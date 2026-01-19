'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, ChevronUp, Newspaper, Search, GitBranch, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIAction, AIActionResponse } from '@/services/aiService';
import { GraphNode, EdgeType } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: string[];
  actions?: AIAction[]; // Actions that were executed
}

interface ChatbotProps {
  onNewsAnalysis?: (analysis: any) => void;
  // New action callbacks
  nodes?: GraphNode[];
  onSearchSelect?: (node: GraphNode) => void;
  onFindPath?: (fromId: string, toId: string) => void;
  onFilterToggle?: (edgeType: EdgeType, enable: boolean) => void;
  onShowOnlyFilters?: (edgeTypes: EdgeType[]) => void;
  onClearFilters?: () => void;
}

// Detect the type of query: 'news', 'relationship', 'general', or 'action'
const detectQueryType = (text: string): 'news' | 'relationship' | 'general' | 'action' => {
  const lowerText = text.toLowerCase();
  
  // Action detection - Commands to interact with the graph
  const actionKeywords = [
    'show me', 'find', 'search for', 'look up', 'select', 'focus on', 'zoom to',
    'path between', 'connection between', 'how is .* connected to', 'route from',
    'filter', 'show only', 'hide', 'display only', 'turn on', 'turn off',
    'enable', 'disable', 'clear filters', 'reset filters', 'show all'
  ];
  const hasActionKeywords = actionKeywords.some(keyword => {
    if (keyword.includes('.*')) {
      return new RegExp(keyword).test(lowerText);
    }
    return lowerText.includes(keyword);
  });
  
  // Specific action patterns
  const pathPattern = /(?:path|connection|route|link)\s+(?:between|from)\s+.+\s+(?:to|and)\s+/i;
  const searchPattern = /(?:show|find|search|select|focus|look up|zoom)\s+(?:me\s+)?(?:the\s+)?[A-Z]/i;
  const filterPattern = /(?:filter|show only|hide|display only|enable|disable)\s+(?:the\s+)?(?:\w+\s+)?(?:relationship|edge|connection|type)/i;
  
  if (hasActionKeywords || pathPattern.test(text) || searchPattern.test(text) || filterPattern.test(text)) {
    return 'action';
  }
  
  // Impact/scenario analysis detection - route to news for bullish/bearish analysis
  const impactKeywords = ['affected', 'impact', 'crashes', 'crash', 'fails', 'bankrupt', 'goes down', 'drops', 'rises', 'grows', 'expands', 'acquires', 'merges'];
  const scenarioKeywords = ['if', 'what would', 'what happens', 'which companies', 'which stocks', 'what stocks'];
  const hasImpactKeywords = impactKeywords.some(keyword => lowerText.includes(keyword));
  const hasScenarioKeywords = scenarioKeywords.some(keyword => lowerText.includes(keyword));
  
  // If asking about impact scenarios, use news analysis for bullish/bearish
  if (hasImpactKeywords && hasScenarioKeywords) {
    return 'news';
  }
  
  // News article detection: Long text with news keywords
  const newsKeywords = ['announced', 'reported', 'according to', 'breaking', 'news', 'article', 'sources', 'confirmed', 'invaded'];
  const hasNewsKeywords = newsKeywords.some(keyword => lowerText.includes(keyword));
  const isLongText = text.length > 200;
  const hasMultipleSentences = (text.match(/[.!?]/g) || []).length >= 3;
  
  if ((hasNewsKeywords && hasMultipleSentences) || (isLongText && hasMultipleSentences)) {
    return 'news';
  }
  
  // Relationship detection: Asks about connections between specific companies
  const relationshipKeywords = ['connection', 'connected', 'relationship', 'between', 'path', 'link', 'linked'];
  const hasRelationshipKeywords = relationshipKeywords.some(keyword => lowerText.includes(keyword));
  
  // Check if two company-like names are mentioned (capitalized words)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const potentialCompanies = capitalizedWords.filter(w => w.length > 3);
  
  if (hasRelationshipKeywords && potentialCompanies.length >= 2) {
    return 'relationship';
  }
  
  // Default to general finance Q&A
  return 'general';
};

// Industries for dynamic suggestions
const INDUSTRIES = [
  'semiconductor', 'automotive', 'tech', 'banking', 'oil & gas', 
  'pharmaceutical', 'retail', 'cloud computing', 'social media', 'AI'
];

// Get a random industry for dynamic suggestions
const getRandomIndustry = (): string => {
  return INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
};

// Generate contextual suggestions based on the conversation
const generateSuggestions = (aiContent: string, analysisType: 'news' | 'general' | 'relationship' | 'greeting' | 'error' | 'action'): string[] => {
  const industryImpact = `What stocks would be affected if the ${getRandomIndustry()} industry crashes?`;
  
  if (analysisType === 'news') {
    return [
      "Show me the supply chain connections",
      "Which companies are most at risk?",
      "Find paths between affected companies",
      "Show only supplier relationships",
      industryImpact
    ];
  }
  
  if (analysisType === 'greeting') {
    return [
      "Show me Apple",
      "Find path between Tesla and NVIDIA",
      "Show only ownership relationships",
      "What is market capitalization?",
      industryImpact
    ];
  }
  
  if (analysisType === 'action') {
    return [
      "Show me Microsoft",
      "Find path between Amazon and Google",
      "Show only partnership connections",
      "Clear all filters",
      industryImpact
    ];
  }
  
  if (analysisType === 'relationship') {
    return [
      "Show me indirect connections",
      "Which industries are most connected?",
      "Find the most influential companies",
      "Show only joint venture relationships",
      industryImpact
    ];
  }
  
  if (analysisType === 'error') {
    return [
      "Show me Apple",
      "What are ETFs?",
      "Find path between Microsoft and Google",
      "How do supply chains work?",
      industryImpact
    ];
  }
  
  // General finance Q&A suggestions
  return [
    "Tell me more about this",
    "What companies are involved?",
    "Show only supplier relationships",
    "Find connected companies",
    industryImpact
  ];
};

export default function Chatbot({ 
  onNewsAnalysis,
  nodes = [],
  onSearchSelect,
  onFindPath,
  onFilterToggle,
  onShowOnlyFilters,
  onClearFilters
}: ChatbotProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I can answer finance questions, analyze relationships, and control the graph. Try commands like "Show me Apple" or "Find path between Microsoft and NVIDIA"!',
      suggestions: [
        "Show me Apple",
        "Find path between Tesla and NVIDIA",
        "Show only supplier relationships",
        "What is market capitalization?",
        "What stocks would be affected if the semiconductor industry crashes?"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Execute AI actions
  const executeActions = (actions: AIAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'search':
          if (action.params.companyName && onSearchSelect) {
            const node = nodes.find(n => 
              n.label.toLowerCase() === action.params.companyName!.toLowerCase() ||
              n.label.toLowerCase().includes(action.params.companyName!.toLowerCase())
            );
            if (node) {
              onSearchSelect(node);
            }
          }
          break;
          
        case 'findPath':
          if (action.params.fromCompany && action.params.toCompany && onFindPath) {
            const fromNode = nodes.find(n => 
              n.label.toLowerCase() === action.params.fromCompany!.toLowerCase() ||
              n.label.toLowerCase().includes(action.params.fromCompany!.toLowerCase())
            );
            const toNode = nodes.find(n => 
              n.label.toLowerCase() === action.params.toCompany!.toLowerCase() ||
              n.label.toLowerCase().includes(action.params.toCompany!.toLowerCase())
            );
            if (fromNode && toNode) {
              onFindPath(fromNode.id, toNode.id);
            }
          }
          break;
          
        case 'filter':
          if (action.params.edgeTypes && onFilterToggle) {
            for (const edgeType of action.params.edgeTypes) {
              onFilterToggle(edgeType as EdgeType, action.params.enable !== false);
            }
          }
          break;
          
        case 'showOnly':
          if (action.params.edgeTypes && onShowOnlyFilters) {
            onShowOnlyFilters(action.params.edgeTypes as EdgeType[]);
          }
          break;
          
        case 'clearFilters':
          if (onClearFilters) {
            onClearFilters();
          }
          break;
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Auto-send after a brief delay so user can see what's being sent
    setTimeout(() => {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: suggestion };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      handleSendWithContent(suggestion);
    }, 100);
  };

  const handleSendWithContent = async (content: string) => {
    setIsLoading(true);

    try {
      const queryType = detectQueryType(content);
      
      // Handle action type queries with the new intent analyzer
      if (queryType === 'action') {
        const res = await fetch('/api/ai/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: content,
            companies: nodes.map(n => n.label),
            edgeTypes: Object.values(EdgeType)
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
          throw new Error(errorData.error || `Request failed with status ${res.status}`);
        }

        const data = await res.json();
        
        if (data.error) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: data.error,
            suggestions: generateSuggestions(data.error, 'error')
          };
          setMessages(prev => [...prev, aiMsg]);
          return;
        }

        // Execute the actions
        if (data.actions && data.actions.length > 0) {
          executeActions(data.actions);
        }

        // Show the response message
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.message,
          suggestions: data.suggestions || generateSuggestions(data.message, 'relationship'),
          actions: data.actions
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
      
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, type: queryType })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Server error: ${res.status}` }));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.error,
          suggestions: generateSuggestions(data.error, 'error')
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
      
      // Handle news analysis
      if (data.analysisType === 'news' && data.affectedCompanies) {
        const affectedCount = data.affectedCompanies.length;
        let responseContent = `Analyzed the news and identified ${affectedCount} affected compan${affectedCount === 1 ? 'y' : 'ies'}. `;
        
        if (affectedCount > 0) {
          responseContent += `Companies highlighted in the graph.`;
          if (onNewsAnalysis) {
            onNewsAnalysis(data);
          }
        } else {
          responseContent += `No matching companies found in the graph.`;
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: responseContent,
          suggestions: generateSuggestions(responseContent, 'news')
        };
        setMessages(prev => [...prev, aiMsg]);
      } 
      // Handle general finance Q&A with optional company highlighting
      else if (data.analysisType === 'general') {
        const responseContent = data.answer || "I couldn't process that question.";
        
        // If companies were mentioned, highlight them
        if (data.mentionedCompanies && data.mentionedCompanies.length > 0 && onNewsAnalysis) {
          onNewsAnalysis({ 
            affectedCompanies: data.mentionedCompanies,
            analysisType: 'general'
          });
        }
        
        const companyCount = data.mentionedCompanies?.length || 0;
        let fullResponse = responseContent;
        if (companyCount > 0) {
          fullResponse += ` (${companyCount} compan${companyCount === 1 ? 'y' : 'ies'} highlighted)`;
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: fullResponse,
          suggestions: generateSuggestions(responseContent, 'general')
        };
        setMessages(prev => [...prev, aiMsg]);
      }
      // Handle relationship analysis
      else {
        const responseContent = data.error || data.explanation || "I couldn't analyze that.";
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: responseContent,
          suggestions: generateSuggestions(responseContent, 'relationship')
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e: any) {
      console.error('Chatbot error:', e);
      const errorMessage = e?.message || String(e);
      
      let userMessage = "Error connecting to AI service.";
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        userMessage = "Network error. Check your connection.";
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage = "API key error. Check your .env.local file.";
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        userMessage = "Model not available. Check API key permissions.";
      } else if (errorMessage) {
        userMessage = `Error: ${errorMessage.substring(0, 150)}`;
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: userMessage,
        suggestions: generateSuggestions(userMessage, 'error')
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const content = input;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    await handleSendWithContent(content);
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
      style={{
        position: 'fixed',
        bottom: 0,
        right: 24,
        width: 380,
        maxHeight: isCollapsed ? 'auto' : '60vh',
        backgroundColor: '#0f172a',
        borderTop: '3px solid #8b5cf6',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px 24px 0 0',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1)'
      }}
    >
      {/* Drag Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 40, height: 5, backgroundColor: '#475569', borderRadius: 3 }} />
      </div>

      {/* Header */}
      <div style={{ 
        padding: '12px 20px 16px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              padding: 8, 
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Sparkles color="white" size={16} />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Orbit AI
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Ready to analyze</span>
              </div>
            </div>
          </div>
          <motion.button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ 
              padding: 6, 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp color="#94a3b8" size={16} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Content - Animated collapse */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: '35vh'
            }}>
              {messages.map((msg, idx) => (
                <React.Fragment key={msg.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                    }}
                  >
                    {msg.role === 'ai' && (
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        flexShrink: 0
                      }}>
                        <Sparkles color="#a78bfa" size={12} />
                      </div>
                    )}
                    <div style={{ 
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: msg.role === 'user' 
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'rgba(30, 41, 59, 0.8)',
                      color: msg.role === 'user' ? 'white' : '#e2e8f0',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: msg.role === 'user' 
                        ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                        : 'none'
                    }}>
                      {msg.content}
                    </div>
                  </motion.div>
                  {/* Suggestion chips for AI messages */}
                  {msg.role === 'ai' && msg.suggestions && idx === messages.length - 1 && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        marginLeft: 32,
                        marginTop: 8,
                        marginRight: 8
                      }}
                    >
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <motion.button
                          key={sIdx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          whileHover={{ scale: 1.01, backgroundColor: 'rgba(139, 92, 246, 0.25)' }}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            padding: '8px 12px',
                            fontSize: 11,
                            color: '#c4b5fd',
                            background: 'rgba(139, 92, 246, 0.12)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 10,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            lineHeight: 1.4,
                            width: 'fit-content'
                          }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    flexShrink: 0
                  }}>
                    <Sparkles color="#a78bfa" size={12} />
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span style={{ display: 'flex', gap: 5 }}>
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                      <motion.span 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                        style={{ width: 6, height: 6, backgroundColor: '#a78bfa', borderRadius: '50%' }}
                      />
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ 
              padding: '12px 16px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.5)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                padding: '10px 12px',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12
              }}>
                <Newspaper color="#64748b" size={16} />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Paste news or ask a question..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: 'white'
                  }}
                />
                <motion.button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: input.trim() && !isLoading 
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'rgba(100, 116, 139, 0.3)',
                    border: 'none',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: input.trim() && !isLoading 
                      ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send color="white" size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
