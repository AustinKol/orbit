import { NextResponse } from 'next/server';
import { analyzeText, analyzeNews, analyzeGeneralFinance } from '@/services/aiService';

// Type guard to check if result has an error property
function hasError(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

export async function POST(request: Request) {
  try {
    const { text, type } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // If type is 'news', use news analysis
    if (type === 'news') {
      const result = await analyzeNews(text);
      if (hasError(result)) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }
      return NextResponse.json({ ...result, analysisType: 'news' });
    }
    
    // If type is 'general', use general finance Q&A
    if (type === 'general') {
      const result = await analyzeGeneralFinance(text);
      if (hasError(result)) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }
      return NextResponse.json({ ...result, analysisType: 'general' });
    }

    // Default to relationship analysis
    const result = await analyzeText(text);
    if (hasError(result)) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }
    return NextResponse.json({ ...result, analysisType: 'relationship' });
  } catch (error: unknown) {
    console.error('API route error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while processing your request.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
