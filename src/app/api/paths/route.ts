import { NextResponse } from 'next/server';
import { findAllPaths } from '@/services/pathService';
import { PathsResponse } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const depth = searchParams.get('depth');

    if (!from || !to) {
      return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
    }

    const maxDepth = depth ? parseInt(depth) : 4;
    const allPaths = findAllPaths(from, to, maxDepth, 15);

    const response: PathsResponse = {
      shortestPath: allPaths.length > 0 ? allPaths[0] : null,
      paths: allPaths,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/paths:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        paths: [],
        shortestPath: null
      },
      { status: 500 }
    );
  }
}
