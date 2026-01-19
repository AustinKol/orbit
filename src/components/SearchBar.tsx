'use client';

import React, { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode } from '@/types';

interface SearchBarProps {
  nodes: GraphNode[];
  onSelect: (node: GraphNode) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearch = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n =>
        n.label.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
    } else {
      setResults([]);
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    onSelect(node);
    setQuery(node.label);
    setResults([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelectNode(results[selectedIndex]);
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Escape') {
      setResults([]);
      setIsFocused(false);
      setQuery('');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      width: 500,
      maxWidth: '90vw'
    }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'relative',
          backgroundColor: '#0f172a',
          borderRadius: 16,
          border: isFocused ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.1)',
          boxShadow: isFocused 
            ? '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)' 
            : '0 8px 32px rgba(0,0,0,0.4)',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '14px 20px',
          gap: 12
        }}>
          <div style={{
            padding: 8,
            backgroundColor: isFocused ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
            borderRadius: 8,
            transition: 'all 0.2s ease'
          }}>
            <Search 
              size={18} 
              color={isFocused ? '#a78bfa' : '#64748b'}
              style={{ transition: 'color 0.2s ease' }}
            />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search companies..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'white',
              fontWeight: 400
            }}
          />
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 6,
                fontSize: 11,
                color: '#c4b5fd'
              }}
            >
              {results.length} found
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isFocused && query.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 8,
              backgroundColor: '#0f172a',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1)',
              overflow: 'hidden'
            }}
          >
            {results.length > 0 ? (
              <div style={{ padding: 8 }}>
                {results.map((node, idx) => (
                  <motion.button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: idx === selectedIndex 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))'
                        : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== selectedIndex) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== selectedIndex) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: idx === selectedIndex 
                          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.3))'
                          : 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Building2 
                          size={14} 
                          color={idx === selectedIndex ? '#c4b5fd' : '#64748b'}
                        />
                      </div>
                      <span style={{ 
                        color: idx === selectedIndex ? 'white' : '#e2e8f0',
                        fontSize: 14,
                        fontWeight: idx === selectedIndex ? 500 : 400
                      }}>
                        {node.label}
                      </span>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: idx === selectedIndex 
                        ? 'rgba(139, 92, 246, 0.3)'
                        : 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      fontSize: 10,
                      color: idx === selectedIndex ? '#c4b5fd' : '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {node.type}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px 24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13
              }}>
                <Search size={20} color="#475569" style={{ margin: '0 auto 8px' }} />
                No companies found matching "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
