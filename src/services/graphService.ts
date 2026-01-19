import { GraphData, GraphNode, NodeType, EdgeType } from '../types';
// Static import for Vercel serverless compatibility
import companiesData from '../data/companies.json';

// In-memory cache
let graphCache: GraphData | null = null;

export const clearGraphCache = () => {
  graphCache = null;
};

export const loadGraph = (): GraphData => {
  // Return cached data if available
  if (graphCache) return graphCache;
  
  try {
    const rawData = companiesData as any;
    
    // Handle both formats: { nodes, links } or flat array with mixed nodes/links
    let rawNodes: any[] = [];
    let rawLinks: any[] = [];
    
    if (Array.isArray(rawData)) {
      // Flat array format: separate nodes (have 'name') from links (have 'source'/'target')
      rawNodes = rawData.filter((item: any) => item.name !== undefined);
      rawLinks = rawData.filter((item: any) => item.source !== undefined && item.target !== undefined);
    } else {
      // Object format with nodes and links arrays
      rawNodes = rawData.nodes || [];
      rawLinks = rawData.links || [];
    }
    
    // Map raw data to application types
    const nodes: GraphNode[] = rawNodes.map((n: any) => ({
      id: n.id,
      label: n.name || n.label || n.id,
      type: (n.type?.toUpperCase() as NodeType) || NodeType.Company,
      description: n.description,
      val: n.val,
      // Additional financial metrics can be stored in data or specific fields
      data: {
        price: n.price,
        change: n.change,
        tvl: n.tvl,
        volume: n.volume
      }
    }));

    const links = rawLinks.map((l: any) => ({
      source: l.source,
      target: l.target,
      type: (l.type?.toUpperCase() as EdgeType) || EdgeType.Partnership,
      description: l.description,
      data: l.data
    }));

    graphCache = { nodes, links };
    console.log(`Loaded graph: ${nodes.length} nodes, ${links.length} links`);
    return graphCache!;
  } catch (e) {
    console.error("Failed to load companies.json", e);
    // Fallback to empty
    return { nodes: [], links: [] };
  }
};

export const getNodeById = (id: string): GraphNode | undefined => {
  const data = loadGraph();
  return data.nodes.find(n => n.id === id);
};

export const searchNodes = (query: string): GraphNode[] => {
  const data = loadGraph();
  const lowerQ = query.toLowerCase();
  return data.nodes.filter(n => 
    n.label.toLowerCase().includes(lowerQ)
  ).slice(0, 10);
};
