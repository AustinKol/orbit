import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchNodes, loadGraph } from './graphService';
import { findPaths } from './pathService';
import { GraphEdge } from '../types';

// API key must be set via environment variable GEMINI_API_KEY
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('GEMINI_API_KEY environment variable is not set. AI features will not work.');
}
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Helper function to try generating content with multiple models
const generateContentWithFallback = async (prompt: string): Promise<string> => {
  if (!genAI) {
    throw new Error('AI service is not configured. Please set the GEMINI_API_KEY environment variable.');
  }
  
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
      
      // If it's not a model not found error, propagate it
      if (!errorMsg.includes('404') && !errorMsg.includes('not found') && !errorMsg.includes('models/')) {
        throw e;
      }
      
      // Otherwise try next model
      console.warn(`Model ${modelName} failed, trying next:`, errorMsg);
      continue;
    }
  }
  
  // All models failed
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}. Please check your API key has access to Gemini models at https://makersuite.google.com/app/apikey`);
};

export const analyzeText = async (text: string) => {
  // Step 1: Extract Entities - More flexible prompt
  const prompt1 = `
    Analyze this text and identify companies, organizations, or people mentioned.
    Extract the two most relevant entities. If only one is found, try to identify a second related entity or use null.
    Return ONLY valid JSON, no markdown, no code blocks, no explanations.
    Format: { "entity1": "Name", "entity2": "Name or null" }
    
    Text: "${text.substring(0, 1000)}"
  `;
  
  let result1: { entity1: string | null; entity2: string | null };
  try {
    let txt = await generateContentWithFallback(prompt1);
    
    // Aggressive cleanup
    txt = txt.replace(/```json/g, '').replace(/```/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim();
    
    // Find first { and last }
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        txt = txt.substring(firstBrace, lastBrace + 1);
        result1 = JSON.parse(txt);
    } else {
        console.error("Invalid JSON response:", txt);
        // Try to extract entities manually from common patterns
        const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|Corporation|LLC|Ltd|Limited|Company|Co)\.?)?)\b/g;
        const matches = [...text.matchAll(entityPattern)];
        const entities = matches.map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
        
        if (entities.length >= 2) {
          result1 = { entity1: entities[0], entity2: entities[1] };
        } else if (entities.length === 1) {
          result1 = { entity1: entities[0], entity2: null };
        } else {
          throw new Error("Could not extract entities");
        }
    }
  } catch (e: any) {
    console.error("Gemini entity extraction failed:", e);
    const errorMsg = e?.message || String(e);
    
    // Check if it's a model not found error
    if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('models/')) {
      return { error: `The Gemini model is not available with your API key. This usually means: 1) Your API key doesn't have access to the model, 2) The model name is incorrect, or 3) Your API key needs to be updated. Please check your API key at https://makersuite.google.com/app/apikey and ensure it has access to Gemini models.` };
    }
    
    // Enhanced fallback: try to find company names in text
    const companyKeywords = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'NVIDIA', 'Tesla', 'IBM', 'Oracle', 'Adobe'];
    const found = companyKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (found.length >= 2) {
      result1 = { entity1: found[0], entity2: found[1] };
    } else if (found.length === 1) {
      // Use a related company as second entity
      result1 = { entity1: found[0], entity2: "Microsoft Corporation" };
    } else {
      return { error: "I couldn't identify specific companies in your message. Please mention at least one company name, or try asking about a specific relationship like 'What's the connection between Apple and Microsoft?'" };
    }
  }

  const e1 = result1.entity1;
  const e2 = result1.entity2;

  if (!e1) {
    return { error: "I couldn't identify any companies or entities in your message. Please mention specific company names or ask about relationships between companies." };
  }

  // If only one entity, try to find a related entity or use a default
  if (!e2) {
    // For news-style queries, we might want to analyze impact on multiple companies
    // For now, suggest the user be more specific
    return { error: `I found "${e1}" but need at least one more company to find a relationship. Please mention another company, or try asking "What companies are connected to ${e1}?"` };
  }

  // Step 2: Map to Graph Nodes
  // Improve search: check if extracted name is part of label, or label part of extracted name
  let nodeA = searchNodes(e1)[0];
  let nodeB = searchNodes(e2)[0];

  // Try simpler search if first attempt fails (e.g. "Apple Inc." vs "Apple")
  if (!nodeA && e1.split(' ').length > 1) {
      nodeA = searchNodes(e1.split(' ')[0])[0];
  }
  if (!nodeB && e2.split(' ').length > 1) {
      nodeB = searchNodes(e2.split(' ')[0])[0];
  }

  if (!nodeA || !nodeB) {
    const missing = !nodeA ? e1 : e2;
    return { error: `Could not map "${missing}" to a known company in the graph. Please try a different entity.` };
  }

  // Step 3: Find Paths
  const paths = findPaths(nodeA.id, nodeB.id, 4); // Default depth 4

  // Step 4: Explain Connection
  let explanation = "Based on the currently loaded graph, no direct or indirect paths were found between these entities within the specified depth.";
  if (paths.length > 0) {
    const shortestPath = paths[0];
    const pathDescription = shortestPath.nodes.map(nodeId => searchNodes(nodeId)[0]?.label || nodeId).join(" -> ");
    const edgesDescription = shortestPath.edges.map((edge: GraphEdge) => 
      `${searchNodes(edge.source)[0]?.label || edge.source} --(${edge.type})--> ${searchNodes(edge.target)[0]?.label || edge.target}`
    ).join("; ");

    const prompt2 = `
      I found a connection between ${nodeA.label} and ${nodeB.label} in a knowledge graph.
      The shortest path found is: ${pathDescription}.
      The relationships involved are: ${edgesDescription}.
      
      Explain this relationship in 2-3 sentences max, focusing on financial/business implications and "why this might matter" for financial literacy. 
      Strictly reference only the graph data provided. Do not make trading advice.
    `;
    
    try {
      explanation = await generateContentWithFallback(prompt2);
    } catch (e) {
      console.error("Gemini explanation generation failed:", e);
      explanation = "Failed to generate an explanation. Please try again.";
    }
  }

  return { nodeA, nodeB, paths, explanation };
};

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ExampleCompany {
  name: string; // Specific company name
  ticker?: string; // Stock ticker if publicly traded
  explanation: string; // Why this specific company would be affected
  searchUrl: string; // URL to search/learn more about this company
}

export interface RippleEffect {
  name: string; // Company, industry, or sector name (not in database)
  type: 'company' | 'industry' | 'sector' | 'supplier' | 'competitor';
  impactType: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  reason: string; // Why this entity would be affected
  exampleCompanies: ExampleCompany[]; // 2-3 specific example companies
}

export interface AffectedCompany {
  companyId: string;
  companyName: string;
  ticker?: string;
  impactType: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  impactDescription: string;
  confidence: number; // 0-1
  rippleEffects?: RippleEffect[]; // Secondary impacts on entities not in database
  news?: NewsArticle[]; // Scraped news articles
  newsLoading?: boolean; // Loading state for news
}

export interface GeneralFinanceResponse {
  answer: string;
  mentionedCompanies: AffectedCompany[];
}

export const analyzeGeneralFinance = async (question: string): Promise<GeneralFinanceResponse | { error: string }> => {
  // Load graph to get company list for context and matching
  const graphData = loadGraph();
  const allCompanyNames = graphData.nodes.map(n => n.label).slice(0, 200);
  
  const prompt = `
    You are a helpful financial assistant. Answer the user's question about finance, investing, or the stock market.
    
    Important guidelines:
    1. Give a clear, informative answer (2-4 sentences)
    2. If specific companies are relevant to the answer, mention them by name
    3. Do NOT give specific investment advice or recommend buying/selling
    4. Be educational and explain concepts clearly
    
    Known companies in our database (you can reference these):
    ${allCompanyNames.slice(0, 100).join(', ')}
    
    After your answer, list any company names from the database above that are directly relevant to your answer.
    
    Output strictly valid JSON with no markdown formatting:
    {
      "answer": "Your clear, helpful answer here",
      "mentionedCompanies": ["Company Name 1", "Company Name 2"]
    }
    
    User question: "${question.substring(0, 1000)}"
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
      
      // Map mentioned company names to graph nodes
      const mappedCompanies: AffectedCompany[] = [];
      const companyMap = new Map(graphData.nodes.map(n => [n.label.toLowerCase(), n]));
      
      for (const companyName of (response.mentionedCompanies || [])) {
        // Try exact match first
        const node = companyMap.get(companyName.toLowerCase());
        if (node) {
          mappedCompanies.push({
            companyId: node.id,
            companyName: node.label,
            impactType: 'neutral',
            impactDescription: 'Mentioned in response',
            confidence: 1.0
          });
        } else {
          // Fuzzy match
          const withoutSuffix = companyName.replace(/\s+(Inc|Corp|Corporation|LLC|Ltd|Limited|Company|Co)\.?$/i, '').trim();
          const fuzzyMatch = graphData.nodes.find(n => 
            n.label.toLowerCase().includes(companyName.toLowerCase()) ||
            n.label.toLowerCase().includes(withoutSuffix.toLowerCase()) ||
            companyName.toLowerCase().includes(n.label.toLowerCase().split(' ')[0])
          );
          
          if (fuzzyMatch && !mappedCompanies.find(c => c.companyId === fuzzyMatch.id)) {
            mappedCompanies.push({
              companyId: fuzzyMatch.id,
              companyName: fuzzyMatch.label,
              impactType: 'neutral',
              impactDescription: 'Mentioned in response',
              confidence: 0.9
            });
          }
        }
      }
      
      return {
        answer: response.answer,
        mentionedCompanies: mappedCompanies
      };
    } else {
      throw new Error("Invalid JSON response from AI");
    }
  } catch (e: any) {
    console.error("General finance analysis failed:", e);
    const errorMsg = e?.message || String(e);
    
    if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('models/')) {
      return { error: `The Gemini model is not available. Please check your API key.` };
    }
    
    return { error: `Failed to process question: ${errorMsg}` };
  }
};

export interface NewsAnalysis {
  affectedCompanies: AffectedCompany[];
  summary: string;
  newsType: 'merger' | 'partnership' | 'regulation' | 'financial' | 'technology' | 'market' | 'other';
}

// AI Action Types - Actions the AI can trigger in the UI
export type AIActionType = 'search' | 'findPath' | 'filter' | 'showOnly' | 'clearFilters';

export interface AIAction {
  type: AIActionType;
  params: {
    companyName?: string;      // For search action
    fromCompany?: string;      // For findPath action
    toCompany?: string;        // For findPath action
    edgeTypes?: string[];      // For filter/showOnly actions
    enable?: boolean;          // For filter action (true = enable, false = disable)
  };
  explanation: string;         // What the action does (for user feedback)
}

export interface AIActionResponse {
  message: string;             // Response message to show user
  actions: AIAction[];         // Actions to execute
  suggestions?: string[];      // Follow-up suggestions
}

export const analyzeNews = async (newsText: string): Promise<NewsAnalysis | { error: string }> => {
  // Step 1: Load all available companies from the graph
  const graphData = loadGraph();
  const allCompanyNames = graphData.nodes.map(n => n.label).slice(0, 200); // Limit to first 200 to avoid token limits
  
  // Step 2: Use smarter prompting - provide companies list and ask AI to identify affected ones
  const prompt = `
    You are a financial analyst analyzing how news affects company stock prices. Identify which companies would be impacted and whether the news is bullish or bearish for their stock.
    
    Available companies in the knowledge graph (use EXACT names from this list):
    ${allCompanyNames.join(', ')}
    
    Instructions:
    1. Analyze the news/scenario and identify which companies from the list above would be affected (even if not directly mentioned)
    2. Consider both direct mentions AND indirect impacts (e.g., oil companies affected by Middle East news, chip makers affected by tech regulations)
    3. For each affected company, determine the STOCK IMPACT:
       - "bullish" = Good for the stock price (positive revenue, competitive advantage, favorable conditions)
       - "bearish" = Bad for the stock price (lost revenue, increased costs, unfavorable conditions, supply chain issues)
       - "neutral" = Minimal or no significant impact on stock
       - "mixed" = Both positive and negative factors at play
    4. Provide a brief description explaining WHY it's bullish/bearish
    5. For EACH affected company, also identify 2-3 "ripple effects" - other companies, industries, suppliers, or sectors that are NOT in our database but would also be impacted. For example:
       - If IKEA is affected → wood suppliers, furniture logistics, home decor retailers
       - If Apple is affected → app developers, accessory manufacturers, retail partners
       - If an oil company is affected → gas stations, petrochemical industry, plastic manufacturers
    6. For EACH ripple effect, provide 2-3 SPECIFIC example companies within that industry/sector with:
       - Their stock ticker (if publicly traded)
       - A brief explanation of why that specific company would be affected
       - A Google Finance search URL in format: https://www.google.com/finance/quote/TICKER:EXCHANGE (use NYSE, NASDAQ, or appropriate exchange)
    7. Classify the news type: "merger", "partnership", "regulation", "financial", "technology", "market", "geopolitical", or "other"
    
    IMPORTANT: Only include companies that are in the list above for "affectedCompanies". Use their EXACT names as shown.
    The "rippleEffects" should be entities NOT in our database - broader industry impacts with REAL example companies.
    
    Output strictly valid JSON with no markdown formatting:
    {
      "newsType": "type",
      "affectedCompanies": [
        {
          "companyName": "Exact Company Name From List",
          "impactType": "bullish|bearish|neutral|mixed",
          "impactDescription": "Why this is bullish/bearish for the stock",
          "confidence": 0.85,
          "rippleEffects": [
            {
              "name": "Industry/Company/Sector name not in database",
              "type": "industry|company|sector|supplier|competitor",
              "impactType": "bullish|bearish|neutral|mixed",
              "reason": "Brief explanation of why they would be affected",
              "exampleCompanies": [
                {
                  "name": "Specific Company Name",
                  "ticker": "TICK",
                  "explanation": "Why this specific company is affected",
                  "searchUrl": "https://www.google.com/finance/quote/TICK:NASDAQ"
                }
              ]
            }
          ]
        }
      ],
      "summary": "2-3 sentence summary of the news and market implications"
    }
    
    News/Scenario: "${newsText.substring(0, 3000)}"
  `;

  try {
    let txt = await generateContentWithFallback(prompt);
    
    // Clean up JSON
    txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      txt = txt.substring(firstBrace, lastBrace + 1);
      const analysis: NewsAnalysis = JSON.parse(txt);
      
      // Map company names to graph nodes (should match exactly now since AI uses exact names)
      const mappedCompanies: AffectedCompany[] = [];
      const companyMap = new Map(graphData.nodes.map(n => [n.label.toLowerCase(), n]));
      
      for (const company of analysis.affectedCompanies) {
        // Try exact match first
        const node = companyMap.get(company.companyName.toLowerCase());
        if (node) {
          mappedCompanies.push({
            companyId: node.id,
            companyName: node.label,
            impactType: company.impactType,
            impactDescription: company.impactDescription,
            confidence: company.confidence,
            rippleEffects: company.rippleEffects || []
          });
        } else {
          // Fallback: try fuzzy matching (without suffix, partial match)
          const withoutSuffix = company.companyName.replace(/\s+(Inc|Corp|Corporation|LLC|Ltd|Limited|Company|Co)\.?$/i, '').trim();
          const fuzzyMatch = graphData.nodes.find(n => 
            n.label.toLowerCase().includes(company.companyName.toLowerCase()) ||
            n.label.toLowerCase().includes(withoutSuffix.toLowerCase()) ||
            company.companyName.toLowerCase().includes(n.label.toLowerCase().split(' ')[0])
          );
          
          if (fuzzyMatch && !mappedCompanies.find(c => c.companyId === fuzzyMatch.id)) {
            mappedCompanies.push({
              companyId: fuzzyMatch.id,
              companyName: fuzzyMatch.label,
              impactType: company.impactType,
              impactDescription: company.impactDescription,
              confidence: company.confidence * 0.8, // Lower confidence for fuzzy matches
              rippleEffects: company.rippleEffects || []
            });
          }
        }
      }
      
      return {
        ...analysis,
        affectedCompanies: mappedCompanies
      };
    } else {
      throw new Error("Invalid JSON response from AI");
    }
  } catch (e: any) {
    console.error("News analysis failed:", e);
    const errorMsg = e?.message || String(e);
    
    // Check if it's a model not found error
    if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('models/')) {
      return { error: `The Gemini model is not available with your API key. This usually means: 1) Your API key doesn't have access to the model, 2) The model name is incorrect, or 3) Your API key needs to be updated. Please check your API key at https://makersuite.google.com/app/apikey and ensure it has access to Gemini models.` };
    }
    
    return { error: `Failed to analyze news: ${errorMsg}` };
  }
};

// AI Action Handler - Detects user intent and triggers UI actions
export const analyzeUserIntent = async (
  userMessage: string, 
  availableCompanies: string[],
  availableEdgeTypes: string[]
): Promise<AIActionResponse | { error: string }> => {
  
  const prompt = `
    You are an AI assistant for a financial knowledge graph visualization tool called Orbit.
    Analyze the user's message and determine what actions they want to perform.
    
    Available companies in the graph:
    ${availableCompanies.slice(0, 150).join(', ')}
    
    Available relationship/edge types to filter:
    ${availableEdgeTypes.join(', ')}
    
    You can trigger these actions:
    1. "search" - Focus on and select a specific company. Use when user wants to view, find, or learn about a company.
    2. "findPath" - Find the shortest path/connection between two companies. Use when user asks about connections, paths, or relationships between two specific companies.
    3. "filter" - Enable or disable specific relationship types. Use when user wants to show/hide certain types of connections.
    4. "showOnly" - Show ONLY the specified relationship types (disable all others). Use when user wants to focus on specific relationship types exclusively.
    5. "clearFilters" - Reset all filters to show everything. Use when user wants to see all relationships again.
    
    Rules:
    - Match company names to the EXACT names in the available companies list (fuzzy match if needed)
    - For "findPath", you need exactly TWO companies
    - For "filter" or "showOnly", match edge types to available types (case-insensitive)
    - You can return multiple actions if needed (e.g., search + filter)
    - Always provide a helpful, conversational message explaining what you're doing
    
    User message: "${userMessage.substring(0, 1000)}"
    
    Output strictly valid JSON with no markdown:
    {
      "message": "Conversational response explaining what you're doing",
      "actions": [
        {
          "type": "search|findPath|filter|showOnly|clearFilters",
          "params": {
            "companyName": "For search - exact company name from list",
            "fromCompany": "For findPath - source company name",
            "toCompany": "For findPath - target company name",
            "edgeTypes": ["For filter/showOnly - array of edge types"],
            "enable": true
          },
          "explanation": "Brief explanation of this action"
        }
      ],
      "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2", "Follow-up suggestion 3"]
    }
    
    If the user's message doesn't require any graph actions (just a general question), return:
    {
      "message": "Your helpful response to their question",
      "actions": [],
      "suggestions": ["Relevant follow-up suggestions"]
    }
  `;

  try {
    let txt = await generateContentWithFallback(prompt);
    
    // Clean up JSON
    txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      txt = txt.substring(firstBrace, lastBrace + 1);
      const response: AIActionResponse = JSON.parse(txt);
      
      // Validate and clean up company names in actions
      const companyMapLower = new Map(availableCompanies.map(c => [c.toLowerCase(), c]));
      
      for (const action of response.actions) {
        if (action.type === 'search' && action.params.companyName) {
          // Try to find exact match
          const exactMatch = companyMapLower.get(action.params.companyName.toLowerCase());
          if (exactMatch) {
            action.params.companyName = exactMatch;
          } else {
            // Fuzzy match
            const fuzzy = availableCompanies.find(c => 
              c.toLowerCase().includes(action.params.companyName!.toLowerCase()) ||
              action.params.companyName!.toLowerCase().includes(c.toLowerCase().split(' ')[0])
            );
            if (fuzzy) action.params.companyName = fuzzy;
          }
        }
        
        if (action.type === 'findPath') {
          // Match fromCompany
          if (action.params.fromCompany) {
            const fromMatch = companyMapLower.get(action.params.fromCompany.toLowerCase()) ||
              availableCompanies.find(c => 
                c.toLowerCase().includes(action.params.fromCompany!.toLowerCase()) ||
                action.params.fromCompany!.toLowerCase().includes(c.toLowerCase().split(' ')[0])
              );
            if (fromMatch) action.params.fromCompany = fromMatch;
          }
          // Match toCompany
          if (action.params.toCompany) {
            const toMatch = companyMapLower.get(action.params.toCompany.toLowerCase()) ||
              availableCompanies.find(c => 
                c.toLowerCase().includes(action.params.toCompany!.toLowerCase()) ||
                action.params.toCompany!.toLowerCase().includes(c.toLowerCase().split(' ')[0])
              );
            if (toMatch) action.params.toCompany = toMatch;
          }
        }
        
        // Normalize edge types
        if (action.params.edgeTypes) {
          const edgeMapLower = new Map(availableEdgeTypes.map(e => [e.toLowerCase().replace(/_/g, ' '), e]));
          action.params.edgeTypes = action.params.edgeTypes.map(et => {
            const normalized = et.toLowerCase().replace(/_/g, ' ');
            return edgeMapLower.get(normalized) || 
              availableEdgeTypes.find(e => e.toLowerCase().includes(normalized)) ||
              et;
          }).filter(et => availableEdgeTypes.includes(et));
        }
      }
      
      return response;
    } else {
      throw new Error("Invalid JSON response");
    }
  } catch (e: any) {
    console.error("Intent analysis failed:", e);
    return { error: `Failed to understand request: ${e?.message || 'Unknown error'}` };
  }
};
