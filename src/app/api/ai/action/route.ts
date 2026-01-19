import { NextResponse } from 'next/server';
import { analyzeUserIntent } from '@/services/aiService';

export async function POST(request: Request) {
  try {
    const { text, companies, edgeTypes } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await analyzeUserIntent(
      text,
      companies || [],
      edgeTypes || []
    );
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action API route error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
