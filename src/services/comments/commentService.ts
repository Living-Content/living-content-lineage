/**
 * Comment API client.
 */

import { logger } from '../../lib/logger.js';
import { api } from '../../lib/api.js';
import { configStore } from '../../stores/configStore.svelte.js';
import type { Comment, CommentCounts, CommentCreateRequest } from '../../config/commentTypes.js';
import { type Result, ok, err } from '../../lib/types/result.js';

/**
 * Fetch comments for a specific node.
 */
export async function fetchComments(nodeId: string): Promise<Result<Comment[]>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/trace/${workflowId}/comments/${nodeId}`
    );

    if (!response.ok) {
      logger.warn(`Comments: Failed to fetch for node ${nodeId}`, response.status);
      return err(`Failed to fetch comments: ${response.status}`);
    }

    const data = await response.json();
    return ok(data);
  } catch (error) {
    logger.error('Comments: Error fetching comments:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Create a new comment on a node.
 */
export async function createComment(
  nodeId: string,
  content: string
): Promise<Result<Comment>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const body: CommentCreateRequest = { content };
    const response = await api.fetch(
      `${apiUrl}/trace/${workflowId}/comments/${nodeId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        return err('You must be an editor to comment');
      }
      logger.warn('Comments: Failed to create', response.status);
      return err(`Failed to create comment: ${response.status}`);
    }

    const data = await response.json();
    logger.debug('Comments: Created comment', data.id);
    return ok(data);
  } catch (error) {
    logger.error('Comments: Error creating comment:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId: string): Promise<Result<void>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/trace/${workflowId}/comments/${commentId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      if (response.status === 403) {
        return err('You can only delete your own comments');
      }
      if (response.status === 404) {
        return err('Comment not found');
      }
      logger.warn('Comments: Failed to delete', response.status);
      return err(`Failed to delete comment: ${response.status}`);
    }

    logger.debug('Comments: Deleted comment', commentId);
    return ok(undefined);
  } catch (error) {
    logger.error('Comments: Error deleting comment:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Fetch comment counts for multiple nodes.
 */
export async function fetchCommentCounts(nodeIds: string[]): Promise<Result<CommentCounts>> {
  const { apiUrl, workflowId } = configStore.current;

  if (!apiUrl || !workflowId) {
    return err('Configuration not loaded');
  }

  if (nodeIds.length === 0) {
    return ok({});
  }

  try {
    const response = await api.fetch(
      `${apiUrl}/trace/${workflowId}/comments/counts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_ids: nodeIds }),
      }
    );

    if (!response.ok) {
      logger.warn('Comments: Failed to fetch counts', response.status);
      return err(`Failed to fetch comment counts: ${response.status}`);
    }

    const data = await response.json();
    return ok(data.counts);
  } catch (error) {
    logger.error('Comments: Error fetching counts:', error);
    return err(error instanceof Error ? error.message : 'Unknown error');
  }
}
