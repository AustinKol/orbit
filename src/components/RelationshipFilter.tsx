'use client';

import React, { useState } from 'react';
import { Filter, Eye, EyeOff, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EdgeType, EDGE_COLORS, EDGE_LABELS } from '@/types';

interface RelationshipFilterProps {
  enabledTypes: Set<EdgeType>;
  onToggle: (type: EdgeType) => void;
  onToggleAll: () => void;
}

export default function RelationshipFilter({ enabledTypes, onToggle, onToggleAll }: RelationshipFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const allTypes = Object.values(EdgeType);
  const allEnabled = allTypes.every(type => enabledTypes.has(type));

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.3 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 388,
        width: 280,
        maxHeight: isCollapsed ? 'auto' : '50vh',
        backgroundColor: '#0f172a',
        borderTop: '3px solid #8b5cf6',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px 24px 0 0',
        zIndex: 9996,
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
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Filter color="white" size={16} />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Filters
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{enabledTypes.size}/{allTypes.length} active</span>
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
            {/* Toggle All Button */}
            <div style={{ padding: '12px 16px 8px' }}>
              <button
                onClick={onToggleAll}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#a78bfa',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {allEnabled ? 'Hide All' : 'Show All'}
              </button>
            </div>

            {/* List */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '8px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: '35vh'
            }}>
              {allTypes.map((type, idx) => {
                const isEnabled = enabledTypes.has(type);
                const color = EDGE_COLORS[type];
                const label = EDGE_LABELS[type];

                return (
                  <motion.button
                    key={type}
                    onClick={() => onToggle(type)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: isEnabled ? 'rgba(139, 92, 246, 0.1)' : 'transparent'
                    }}
                  >
                    {/* Color Indicator */}
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `2px solid ${isEnabled ? color : '#475569'}`,
                      backgroundColor: isEnabled ? color : 'transparent'
                    }} />

                    {/* Label */}
                    <span style={{ 
                      flex: 1, 
                      textAlign: 'left',
                      fontSize: 12, 
                      fontWeight: 500, 
                      color: isEnabled ? 'white' : '#94a3b8'
                    }}>
                      {label}
                    </span>

                    {/* Toggle Icon */}
                    {isEnabled ? (
                      <Eye color="#a78bfa" size={14} />
                    ) : (
                      <EyeOff color="#475569" size={14} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
