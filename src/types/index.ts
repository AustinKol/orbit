export enum NodeType {
  Company = 'COMPANY',
  Person = 'PERSON',
  Institution = 'INSTITUTION',
  Fund = 'FUND'
}

export enum EdgeType {
  Ownership = 'OWNERSHIP',
  Partnership = 'PARTNERSHIP',
  Client = 'CLIENT',
  Supplier = 'SUPPLIER',
  Creditor = 'CREDITOR',
  Debtor = 'DEBTOR',
  JointVenture = 'JOINT_VENTURE',
  Licensing = 'LICENSING',
  Swaps = 'SWAPS',
  BoardInterlock = 'BOARD_INTERLOCK'
}

export const EDGE_COLORS: Record<EdgeType, string> = {
  [EdgeType.Ownership]: '#ffffff', // White - stands out for ownership stakes
  [EdgeType.Partnership]: '#64748b', // Slate 500 - subtle for common relationships
  [EdgeType.Client]: '#22c55e', // Green 500 - revenue/client relationships
  [EdgeType.Supplier]: '#f97316', // Orange 500 - supply chain
  [EdgeType.Creditor]: '#ef4444', // Red 500 - debt/credit risk
  [EdgeType.Debtor]: '#f43f5e', // Rose 500 - debt obligations
  [EdgeType.JointVenture]: '#06b6d4', // Cyan 500 - joint ventures
  [EdgeType.Licensing]: '#a78bfa', // Violet 400 - licensing/IP
  [EdgeType.Swaps]: '#2dd4bf', // Teal 400 - financial swaps
  [EdgeType.BoardInterlock]: '#c084fc' // Purple 400 - board connections
};

// Human-readable labels for relationship types
export const EDGE_LABELS: Record<EdgeType, string> = {
  [EdgeType.Ownership]: 'Ownership',
  [EdgeType.Partnership]: 'Partnership',
  [EdgeType.Client]: 'Client',
  [EdgeType.Supplier]: 'Supplier',
  [EdgeType.Creditor]: 'Creditor',
  [EdgeType.Debtor]: 'Debtor',
  [EdgeType.JointVenture]: 'Joint Venture',
  [EdgeType.Licensing]: 'Licensing Agreement',
  [EdgeType.Swaps]: 'Swaps',
  [EdgeType.BoardInterlock]: 'Board Interlock'
};

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  ticker?: string;
  description?: string;
  industry?: string;
  val?: number; // Visual size
  x?: number;
  y?: number;
  z?: number;
  data?: {
    price?: number;
    change?: number;
    volume?: number;
    tvl?: number;
    [key: string]: any;
  };
}

export interface GraphEdge {
  source: string | any;
  target: string | any;
  type: EdgeType;
  description?: string; // Summary of relationship
  data?: any; // Specifics (pct, amount, etc.)
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface PathResult {
  nodes: string[];
  edges: GraphEdge[];
  length: number;
}

export interface ExposureBreakdown {
  lengthPenalty: number;
  relationshipWeightScore: number;
  amountScore: number;
  ownershipScore: number;
  confidencePenalty: number;
}

export interface PathItem extends PathResult {
  pathId: string;
  exposureIndex: number;
  exposureBreakdown: ExposureBreakdown;
  summary: string;
}

export interface PathsResponse {
  shortestPath: PathItem | null;
  paths: PathItem[];
}

export interface CycleResult {
  path: string[];
  length: number;
}

export interface CycleResultWithEdges {
  cycleId: string;
  path: string[];        // Node IDs in the cycle
  edges: GraphEdge[];    // Edges forming the cycle
  length: number;        // Number of edges (hops) in the cycle
}

export interface CyclesResponse {
  nodeId: string;
  cycles: CycleResultWithEdges[];
  totalFound: number;
  capped: boolean;       // True if results were capped
}
