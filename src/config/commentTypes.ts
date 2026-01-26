/**
 * Comment type definitions.
 */

export interface Comment {
  id: string;
  trace_id: string;
  node_id: string;
  gaim_id: string;
  user_id: string;
  user_name: string;
  user_picture: string | null;
  content: string;
  created_at: string;
}

export interface CommentCounts {
  [nodeId: string]: number;
}

export interface CommentCreateRequest {
  content: string;
}

export interface CommentCountsRequest {
  node_ids: string[];
}

export interface CommentCountsResponse {
  counts: CommentCounts;
}
