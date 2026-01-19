'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, GraphEdge, NodeType } from '@/types';
import { X, TrendingUp, DollarSign, Activity, Globe, Building2, Link2, ChevronRight, ChevronUp } from 'lucide-react';

interface TradingCardProps {
  node: GraphNode;
  onClose: () => void;
  connectedNodes?: GraphNode[];
  onNodeSelect?: (node: GraphNode) => void;
}

export default function TradingCard({ node, onClose, connectedNodes = [], onNodeSelect }: TradingCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Determine if we have financial data
  const hasFinancials = node.data && (node.data.price || node.data.volume);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          maxWidth: '500px',
          maxHeight: isCollapsed ? 'auto' : '70vh',
          backgroundColor: '#0f172a',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '0 24px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <motion.div 
            style={{ width: 48, height: 6, backgroundColor: '#475569', borderRadius: 3 }}
          />
        </div>

        {/* Header */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div 
                style={{ 
                  padding: 10, 
                  backgroundColor: 'rgba(139, 92, 246, 0.3)', 
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Building2 color="white" size={20} />
              </motion.div>
              <div>
                <h2 style={{ color: 'white', fontSize: 18, fontWeight: 'bold', margin: 0 }}>
                  {node.label}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: 'rgba(139, 92, 246, 0.3)',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textTransform: 'uppercase'
                  }}>
                    {node.type}
                  </span>
                  {node.ticker && (
                    <span style={{ 
                      padding: '4px 10px', 
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      borderRadius: 20,
                      fontSize: 12,
                      color: '#c4b5fd',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      {node.ticker}
                    </span>
                  )}
                  {connectedNodes.length > 0 && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {connectedNodes.length} connections
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                  padding: 8, 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)',
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
                  <ChevronUp color="#94a3b8" size={18} />
                </motion.div>
              </motion.button>
              <motion.button 
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                  padding: 8, 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X color="#94a3b8" size={18} />
              </motion.button>
            </div>
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
              style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                maxHeight: '50vh'
              }}>
                {/* Description */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ 
                    padding: 20, 
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Building2 color="#a78bfa" size={16} />
                    <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                      About
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {node.description || "No description available for this entity."}
                  </p>
                </motion.div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Financials */}
                  {hasFinancials && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <DollarSign color="#a78bfa" size={16} />
                        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Market Data
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {node.data?.price && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 14,
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c4b5fd'
                              }}>
                                <DollarSign size={16} />
                              </div>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>Price</span>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>${node.data?.price}</span>
                          </div>
                        )}
                        
                        {node.data?.change !== undefined && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 14,
                              backgroundColor: (node.data?.change ?? 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              border: `1px solid ${(node.data?.change ?? 0) >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                backgroundColor: (node.data?.change ?? 0) >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: (node.data?.change ?? 0) >= 0 ? '#86efac' : '#fca5a5'
                              }}>
                                <TrendingUp size={16} />
                              </div>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>Change</span>
                            </div>
                            <span style={{ 
                              fontSize: 15, 
                              fontWeight: 600, 
                              color: (node.data?.change ?? 0) >= 0 ? '#86efac' : '#fca5a5' 
                            }}>
                              {(node.data?.change ?? 0) >= 0 ? '+' : ''}{node.data?.change}%
                            </span>
                          </div>
                        )}
                        
                        {node.data?.volume && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 14,
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c4b5fd'
                              }}>
                                <Activity size={16} />
                              </div>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>Volume</span>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
                              {((node.data?.volume ?? 0) / 1000000).toFixed(1)}M
                            </span>
                          </div>
                        )}
                        
                        {node.data?.tvl && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: 14,
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c4b5fd'
                              }}>
                                <Globe size={16} />
                              </div>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>Market Cap</span>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>
                              {((node.data?.tvl ?? 0) / 1000000000).toFixed(1)}B
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Activity color="#a78bfa" size={16} />
                      <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Actions
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                          width: '100%',
                          padding: '14px 20px',
                          background: 'linear-gradient(to right, #8b5cf6, #a855f7)',
                          border: 'none',
                          borderRadius: 12,
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Trade {node.ticker || node.label}
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                          width: '100%',
                          padding: '14px 20px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        View Analysis
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Connected Companies */}
                {connectedNodes.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Link2 color="#a78bfa" size={18} />
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Connected Companies
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                      <span style={{ 
                        padding: '4px 12px',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 20,
                        fontSize: 12,
                        color: '#c4b5fd'
                      }}>
                        {connectedNodes.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {connectedNodes.slice(0, 8).map((connNode, idx) => (
                        <motion.button
                          key={connNode.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.03 }}
                          onClick={() => onNodeSelect?.(connNode)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 8, 
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Building2 color="#a78bfa" size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              color: 'white', 
                              fontSize: 13, 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {connNode.label}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 11 }}>
                              {connNode.ticker || connNode.type}
                            </div>
                          </div>
                          {connNode.data?.change !== undefined && (
                            <span style={{ 
                              fontSize: 12, 
                              fontWeight: 600,
                              color: connNode.data.change >= 0 ? '#86efac' : '#fca5a5'
                            }}>
                              {connNode.data.change >= 0 ? '+' : ''}{connNode.data.change}%
                            </span>
                          )}
                          <ChevronRight color="#64748b" size={14} />
                        </motion.button>
                      ))}
                    </div>
                    {connectedNodes.length > 8 && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          +{connectedNodes.length - 8} more connections
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
