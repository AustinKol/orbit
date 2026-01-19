'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Route, ArrowDown, CheckCircle2, Loader2, AlertCircle, CheckSquare, Square, Building2, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, PathItem, PathsResponse } from '@/types';

interface PathFinderProps {
  nodes: GraphNode[];
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
}

export default function PathFinder({ nodes, onPathFound }: PathFinderProps) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<GraphNode[]>([]);
  const [toResults, setToResults] = useState<GraphNode[]>([]);
  const [fromSelected, setFromSelected] = useState<GraphNode | null>(null);
  const [toSelected, setToSelected] = useState<GraphNode | null>(null);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [fromSelectedIndex, setFromSelectedIndex] = useState(0);
  const [toSelectedIndex, setToSelectedIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [selectedPathIds, setSelectedPathIds] = useState<Set<string>>(new Set());
  const [maxDepth, setMaxDepth] = useState<number>(4);

  useEffect(() => {
    if (selectedPathIds.size === 0) {
      onPathFound(null);
      return;
    }

    const selectedPaths = paths.filter(p => selectedPathIds.has(p.pathId));
    if (selectedPaths.length === 0) {
      onPathFound(null);
      return;
    }

    const allNodes = new Set<string>();
    const allEdgeIds = new Set<string>();

    selectedPaths.forEach(path => {
      path.nodes.forEach(nodeId => allNodes.add(nodeId));
      path.edges.forEach((edge: any) => {
        const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
        const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
        allEdgeIds.add(`${sourceId}-${targetId}`);
        allEdgeIds.add(`${targetId}-${sourceId}`);
      });
    });

    onPathFound({ nodes: Array.from(allNodes), edges: Array.from(allEdgeIds) });
  }, [selectedPathIds, paths, onPathFound]);

  useEffect(() => {
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
  }, [fromSelected?.id, toSelected?.id]);

  const handleFromSearch = (val: string) => {
    setFromQuery(val);
    setFromSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase()));
      setFromResults(filtered.slice(0, 6));
    } else {
      setFromResults([]);
    }
  };

  const handleToSearch = (val: string) => {
    setToQuery(val);
    setToSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase()));
      setToResults(filtered.slice(0, 6));
    } else {
      setToResults([]);
    }
  };

  const handleSelectFrom = (node: GraphNode) => {
    setFromSelected(node);
    setFromQuery(node.label);
    setFromResults([]);
    setIsFromFocused(false);
  };

  const handleSelectTo = (node: GraphNode) => {
    setToSelected(node);
    setToQuery(node.label);
    setToResults([]);
    setIsToFocused(false);
  };

  const handleFindPaths = async () => {
    if (!fromSelected || !toSelected) return;
    if (fromSelected.id === toSelected.id) {
      setPathError('Please select two different nodes');
      onPathFound(null);
      setPaths([]);
      setSelectedPathIds(new Set());
      return;
    }

    setIsLoading(true);
    setPathError(null);
    setPaths([]);
    setSelectedPathIds(new Set());

    try {
      const response = await fetch(`/api/paths?from=${fromSelected.id}&to=${toSelected.id}&depth=${maxDepth}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');

      let data: PathsResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.paths && data.paths.length > 0) {
        setPaths(data.paths);
        if (data.shortestPath) {
          setSelectedPathIds(new Set([data.shortestPath.pathId]));
        }
      } else {
        setPathError('No paths found within specified depth.');
        setPaths([]);
        setSelectedPathIds(new Set());
        onPathFound(null);
      }
    } catch (error) {
      setPathError(error instanceof Error ? error.message : 'Failed to find paths.');
      setPaths([]);
      setSelectedPathIds(new Set());
      onPathFound(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePath = (pathId: string) => {
    setSelectedPathIds(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) next.delete(pathId);
      else next.add(pathId);
      return next;
    });
  };

  const handleClear = () => {
    setFromSelected(null);
    setToSelected(null);
    setFromQuery('');
    setToQuery('');
    setFromResults([]);
    setToResults([]);
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
    onPathFound(null);
  };

  const handleFromKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && fromResults.length > 0) {
      e.preventDefault();
      handleSelectFrom(fromResults[fromSelectedIndex]);
    } else if (e.key === 'ArrowDown' && fromResults.length > 0) {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev + 1) % fromResults.length);
    } else if (e.key === 'ArrowUp' && fromResults.length > 0) {
      e.preventDefault();
      setFromSelectedIndex((prev) => (prev - 1 + fromResults.length) % fromResults.length);
    }
  };

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && toResults.length > 0) {
      e.preventDefault();
      handleSelectTo(toResults[toSelectedIndex]);
    } else if (e.key === 'ArrowDown' && toResults.length > 0) {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev + 1) % toResults.length);
    } else if (e.key === 'ArrowUp' && toResults.length > 0) {
      e.preventDefault();
      setToSelectedIndex((prev) => (prev - 1 + toResults.length) % toResults.length);
    }
  };

  const formatPathSequence = (path: PathItem): string => {
    const nodeLabels = path.nodes.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node ? node.label : nodeId;
    });
    return nodeLabels.join(' → ');
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 24,
        width: 340,
        maxHeight: isCollapsed ? 'auto' : '55vh',
        backgroundColor: '#0f172a',
        borderTop: '3px solid #8b5cf6',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px 24px 0 0',
        zIndex: 9997,
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
              <Route color="white" size={16} />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Path Finder
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Discover connections</span>
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
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: '40vh'
            }}>
              {/* From Node */}
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  From
                </label>
                {fromSelected ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 color="#a78bfa" size={14} />
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{fromSelected.label}</span>
                    </div>
                    <button
                      onClick={() => { setFromSelected(null); setFromQuery(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <X color="#94a3b8" size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: isFromFocused ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10
                    }}>
                      <Search color="#64748b" size={14} />
                      <input
                        type="text"
                        value={fromQuery}
                        onChange={(e) => handleFromSearch(e.target.value)}
                        onFocus={() => setIsFromFocused(true)}
                        onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
                        onKeyDown={handleFromKeyDown}
                        placeholder="Search..."
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'white' }}
                      />
                    </div>
                    <AnimatePresence>
                      {isFromFocused && fromQuery.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 8,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            zIndex: 50
                          }}
                        >
                          {fromResults.length > 0 ? fromResults.map((node, idx) => (
                            <button
                              key={node.id}
                              onClick={() => handleSelectFrom(node)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 10px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: idx === fromSelectedIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <Building2 color={idx === fromSelectedIndex ? '#c4b5fd' : '#64748b'} size={12} />
                              <span style={{ color: idx === fromSelectedIndex ? 'white' : '#e2e8f0', fontSize: 12 }}>{node.label}</span>
                            </button>
                          )) : (
                            <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 11 }}>No results</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowDown color="#64748b" size={16} />
              </div>

              {/* To Node */}
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  To
                </label>
                {toSelected ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 color="#a78bfa" size={14} />
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{toSelected.label}</span>
                    </div>
                    <button
                      onClick={() => { setToSelected(null); setToQuery(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <X color="#94a3b8" size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: isToFocused ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10
                    }}>
                      <Search color="#64748b" size={14} />
                      <input
                        type="text"
                        value={toQuery}
                        onChange={(e) => handleToSearch(e.target.value)}
                        onFocus={() => setIsToFocused(true)}
                        onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
                        onKeyDown={handleToKeyDown}
                        placeholder="Search..."
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'white' }}
                      />
                    </div>
                    <AnimatePresence>
                      {isToFocused && toQuery.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 8,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            zIndex: 50
                          }}
                        >
                          {toResults.length > 0 ? toResults.map((node, idx) => (
                            <button
                              key={node.id}
                              onClick={() => handleSelectTo(node)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 10px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: idx === toSelectedIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                              }}
                            >
                              <Building2 color={idx === toSelectedIndex ? '#c4b5fd' : '#64748b'} size={12} />
                              <span style={{ color: idx === toSelectedIndex ? 'white' : '#e2e8f0', fontSize: 12 }}>{node.label}</span>
                            </button>
                          )) : (
                            <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 11 }}>No results</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Depth Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Max Depth
                </label>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: 'white',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {[2, 3, 4, 5, 6].map(d => (
                    <option key={d} value={d} style={{ backgroundColor: '#1e293b' }}>{d} hops</option>
                  ))}
                </select>
              </div>

              {/* Path Results */}
              <AnimatePresence>
                {paths.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>
                        {paths.length} path{paths.length !== 1 ? 's' : ''} found
                      </span>
                      <span style={{ fontSize: 10, color: '#a78bfa' }}>
                        {selectedPathIds.size} selected
                      </span>
                    </div>
                    <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {paths.map((path, idx) => {
                        const isSelected = selectedPathIds.has(path.pathId);
                        return (
                          <motion.button
                            key={path.pathId}
                            onClick={() => handleTogglePath(path.pathId)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: 10,
                              borderRadius: 8,
                              border: isSelected ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                              background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8
                            }}
                          >
                            {isSelected ? <CheckSquare color="#a78bfa" size={14} /> : <Square color="#64748b" size={14} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ color: 'white', fontSize: 11, fontWeight: 500 }}>#{idx + 1}</span>
                                <span style={{ color: '#94a3b8', fontSize: 10 }}>({path.length} hops)</span>
                              </div>
                              <div style={{ color: '#e2e8f0', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formatPathSequence(path)}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {pathError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                      padding: 10,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <AlertCircle color="#f87171" size={14} />
                    <span style={{ color: '#fca5a5', fontSize: 11 }}>{pathError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div style={{ 
              padding: '12px 16px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              gap: 8
            }}>
              <motion.button
                onClick={handleFindPaths}
                disabled={!fromSelected || !toSelected || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: fromSelected && toSelected && !isLoading 
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'rgba(100, 116, 139, 0.3)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: fromSelected && toSelected && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: fromSelected && toSelected && !isLoading 
                    ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                    : 'none'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 color="white" size={14} className="animate-spin" />
                    <span>Finding...</span>
                  </>
                ) : (
                  <>
                    <Route color="white" size={14} />
                    <span>Find</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleClear}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Clear
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
