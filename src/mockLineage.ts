/**
 * Mock lineage data based on real Living Content lineage structure.
 * Matches the actual pipeline: Select → Retrieve → Generate → Save
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
        "@id": "urn:cid:comp-select-tool",
        "@type": "ComputationRegistration",
        input: [
          "urn:cid:data-select-tool-code",
          "urn:cid:data-select-tool-model",
          "urn:cid:data-consumed-query",
        ],
        output: [],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:15Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-retrieve-history",
        "@type": "ComputationRegistration",
        input: ["urn:cid:comp-select-tool"],
        output: ["urn:cid:data-selected-tool", "urn:cid:data-retrieved-history"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:20Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-generate-response",
        "@type": "ComputationRegistration",
        input: [
          "urn:cid:data-retrieved-history",
          "urn:cid:data-generate-response-code",
          "urn:cid:data-generate-response-model",
        ],
        output: ["urn:cid:data-generated-response"],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:25Z",
      },
      {
        "@context": CONTEXT,
        "@id": "urn:cid:comp-save-response",
        "@type": "ComputationRegistration",
        input: ["urn:cid:data-generated-response"],
        output: [],
        operatedBy: OPERATOR_DID,
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:30Z",
      },
    ],
    dataRegistrations: [
      { "@context": CONTEXT, "@id": "urn:cid:reg-1", "@type": "DataRegistration", data: "urn:cid:data-select-tool-code", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-2", "@type": "DataRegistration", data: "urn:cid:data-select-tool-model", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-3", "@type": "DataRegistration", data: "urn:cid:data-consumed-query", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-4", "@type": "DataRegistration", data: "urn:cid:data-selected-tool", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-5", "@type": "DataRegistration", data: "urn:cid:data-retrieved-history", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-6", "@type": "DataRegistration", data: "urn:cid:data-generate-response-code", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-7", "@type": "DataRegistration", data: "urn:cid:data-generate-response-model", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:reg-8", "@type": "DataRegistration", data: "urn:cid:data-generated-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:26Z" },
    ],
    metadata: [
      { "@context": CONTEXT, "@id": "urn:cid:meta-1", "@type": "MetadataRegistration", subject: "urn:cid:data-select-tool-code", metadata: "urn:cid:blob-select-tool-code", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-2", "@type": "MetadataRegistration", subject: "urn:cid:data-select-tool-model", metadata: "urn:cid:blob-select-tool-model", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-3", "@type": "MetadataRegistration", subject: "urn:cid:data-consumed-query", metadata: "urn:cid:blob-consumed-query", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:10Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-4", "@type": "MetadataRegistration", subject: "urn:cid:data-selected-tool", metadata: "urn:cid:blob-selected-tool", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-5", "@type": "MetadataRegistration", subject: "urn:cid:data-retrieved-history", metadata: "urn:cid:blob-retrieved-history", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:21Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-6", "@type": "MetadataRegistration", subject: "urn:cid:data-generate-response-code", metadata: "urn:cid:blob-generate-response-code", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-7", "@type": "MetadataRegistration", subject: "urn:cid:data-generate-response-model", metadata: "urn:cid:blob-generate-response-model", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-8", "@type": "MetadataRegistration", subject: "urn:cid:data-generated-response", metadata: "urn:cid:blob-generated-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:26Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-1", "@type": "MetadataRegistration", subject: "urn:cid:comp-select-tool", metadata: "urn:cid:blob-comp-select-tool", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:15Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-2", "@type": "MetadataRegistration", subject: "urn:cid:comp-retrieve-history", metadata: "urn:cid:blob-comp-retrieve-history", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:20Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-3", "@type": "MetadataRegistration", subject: "urn:cid:comp-generate-response", metadata: "urn:cid:blob-comp-generate-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:25Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-comp-4", "@type": "MetadataRegistration", subject: "urn:cid:comp-save-response", metadata: "urn:cid:blob-comp-save-response", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:30Z" },
      // Attestation metadata
      { "@context": CONTEXT, "@id": "urn:cid:meta-attest-1", "@type": "MetadataRegistration", subject: "urn:cid:attest-retrieve", metadata: "urn:cid:blob-attest-retrieve", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:22Z" },
      { "@context": CONTEXT, "@id": "urn:cid:meta-attest-2", "@type": "MetadataRegistration", subject: "urn:cid:attest-generate", metadata: "urn:cid:blob-attest-generate", registeredBy: OPERATOR_DID, timestamp: "2026-01-14T05:00:27Z" },
    ],
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
        "@id": "urn:cid:attest-generate",
        "@type": "AttestationRegistration",
        verifies: ["urn:cid:data-generated-response"],
        registeredBy: OPERATOR_DID,
        timestamp: "2026-01-14T05:00:27Z",
      },
    ],
  },
  blobs: {
    // SELECT STAGE - inputs
    "urn:cid:blob-select-tool-code": {
      name: "Select Tool",
      namespace: "living-content",
      type: "Data",
      assetType: "Code",
      humanDescription: "Code that determines which tool to use",
    },
    "urn:cid:blob-select-tool-model": {
      name: "Select Tool",
      namespace: "living-content",
      type: "Data",
      assetType: "Model",
      humanDescription: "Model configuration for tool selection",
    },
    "urn:cid:blob-consumed-query": {
      name: "Consumed Query",
      namespace: "living-content",
      type: "Data",
      assetType: "Document",
      humanDescription: "Your original question",
    },

    // RETRIEVE STAGE - outputs
    "urn:cid:blob-selected-tool": {
      name: "Selected Tool",
      namespace: "living-content",
      type: "Data",
      assetType: "Document",
      humanDescription: "The tool that was selected for this request",
    },
    "urn:cid:blob-retrieved-history": {
      name: "Retrieved History",
      namespace: "living-content",
      type: "Data",
      assetType: "Dataset",
      humanDescription: "Your previous conversation messages",
      duration: "45ms",
    },

    // GENERATE STAGE - inputs and outputs
    "urn:cid:blob-generate-response-code": {
      name: "Generate Response",
      namespace: "living-content",
      type: "Data",
      assetType: "Code",
      humanDescription: "Code that orchestrates response generation",
    },
    "urn:cid:blob-generate-response-model": {
      name: "Generate Response",
      namespace: "living-content",
      type: "Data",
      assetType: "Model",
      humanDescription: "The AI model used to generate your response",
    },
    "urn:cid:blob-generated-response": {
      name: "Generated Response",
      namespace: "living-content",
      type: "Data",
      assetType: "Document",
      format: "text/markdown",
      humanDescription: "The AI's written response to your question",
      duration: "2.3 seconds",
    },

    // COMPUTATION NODES
    "urn:cid:blob-comp-select-tool": {
      name: "Select Tool",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      humanDescription: "Determined the best tool for your request",
      duration: "120ms",
    },
    "urn:cid:blob-comp-retrieve-history": {
      name: "Retrieve History",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      humanDescription: "Retrieved your conversation history",
      duration: "45ms",
    },
    "urn:cid:blob-comp-generate-response": {
      name: "Generate Response",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      humanDescription: "Generated a response using AI",
      duration: "2.3 seconds",
    },
    "urn:cid:blob-comp-save-response": {
      name: "Save Response",
      namespace: "living-content",
      type: "Computation",
      assetType: "Computation",
      humanDescription: "Saved the response for you to see",
      duration: "50ms",
    },

    // ATTESTATION NODES
    "urn:cid:blob-attest-retrieve": {
      name: "Attest",
      namespace: "living-content",
      type: "Data",
      assetType: "Data",
      humanDescription: "Cryptographic proof of history retrieval",
      verifiedBy: "Living Content Attestation Service",
    },
    "urn:cid:blob-attest-generate": {
      name: "Attest",
      namespace: "living-content",
      type: "Data",
      assetType: "Data",
      humanDescription: "Cryptographic proof of response generation",
      verifiedBy: "Living Content Attestation Service",
    },
  },
};
