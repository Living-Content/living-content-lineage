/**
 * Comment state store using Svelte 5 runes.
 * Manages comments and counts per node.
 * Supports real-time updates via WebSocket.
 */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { logger } from '../lib/logger.js';
import type { Comment, CommentCounts } from '../config/commentTypes.js';
import {
  fetchComments,
  createComment,
  deleteComment,
  fetchCommentCounts,
} from '../services/comments/commentService.js';
import { commentWebSocket } from '../services/comments/commentWebSocket.js';

const comments = new SvelteMap<string, Comment[]>();
let counts = $state<CommentCounts>({});
const loadingNodes = new SvelteSet<string>();
const loadedNodes = new SvelteSet<string>();
let submitting = $state(false);
let error = $state<string | null>(null);
let wsConnected = $state(false);

export const commentState = {
  /**
   * Get comments for a specific node (reactive).
   */
  getComments(nodeId: string): Comment[] {
    return comments.get(nodeId) || [];
  },

  /**
   * Get comment count for a specific node (reactive).
   */
  getCount(nodeId: string): number {
    return counts[nodeId] || 0;
  },

  /**
   * Check if a node has comments (reactive).
   */
  hasComments(nodeId: string): boolean {
    return (counts[nodeId] || 0) > 0;
  },

  /**
   * Check if comments are loading for a node (reactive).
   */
  isLoading(nodeId: string): boolean {
    return loadingNodes.has(nodeId);
  },

  /**
   * Check if comment submission is in progress (reactive).
   */
  get isSubmitting(): boolean {
    return submitting;
  },

  /**
   * Get current error message (reactive).
   */
  get error(): string | null {
    return error;
  },

  /**
   * All counts (reactive).
   */
  get counts(): CommentCounts {
    return counts;
  },

  /**
   * Clear error message.
   */
  clearError(): void {
    error = null;
  },

  /**
   * Load comments for a specific node.
   */
  async loadComments(nodeId: string): Promise<void> {
    if (loadingNodes.has(nodeId) || loadedNodes.has(nodeId)) return;

    loadingNodes.add(nodeId);
    error = null;

    const result = await fetchComments(nodeId);

    loadingNodes.delete(nodeId);

    if (result.ok) {
      loadedNodes.add(nodeId);
      comments.set(nodeId, result.data);
      counts = { ...counts, [nodeId]: result.data.length };
    } else {
      loadedNodes.add(nodeId); // Also mark as "loaded" on failure to prevent retry spam
      error = result.error;
      logger.warn('CommentState: Failed to load comments', result.error);
    }
  },

  /**
   * Force reload comments for a specific node.
   */
  async reloadComments(nodeId: string): Promise<void> {
    loadedNodes.delete(nodeId);
    return this.loadComments(nodeId);
  },

  /**
   * Submit a new comment.
   */
  async submitComment(nodeId: string, content: string): Promise<boolean> {
    if (submitting) return false;

    submitting = true;
    error = null;

    const result = await createComment(nodeId, content);

    submitting = false;

    if (result.ok) {
      // Only add locally if WebSocket is NOT connected
      // If connected, the WebSocket will handle adding the comment to avoid duplicates
      if (!wsConnected) {
        const nodeComments = comments.get(nodeId) || [];
        comments.set(nodeId, [...nodeComments, result.data]);
        counts = { ...counts, [nodeId]: (counts[nodeId] || 0) + 1 };
      }
      return true;
    } else {
      error = result.error;
      logger.warn('CommentState: Failed to submit comment', result.error);
      return false;
    }
  },

  /**
   * Delete a comment.
   */
  async removeComment(nodeId: string, commentId: string): Promise<boolean> {
    const result = await deleteComment(commentId);

    if (result.ok) {
      // Only remove locally if WebSocket is NOT connected
      // If connected, the WebSocket will handle removing the comment
      if (!wsConnected) {
        const nodeComments = comments.get(nodeId) || [];
        const filtered = nodeComments.filter((c) => c.id !== commentId);
        comments.set(nodeId, filtered);
        counts = { ...counts, [nodeId]: Math.max(0, (counts[nodeId] || 0) - 1) };
      }
      return true;
    } else {
      error = result.error;
      logger.warn('CommentState: Failed to delete comment', result.error);
      return false;
    }
  },

  /**
   * Load comment counts for multiple nodes (batch).
   */
  async loadCounts(nodeIds: string[]): Promise<void> {
    if (nodeIds.length === 0) return;

    const result = await fetchCommentCounts(nodeIds);

    if (result.ok) {
      counts = { ...counts, ...result.data };
      logger.debug('CommentState: Loaded counts for', nodeIds.length, 'nodes');
    } else {
      logger.warn('CommentState: Failed to load counts', result.error);
    }
  },

  /**
   * Clear all cached comments (but preserve counts).
   */
  clearComments(): void {
    comments.clear();
    loadedNodes.clear();
    error = null;
  },

  /**
   * Reset all state.
   */
  reset(): void {
    comments.clear();
    counts = {};
    loadingNodes.clear();
    loadedNodes.clear();
    submitting = false;
    error = null;
    commentWebSocket.disconnect();
    wsConnected = false;
  },

  /**
   * Check if WebSocket is connected (reactive).
   */
  get isWsConnected(): boolean {
    return wsConnected;
  },

  /**
   * Connect to WebSocket for real-time updates on a trace.
   * Call this when the trace is loaded.
   */
  async connectRealtime(traceId: string): Promise<void> {
    // Set up WebSocket handlers
    commentWebSocket.setHandlers({
      onCommentCreated: (comment: Comment) => {
        const nodeComments = comments.get(comment.node_id) || [];
        // Avoid duplicates (in case we created it locally)
        if (!nodeComments.some((c) => c.id === comment.id)) {
          comments.set(comment.node_id, [...nodeComments, comment]);
          counts = { ...counts, [comment.node_id]: (counts[comment.node_id] || 0) + 1 };
          logger.debug('CommentState: Added comment from WebSocket', comment.id);
        }
      },
      onCommentDeleted: (nodeId: string, commentId: string) => {
        const nodeComments = comments.get(nodeId) || [];
        const filtered = nodeComments.filter((c) => c.id !== commentId);
        if (filtered.length !== nodeComments.length) {
          comments.set(nodeId, filtered);
          counts = { ...counts, [nodeId]: Math.max(0, (counts[nodeId] || 0) - 1) };
          logger.debug('CommentState: Removed comment from WebSocket', commentId);
        }
      },
      onCountUpdated: (nodeId: string, count: number) => {
        counts = { ...counts, [nodeId]: count };
        logger.debug('CommentState: Updated count from WebSocket', nodeId, count);
      },
      onConnectionChange: (state) => {
        wsConnected = state === 'connected';
        logger.debug('CommentState: WebSocket state', state);
      },
    });

    // Connect
    await commentWebSocket.connect(traceId);
  },

  /**
   * Disconnect from WebSocket.
   */
  disconnectRealtime(): void {
    commentWebSocket.disconnect();
    wsConnected = false;
  },
};
