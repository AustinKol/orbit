import { GraphEdge, EdgeType, ExposureBreakdown } from '../types';
import { searchNodes } from './graphService';

// Relationship type weights for exposure calculation
const RELATIONSHIP_WEIGHTS: Record<EdgeType, number> = {
  [EdgeType.Ownership]: 5,
  [EdgeType.Creditor]: 4,
  [EdgeType.Debtor]: 4,
  [EdgeType.Swaps]: 4,
  [EdgeType.Client]: 3,
  [EdgeType.Supplier]: 3,
  [EdgeType.Partnership]: 2,
  [EdgeType.JointVenture]: 2,
  [EdgeType.Licensing]: 2,
  [EdgeType.BoardInterlock]: 1,
};

/**
 * Calculates exposure contribution for a single edge based on relationship type and numeric data
 */
const calculateEdgeExposure = (edge: GraphEdge): { baseExposure: number; hasNumericData: boolean } => {
  let baseExposure = RELATIONSHIP_WEIGHTS[edge.type] || 1;
  let hasNumericData = false;

  // Add numeric magnitude contribution
  if (edge.data) {
    // Ownership percentage
    if (edge.data.pct !== undefined && typeof edge.data.pct === 'number') {
      baseExposure += edge.data.pct / 10; // 50% => +5
      hasNumericData = true;
    }

    // Amount (loans, purchases, etc.)
    if (edge.data.amount !== undefined && typeof edge.data.amount === 'number') {
      // Log scale: log10(amount + 1) * 3
      baseExposure += Math.log10(edge.data.amount + 1) * 3;
      hasNumericData = true;
    }

    // Recurring purchase amount
    if (edge.data.recurringPurchaseUSD !== undefined && typeof edge.data.recurringPurchaseUSD === 'number') {
      baseExposure += Math.log10(edge.data.recurringPurchaseUSD + 1) * 3;
      hasNumericData = true;
    }
  }

  return { baseExposure, hasNumericData };
};

/**
 * Generates a human-readable summary for a path
 */
const generatePathSummary = (edges: GraphEdge[]): string => {
  const summaries: string[] = [];
  let totalAmount = 0;
  let hasOwnership = false;
  let hasLargeAmount = false;

  for (const edge of edges) {
    if (edge.type === EdgeType.Ownership && edge.data?.pct) {
      hasOwnership = true;
      summaries.push(`${edge.data.pct}% ownership`);
    }
    if (edge.data?.amount) {
      totalAmount += edge.data.amount;
      if (edge.data.amount > 1000000) {
        hasLargeAmount = true;
      }
    }
  }

  if (hasLargeAmount) {
    const amountStr = totalAmount >= 1000000000 
      ? `$${(totalAmount / 1000000000).toFixed(1)}B`
      : `$${(totalAmount / 1000000).toFixed(1)}M`;
    summaries.push(`High exposure: ${amountStr}`);
  } else if (totalAmount > 0) {
    summaries.push(`Total amount: $${(totalAmount / 1000).toFixed(0)}K`);
  }

  if (hasOwnership) {
    return summaries.join(', ') || 'Ownership relationship';
  }

  if (summaries.length > 0) {
    return summaries[0];
  }

  // Fallback to relationship types
  const types = edges.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i);
  if (types.length === 1) {
    return `${types[0]} relationship`;
  }
  return `${edges.length} relationships`;
};

/**
 * Calculates Exposure Index for a complete path and returns breakdown.
 * Exposure Index is a heuristic aggregate of financial magnitude and relationship strength, penalized by path length.
 */
export const scorePath = (edges: GraphEdge[], length: number): { exposureIndex: number; breakdown: ExposureBreakdown; summary: string } => {
  let relationshipWeightScore = 0;
  let amountScore = 0;
  let ownershipScore = 0;
  let hasNumericData = false;

  for (const edge of edges) {
    const { baseExposure, hasNumericData: hasData } = calculateEdgeExposure(edge);
    relationshipWeightScore += RELATIONSHIP_WEIGHTS[edge.type] || 1;
    
    if (hasData) {
      hasNumericData = true;
      
      if (edge.data?.pct !== undefined) {
        ownershipScore += edge.data.pct / 10;
      }
      
      if (edge.data?.amount !== undefined) {
        amountScore += Math.log10(edge.data.amount + 1) * 3;
      }
      
      if (edge.data?.recurringPurchaseUSD !== undefined) {
        amountScore += Math.log10(edge.data.recurringPurchaseUSD + 1) * 3;
      }
    }
  }

  // Penalize long paths
  const lengthPenalty = length * 0.75;
  
  // Light penalty for edges without numeric data
  const confidencePenalty = hasNumericData ? 0 : edges.length * 0.5;

  // Exposure Index: sum of all positive contributions minus penalties
  const exposureIndex = relationshipWeightScore + amountScore + ownershipScore - lengthPenalty - confidencePenalty;

  const breakdown: ExposureBreakdown = {
    lengthPenalty,
    relationshipWeightScore,
    amountScore,
    ownershipScore,
    confidencePenalty,
  };

  const summary = generatePathSummary(edges);

  return { exposureIndex, breakdown, summary };
};
