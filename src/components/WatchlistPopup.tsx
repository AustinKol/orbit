'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star,
  Search,
  X,
  ChevronUp,
  Eye,
  EyeOff,
  Trash2,
  Building2
} from 'lucide-react';
import { GraphNode } from '@/types';

interface WatchlistPopupProps {
  nodes: GraphNode[];
  watchlist: Set<string>;
  onAddToWatchlist: (nodeId: string) => void;
  onRemoveFromWatchlist: (nodeId: string) => void;
  onClearWatchlist: () => void;
  isWatchlistActive: boolean;
  onToggleWatchlistActive: () => void;
  onClose: () => void;
}

export default function WatchlistPopup({ 
  nodes, 
  watchlist, 
  onAddToWatchlist, 
  onRemoveFromWatchlist,
  onClearWatchlist,
  isWatchlistActive,
  onToggleWatchlistActive,
  onClose 
}: WatchlistPopupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get watchlist nodes
  const watchlistNodes = nodes.filter(n => watchlist.has(n.id));

  // Handle search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = nodes
        .filter(n => 
          !watchlist.has(n.id) && 
          (n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (n.ticker && n.ticker.toLowerCase().includes(searchQuery.toLowerCase())))
        )
        .slice(0, 8);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, nodes, watchlist]);

  const handleAddNode = (node: GraphNode) => {
    onAddToWatchlist(node.id);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          width: 400,
          maxHeight: isCollapsed ? 'auto' : '80vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.1)'
        }}
      >

        {/* Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.1), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: 'rgba(251, 191, 36, 0.25)', 
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Star color="#fbbf24" size={20} fill="#fbbf24" />
              </motion.div>
              <div>
                <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                  Watchlist
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: 'rgba(251, 191, 36, 0.25)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {watchlist.size} stocks
                  </span>
                  <motion.button
                    onClick={onToggleWatchlistActive}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      backgroundColor: isWatchlistActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                      borderRadius: 20,
                      fontSize: 12,
                      color: isWatchlistActive ? '#86efac' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${isWatchlistActive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    {isWatchlistActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    {isWatchlistActive ? 'Active' : 'Show All'}
                  </motion.button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {watchlist.size > 0 && (
                <motion.button 
                  onClick={onClearWatchlist}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ 
                    padding: 6, 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 color="#fca5a5" size={14} />
                </motion.button>
              )}
              <motion.button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
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
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronUp color="#94a3b8" size={14} />
                </motion.div>
              </motion.button>
              <motion.button 
                onClick={onClose}
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
                <X color="#94a3b8" size={14} />
              </motion.button>
            </div>
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
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                maxHeight: '60vh'
              }}>
                {/* Search to Add */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ position: 'relative' }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    padding: '14px 16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 12,
                    border: isSearchFocused ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Search color="#94a3b8" size={18} />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      placeholder="Search stocks to add..."
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'white',
                        fontSize: 14
                      }}
                    />
                    {searchQuery && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearchQuery('')}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X color="#94a3b8" size={16} />
                      </motion.button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {searchResults.length > 0 && isSearchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: 8,
                          backgroundColor: 'rgba(15, 23, 42, 0.98)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          overflow: 'hidden',
                          zIndex: 100,
                          maxHeight: 300,
                          overflowY: 'auto'
                        }}
                      >
                        {searchResults.map((node, idx) => (
                          <motion.button
                            key={node.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => handleAddNode(node)}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              cursor: 'pointer',
                              color: 'white',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Building2 color="#94a3b8" size={16} />
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{node.label}</div>
                                {node.ticker && (
                                  <div style={{ fontSize: 11, color: '#64748b' }}>{node.ticker}</div>
                                )}
                              </div>
                            </div>
                            <Star color="#fbbf24" size={16} />
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Watchlist Items */}
                <div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
                  >
                    <Star color="#fbbf24" size={18} fill="#fbbf24" />
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                      Your Watchlist
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                    <span style={{ 
                      padding: '4px 12px',
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: 20,
                      fontSize: 12,
                      color: '#fef08a'
                    }}>
                      {watchlist.size}
                    </span>
                  </motion.div>

                  {watchlistNodes.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: 32,
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: 14
                      }}
                    >
                      <Star color="#475569" size={32} style={{ margin: '0 auto 12px' }} />
                      <div>No stocks in your watchlist</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Search above to add stocks</div>
                    </motion.div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 8 
                    }}>
                      {watchlistNodes.map((node, idx) => (
                        <motion.div 
                          key={node.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + idx * 0.03 }}
                          style={{ 
                            padding: 14,
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              color: 'white', 
                              fontWeight: 600, 
                              fontSize: 13,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {node.label}
                            </div>
                            {node.ticker && (
                              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                                {node.ticker}
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemoveFromWatchlist(node.id)}
                            style={{
                              padding: 6,
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 6,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <X color="#fca5a5" size={12} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
