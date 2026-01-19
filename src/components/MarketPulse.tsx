'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Newspaper,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Loader2,
  Globe,
  RefreshCw
} from 'lucide-react';
import { NewsAnalysis, AffectedCompany, NewsArticle, RippleEffect, ExampleCompany } from '@/services/aiService';

interface MarketPulseProps {
  analysis: NewsAnalysis;
  onClose: () => void;
}

const IMPACT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  bullish: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#86efac' },
  bearish: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' },
  neutral: { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', text: '#cbd5e1' },
  mixed: { bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', text: '#fef08a' }
};

const SENTIMENT_STYLES: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac' },
  negative: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' },
  neutral: { bg: 'rgba(100, 116, 139, 0.2)', text: '#cbd5e1' }
};

const IMPACT_ICONS: Record<string, any> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
  mixed: AlertCircle
};

const RIPPLE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  industry: { label: 'Industry', color: '#a78bfa' },
  company: { label: 'Company', color: '#60a5fa' },
  sector: { label: 'Sector', color: '#f472b6' },
  supplier: { label: 'Supplier', color: '#fb923c' },
  competitor: { label: 'Competitor', color: '#34d399' }
};

export default function MarketPulse({ analysis, onClose }: MarketPulseProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasNewUpdate, setHasNewUpdate] = useState(true);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [companiesWithNews, setCompaniesWithNews] = useState<AffectedCompany[]>([]);
  const [loadingNews, setLoadingNews] = useState<Set<string>>(new Set());
  const prevAnalysisRef = useRef<string>('');
  
  const { affectedCompanies, summary, newsType } = analysis;

  // Initialize companies with news state
  useEffect(() => {
    setCompaniesWithNews(affectedCompanies.map(c => ({ ...c, news: undefined, newsLoading: false })));
  }, [affectedCompanies]);

  // Detect when analysis changes
  useEffect(() => {
    const currentAnalysisKey = JSON.stringify(analysis);
    if (prevAnalysisRef.current !== currentAnalysisKey) {
      setHasNewUpdate(true);
      setPulseIntensity(1);
    }
    prevAnalysisRef.current = currentAnalysisKey;
  }, [analysis]);
  
  // Gradually reduce pulse intensity
  useEffect(() => {
    if (!hasNewUpdate) return;
    
    const interval = setInterval(() => {
      setPulseIntensity(prev => Math.max(0.3, prev - 0.1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [hasNewUpdate]);

  const dismissAlert = () => {
    setHasNewUpdate(false);
    setPulseIntensity(0);
  };

  const handleSheetClick = () => {
    dismissAlert();
  };

  // Fetch news for a specific company
  const fetchNewsForCompany = async (companyId: string, companyName: string) => {
    if (loadingNews.has(companyId)) return;

    setLoadingNews(prev => new Set(prev).add(companyId));

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: [{ companyId, companyName }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newsData = data.news?.[0];
        
        if (newsData) {
          setCompaniesWithNews(prev => 
            prev.map(c => 
              c.companyId === companyId 
                ? { ...c, news: newsData.articles, newsLoading: false }
                : c
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoadingNews(prev => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    }
  };

  // Handle company expansion and auto-fetch news
  const handleCompanyExpand = (companyId: string, companyName: string) => {
    if (expandedCompany === companyId) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyId);
      // Auto-fetch news if not already loaded
      const company = companiesWithNews.find(c => c.companyId === companyId);
      if (!company?.news && !loadingNews.has(companyId)) {
        fetchNewsForCompany(companyId, companyName);
      }
    }
  };

  const sortedCompanies = [...companiesWithNews].sort((a, b) => {
    const order: Record<string, number> = { bearish: 0, bullish: 1, mixed: 2, neutral: 3 };
    return (order[a.impactType] || 3) - (order[b.impactType] || 3);
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={handleSheetClick}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: '900px',
          maxHeight: isCollapsed ? 'auto' : '75vh',
          backgroundColor: '#0f172a',
          borderTop: hasNewUpdate ? '3px solid #ef4444' : '3px solid #06b6d4',
          borderRadius: '24px 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: hasNewUpdate 
            ? `0 -10px 60px rgba(239, 68, 68, ${0.4 * pulseIntensity}), 0 0 40px rgba(239, 68, 68, ${0.25 * pulseIntensity}), 0 0 80px rgba(239, 68, 68, ${0.15 * pulseIntensity})` 
            : '0 -10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(6, 182, 212, 0.15)'
        }}
      >

        {/* Glowing shine effect for new updates */}
        {hasNewUpdate && (
          <>
            <motion.div
              animate={{ 
                opacity: [0.3 * pulseIntensity, 0.8 * pulseIntensity, 0.3 * pulseIntensity],
                scale: [1, 1.02, 1]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '28px 28px 0 0',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.4) 0%, transparent 50%)',
                pointerEvents: 'none',
                filter: 'blur(8px)'
              }}
            />
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                boxShadow: [
                  'inset 0 2px 20px rgba(239, 68, 68, 0.3)',
                  'inset 0 2px 40px rgba(239, 68, 68, 0.6)',
                  'inset 0 2px 20px rgba(239, 68, 68, 0.3)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '24px 24px 0 0',
                border: '2px solid #ef4444',
                pointerEvents: 'none'
              }}
            />
          </>
        )}

        {/* Drag Handle */}
        <div onClick={dismissAlert} style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', cursor: 'pointer' }}>
          <motion.div 
            style={{ 
              width: 48, 
              height: 6, 
              backgroundColor: hasNewUpdate ? '#ef4444' : '#06b6d4', 
              borderRadius: 3,
              boxShadow: hasNewUpdate ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 0 12px rgba(6, 182, 212, 0.4)'
            }}
            animate={hasNewUpdate ? { 
              scaleX: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        </div>

        {/* Header */}
        <div 
          onClick={dismissAlert}
          style={{ 
            padding: '16px 24px', 
            borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
            background: hasNewUpdate 
              ? 'linear-gradient(to right, rgba(239, 68, 68, 0.15), transparent)'
              : 'linear-gradient(to right, rgba(6, 182, 212, 0.15), transparent)',
            cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.25)', 
                  borderRadius: 12,
                  border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: hasNewUpdate ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(6, 182, 212, 0.3)'
                }}
                animate={hasNewUpdate ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.4)',
                    '0 0 35px rgba(239, 68, 68, 0.7)',
                    '0 0 20px rgba(239, 68, 68, 0.4)'
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Globe color={hasNewUpdate ? '#fca5a5' : '#67e8f9'} size={20} />
              </motion.div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0, fontFamily: 'system-ui' }}>
                    Market Pulse
                  </h2>
                  {hasNewUpdate && (
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.3)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#fca5a5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Live
                    </motion.span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: hasNewUpdate ? '#fca5a5' : '#67e8f9',
                    border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)'
                  }}>
                    {newsType}
                  </span>
                  <motion.span 
                    style={{ fontSize: 12, color: hasNewUpdate ? '#fca5a5' : '#94a3b8' }}
                    animate={hasNewUpdate ? { opacity: [0.7, 1, 0.7] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {affectedCompanies.length} companies tracked
                  </motion.span>
                </div>
              </div>
            </div>
            <motion.button 
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
                dismissAlert();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ 
                padding: 8, 
                backgroundColor: hasNewUpdate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.15)', 
                border: hasNewUpdate ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 8,
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
                <ChevronUp color={hasNewUpdate ? '#fca5a5' : '#67e8f9'} size={18} />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                maxHeight: '55vh'
              }}>
                {/* Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ 
                    padding: 20, 
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 12,
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Newspaper color="#67e8f9" size={16} />
                    <span style={{ fontSize: 12, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                      Analysis Summary
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {summary}
                  </p>
                </motion.div>

                {/* Companies */}
                <div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
                  >
                    <Building2 color="#67e8f9" size={18} />
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                      Affected Companies
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(6, 182, 212, 0.3), transparent)' }} />
                    <span style={{ 
                      padding: '4px 12px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: 20,
                      fontSize: 12,
                      color: '#67e8f9'
                    }}>
                      {affectedCompanies.length}
                    </span>
                  </motion.div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sortedCompanies.map((company, idx) => {
                      const styles = IMPACT_STYLES[company.impactType] || IMPACT_STYLES.neutral;
                      const ImpactIcon = IMPACT_ICONS[company.impactType] || Minus;
                      const isExpanded = expandedCompany === company.companyId;
                      const isLoadingNews = loadingNews.has(company.companyId);
                      
                      return (
                        <motion.div 
                          key={company.companyId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          style={{ 
                            backgroundColor: styles.bg,
                            border: `2px solid ${styles.border}40`,
                            borderRadius: 12,
                            overflow: 'hidden'
                          }}
                        >
                          {/* Company Header */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyExpand(company.companyId, company.companyName);
                            }}
                            style={{ 
                              padding: 16,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 16,
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{ 
                                  padding: 6, 
                                  backgroundColor: styles.bg, 
                                  borderRadius: 8,
                                  border: `1px solid ${styles.border}40`
                                }}>
                                  <ImpactIcon color={styles.text} size={16} />
                                </div>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                                  {company.companyName}
                                </span>
                                <span style={{ 
                                  padding: '2px 10px',
                                  backgroundColor: styles.bg,
                                  border: `1px solid ${styles.border}60`,
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: styles.text,
                                  textTransform: 'uppercase'
                                }}>
                                  {company.impactType}
                                </span>
                              </div>
                              <p style={{ color: styles.text, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                                {company.impactDescription}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
                                  Confidence
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 'bold', color: styles.text }}>
                                  {Math.round(company.confidence * 100)}%
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                style={{
                                  padding: 4,
                                  backgroundColor: 'rgba(0,0,0,0.2)',
                                  borderRadius: 4
                                }}
                              >
                                <ChevronDown color={styles.text} size={14} />
                              </motion.div>
                            </div>
                          </div>

                          {/* News Section (Expandable) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ 
                                  padding: '0 16px 16px',
                                  borderTop: `1px solid ${styles.border}30`
                                }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8, 
                                    marginTop: 12,
                                    marginBottom: 12 
                                  }}>
                                    <Globe color={styles.text} size={14} />
                                    <span style={{ 
                                      fontSize: 12, 
                                      color: styles.text, 
                                      textTransform: 'uppercase', 
                                      letterSpacing: 0.5,
                                      fontWeight: 600
                                    }}>
                                      Latest News
                                    </span>
                                    {!isLoadingNews && company.news && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetchNewsForCompany(company.companyId, company.companyName);
                                        }}
                                        style={{
                                          marginLeft: 'auto',
                                          padding: 4,
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <RefreshCw color={styles.text} size={12} />
                                      </motion.button>
                                    )}
                                  </div>

                                  {isLoadingNews ? (
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      gap: 8,
                                      padding: '20px 0'
                                    }}>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                      >
                                        <Loader2 color={styles.text} size={18} />
                                      </motion.div>
                                      <span style={{ fontSize: 13, color: styles.text }}>
                                        Fetching latest news...
                                      </span>
                                    </div>
                                  ) : company.news && company.news.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      {company.news.map((article, articleIdx) => {
                                        const sentimentStyle = SENTIMENT_STYLES[article.sentiment] || SENTIMENT_STYLES.neutral;
                                        
                                        return (
                                          <motion.div
                                            key={articleIdx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: articleIdx * 0.1 }}
                                            style={{
                                              padding: 12,
                                              backgroundColor: 'rgba(0,0,0,0.2)',
                                              borderRadius: 8,
                                              border: '1px solid rgba(255,255,255,0.05)'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                              <div style={{ flex: 1 }}>
                                                <a
                                                  href={article.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  style={{
                                                    color: 'white',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 6,
                                                    lineHeight: 1.4
                                                  }}
                                                >
                                                  {article.title}
                                                  <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                                                </a>
                                                <p style={{ 
                                                  color: '#94a3b8', 
                                                  fontSize: 12, 
                                                  lineHeight: 1.5, 
                                                  margin: '6px 0 0 0' 
                                                }}>
                                                  {article.summary}
                                                </p>
                                                <div style={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  gap: 12, 
                                                  marginTop: 8 
                                                }}>
                                                  <span style={{ 
                                                    fontSize: 11, 
                                                    color: '#64748b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                  }}>
                                                    <Clock size={10} />
                                                    {formatDate(article.publishedAt)}
                                                  </span>
                                                  <span style={{ fontSize: 11, color: '#64748b' }}>
                                                    {article.source}
                                                  </span>
                                                  <span style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: sentimentStyle.bg,
                                                    borderRadius: 10,
                                                    fontSize: 10,
                                                    color: sentimentStyle.text,
                                                    textTransform: 'capitalize'
                                                  }}>
                                                    {article.sentiment}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      textAlign: 'center', 
                                      padding: '16px 0',
                                      color: '#64748b',
                                      fontSize: 13
                                    }}>
                                      No recent news found
                                    </div>
                                  )}

                                  {/* Ripple Effects Section */}
                                  {company.rippleEffects && company.rippleEffects.length > 0 && (
                                    <>
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 8, 
                                        marginTop: 20,
                                        marginBottom: 12 
                                      }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={styles.text} strokeWidth="2">
                                          <circle cx="12" cy="12" r="3" />
                                          <circle cx="12" cy="12" r="7" opacity="0.6" />
                                          <circle cx="12" cy="12" r="11" opacity="0.3" />
                                        </svg>
                                        <span style={{ 
                                          fontSize: 12, 
                                          color: styles.text, 
                                          textTransform: 'uppercase', 
                                          letterSpacing: 0.5,
                                          fontWeight: 600
                                        }}>
                                          Ripple Effects
                                        </span>
                                        <span style={{
                                          marginLeft: 'auto',
                                          padding: '2px 8px',
                                          backgroundColor: 'rgba(255,255,255,0.1)',
                                          borderRadius: 10,
                                          fontSize: 10,
                                          color: '#94a3b8'
                                        }}>
                                          Not in database
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {company.rippleEffects.map((ripple, rippleIdx) => {
                                          const rippleImpactStyle = IMPACT_STYLES[ripple.impactType] || IMPACT_STYLES.neutral;
                                          const RippleIcon = IMPACT_ICONS[ripple.impactType] || Minus;
                                          const typeInfo = RIPPLE_TYPE_LABELS[ripple.type] || { label: ripple.type, color: '#94a3b8' };
                                          
                                          return (
                                            <motion.div
                                              key={rippleIdx}
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: rippleIdx * 0.1 }}
                                              style={{
                                                padding: 12,
                                                backgroundColor: 'rgba(0,0,0,0.25)',
                                                borderRadius: 10,
                                                borderLeft: `3px solid ${rippleImpactStyle.border}`,
                                              }}
                                            >
                                              {/* Ripple Header */}
                                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <div style={{
                                                  padding: 4,
                                                  backgroundColor: rippleImpactStyle.bg,
                                                  borderRadius: 6,
                                                  flexShrink: 0
                                                }}>
                                                  <RippleIcon color={rippleImpactStyle.text} size={12} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ 
                                                      color: 'white', 
                                                      fontWeight: 600, 
                                                      fontSize: 13 
                                                    }}>
                                                      {ripple.name}
                                                    </span>
                                                    <span style={{
                                                      padding: '1px 6px',
                                                      backgroundColor: `${typeInfo.color}20`,
                                                      border: `1px solid ${typeInfo.color}40`,
                                                      borderRadius: 8,
                                                      fontSize: 9,
                                                      color: typeInfo.color,
                                                      textTransform: 'uppercase',
                                                      fontWeight: 600
                                                    }}>
                                                      {typeInfo.label}
                                                    </span>
                                                    <span style={{
                                                      padding: '1px 6px',
                                                      backgroundColor: rippleImpactStyle.bg,
                                                      border: `1px solid ${rippleImpactStyle.border}50`,
                                                      borderRadius: 8,
                                                      fontSize: 9,
                                                      color: rippleImpactStyle.text,
                                                      textTransform: 'uppercase',
                                                      fontWeight: 600
                                                    }}>
                                                      {ripple.impactType}
                                                    </span>
                                                  </div>
                                                  <p style={{ 
                                                    color: '#94a3b8', 
                                                    fontSize: 12, 
                                                    lineHeight: 1.4, 
                                                    margin: '6px 0 0 0' 
                                                  }}>
                                                    {ripple.reason}
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Example Companies */}
                                              {ripple.exampleCompanies && ripple.exampleCompanies.length > 0 && (
                                                <div style={{ 
                                                  marginTop: 12,
                                                  marginLeft: 26,
                                                  paddingTop: 10,
                                                  borderTop: '1px solid rgba(255,255,255,0.08)'
                                                }}>
                                                  <div style={{ 
                                                    fontSize: 10, 
                                                    color: '#64748b', 
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                  }}>
                                                    <Building2 size={10} />
                                                    Example Companies
                                                  </div>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {ripple.exampleCompanies.map((example, exIdx) => (
                                                      <motion.div
                                                        key={exIdx}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: (rippleIdx * 0.1) + (exIdx * 0.05) }}
                                                        style={{
                                                          padding: '10px 12px',
                                                          backgroundColor: 'rgba(255,255,255,0.03)',
                                                          borderRadius: 8,
                                                          border: '1px solid rgba(255,255,255,0.06)'
                                                        }}
                                                      >
                                                        <div style={{ 
                                                          display: 'flex', 
                                                          alignItems: 'center', 
                                                          justifyContent: 'space-between',
                                                          marginBottom: 6
                                                        }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ 
                                                              color: 'white', 
                                                              fontWeight: 600, 
                                                              fontSize: 12 
                                                            }}>
                                                              {example.name}
                                                            </span>
                                                            {example.ticker && (
                                                              <span style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                                                borderRadius: 4,
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: '#67e8f9',
                                                                fontFamily: 'monospace'
                                                              }}>
                                                                ${example.ticker}
                                                              </span>
                                                            )}
                                                          </div>
                                                          <a
                                                            href={example.searchUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                              padding: '4px 8px',
                                                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                              border: '1px solid rgba(99, 102, 241, 0.3)',
                                                              borderRadius: 6,
                                                              fontSize: 10,
                                                              color: '#a5b4fc',
                                                              textDecoration: 'none',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              gap: 4,
                                                              transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.25)';
                                                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                                                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                                            }}
                                                          >
                                                            View
                                                            <ExternalLink size={10} />
                                                          </a>
                                                        </div>
                                                        <p style={{ 
                                                          color: '#94a3b8', 
                                                          fontSize: 11, 
                                                          lineHeight: 1.4, 
                                                          margin: 0 
                                                        }}>
                                                          {example.explanation}
                                                        </p>
                                                      </motion.div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
