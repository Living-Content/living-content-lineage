import type { AssetType, NodeType } from "../types.js";

export const NODE_STYLES: Record<
  NodeType,
  {
    color: string;
    borderColor: string;
    iconColor: string;
    borderStyle?: string;
  }
> = {
  data: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  compute: {
    color: "#ffffff",
    borderColor: "#ec4899",
    iconColor: "#ec4899",
    borderStyle: "dashed",
  },
  attestation: {
    color: "#ffffff",
    borderColor: "#22c55e",
    iconColor: "#22c55e",
  },
  filter: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  join: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  store: {
    color: "#fef3c7",
    borderColor: "#ec4899",
    iconColor: "#d97706",
    borderStyle: "solid",
  },
  media: { color: "#ffffff", borderColor: "#1a1a1a", iconColor: "#1a1a1a" },
  meta: { color: "#f0f4f8", borderColor: "#3b82f6", iconColor: "#3b82f6" },
};

export const ASSET_TYPE_COLORS: Partial<Record<AssetType, string>> = {
  Model: "#000000",
  Code: "#9ca3af",
  Document: "#22d3ee",
  Data: "#fb923c",
  Dataset: "#3b82f6",
};

export const NODE_ICON_PATHS: Record<NodeType, string> = {
  data: "/icons/data.svg",
  compute: "/icons/compute.svg",
  attestation: "/icons/attestation.svg",
  filter: "/icons/filter.svg",
  join: "/icons/join.svg",
  store: "/icons/store.svg",
  media: "/icons/media.svg",
  meta: "/icons/collection.svg",
};

export const ASSET_TYPE_ICONS: Partial<Record<AssetType, string>> = {
  Code: "/icons/code.svg",
  Document: "/icons/document.svg",
};

export const DEFAULT_NODE_SIZE = 14;
export const ATTESTATION_NODE_SIZE = 16;
export const META_NODE_SIZE = 24;
