import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAKBC8isX--9XLnm8Xmm_BU_jOsLXopcuU';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface CompanyNewsResponse {
  companyId: string;
  companyName: string;
  articles: NewsArticle[];
  lastUpdated: string;
}

// Helper function to generate content with model fallback
const generateContentWithFallback = async (prompt: string): Promise<string> => {
  const modelNames = ['gemini-2.0-flash-exp', 'gemini-2.0-flash'];
  let lastError: any;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const resp = await model.generateContent(prompt);
      return resp.response.text();
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      lastError = e;
      
      if (!errorMsg.includes('404') && !errorMsg.includes('not found') && !errorMsg.includes('models/')) {
        throw e;
      }
      
      console.warn(`Model ${modelName} failed, trying next:`, errorMsg);
      continue;
    }
  }
  
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Fetch news for a single company using Gemini to search and summarize
async function fetchCompanyNews(companyName: string, ticker?: string): Promise<NewsArticle[]> {
  const searchTerm = ticker ? `${companyName} (${ticker})` : companyName;
  
  const prompt = `
    You are a financial news analyst. Find and summarize the 3 most recent and relevant news articles about ${searchTerm} from the past week.
    
    Focus on:
    - Stock market news
    - Business developments
    - Earnings and financial reports
    - Strategic announcements
    - Industry trends affecting the company
    
    For each article, provide:
    - A compelling headline
    - A 1-2 sentence summary
    - The likely source (e.g., Reuters, Bloomberg, CNBC, WSJ, etc.)
    - Approximate publication date (relative to today, January 2026)
    - Sentiment: positive, negative, or neutral for the stock
    
    Output ONLY valid JSON with no markdown formatting:
    {
      "articles": [
        {
          "title": "Article headline",
          "summary": "Brief 1-2 sentence summary of the article",
          "source": "News source name",
          "url": "https://example.com/article",
          "publishedAt": "2026-01-18",
          "sentiment": "positive|negative|neutral"
        }
      ]
    }
    
    If no recent news is available, return an empty articles array.
  `;

  try {
    let txt = await generateContentWithFallback(prompt);
    
    // Clean up JSON
    txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      txt = txt.substring(firstBrace, lastBrace + 1);
      const response = JSON.parse(txt);
      return response.articles || [];
    }
    
    return [];
  } catch (e) {
    console.error(`Failed to fetch news for ${companyName}:`, e);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { companies } = await request.json();

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: 'Companies array is required' }, { status: 400 });
    }

    // Limit to 5 companies to avoid rate limits
    const limitedCompanies = companies.slice(0, 5);
    
    // Fetch news for all companies in parallel
    const newsPromises = limitedCompanies.map(async (company: { companyId: string; companyName: string; ticker?: string }) => {
      const articles = await fetchCompanyNews(company.companyName, company.ticker);
      return {
        companyId: company.companyId,
        companyName: company.companyName,
        articles,
        lastUpdated: new Date().toISOString()
      } as CompanyNewsResponse;
    });

    const results = await Promise.all(newsPromises);
    
    return NextResponse.json({ news: results });
  } catch (error: any) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
