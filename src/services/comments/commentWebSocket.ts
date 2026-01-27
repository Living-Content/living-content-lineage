/**
 * WebSocket service for real-time comment and replay updates.
 *
 * Connects to the GAIM API WebSocket endpoint to receive live events.
 * Handles authentication, reconnection, and subscription management.
 */

import { logger } from '../../lib/logger.js';
import { configStore } from '../../stores/configStore.svelte.js';
import { tokenStore } from '../../stores/tokenStore.svelte.js';
import { replayState } from '../../stores/replayState.svelte.js';
import { toastStore } from '../../lib/toast.svelte.js';
import type { Comment } from '../../config/commentTypes.js';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface CommentCreatedEvent {
  type: 'comment_created';
  comment: {
    id: string;
    traceId: string;
    nodeId: string;
    userId: string;
    userName: string;
    userPicture: string | null;
    content: string;
    createdAt: string;
  };
}

interface CommentDeletedEvent {
  type: 'comment_deleted';
  commentId: string;
  traceId: string;
  nodeId: string;
}

interface CommentCountUpdateEvent {
  type: 'comment_count_update';
  traceId: string;
  nodeId: string;
  count: number;
}

interface ReplayCompleteEvent {
  type: 'replay_complete';
  workflowId: string;
  sourceWorkflowId: string;
  status: 'success' | 'error';
  message?: string;
}

interface CommentEventHandlers {
  onCommentCreated?: (comment: Comment) => void;
  onCommentDeleted?: (nodeId: string, commentId: string) => void;
  onCountUpdated?: (nodeId: string, count: number) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

function transformComment(event: CommentCreatedEvent['comment']): Comment {
  return {
    id: event.id,
    trace_id: event.traceId,
    node_id: event.nodeId,
    gaim_id: configStore.gaimId,
    user_id: event.userId,
    user_name: event.userName,
    user_picture: event.userPicture,
    content: event.content,
    created_at: event.createdAt,
  };
}

class CommentWebSocket {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private handlers: CommentEventHandlers = {};
  private subscribedTraceId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private clientId: string | null = null;

  /**
   * Register event handlers for comment updates.
   */
  setHandlers(handlers: CommentEventHandlers): void {
    this.handlers = handlers;
  }

  /**
   * Connect to the WebSocket and subscribe to a trace's comments.
   */
  async connect(traceId: string): Promise<boolean> {
    // Don't reconnect if already connected to this trace
    if (this.state === 'connected' && this.subscribedTraceId === traceId) {
      return true;
    }

    // Disconnect from previous connection if any
    if (this.ws) {
      this.disconnect();
    }

    this.subscribedTraceId = traceId;
    return this.doConnect();
  }

  /**
   * Disconnect from WebSocket.
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.subscribedTraceId = null;
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
    logger.debug('CommentWebSocket: Disconnected');
  }

  private async doConnect(): Promise<boolean> {
    if (!configStore.hasValidConfig()) {
      logger.warn('CommentWebSocket: Cannot connect - no valid config');
      return false;
    }

    this.setState('connecting');

    try {
      const wsUrl = this.buildWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false);
          return;
        }

        const connectionTimeout = setTimeout(() => {
          logger.warn('CommentWebSocket: Connection timeout');
          this.ws?.close();
          resolve(false);
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          logger.debug('CommentWebSocket: Connected, sending auth');
          this.sendAuth();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data, resolve);
          } catch (e) {
            logger.error('CommentWebSocket: Failed to parse message', e);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          logger.error('CommentWebSocket: Error', error);
          resolve(false);
        };

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout);
          logger.debug('CommentWebSocket: Closed');
          this.setState('disconnected');
          this.scheduleReconnect();
        };
      });
    } catch (e) {
      logger.error('CommentWebSocket: Failed to connect', e);
      this.setState('disconnected');
      return false;
    }
  }

  private buildWebSocketUrl(): string {
    const apiUrl = configStore.apiUrl;
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const host = apiUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${host}/ws`;
  }

  private sendAuth(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const authMessage: Record<string, unknown> = {
      type: 'auth',
    };

    // Add token (access token preferred, fall back to anon token)
    if (tokenStore.accessToken) {
      authMessage.accessToken = tokenStore.accessToken;
    } else if (tokenStore.anonToken) {
      authMessage.anonToken = tokenStore.anonToken;
    }

    // Include clientId for session resume if we have one
    if (this.clientId) {
      authMessage.clientId = this.clientId;
    }

    this.ws.send(JSON.stringify(authMessage));
  }

  private handleMessage(data: Record<string, unknown>, connectResolve?: (value: boolean) => void): void {
    const type = data.type as string;

    switch (type) {
      case 'auth_ok':
        this.clientId = (data.clientId as string) || null;
        this.setState('connected');
        this.reconnectAttempts = 0;
        logger.debug('CommentWebSocket: Authenticated, subscribing to trace');
        this.subscribeToTrace();
        if (connectResolve) connectResolve(true);
        break;

      case 'auth_error':
        logger.warn('CommentWebSocket: Auth failed', data.message);
        if (connectResolve) connectResolve(false);
        break;

      case 'comment_created':
        this.handleCommentCreated(data as unknown as CommentCreatedEvent);
        break;

      case 'comment_deleted':
        this.handleCommentDeleted(data as unknown as CommentDeletedEvent);
        break;

      case 'comment_count_update':
        this.handleCountUpdate(data as unknown as CommentCountUpdateEvent);
        break;

      case 'replay_complete':
        this.handleReplayComplete(data as unknown as ReplayCompleteEvent);
        break;

      default:
        // Ignore other message types (ping, etc.)
        break;
    }
  }

  private subscribeToTrace(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.subscribedTraceId) return;

    this.ws.send(
      JSON.stringify({
        type: 'subscribe_trace_comments',
        traceId: this.subscribedTraceId,
      })
    );

    logger.debug('CommentWebSocket: Subscribed to trace', this.subscribedTraceId);
  }

  private handleCommentCreated(event: CommentCreatedEvent): void {
    const comment = transformComment(event.comment);
    logger.debug('CommentWebSocket: Comment created', comment.id);
    this.handlers.onCommentCreated?.(comment);
  }

  private handleCommentDeleted(event: CommentDeletedEvent): void {
    logger.debug('CommentWebSocket: Comment deleted', event.commentId);
    this.handlers.onCommentDeleted?.(event.nodeId, event.commentId);
  }

  private handleCountUpdate(event: CommentCountUpdateEvent): void {
    logger.debug('CommentWebSocket: Count updated', event.nodeId, event.count);
    this.handlers.onCountUpdated?.(event.nodeId, event.count);
  }

  private handleReplayComplete(event: ReplayCompleteEvent): void {
    logger.info('CommentWebSocket: Replay complete', event.workflowId, event.status);

    if (event.status === 'success') {
      toastStore.success('Replay complete - click to view', true);
      replayState.setCompletedWorkflowId(event.workflowId);
    } else {
      toastStore.error(event.message || 'Replay failed');
      replayState.setCompletedWorkflowId(null);
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.handlers.onConnectionChange?.(state);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn('CommentWebSocket: Max reconnect attempts reached');
      return;
    }

    if (!this.subscribedTraceId) {
      // No need to reconnect if we weren't subscribed
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    logger.debug(`CommentWebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  get isConnected(): boolean {
    return this.state === 'connected';
  }
}

// Singleton instance
export const commentWebSocket = new CommentWebSocket();
