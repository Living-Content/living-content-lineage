# Comments System

Real-time commenting system for trace nodes. Users can add, view, and delete comments on individual nodes within a trace.

## Architecture

### Frontend Components

```
src/
├── components/comments/
│   ├── CommentPanel.svelte      # Main panel (positioned right of DetailPanel)
│   ├── CommentList.svelte       # Scrollable comment list
│   ├── CommentItem.svelte       # Single comment with delete
│   ├── CommentInput.svelte      # Text input + send button
│   ├── CommentIndicator.svelte  # Count badge
│   └── AuthPrompt.svelte        # Sign-in prompt for unauthenticated users
├── stores/
│   └── commentState.svelte.ts   # Comments state management
├── services/comments/
│   ├── commentService.ts        # REST API client
│   ├── commentWebSocket.ts      # WebSocket client for real-time updates
│   └── formatters.ts            # Relative time formatting
└── config/
    └── commentTypes.ts          # TypeScript interfaces
```

### State Management

`commentState.svelte.ts` manages:
- `comments`: Map<nodeId, Comment[]> - cached comments per node
- `counts`: Record<nodeId, number> - badge counts for all nodes
- `wsConnected`: boolean - WebSocket connection status

### Real-time Updates

The system uses WebSocket for real-time synchronization:

1. **On trace load**: Connect to WebSocket and subscribe to trace comments
2. **On comment create/delete**: Backend broadcasts to all subscribed users
3. **On receive**: Update local state (with duplicate prevention)

Message types:
- `subscribe_trace_comments` - Subscribe to a trace's comment events
- `unsubscribe_trace_comments` - Unsubscribe from a trace
- `comment_created` - New comment added
- `comment_deleted` - Comment removed
- `comment_count_update` - Count changed

## API Endpoints

All endpoints are on the GAIM API (`{gaim_id}.api.livingcontent.co`).

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/trace/{workflow_id}/comments/{node_id}` | GET | viewer+ | Get comments for node |
| `/trace/{workflow_id}/comments/{node_id}` | POST | editor+ | Create comment |
| `/trace/{workflow_id}/comments/{comment_id}` | DELETE | owner/admin | Delete comment |
| `/trace/{workflow_id}/comments/counts` | POST | viewer+ | Batch get counts |

## Permissions

Based on GAIM membership roles:
- **viewer**: Can read comments
- **editor**: Can read and create comments
- **admin**: Can read, create, and delete any comment
- **owner**: Can delete their own comments

Anonymous users (with anon token) can view comments if they have viewer+ role.

## UI Layout

### Desktop (>900px)
- DetailPanel positioned LEFT of selected node
- CommentPanel appears RIGHT of DetailPanel (can overlay node)
- Both panels 360px wide

### Mobile (≤900px)
- Tab switcher between Data and Comments
- Only one panel visible at a time
- Panels slide in from bottom

## Data Flow

```
User creates comment
    ↓
commentState.submitComment()
    ↓
POST /trace/{id}/comments/{nodeId}
    ↓
Backend creates comment in MongoDB
    ↓
Backend broadcasts via Redis pub/sub
    ↓
All subscribed WebSocket clients receive
    ↓
commentState updates (with duplicate check)
```

## Comment Schema

```typescript
interface Comment {
  id: string;
  trace_id: string;
  node_id: string;
  gaim_id: string;
  user_id: string;
  user_name: string;
  user_picture: string | null;
  content: string;        // max 2000 chars
  created_at: string;     // ISO datetime
}
```
