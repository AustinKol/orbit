// src/data/mockData.ts

import companiesData from './companies.json';

export type NodeType = 'company' | 'person' | 'fund';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  val: number; // size
  description: string;
  price?: number;
  change?: number;
  tvl?: number;
  volume?: number;
}

export interface Link {
  source: string;
  target: string;
  type: 'partnership' | 'ownership' | 'investment';
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

// Parse the flat array format from companies.json
const rawData = companiesData as unknown[];
const nodes: Node[] = rawData
  .filter((item: any) => item.name !== undefined)
  .map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.type as NodeType,
    val: item.val,
    description: item.description,
    price: item.price,
    change: item.change,
    tvl: item.tvl,
    volume: item.volume,
  }));

const links: Link[] = rawData
  .filter((item: any) => item.source !== undefined && item.target !== undefined)
  .map((item: any) => ({
    source: item.source,
    target: item.target,
    type: item.type as Link['type'],
  }));

export const MOCK_DATA: GraphData = { nodes, links };
