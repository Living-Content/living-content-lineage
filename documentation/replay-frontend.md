# Workflow Replay - Frontend Architecture

The replay system allows users to modify node values in a workflow trace and re-execute from that point, creating a branched workflow.

## Overview

```
User edits field → replayState stores modification → Submit → API call → WebSocket notification
```

## State Management

### replayState.svelte.ts

Central store managing all replay-related state using Svelte 5 runes.

```typescript
// Core state
let modifications = $state<NodeModification[]>([]);
let branchPointNodeId = $state<string | null>(null);
let isSubmitting = $state(false);
let completedWorkflowId = $state<string | null>(null);

// Derived state
const hasModifications = $derived(modifications.length > 0);
const modificationCount = $derived(modifications.length);
```

### NodeModification Interface

```typescript
interface NodeModification {
  nodeId: string;        // Which node to modify
  fieldPath: string;     // Dot-notation path (e.g., "data.temperature")
  originalValue: unknown;
  newValue: unknown;
}
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `addModification(mod)` | Queue a field change |
| `removeModification(nodeId, fieldPath)` | Revert a specific change |
| `clearModifications()` | Reset all pending changes |
| `computeBranchPoint(nodeOrder)` | Find earliest modified node |
| `submitReplay()` | POST to API, returns Result |
| `setCompletedWorkflowId(id)` | Called by WebSocket handler |

### Branch Point Computation

When multiple nodes are modified, the branch point is the earliest one in execution order:

```typescript
computeBranchPoint(nodeOrder: string[]): string | null {
  if (modifications.length === 0) return null;
  const modifiedNodeIds = new Set(modifications.map(m => m.nodeId));

  for (const nodeId of nodeOrder) {
    if (modifiedNodeIds.has(nodeId)) {
      return nodeId;  // First modified node in execution order
    }
  }
  return modifications[0].nodeId;
}
```

The `nodeOrder` comes from `traceState.nodeExecutionOrder` (nodes sorted by x-coordinate).

## Components

### EditableValue.svelte

Displays a value with edit capability. Used in DetailView for JSON/text fields.

```
┌────────────────────────────────────────┐
│  { "query": "example" }         [✏️]  │  ← Hover shows edit button
└────────────────────────────────────────┘
         ↓ Click edit
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │
│  │ { "query": "modified" }          │  │  ← Textarea for editing
│  └──────────────────────────────────┘  │
│                    [Save] [Cancel]     │
└────────────────────────────────────────┘
```

**Props:**
- `nodeId` - Node being edited
- `fieldPath` - Path to field (e.g., "data.query")
- `currentValue` - Original value
- `editType` - "text" | "number" | "textarea" | "json"

### EditableDataCard.svelte

Compact card for numeric/simple values with inline editing.

```
┌──────────────┐
│ TEMPERATURE  │
│    0.7       │ [✏️]
└──────────────┘
```

### ReplayActionBar.svelte

Fixed bottom bar that appears when modifications exist.

```
┌─────────────────────────────────────────────────────────────┐
│  3 modifications              [Reset]  [Replay from here]  │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Slides in when `hasModifications === true`
- "Reset" calls `replayState.clearModifications()`
- "Replay from here" calls `replayState.submitReplay()`
- Uses toast notifications for feedback (no inline errors)

## Toast Notifications

All user feedback uses `toastStore` from `src/lib/toast.ts`:

```typescript
// On submit
toastStore.info('Submitting replay...');

// On success
toastStore.success('Replay submitted - executing...');

// On error
toastStore.error('Failed to submit replay: 500');

// On WebSocket completion
toastStore.success('Replay complete - click to view', true);  // persistent
```

## WebSocket Integration

The existing `commentWebSocket.ts` handles `replay_complete` messages:

```typescript
case 'replay_complete':
  if (event.status === 'success') {
    toastStore.success('Replay complete - click to view', true);
    replayState.setCompletedWorkflowId(event.workflowId);
  } else {
    toastStore.error(event.message || 'Replay failed');
  }
  break;
```

## User Flow

1. **Select node** - Click on a node in the trace graph
2. **Open DetailView** - See node data in the side panel
3. **Edit field** - Click edit icon, modify value, save
4. **Visual feedback** - Modified fields show orange outline
5. **Review changes** - ReplayActionBar shows modification count
6. **Submit** - Click "Replay from here"
7. **Wait** - Toast shows "Submitting...", then "Executing..."
8. **Complete** - WebSocket delivers completion, persistent toast appears
9. **Navigate** - Click toast or use branch UI to view new workflow

## API Integration

### Submit Replay

```typescript
POST /replay
Content-Type: application/json

{
  "sourceWorkflowId": "workflow-abc-123",
  "branchPointNodeId": "node-llm-call-1",
  "modifications": [
    {
      "nodeId": "node-llm-call-1",
      "fieldPath": "data.temperature",
      "originalValue": 0.7,
      "newValue": 0.9
    }
  ]
}

// Response (immediate)
{
  "workflowId": "workflow-xyz-789",
  "parentWorkflowId": "workflow-abc-123",
  "branchPointNodeId": "node-llm-call-1",
  "requestId": "req-456",
  "status": "queued"
}
```

### WebSocket Message

```typescript
// Received async after execution completes
{
  "type": "replay_complete",
  "workflowId": "workflow-xyz-789",
  "sourceWorkflowId": "workflow-abc-123",
  "status": "success"
}
```

## File Structure

```
src/
├── stores/
│   ├── replayState.svelte.ts    # Central replay state
│   └── traceState.svelte.ts     # Provides nodeExecutionOrder
├── components/
│   ├── replay/
│   │   └── ReplayActionBar.svelte
│   └── dataviewer/
│       ├── detail/
│       │   └── EditableValue.svelte
│       └── cards/
│           └── EditableDataCard.svelte
├── services/
│   └── comments/
│       └── commentWebSocket.ts  # Handles replay_complete
└── lib/
    └── toast.ts                 # Toast notifications
```
