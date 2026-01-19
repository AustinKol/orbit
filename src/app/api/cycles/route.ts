import { NextResponse } from 'next/server';
import { findCycles, findCyclesWithEdges } from '@/services/pathService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const node = searchParams.get('node');
  const maxDepth = searchParams.get('maxDepth');
  const maxCycles = searchParams.get('maxCycles');
  const detailed = searchParams.get('detailed');

  if (!node) {
    return NextResponse.json({ error: 'Missing node parameter' }, { status: 400 });
  }

  // Use detailed version with edges for the cycle highlighting feature
  if (detailed === 'true') {
    const result = findCyclesWithEdges(
      node, 
      maxDepth ? parseInt(maxDepth) : 8,
      maxCycles ? parseInt(maxCycles) : 50
    );
    return NextResponse.json(result);
  }

  // Legacy simple version
  const cycles = findCycles(node, maxDepth ? parseInt(maxDepth) : undefined);
  return NextResponse.json(cycles);
}
