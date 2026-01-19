import { NextResponse } from 'next/server';
import { loadGraph } from '@/services/graphService';

export async function GET() {
  const graphData = loadGraph();
  return NextResponse.json(graphData);
}
