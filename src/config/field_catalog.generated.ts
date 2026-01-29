/**
 * Auto-generated field catalog types.
 * DO NOT EDIT - Generated from Python field catalog.
 */

export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'object' | 'array';

export type EditCapability = 'none' | 'text' | 'textarea' | 'number' | 'json' | 'select';

export type DisplayType = 'metric' | 'text' | 'text-preview' | 'badge' | 'status' | 'duration' | 'datetime' | 'percentage' | 'dimensions' | 'filesize' | 'hash' | 'number' | 'code' | 'markdown' | 'list' | 'link-pair' | 'asset-list' | 'chunk-list' | 'key-value';

export type Phase = 'Acquisition' | 'Preparation' | 'Retrieval' | 'Reasoning' | 'Generation' | 'Persistence';

export type NodeType = 'data' | 'process' | 'claim' | 'store' | 'media' | 'workflow';

export type AssetCategory = 'Content' | 'Process' | 'Verification';

export type AssetType = 'Model' | 'Code' | 'Action' | 'Claim' | 'UserQuery' | 'ToolSelection' | 'GapAnalysis' | 'QueryPlan' | 'SufficiencyEvaluation' | 'AssistantResponse' | 'ConversationHistory' | 'KnowledgeSearchResult' | 'SourceImage' | 'GeneratedImage' | 'SourceAudio' | 'GeneratedAudio' | 'SourceVideo' | 'GeneratedVideo';

export interface NestedEditRule {
  path: string;
  editType: EditCapability;
  description?: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  description?: string;
  fieldType: FieldType;
  sourcePath: string;
  displayType: DisplayType;
  isCard: boolean;
  span?: number;
  editCapability: EditCapability;
  nestedEditRules?: NestedEditRule[];
  unit?: string;
  truncateAt?: number;
  aliases?: string[];
}

export interface AssetTypeFields {
  assetType: AssetType;
  label: string;
  nodeType: NodeType;
  category: AssetCategory;
  description?: string;
  iconName?: string;
  cardColumns: number;
  fields: FieldDefinition[];
}

export interface FieldCatalog {
  version: string;
  assetTypes: AssetTypeFields[];
}

export interface NodeDefinition {
  assetType: AssetType;
  label: string;
  description?: string;
  fields: string[];
}

export interface StepDefinition {
  name: string;
  label: string;
  phase: Phase;
  description?: string;
  nodes: NodeDefinition[];
}

export interface WorkflowCatalog {
  version: string;
  steps: StepDefinition[];
}

export interface AssetTypeConfig {
  nodeType: NodeType;
  category: AssetCategory;
  label: string;
  iconName: string;
}

/**
 * Auto-generated field catalog data.
 * DO NOT EDIT - Generated from Python field catalog.
 */

export const FIELD_CATALOG: FieldCatalog = {
  version: '1.0',
  assetTypes: [
{
  assetType: 'Model',
  label: 'Model',
  nodeType: 'process',
  category: 'Process',
  description: 'LLM inference operations with token metrics',
  iconName: 'model',
  cardColumns: 4,
  fields: [
  {
    name: 'inputTokens',
    label: 'Input Tokens',
    fieldType: 'integer',
    sourcePath: 'data.inputTokens',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'outputTokens',
    label: 'Output Tokens',
    fieldType: 'integer',
    sourcePath: 'data.outputTokens',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'totalDurationMs',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.totalDurationMs',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'temperature',
    label: 'Temperature',
    fieldType: 'float',
    sourcePath: 'data.temperature',
    displayType: 'number',
    isCard: true,
    editCapability: 'number',
    description: 'Sampling temperature for model inference',
    span: 2
  },
  {
    name: 'tokenLimit',
    label: 'Token Limit',
    fieldType: 'integer',
    sourcePath: 'data.tokenLimit',
    displayType: 'metric',
    isCard: false,
    editCapability: 'number',
    description: 'Maximum output token limit'
  },
  {
    name: 'model',
    label: 'Model',
    fieldType: 'string',
    sourcePath: 'assertions.model.modelId',
    displayType: 'badge',
    isCard: false,
    editCapability: 'select',
    description: 'Model identifier for selection'
  }
  ]
},
{
  assetType: 'Code',
  label: 'Code',
  nodeType: 'process',
  category: 'Process',
  description: 'Code execution with timing and source',
  iconName: 'code',
  cardColumns: 4,
  fields: [
  {
    name: 'durationMs',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.durationMs',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'module',
    label: 'Module',
    fieldType: 'string',
    sourcePath: 'data.module',
    displayType: 'text',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'arguments',
    label: 'Arguments',
    fieldType: 'object',
    sourcePath: 'data.arguments',
    displayType: 'key-value',
    isCard: false,
    editCapability: 'json',
    description: 'Function arguments (modifiable for replay)'
  },
  {
    name: 'sourceCode',
    label: 'Source Code',
    fieldType: 'string',
    sourcePath: 'data.sourceCode',
    displayType: 'code',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'Action',
  label: 'Action',
  nodeType: 'process',
  category: 'Process',
  description: 'Pure connector node with no data payload',
  iconName: 'action',
  cardColumns: 4,
  fields: [

  ]
},
{
  assetType: 'Claim',
  label: 'Claim',
  nodeType: 'claim',
  category: 'Verification',
  description: 'Verification claims with attestation metadata',
  iconName: 'claim',
  cardColumns: 4,
  fields: [
  {
    name: 'status',
    label: 'Status',
    fieldType: 'string',
    sourcePath: 'computed.status',
    displayType: 'status',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'algorithm',
    label: 'Algorithm',
    fieldType: 'string',
    sourcePath: 'manifest.attestation.alg',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'issuer',
    label: 'Issuer',
    fieldType: 'string',
    sourcePath: 'manifest.attestation.issuer',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'UserQuery',
  label: 'User Query',
  nodeType: 'data',
  category: 'Content',
  description: 'Incoming user query or request',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'query',
    label: 'Query',
    fieldType: 'string',
    sourcePath: 'data.query',
    displayType: 'text-preview',
    isCard: false,
    editCapability: 'textarea',
    description: 'User query input (modifiable for replay)',
    truncateAt: 500
  },
  {
    name: 'messageCount',
    label: 'Messages',
    fieldType: 'integer',
    sourcePath: 'data.messageCount',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'value',
    label: 'Content',
    fieldType: 'string',
    sourcePath: 'data.value',
    displayType: 'text-preview',
    isCard: true,
    editCapability: 'textarea',
    description: 'Document content (modifiable for replay)',
    span: 4,
    truncateAt: 100
  }
  ]
},
{
  assetType: 'ToolSelection',
  label: 'Tool Selection',
  nodeType: 'data',
  category: 'Content',
  description: 'Decision on which tool to use',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'toolId',
    label: 'Tool',
    fieldType: 'string',
    sourcePath: 'data.toolId',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'candidates',
    label: 'Candidates',
    fieldType: 'array',
    sourcePath: 'data.candidates',
    displayType: 'list',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'llmResponse',
    label: 'Selection',
    fieldType: 'string',
    sourcePath: 'data.llmResponse',
    displayType: 'text-preview',
    isCard: false,
    editCapability: 'textarea',
    description: 'LLM selection response (modifiable for replay)',
    truncateAt: 100
  }
  ]
},
{
  assetType: 'GapAnalysis',
  label: 'Gap Analysis',
  nodeType: 'data',
  category: 'Content',
  description: 'Identified knowledge gaps and requirements',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'gaps',
    label: 'Knowledge Gaps',
    fieldType: 'array',
    sourcePath: 'data.gaps',
    displayType: 'list',
    isCard: true,
    editCapability: 'none',
    span: 4
  },
  {
    name: 'requirements',
    label: 'Requirements',
    fieldType: 'array',
    sourcePath: 'data.requirements',
    displayType: 'list',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'reasoningTrace',
    label: 'Reasoning',
    fieldType: 'string',
    sourcePath: 'data.reasoningTrace',
    displayType: 'text-preview',
    isCard: false,
    editCapability: 'none',
    truncateAt: 500
  },
  {
    name: 'dataQualityAssessment',
    label: 'Data Quality',
    fieldType: 'string',
    sourcePath: 'data.dataQualityAssessment',
    displayType: 'text-preview',
    isCard: true,
    editCapability: 'none',
    span: 4,
    truncateAt: 200
  }
  ]
},
{
  assetType: 'QueryPlan',
  label: 'Query Plan',
  nodeType: 'data',
  category: 'Content',
  description: 'Planned queries and execution strategy',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'queries',
    label: 'Planned Queries',
    fieldType: 'array',
    sourcePath: 'data.queries',
    displayType: 'list',
    isCard: true,
    editCapability: 'none',
    span: 4
  },
  {
    name: 'executionPlan',
    label: 'Execution Plan',
    fieldType: 'object',
    sourcePath: 'data.executionPlan',
    displayType: 'key-value',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'SufficiencyEvaluation',
  label: 'Sufficiency Evaluation',
  nodeType: 'data',
  category: 'Content',
  description: 'Evaluation of data completeness',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'isSufficient',
    label: 'Data Sufficient',
    fieldType: 'boolean',
    sourcePath: 'data.isSufficient',
    displayType: 'status',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'iteration',
    label: 'Iteration',
    fieldType: 'integer',
    sourcePath: 'data.iteration',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'shouldContinue',
    label: 'Continue?',
    fieldType: 'boolean',
    sourcePath: 'data.shouldContinue',
    displayType: 'status',
    isCard: true,
    editCapability: 'none',
    span: 2
  }
  ]
},
{
  assetType: 'AssistantResponse',
  label: 'Assistant Response',
  nodeType: 'data',
  category: 'Content',
  description: 'Final generated content',
  iconName: 'document',
  cardColumns: 4,
  fields: [
  {
    name: 'response',
    label: 'Response',
    fieldType: 'string',
    sourcePath: 'data.response',
    displayType: 'markdown',
    isCard: false,
    editCapability: 'textarea',
    description: 'Generated response (modifiable for replay)'
  },
  {
    name: 'responseLength',
    label: 'Response Length',
    fieldType: 'integer',
    sourcePath: 'data.responseLength',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'requestMessageId',
    label: 'Request ID',
    fieldType: 'string',
    sourcePath: 'data.requestMessageId',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'responseMessageId',
    label: 'Response ID',
    fieldType: 'string',
    sourcePath: 'data.responseMessageId',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'ConversationHistory',
  label: 'Conversation History',
  nodeType: 'store',
  category: 'Content',
  description: 'Retrieved conversation context',
  iconName: 'data',
  cardColumns: 4,
  fields: [
  {
    name: 'messageCount',
    label: 'Messages',
    fieldType: 'integer',
    sourcePath: 'data.messageCount',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'conversationHistory',
    label: 'Conversation History',
    fieldType: 'array',
    sourcePath: 'data.conversationHistory',
    displayType: 'list',
    isCard: false,
    editCapability: 'json',
    description: 'Conversation messages (user messages editable for replay)',
    nestedEditRules: [{ path: '[role=user].content', editType: 'textarea', description: 'Only user messages are editable' }]
  }
  ]
},
{
  assetType: 'KnowledgeSearchResult',
  label: 'Knowledge Search Result',
  nodeType: 'store',
  category: 'Content',
  description: 'Retrieved knowledge chunks',
  iconName: 'data',
  cardColumns: 4,
  fields: [
  {
    name: 'count',
    label: 'Results Found',
    fieldType: 'integer',
    sourcePath: 'data.count',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'totalChunks',
    label: 'Chunks',
    fieldType: 'integer',
    sourcePath: 'data.totalChunks',
    displayType: 'metric',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'success',
    label: 'Status',
    fieldType: 'boolean',
    sourcePath: 'data.success',
    displayType: 'status',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'evaluationSummary',
    label: 'Summary',
    fieldType: 'string',
    sourcePath: 'data.evaluationSummary',
    displayType: 'text-preview',
    isCard: true,
    editCapability: 'textarea',
    description: 'Evaluation summary (modifiable for replay)',
    span: 4,
    truncateAt: 200
  },
  {
    name: 'chunks',
    label: 'Retrieved Chunks',
    fieldType: 'array',
    sourcePath: 'data.chunks',
    displayType: 'list',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'SourceImage',
  label: 'Source Image',
  nodeType: 'media',
  category: 'Content',
  description: 'Input image asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'dimensions',
    label: 'Dimensions',
    fieldType: 'string',
    sourcePath: 'computed.dimensions',
    displayType: 'dimensions',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 4
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'GeneratedImage',
  label: 'Generated Image',
  nodeType: 'media',
  category: 'Content',
  description: 'AI-generated image asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'dimensions',
    label: 'Dimensions',
    fieldType: 'string',
    sourcePath: 'computed.dimensions',
    displayType: 'dimensions',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 4
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  }
  ]
},
{
  assetType: 'SourceAudio',
  label: 'Source Audio',
  nodeType: 'media',
  category: 'Content',
  description: 'Input audio asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'duration',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.duration',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  }
  ]
},
{
  assetType: 'GeneratedAudio',
  label: 'Generated Audio',
  nodeType: 'media',
  category: 'Content',
  description: 'AI-generated audio asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'duration',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.duration',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  }
  ]
},
{
  assetType: 'SourceVideo',
  label: 'Source Video',
  nodeType: 'media',
  category: 'Content',
  description: 'Input video asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'dimensions',
    label: 'Dimensions',
    fieldType: 'string',
    sourcePath: 'computed.dimensions',
    displayType: 'dimensions',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'duration',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.duration',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  }
  ]
},
{
  assetType: 'GeneratedVideo',
  label: 'Generated Video',
  nodeType: 'media',
  category: 'Content',
  description: 'AI-generated video asset',
  iconName: 'media',
  cardColumns: 4,
  fields: [
  {
    name: 'format',
    label: 'Format',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'badge',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'dimensions',
    label: 'Dimensions',
    fieldType: 'string',
    sourcePath: 'computed.dimensions',
    displayType: 'dimensions',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'fileSize',
    label: 'File Size',
    fieldType: 'integer',
    sourcePath: 'data.size',
    displayType: 'filesize',
    isCard: true,
    editCapability: 'none',
    span: 2
  },
  {
    name: 'mimeType',
    label: 'MIME Type',
    fieldType: 'string',
    sourcePath: 'manifest.format',
    displayType: 'text',
    isCard: false,
    editCapability: 'none'
  },
  {
    name: 'duration',
    label: 'Duration',
    fieldType: 'integer',
    sourcePath: 'data.duration',
    displayType: 'duration',
    isCard: true,
    editCapability: 'none',
    span: 2
  }
  ]
}
  ]
};

/**
 * Asset type configuration lookup table.
 * Maps asset type to its visual and categorical properties.
 */
export const ASSET_TYPE_CONFIG: Record<AssetType, AssetTypeConfig> = {
  'Model': { nodeType: 'process', category: 'Process', label: 'Model', iconName: 'model' },
  'Code': { nodeType: 'process', category: 'Process', label: 'Code', iconName: 'code' },
  'Action': { nodeType: 'process', category: 'Process', label: 'Action', iconName: 'action' },
  'Claim': { nodeType: 'claim', category: 'Verification', label: 'Claim', iconName: 'claim' },
  'UserQuery': { nodeType: 'data', category: 'Content', label: 'User Query', iconName: 'document' },
  'ToolSelection': { nodeType: 'data', category: 'Content', label: 'Tool Selection', iconName: 'document' },
  'GapAnalysis': { nodeType: 'data', category: 'Content', label: 'Gap Analysis', iconName: 'document' },
  'QueryPlan': { nodeType: 'data', category: 'Content', label: 'Query Plan', iconName: 'document' },
  'SufficiencyEvaluation': { nodeType: 'data', category: 'Content', label: 'Sufficiency Evaluation', iconName: 'document' },
  'AssistantResponse': { nodeType: 'data', category: 'Content', label: 'Assistant Response', iconName: 'document' },
  'ConversationHistory': { nodeType: 'store', category: 'Content', label: 'Conversation History', iconName: 'data' },
  'KnowledgeSearchResult': { nodeType: 'store', category: 'Content', label: 'Knowledge Search Result', iconName: 'data' },
  'SourceImage': { nodeType: 'media', category: 'Content', label: 'Source Image', iconName: 'media' },
  'GeneratedImage': { nodeType: 'media', category: 'Content', label: 'Generated Image', iconName: 'media' },
  'SourceAudio': { nodeType: 'media', category: 'Content', label: 'Source Audio', iconName: 'media' },
  'GeneratedAudio': { nodeType: 'media', category: 'Content', label: 'Generated Audio', iconName: 'media' },
  'SourceVideo': { nodeType: 'media', category: 'Content', label: 'Source Video', iconName: 'media' },
  'GeneratedVideo': { nodeType: 'media', category: 'Content', label: 'Generated Video', iconName: 'media' }
};

/**
 * Auto-generated workflow catalog data.
 * DO NOT EDIT - Generated from Python workflow catalog.
 */

export const WORKFLOW_CATALOG: WorkflowCatalog = {
  version: '1.0',
  steps: [
  {
    name: 'ingest',
    label: 'Ingest',
    phase: 'Acquisition',
    description: 'Receive and parse user input',
    nodes: [
    {
      assetType: 'UserQuery',
      label: 'User Query',
      description: 'Incoming user query or request',
      fields: ['query', 'messageCount', 'value']
    }
    ]
  },
  {
    name: 'select',
    label: 'Select',
    phase: 'Preparation',
    description: 'Select appropriate tool or workflow path',
    nodes: [
    {
      assetType: 'ToolSelection',
      label: 'Tool Selection',
      description: 'Decision on which tool to use',
      fields: ['toolId', 'candidates', 'llmResponse']
    },
    {
      assetType: 'Model',
      label: 'Selection Model',
      description: 'LLM used for tool selection',
      fields: ['inputTokens', 'outputTokens', 'totalDurationMs', 'temperature']
    }
    ]
  },
  {
    name: 'retrieve',
    label: 'Retrieve',
    phase: 'Retrieval',
    description: 'Fetch conversation history and context',
    nodes: [
    {
      assetType: 'ConversationHistory',
      label: 'Conversation History',
      description: 'Retrieved conversation context',
      fields: ['messageCount', 'conversationHistory']
    }
    ]
  },
  {
    name: 'search',
    label: 'Search',
    phase: 'Retrieval',
    description: 'Search external knowledge sources',
    nodes: [
    {
      assetType: 'KnowledgeSearchResult',
      label: 'Search Results',
      description: 'Retrieved knowledge chunks',
      fields: ['count', 'totalChunks', 'success', 'chunks', 'evaluationSummary']
    }
    ]
  },
  {
    name: 'reflect',
    label: 'Reflect',
    phase: 'Reasoning',
    description: 'Analyze knowledge gaps and requirements',
    nodes: [
    {
      assetType: 'GapAnalysis',
      label: 'Gap Analysis',
      description: 'Identified knowledge gaps and requirements',
      fields: ['gaps', 'requirements', 'reasoningTrace', 'dataQualityAssessment']
    },
    {
      assetType: 'Model',
      label: 'Reflection Model',
      description: 'LLM used for gap analysis',
      fields: ['inputTokens', 'outputTokens', 'totalDurationMs', 'temperature']
    }
    ]
  },
  {
    name: 'plan',
    label: 'Plan',
    phase: 'Reasoning',
    description: 'Create execution plan for queries',
    nodes: [
    {
      assetType: 'QueryPlan',
      label: 'Query Plan',
      description: 'Planned queries and execution strategy',
      fields: ['queries', 'executionPlan']
    },
    {
      assetType: 'Model',
      label: 'Planning Model',
      description: 'LLM used for query planning',
      fields: ['inputTokens', 'outputTokens', 'totalDurationMs', 'temperature']
    }
    ]
  },
  {
    name: 'evaluate',
    label: 'Evaluate',
    phase: 'Reasoning',
    description: 'Assess data sufficiency',
    nodes: [
    {
      assetType: 'SufficiencyEvaluation',
      label: 'Sufficiency Check',
      description: 'Evaluation of data completeness',
      fields: ['isSufficient', 'iteration', 'shouldContinue']
    },
    {
      assetType: 'Model',
      label: 'Evaluation Model',
      description: 'LLM used for sufficiency evaluation',
      fields: ['inputTokens', 'outputTokens', 'totalDurationMs', 'temperature']
    }
    ]
  },
  {
    name: 'generate',
    label: 'Generate',
    phase: 'Generation',
    description: 'Generate response content',
    nodes: [
    {
      assetType: 'AssistantResponse',
      label: 'Generated Response',
      description: 'Final generated content',
      fields: ['response', 'responseLength']
    },
    {
      assetType: 'Model',
      label: 'Generation Model',
      description: 'LLM used for response generation',
      fields: ['inputTokens', 'outputTokens', 'totalDurationMs', 'temperature', 'tokenLimit', 'model']
    },
    {
      assetType: 'GeneratedImage',
      label: 'Generated Image',
      description: 'Generated image content',
      fields: ['format', 'dimensions', 'fileSize', 'mimeType']
    },
    {
      assetType: 'GeneratedAudio',
      label: 'Generated Audio',
      description: 'Generated audio content',
      fields: ['format', 'fileSize', 'mimeType', 'duration']
    },
    {
      assetType: 'GeneratedVideo',
      label: 'Generated Video',
      description: 'Generated video content',
      fields: ['format', 'dimensions', 'fileSize', 'mimeType', 'duration']
    }
    ]
  },
  {
    name: 'store',
    label: 'Store',
    phase: 'Persistence',
    description: 'Persist results to storage',
    nodes: [
    {
      assetType: 'AssistantResponse',
      label: 'Stored Messages',
      description: 'Persisted request and response',
      fields: ['requestMessageId', 'responseMessageId']
    }
    ]
  }
  ]
};

/**
 * Check if a string is a valid asset type.
 */
export const isValidAssetType = (s: string): s is AssetType => s in ASSET_TYPE_CONFIG;

/**
 * Get the node type for an asset type.
 */
export const getAssetTypeNodeType = (assetType: string): NodeType =>
  ASSET_TYPE_CONFIG[assetType as AssetType]?.nodeType ?? 'data';

/**
 * Get the category for an asset type.
 */
export const getAssetTypeCategory = (assetType: string): AssetCategory =>
  ASSET_TYPE_CONFIG[assetType as AssetType]?.category ?? 'Content';

/**
 * Get the human-readable label for an asset type.
 */
export const getAssetTypeLabel = (assetType: string): string =>
  ASSET_TYPE_CONFIG[assetType as AssetType]?.label ?? assetType;

/**
 * Get the icon name for an asset type.
 */
export const getAssetTypeIconName = (assetType: string): string =>
  ASSET_TYPE_CONFIG[assetType as AssetType]?.iconName ?? assetType.toLowerCase();

/**
 * Get all valid asset types.
 */
export const getAllAssetTypes = (): AssetType[] =>
  Object.keys(ASSET_TYPE_CONFIG) as AssetType[];

/**
 * Get fields by asset type.
 */
export const getFieldsByAssetType = (assetType: string): FieldDefinition[] => {
  const assetConfig = FIELD_CATALOG.assetTypes.find(at => at.assetType === assetType);
  return assetConfig?.fields ?? [];
};

/**
 * Get all editable fields across all asset types.
 */
export const getEditableFields = (): Array<{ assetType: string; field: FieldDefinition }> => {
  const result: Array<{ assetType: string; field: FieldDefinition }> = [];
  for (const assetConfig of FIELD_CATALOG.assetTypes) {
    for (const field of assetConfig.fields) {
      if (field.editCapability !== 'none') {
        result.push({ assetType: assetConfig.assetType, field });
      }
    }
  }
  return result;
};

/**
 * Get field by name, optionally within an asset type.
 */
export const getFieldByName = (name: string, assetType?: string): FieldDefinition | undefined => {
  if (assetType) {
    const assetConfig = FIELD_CATALOG.assetTypes.find(at => at.assetType === assetType);
    return assetConfig?.fields.find(f => f.name === name);
  }
  for (const assetConfig of FIELD_CATALOG.assetTypes) {
    const field = assetConfig.fields.find(f => f.name === name);
    if (field) return field;
  }
  return undefined;
};

/**
 * Get card columns for an asset type.
 */
export const getCardColumns = (assetType: string): number => {
  const assetConfig = FIELD_CATALOG.assetTypes.find(at => at.assetType === assetType);
  return assetConfig?.cardColumns ?? 4;
};

/**
 * Get all steps.
 */
export const getAllSteps = (): StepDefinition[] => {
  return WORKFLOW_CATALOG.steps;
};

/**
 * Get step by name.
 */
export const getStepByName = (name: string): StepDefinition | undefined => {
  return WORKFLOW_CATALOG.steps.find(s => s.name === name);
};

/**
 * Get steps by phase.
 */
export const getStepsByPhase = (phase: Phase): StepDefinition[] => {
  return WORKFLOW_CATALOG.steps.filter(s => s.phase === phase);
};

/**
 * Get all phases (in order).
 */
export const getPhases = (): Phase[] => {
  return ['Acquisition', 'Preparation', 'Retrieval', 'Reasoning', 'Generation', 'Persistence'];
};

/**
 * Get step to phase mapping.
 */
export const stepToPhase = (step: string): Phase => {
  const stepDef = WORKFLOW_CATALOG.steps.find(s => s.name === step);
  return stepDef?.phase ?? 'Acquisition';
};
