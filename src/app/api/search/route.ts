import { NextResponse } from 'next/server';
import { searchNodes } from '@/services/graphService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const results = searchNodes(q);
  return NextResponse.json(results);
}
