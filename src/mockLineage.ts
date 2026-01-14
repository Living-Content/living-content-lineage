/**
 * Mock lineage data based on real Living Content lineage structure.
 * Demonstrates C2PA-aligned provenance tracking with fan-in/fan-out patterns.
 */

export interface ComputationStatement {
  "@context": string;
  "@id": string;
  "@type": "ComputationRegistration";
  input: string[];
  output: string[];
  operatedBy: string;
  registeredBy: string;
  timestamp: string;
}

export interface DataRegistrationStatement {
  "@context": string;
  "@id": string;
  "@type": "DataRegistration";
  data: string;
  registeredBy: string;
  timestamp: string;
}

export interface MetadataStatement {
  "@context": string;
  "@id": string;
  "@type": "MetadataRegistration";
  subject: string;
  metadata: string;
  registeredBy: string;
  timestamp: string;
}

export interface AttestationStatement {
  "@context": string;
  "@id": string;
  "@type": "AttestationRegistration";
  verifies: string[];
  registeredBy: string;
  timestamp: string;
}

export interface C2PAAction {
  action: string;
  digitalSourceType?: string;
  softwareAgent?: { name: string; version: string };
  when: string;
  parameters?: Record<string, unknown>;
}

export interface C2PAIngredient {
  relationship: "parentOf" | "componentOf" | "inputTo";
  title: string;
  format?: string;
  instance_id: string;
  document_id?: string;
}

export interface C2PAManifest {
  claim_generator_info: { name: string; version: string };
  title: string;
  format?: string;
  instance_id: string;
  assertions: Array<{ label: string; data: unknown }>;
  signature: { alg: string; issuer: string; time: string };
}

export interface MetadataBlob {
  name: string;
  namespace: string;
  type: "Data" | "Computation";
  blob_type?: string;
  description?: string;
  assetType: "Model" | "Code" | "Computation" | "Data" | "Document" | "Dataset" | "Media";
  format?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  temperature?: number;
  max_tokens?: number;
  computation?: string;
  c2pa_manifest?: C2PAManifest;
  // Human-readable metadata
  humanDescription?: string;
  humanInputs?: string[];
  humanOutputs?: string[];
  verifiedBy?: string;
  verifiedAt?: string;
  duration?: string;
}

export interface MockLineage {
  statements: {
    computations: ComputationStatement[];
    dataRegistrations: DataRegistrationStatement[];
    metadata: MetadataStatement[];
    attestations: AttestationStatement[];
  };
  blobs: Record<string, MetadataBlob>;
}

const CONTEXT = "urn:cid:bafkr4iavz5hgvy4uayvzvzle7gtsbn3u76pfhndzkvh3jefksqmltme56m";
const OPERATOR_DID = "did:key:zQ3shwc61yUNaJZBX2L9mZd3xhWjTEqD52dA3JxBnZnu78E3d";

export const mockLineage: MockLineage = {
  statements: {
    computations: [
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-retrieve-history",
        "@type": "ComputationRegistration",
        input: ["urn:cid:data-user-query", "urn:cid:data-session-context"],
        output: ["urn:cid:data-retrieved-history"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:20Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-generate-response",
        "@type": "ComputationRegistration",
        input: ["urn:cid:data-retrieved-history", "urn:cid:data-model-config"],
        output: ["urn:cid:data-generated-response"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:25Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-generate-image",
        "@type": "ComputationRegistration",
        input: ["urn:cid:data-generated-response"],
        output: ["urn:cid:data-generated-image"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:30Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-save-output",
        "@type": "ComputationRegistration",
        input: ["urn:cid:data-generated-response", "urn:cid:data-generated-image"],
        output: ["urn:cid:data-final-document"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:35Z",
      },
    ],
    dataRegistrations: [
      { "@context": CONTEXT, "@id": "urn:cid:reg-1", "@type": "DataRegistration", data: "urn:cid:data-user-query", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-2", "@type": "DataRegistration", data: "urn:cid:data-session-context", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:11Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-3", "@type": "DataRegistration", data: "urn:cid:data-model-config", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:12Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-4", "@type": "DataRegistration", data: "urn:cid:data-retrieved-history", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-5", "@type": "DataRegistration", data: "urn:cid:data-generated-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:26Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-6", "@type": "DataRegistration", data: "urn:cid:data-generated-image", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:31Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-7", "@type": "DataRegistration", data: "urn:cid:data-final-document", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:36Z" },
    ],
    metadata: [
      { "@context": CONTEXT, "@id": "urn:cid:meta-1", "@type": "MetadataRegistration", subject: "urn:cid:data-user-query", metadata: "urn:cid:blob-user-query", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-2", "@type": "MetadataRegistration", subject: "urn:cid:data-session-context", metadata: "urn:cid:blob-session-context", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:11Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-3", "@type": "MetadataRegistration", subject: "urn:cid:data-model-config", metadata: "urn:cid:blob-model-config", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:12Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-4", "@type": "MetadataRegistration", subject: "urn:cid:data-retrieved-history", metadata: "urn:cid:blob-retrieved-history", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-5", "@type": "MetadataRegistration", subject: "urn:cid:data-generated-response", metadata: "urn:cid:blob-generated-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:26Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-6", "@type": "MetadataRegistration", subject: "urn:cid:data-generated-image", metadata: "urn:cid:blob-generated-image", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:31Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-7", "@type": "MetadataRegistration", subject: "urn:cid:data-final-document", metadata: "urn:cid:blob-final-document", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:36Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-1", "@type": "MetadataRegistration", subject: "urn:cid:comp-retrieve-history", metadata: "urn:cid:blob-comp-retrieve", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:20Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-2", "@type": "MetadataRegistration", subject: "urn:cid:comp-generate-response", metadata: "urn:cid:blob-comp-generate", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:25Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-3", "@type": "MetadataRegistration", subject: "urn:cid:comp-generate-image", metadata: "urn:cid:blob-comp-image", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:30Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-4", "@type": "MetadataRegistration", subject: "urn:cid:comp-save-output", metadata: "urn:cid:blob-comp-save", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:35Z" },
      // Attestation metadata
      { "@context": CONTEXT, "@id": "urn:cid:meta-attest-1", "@type": "MetadataRegistration", subject: "urn:cid:attest-retrieve", metadata: "urn:cid:blob-attest-retrieve", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-attest-2", "@type": "MetadataRegistration", subject: "urn:cid:attest-output", metadata: "urn:cid:blob-attest-output", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:37Z" },
    ],
    // Attestation registrations - verify computation outputs
    attestations: [
      {
        "@context": CONTEXT,
        "@id": "urn:cid:attest-retrieve",
        "@type": "AttestationRegistration",
        verifies: ["urn:cid:data-retrieved-history"],
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:22Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:attest-output",
        "@type": "AttestationRegistration",
        verifies: ["urn:cid:data-final-document"],
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:37Z",
      },
    ],
  },
  blobs: {
    "urn:cid:blob-user-query": {
      name: "User Query",
      namespace: "living-content",
      type: "Data",
      assetType: "Data",
      description: "User input query text",
      humanDescription: "Your original question that started this request",
      humanOutputs: ["Text: \"What are some good hiking trails near San Francisco?\""],
      verifiedBy: "Living Content",
      verifiedAt: "January 14, 2026 at 5:00 AM",
    },
    "urn:cid:blob-session-context": {
      name: "Session Context",
      namespace: "living-content",
      type: "Data",
      assetType: "Dataset",
      description: "Current session state and context",
      humanDescription: "Information about your current conversation session",
      humanOutputs: ["Session ID, preferences, and conversation state"],
      verifiedBy: "Living Content",
      verifiedAt: "January 14, 2026 at 5:00 AM",
    },
    "urn:cid:blob-model-config": {
      name: "Model Config",
      namespace: "living-content",
      type: "Data",
      assetType: "Model",
      description: "LLM configuration for claude-sonnet-4-5",
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      temperature: 0.7,
      humanDescription: "The AI model settings used to generate your response",
      humanOutputs: ["Model: Claude Sonnet 4.5", "Max length: 4,096 tokens", "Creativity: 70%"],
      verifiedBy: "Anthropic",
      verifiedAt: "January 14, 2026 at 5:00 AM",
    },
    "urn:cid:blob-retrieved-history": {
      name: "Retrieved History",
      namespace: "living-content",
      type: "Data",
      assetType: "Dataset",
      description: "Conversation history retrieved from memory",
      humanDescription: "Your previous messages from this conversation",
      humanInputs: ["Your question", "Session context"],
      humanOutputs: ["12 previous messages retrieved"],
      verifiedBy: "Living Content",
      verifiedAt: "January 14, 2026 at 5:00 AM",
      duration: "45ms",
    },
    "urn:cid:blob-generated-response": {
      name: "Generated Response",
      namespace: "living-content",
      type: "Data",
      blob_type: "file",
      assetType: "Document",
      format: "text/markdown",
      description: "AI-generated text response",
      model: "claude-sonnet-4-5",
      input_tokens: 2450,
      output_tokens: 512,
      total_tokens: 2962,
      humanDescription: "The AI's written response to your question",
      humanInputs: ["Your question about hiking trails", "12 previous messages for context", "AI model settings"],
      humanOutputs: ["512 words of text about Bay Area hiking trails"],
      verifiedBy: "Living Content + Anthropic",
      verifiedAt: "January 14, 2026 at 5:00 AM",
      duration: "2.3 seconds",
      c2pa_manifest: {
        claim_generator_info: { name: "Living Content AI", version: "1.0.0" },
        title: "AI Generated Response",
        format: "text/markdown",
        instance_id: "urn:uuid:b92e4fae-8dec-12d1-b876-11b1d92f7cg7",
        assertions: [
          {
            label: "c2pa.actions",
            data: {
              actions: [
                {
                  action: "c2pa.created",
                  digitalSourceType: "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                  softwareAgent: { name: "claude-sonnet-4-5", version: "4.5" },
                  when: "2026-01-14T05:00:26Z",
                },
              ],
            },
          },
          {
            label: "c2pa.ingredient.v3",
            data: [
              { relationship: "inputTo", title: "User Query", instance_id: "urn:cid:data-user-query" },
              { relationship: "inputTo", title: "Retrieved History", instance_id: "urn:cid:data-retrieved-history" },
            ],
          },
        ],
        signature: { alg: "ES256", issuer: OPERATOR_DID, time: "2026-01-14T05:00:26Z" },
      },
    },
    "urn:cid:blob-generated-image": {
      name: "Generated Image",
      namespace: "living-content",
      type: "Data",
      blob_type: "file",
      assetType: "Media",
      format: "image/png",
      description: "AI-generated artwork",
      humanDescription: "An AI-created image to accompany the response",
      humanInputs: ["Text description from the generated response"],
      humanOutputs: ["1024×1024 PNG image of hiking trail scenery"],
      verifiedBy: "Living Content + OpenAI",
      verifiedAt: "January 14, 2026 at 5:00 AM",
      duration: "4.1 seconds",
      c2pa_manifest: {
        claim_generator_info: { name: "Living Content AI", version: "1.0.0" },
        title: "AI Generated Artwork",
        format: "image/png",
        instance_id: "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        assertions: [
          {
            label: "c2pa.actions",
            data: {
              actions: [
                {
                  action: "c2pa.created",
                  digitalSourceType: "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                  softwareAgent: { name: "DALL-E 3", version: "3.0" },
                  when: "2026-01-14T05:00:30Z",
                  parameters: { prompt: "A serene landscape", seed: 12345 },
                },
              ],
            },
          },
          {
            label: "c2pa.hash.data",
            data: { alg: "sha256", hash: "7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730" },
          },
          {
            label: "c2pa.ingredient.v3",
            data: { relationship: "inputTo", title: "Generated Response", instance_id: "urn:cid:data-generated-response" },
          },
        ],
        signature: { alg: "ES256", issuer: OPERATOR_DID, time: "2026-01-14T05:00:30Z" },
      },
    },
    "urn:cid:blob-final-document": {
      name: "Final Output",
      namespace: "living-content",
      type: "Data",
      blob_type: "file",
      assetType: "Document",
      format: "application/json",
      description: "Combined response with text and image",
      humanDescription: "Your complete response package with text and image",
      humanInputs: ["Generated text response", "Generated image"],
      humanOutputs: ["Complete response ready to display"],
      verifiedBy: "Living Content",
      verifiedAt: "January 14, 2026 at 5:00 AM",
      duration: "120ms",
      c2pa_manifest: {
        claim_generator_info: { name: "Living Content AI", version: "1.0.0" },
        title: "Final Combined Output",
        format: "application/json",
        instance_id: "urn:uuid:c83f5bae-9efd-23e2-c987-22c2e03g8dh8",
        assertions: [
          {
            label: "c2pa.actions",
            data: {
              actions: [
                {
                  action: "c2pa.combined",
                  softwareAgent: { name: "Living Content Pipeline", version: "1.0.0" },
                  when: "2026-01-14T05:00:35Z",
                },
              ],
            },
          },
          {
            label: "c2pa.ingredient.v3",
            data: [
              { relationship: "componentOf", title: "Generated Response", instance_id: "urn:cid:data-generated-response" },
              { relationship: "componentOf", title: "Generated Image", instance_id: "urn:cid:data-generated-image" },
            ],
          },
        ],
        signature: { alg: "ES256", issuer: OPERATOR_DID, time: "2026-01-14T05:00:35Z" },
      },
    },
    "urn:cid:blob-comp-retrieve": {
      name: "Retrieve History",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      description: "Retrieves conversation history from memory store",
      computation: "retrieve_history",
      humanDescription: "Looked up your previous conversation messages",
      humanInputs: ["Your current question", "Your session info"],
      humanOutputs: ["Found 12 relevant messages from your chat history"],
      duration: "45ms",
    },
    "urn:cid:blob-comp-generate": {
      name: "Generate Response",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      description: "Generates text response using LLM",
      computation: "generate_response",
      humanDescription: "AI wrote a response based on your question and context",
      humanInputs: ["Your question", "Chat history", "AI model settings"],
      humanOutputs: ["Written response about hiking trails"],
      duration: "2.3 seconds",
    },
    "urn:cid:blob-comp-image": {
      name: "Generate Image",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      description: "Generates image using diffusion model",
      computation: "generate_image",
      humanDescription: "AI created an image to illustrate the response",
      humanInputs: ["Description extracted from the text response"],
      humanOutputs: ["Scenic hiking trail image"],
      duration: "4.1 seconds",
    },
    "urn:cid:blob-comp-save": {
      name: "Save Output",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      description: "Combines and saves final output",
      computation: "save_output",
      humanDescription: "Packaged everything together for you to see",
      humanInputs: ["Text response", "Generated image"],
      humanOutputs: ["Your complete response"],
      duration: "120ms",
    },
    // Attestation nodes
    "urn:cid:blob-attest-retrieve": {
      name: "Attest 1",
      namespace: "living-content",
      type: "Data",
      assetType: "Data",
      humanDescription: "Cryptographic proof that history retrieval was performed correctly",
      verifiedBy: "Living Content Attestation Service",
      verifiedAt: "January 14, 2026 at 5:00 AM",
    },
    "urn:cid:blob-attest-output": {
      name: "Attest 2",
      namespace: "living-content",
      type: "Data",
      assetType: "Data",
      humanDescription: "Cryptographic proof that the final output was assembled correctly",
      verifiedBy: "Living Content Attestation Service",
      verifiedAt: "January 14, 2026 at 5:00 AM",
    },
  },
};
