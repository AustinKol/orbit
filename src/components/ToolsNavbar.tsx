'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, GitBranch, Search, X, ArrowRight, CheckCircle2, Loader2, AlertCircle, CheckSquare, Square, Info, Star, Sparkles, Route, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode, EdgeType, PathItem, PathsResponse, CycleResultWithEdges, CyclesResponse } from '@/types';

interface ToolsNavbarProps {
  nodes: GraphNode[];
  enabledTypes: Set<EdgeType>;
  onToggle: (type: EdgeType) => void;
  onToggleAll: () => void;
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
  onWatchlistClick: () => void;
  watchlistCount: number;
  // Cycle mode props
  cycleMode: boolean;
  onCycleModeToggle: (enabled: boolean) => void;
  onCyclesFound: (cycles: CycleResultWithEdges[] | null, highlightNodes: Set<string>, highlightEdges: Set<string>) => void;
  selectedNodeId?: string;
}

type ActiveTool = 'filter' | 'path' | 'cycles' | null;

export default function ToolsNavbar({ 
  nodes, 
  enabledTypes, 
  onToggle, 
  onToggleAll, 
  onPathFound,
  onWatchlistClick,
  watchlistCount,
  cycleMode,
  onCycleModeToggle,
  onCyclesFound,
  selectedNodeId
}: ToolsNavbarProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const handleToolClick = (tool: ActiveTool) => {
    if (tool === 'cycles') {
      // Toggle cycle mode
      const newEnabled = !cycleMode;
      onCycleModeToggle(newEnabled);
      setActiveTool(newEnabled ? 'cycles' : null);
    } else {
      // For other tools, toggle as before
      setActiveTool(activeTool === tool ? null : tool);
    }
  };

  // Sync activeTool with cycleMode
  useEffect(() => {
    if (cycleMode && activeTool !== 'cycles') {
      setActiveTool('cycles');
    } else if (!cycleMode && activeTool === 'cycles') {
      setActiveTool(null);
    }
  }, [cycleMode]);

  return (
    <div className="absolute top-24 left-6 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        {/* Modern toolbar */}
        <div 
          style={{
            display: 'flex',
            gap: 8,
            padding: 8,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset'
          }}
        >
          {/* Filter Button */}
          <motion.button
            onClick={() => handleToolClick('filter')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              backgroundColor: activeTool === 'filter' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTool === 'filter' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: activeTool === 'filter' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sliders size={16} color={activeTool === 'filter' ? '#c4b5fd' : '#94a3b8'} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: activeTool === 'filter' ? 'white' : 'rgba(255,255,255,0.8)'
              }}>
                Filters
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                {enabledTypes.size} active
              </div>
            </div>
          </motion.button>

          {/* Path Button */}
          <motion.button
            onClick={() => handleToolClick('path')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              backgroundColor: activeTool === 'path' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTool === 'path' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: activeTool === 'path' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GitBranch size={16} color={activeTool === 'path' ? '#67e8f9' : '#94a3b8'} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: activeTool === 'path' ? 'white' : 'rgba(255,255,255,0.8)'
              }}>
                Path Finder
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                Find connections
              </div>
            </div>
          </motion.button>

          {/* Watchlist Button */}
          <motion.button
            onClick={onWatchlistClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              backgroundColor: watchlistCount > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)',
              border: watchlistCount > 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: watchlistCount > 0 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Star size={16} color={watchlistCount > 0 ? '#fbbf24' : '#94a3b8'} fill={watchlistCount > 0 ? '#fbbf24' : 'none'} />
              {watchlistCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fbbf24',
                  color: '#000',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {watchlistCount > 9 ? '9+' : watchlistCount}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: watchlistCount > 0 ? '#fef08a' : 'rgba(255,255,255,0.8)'
              }}>
                Watchlist
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                {watchlistCount > 0 ? `${watchlistCount} stocks` : 'Track stocks'}
              </div>
            </div>
          </motion.button>

          {/* Cycles Button (Circle Jerk Mode) */}
          <motion.button
            onClick={() => handleToolClick('cycles')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              backgroundColor: cycleMode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.03)',
              border: cycleMode ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: cycleMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={16} color={cycleMode ? '#f9a8d4' : '#94a3b8'} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: cycleMode ? 'white' : 'rgba(255,255,255,0.8)'
              }}>
                Cycles
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                {cycleMode ? 'Active' : 'Find loops'}
              </div>
            </div>
          </motion.button>
        </div>

        {/* Active tool panel */}
        <AnimatePresence>
          {activeTool === 'filter' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <RelationshipFilterPanel
                enabledTypes={enabledTypes}
                onToggle={onToggle}
                onToggleAll={onToggleAll}
              />
            </motion.div>
          )}
          {activeTool === 'path' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <PathFinderPanel
                nodes={nodes}
                onPathFound={onPathFound}
              />
            </motion.div>
          )}
          {activeTool === 'cycles' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <CyclesPanel
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onCyclesFound={onCyclesFound}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Inline filter panel (extracted from RelationshipFilter)
function RelationshipFilterPanel({ 
  enabledTypes, 
  onToggle, 
  onToggleAll 
}: { 
  enabledTypes: Set<EdgeType>; 
  onToggle: (type: EdgeType) => void; 
  onToggleAll: () => void;
}) {
  const allTypes = Object.values(EdgeType);
  const allEnabled = allTypes.every(type => enabledTypes.has(type));
  const { EDGE_COLORS, EDGE_LABELS } = require('@/types');

  return (
    <div
      style={{
        width: 340,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(to right, rgba(139, 92, 246, 0.15), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={18} color="#c4b5fd" />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
              Relationship Filters
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
              {enabledTypes.size} of {allTypes.length} active
            </p>
          </div>
        </div>
        <motion.button
          onClick={onToggleAll}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '6px 14px',
            backgroundColor: allEnabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: allEnabled ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 8,
            color: allEnabled ? '#fca5a5' : '#86efac',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {allEnabled ? 'Disable All' : 'Enable All'}
        </motion.button>
      </div>

      {/* Filter Grid */}
      <div style={{ padding: 12, maxHeight: 280, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {allTypes.map((type) => {
            const isEnabled = enabledTypes.has(type);
            const color = EDGE_COLORS[type];
            const label = EDGE_LABELS[type];
            return (
              <motion.button
                key={type}
                onClick={() => onToggle(type)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: isEnabled ? `${color}20` : 'rgba(255,255,255,0.03)',
                  border: isEnabled ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: isEnabled ? `${color}30` : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: isEnabled ? color : 'rgba(255,255,255,0.2)'
                  }} />
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isEnabled ? 'white' : 'rgba(255,255,255,0.4)',
                  textAlign: 'left',
                  flex: 1
                }}>
                  {label}
                </span>
                {isEnabled && (
                  <CheckCircle2 size={14} color={color} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Inline path finder panel (simplified from PathFinder)
function PathFinderPanel({ 
  nodes, 
  onPathFound 
}: { 
  nodes: GraphNode[]; 
  onPathFound: (path: { nodes: string[]; edges: string[] } | null) => void;
}) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromResults, setFromResults] = useState<GraphNode[]>([]);
  const [toResults, setToResults] = useState<GraphNode[]>([]);
  const [fromSelected, setFromSelected] = useState<GraphNode | null>(null);
  const [toSelected, setToSelected] = useState<GraphNode | null>(null);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [selectedPathIds, setSelectedPathIds] = useState<Set<string>>(new Set());
  const [maxDepth, setMaxDepth] = useState<number>(4);

  const handleFromSearch = (val: string) => {
    setFromQuery(val);
    if (val.length > 1) {
      setFromResults(nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setFromResults([]);
    }
  };

  const handleToSearch = (val: string) => {
    setToQuery(val);
    if (val.length > 1) {
      setToResults(nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setToResults([]);
    }
  };

  // Update highlighting when selection changes
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

    // Union of all nodes and edges from selected paths
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

  // Clear selection when A/B changes
  useEffect(() => {
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
  }, [fromSelected?.id, toSelected?.id]);

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let data: PathsResponse;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError, 'Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.paths && data.paths.length > 0) {
        setPaths(data.paths);
        // Default: select the shortest path (first one)
        if (data.shortestPath) {
          setSelectedPathIds(new Set([data.shortestPath.pathId]));
        }
      } else {
        setPathError('No paths found within depth ' + maxDepth + '.');
        setPaths([]);
        setSelectedPathIds(new Set());
        onPathFound(null);
      }
    } catch (error) {
      console.error('Failed to find paths:', error);
      setPathError(error instanceof Error ? error.message : 'Failed to find paths. Please try again.');
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
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPathIds(new Set(paths.map(p => p.pathId)));
  };

  const handleClearSelection = () => {
    setSelectedPathIds(new Set());
  };

  const formatPathSequence = (path: PathItem): string => {
    const nodeLabels = path.nodes.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node ? node.label : nodeId;
    });
    return nodeLabels.join(' → ');
  };

  const handleClear = () => {
    setFromSelected(null);
    setToSelected(null);
    setFromQuery('');
    setToQuery('');
    setPaths([]);
    setSelectedPathIds(new Set());
    setPathError(null);
    onPathFound(null);
  };

  return (
    <div
      style={{
        width: 360,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(to right, rgba(6, 182, 212, 0.15), transparent)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GitBranch size={18} color="#67e8f9" />
        </div>
        <div>
          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
            Path Finder
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            Discover connections between companies
          </p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* From Node */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#67e8f9', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Start Company
          </label>
          <div style={{ position: 'relative' }}>
            {fromSelected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 10
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{fromSelected.label}</span>
                <motion.button 
                  onClick={() => { setFromSelected(null); setFromQuery(''); }} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} color="#67e8f9" />
                </motion.button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} size={15} color="#64748b" />
                <input
                  value={fromQuery}
                  onChange={(e) => handleFromSearch(e.target.value)}
                  onFocus={() => setIsFromFocused(true)}
                  onBlur={() => setTimeout(() => setIsFromFocused(false), 200)}
                  placeholder="Search company..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 14px 10px 38px',
                    color: 'white',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
                {isFromFocused && fromResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    zIndex: 50
                  }}>
                    {fromResults.map(node => (
                      <button
                        key={node.id}
                        onClick={() => { setFromSelected(node); setFromQuery(node.label); setFromResults([]); }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.8)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ArrowRight size={14} color="#67e8f9" style={{ transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* To Node */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#67e8f9', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            End Company
          </label>
          <div style={{ position: 'relative' }}>
            {toSelected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 10
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{toSelected.label}</span>
                <motion.button 
                  onClick={() => { setToSelected(null); setToQuery(''); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} color="#67e8f9" />
                </motion.button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} size={15} color="#64748b" />
                <input
                  value={toQuery}
                  onChange={(e) => handleToSearch(e.target.value)}
                  onFocus={() => setIsToFocused(true)}
                  onBlur={() => setTimeout(() => setIsToFocused(false), 200)}
                  placeholder="Search company..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 14px 10px 38px',
                    color: 'white',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
                {isToFocused && toResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    zIndex: 50
                  }}>
                    {toResults.map(node => (
                      <button
                        key={node.id}
                        onClick={() => { setToSelected(node); setToQuery(node.label); setToResults([]); }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.8)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Depth Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Depth (Hops)
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2, 3, 4, 5, 6, 7].map(depth => (
              <motion.button
                key={depth}
                onClick={() => setMaxDepth(depth)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  backgroundColor: maxDepth === depth ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.04)',
                  border: maxDepth === depth ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: maxDepth === depth ? '#67e8f9' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {depth}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Path Results */}
        <AnimatePresence>
          {paths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#67e8f9', textTransform: 'uppercase' }}>
                  Found {paths.length} path{paths.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <motion.button
                    onClick={handleSelectAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: 6,
                      color: '#67e8f9',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </motion.button>
                  <motion.button
                    onClick={handleClearSelection}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </motion.button>
                </div>
              </div>
              
              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {paths.map((path, idx) => {
                  const isSelected = selectedPathIds.has(path.pathId);
                  const nodeLabels = path.nodes.map(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    return node ? node.label : nodeId;
                  });
                  const exposureColor = path.exposureIndex >= 70 ? '#ef4444' : path.exposureIndex >= 40 ? '#f59e0b' : '#10b981';
                  return (
                    <motion.button
                      key={path.pathId}
                      onClick={() => handleTogglePath(path.pathId)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {isSelected ? (
                            <CheckSquare size={14} color="#67e8f9" />
                          ) : (
                            <Square size={14} color="rgba(255,255,255,0.3)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header row with path number, hops, and exposure index */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#67e8f9' : 'white' }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              backgroundColor: 'rgba(6, 182, 212, 0.2)',
                              borderRadius: 3,
                              fontSize: 9,
                              color: '#67e8f9'
                            }}>
                              {path.length} hop{path.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              backgroundColor: `${exposureColor}22`,
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 600,
                              color: exposureColor
                            }}>
                              EXP {path.exposureIndex.toFixed(0)}
                            </span>
                          </div>
                          {/* Company chain as compact flow */}
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            alignItems: 'center', 
                            gap: 3,
                            marginBottom: 4
                          }}>
                            {nodeLabels.map((label, i) => (
                              <React.Fragment key={i}>
                                <span style={{
                                  fontSize: 10,
                                  color: i === 0 || i === nodeLabels.length - 1 ? '#67e8f9' : 'rgba(255,255,255,0.7)',
                                  fontWeight: i === 0 || i === nodeLabels.length - 1 ? 600 : 400,
                                  backgroundColor: i === 0 || i === nodeLabels.length - 1 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.05)',
                                  padding: '2px 5px',
                                  borderRadius: 3,
                                  maxWidth: 100,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {label}
                                </span>
                                {i < nodeLabels.length - 1 && (
                                  <ArrowRight size={10} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          {/* Summary */}
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.3 }}>
                            {path.summary}
                          </div>
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                color: '#fca5a5',
                fontSize: 12
              }}
            >
              <AlertCircle size={14} />
              <span>{pathError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <motion.button
            onClick={handleFindPaths}
            disabled={!fromSelected || !toSelected || isLoading}
            whileHover={{ scale: fromSelected && toSelected && !isLoading ? 1.02 : 1 }}
            whileTap={{ scale: fromSelected && toSelected && !isLoading ? 0.98 : 1 }}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: fromSelected && toSelected && !isLoading 
                ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' 
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: fromSelected && toSelected && !isLoading ? 'pointer' : 'not-allowed',
              opacity: fromSelected && toSelected && !isLoading ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <GitBranch size={16} />}
            {isLoading ? 'Finding...' : 'Find Paths'}
          </motion.button>
          <motion.button
            onClick={handleClear}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Clear
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// Cycles Panel for "Circle Jerk Mode"
function CyclesPanel({ 
  nodes, 
  selectedNodeId,
  onCyclesFound 
}: { 
  nodes: GraphNode[]; 
  selectedNodeId?: string;
  onCyclesFound: (cycles: CycleResultWithEdges[] | null, highlightNodes: Set<string>, highlightEdges: Set<string>) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycles, setCycles] = useState<CycleResultWithEdges[]>([]);
  const [selectedCycleIds, setSelectedCycleIds] = useState<Set<string>>(new Set());
  const [maxDepth, setMaxDepth] = useState<number>(6);
  const [responseInfo, setResponseInfo] = useState<{ totalFound: number; capped: boolean } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [localSelectedNode, setLocalSelectedNode] = useState<GraphNode | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Sync local selection with external selectedNodeId (when clicking on graph)
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node && (!localSelectedNode || localSelectedNode.id !== selectedNodeId)) {
        setLocalSelectedNode(node);
        setSearchQuery(node.label);
      }
    }
  }, [selectedNodeId, nodes]);

  // Handle search input
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val.length > 1) {
      setSearchResults(nodes.filter(n => n.label.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
    } else {
      setSearchResults([]);
    }
  };

  // Handle node selection from search
  const handleSelectNode = (node: GraphNode) => {
    setLocalSelectedNode(node);
    setSearchQuery(node.label);
    setSearchResults([]);
  };

  // Clear selection
  const handleClearNode = () => {
    setLocalSelectedNode(null);
    setSearchQuery('');
    setCycles([]);
    setSelectedCycleIds(new Set());
    setError(null);
    setResponseInfo(null);
    onCyclesFound(null, new Set(), new Set());
  };

  // The actual node ID to use for cycle detection
  const activeNodeId = localSelectedNode?.id;

  // Fetch cycles when selected node changes
  useEffect(() => {
    if (!activeNodeId) {
      setCycles([]);
      setSelectedCycleIds(new Set());
      setError(null);
      setResponseInfo(null);
      onCyclesFound(null, new Set(), new Set());
      return;
    }

    const fetchCycles = async () => {
      setIsLoading(true);
      setError(null);
      setCycles([]);
      setSelectedCycleIds(new Set());
      setResponseInfo(null);

      try {
        const response = await fetch(
          `/api/cycles?node=${activeNodeId}&maxDepth=${maxDepth}&detailed=true`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CyclesResponse = await response.json();
        
        if (data.cycles && data.cycles.length > 0) {
          setCycles(data.cycles);
          setResponseInfo({ totalFound: data.totalFound, capped: data.capped });
          
          // Auto-select first cycle
          const firstCycleId = data.cycles[0].cycleId;
          setSelectedCycleIds(new Set([firstCycleId]));
          
          // Highlight the first cycle
          const highlightNodes = new Set<string>(data.cycles[0].path);
          const highlightEdges = new Set<string>();
          data.cycles[0].edges.forEach((edge: any) => {
            const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
            const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
            highlightEdges.add(`${sourceId}-${targetId}`);
          });
          
          onCyclesFound(data.cycles, highlightNodes, highlightEdges);
        } else {
          setError('No cycles found for this node');
          onCyclesFound(null, new Set(), new Set());
        }
      } catch (err) {
        console.error('Failed to fetch cycles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch cycles');
        onCyclesFound(null, new Set(), new Set());
      } finally {
        setIsLoading(false);
      }
    };

    fetchCycles();
  }, [activeNodeId, maxDepth]);

  // Update highlighting when selection changes
  useEffect(() => {
    if (selectedCycleIds.size === 0) {
      onCyclesFound(cycles.length > 0 ? cycles : null, new Set(), new Set());
      return;
    }

    const selectedCycles = cycles.filter(c => selectedCycleIds.has(c.cycleId));
    if (selectedCycles.length === 0) {
      onCyclesFound(cycles.length > 0 ? cycles : null, new Set(), new Set());
      return;
    }

    // Union of all nodes and edges from selected cycles
    const allNodes = new Set<string>();
    const allEdgeIds = new Set<string>();

    selectedCycles.forEach(cycle => {
      cycle.path.forEach(nodeId => allNodes.add(nodeId));
      cycle.edges.forEach((edge: any) => {
        const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
        const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
        allEdgeIds.add(`${sourceId}-${targetId}`);
      });
    });

    onCyclesFound(cycles, allNodes, allEdgeIds);
  }, [selectedCycleIds, cycles, onCyclesFound]);

  const handleToggleCycle = (cycleId: string) => {
    setSelectedCycleIds(prev => {
      const next = new Set(prev);
      if (next.has(cycleId)) {
        next.delete(cycleId);
      } else {
        next.add(cycleId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedCycleIds(new Set(cycles.map(c => c.cycleId)));
  };

  const handleClearSelection = () => {
    setSelectedCycleIds(new Set());
  };

  const getNodeLabel = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.label : nodeId;
  };

  return (
    <div
      style={{
        width: 380,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(236, 72, 153, 0.2)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(to right, rgba(236, 72, 153, 0.15), transparent)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(236, 72, 153, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RefreshCw size={18} color="#f9a8d4" />
        </div>
        <div>
          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 600, margin: 0 }}>
            Cycle Detection
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            Find circular dependencies
          </p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Company Search */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#f9a8d4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select Company
          </label>
          <div style={{ position: 'relative' }}>
            {localSelectedNode ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: 'rgba(236, 72, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RefreshCw size={12} color="#f9a8d4" />
                  </div>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{localSelectedNode.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isLoading && <Loader2 size={14} color="#f9a8d4" className="animate-spin" />}
                  <motion.button 
                    onClick={handleClearNode}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} color="#f9a8d4" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} size={15} color="#64748b" />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search company..."
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 14px 10px 38px',
                    color: 'white',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
                {isSearchFocused && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    zIndex: 50
                  }}>
                    {searchResults.map(node => (
                      <button
                        key={node.id}
                        onClick={() => handleSelectNode(node)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.8)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
            Search or click a node in the graph
          </div>
        </div>

        {/* Depth Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Max Depth (Hops)
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[4, 5, 6, 7, 8].map(depth => (
              <motion.button
                key={depth}
                onClick={() => setMaxDepth(depth)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  backgroundColor: maxDepth === depth ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.04)',
                  border: maxDepth === depth ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: maxDepth === depth ? '#f9a8d4' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {depth}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cycle Results */}
        <AnimatePresence>
          {cycles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#f9a8d4', textTransform: 'uppercase' }}>
                    {cycles.length} cycle{cycles.length !== 1 ? 's' : ''} found
                  </span>
                  {responseInfo?.capped && (
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>
                      (capped)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <motion.button
                    onClick={handleSelectAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(236, 72, 153, 0.15)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      borderRadius: 6,
                      color: '#f9a8d4',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </motion.button>
                  <motion.button
                    onClick={handleClearSelection}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </motion.button>
                </div>
              </div>
              
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cycles.map((cycle, idx) => {
                  const isSelected = selectedCycleIds.has(cycle.cycleId);
                  const nodeLabels = cycle.path.map(nodeId => getNodeLabel(nodeId));
                  
                  return (
                    <motion.button
                      key={cycle.cycleId}
                      onClick={() => handleToggleCycle(cycle.cycleId)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {isSelected ? (
                            <CheckSquare size={14} color="#f9a8d4" />
                          ) : (
                            <Square size={14} color="rgba(255,255,255,0.3)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header row with cycle number and length */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#f9a8d4' : 'white' }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              backgroundColor: 'rgba(236, 72, 153, 0.2)',
                              borderRadius: 3,
                              fontSize: 9,
                              color: '#f9a8d4'
                            }}>
                              {cycle.length} hop{cycle.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {/* Company chain as compact flow */}
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            alignItems: 'center', 
                            gap: 3
                          }}>
                            {nodeLabels.map((label, i) => (
                              <React.Fragment key={i}>
                                <span style={{
                                  fontSize: 10,
                                  color: i === 0 || i === nodeLabels.length - 1 ? '#f9a8d4' : 'rgba(255,255,255,0.7)',
                                  fontWeight: i === 0 || i === nodeLabels.length - 1 ? 600 : 400,
                                  backgroundColor: i === 0 || i === nodeLabels.length - 1 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(255,255,255,0.05)',
                                  padding: '2px 5px',
                                  borderRadius: 3,
                                  maxWidth: 90,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {label}
                                </span>
                                {i < nodeLabels.length - 1 && (
                                  <ArrowRight size={10} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
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
          {error && !isLoading && selectedNodeId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                color: '#fca5a5',
                fontSize: 12
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
