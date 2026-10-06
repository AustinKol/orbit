'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sliders, GitBranch, Search, X, ArrowRight, CheckCircle2, Loader2, AlertCircle, CheckSquare, Square, Info, Star, Sparkles, Route, RefreshCw, Building2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
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
  // Search props
  onSearchSelect: (node: GraphNode) => void;
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
  selectedNodeId,
  onSearchSelect
}: ToolsNavbarProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const dragControls = useDragControls();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleToolClick = (tool: ActiveTool) => {
    if (tool === 'cycles') {
      // The button turns cycle mode on, then only shows/hides the menu;
      // the menu's Clear button is what turns cycle mode off
      if (!cycleMode) {
        onCycleModeToggle(true);
        setActiveTool('cycles');
      } else {
        setActiveTool(activeTool === 'cycles' ? null : 'cycles');
      }
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

  // Clicking anywhere outside the cycles or path menu hides it; the found
  // cycles/path stay on the graph until the menu's Clear button is used
  const cyclesPanelRef = useRef<HTMLDivElement>(null);
  const cyclesButtonRef = useRef<HTMLButtonElement>(null);
  const pathPanelRef = useRef<HTMLDivElement>(null);
  const pathButtonRef = useRef<HTMLButtonElement>(null);
  // Path Finder mounts on first open (its effects reset the highlights on mount),
  // then stays mounted so hiding it keeps the chosen companies and found paths
  const [pathPanelMounted, setPathPanelMounted] = useState(false);
  useEffect(() => {
    if (activeTool === 'path') setPathPanelMounted(true);
  }, [activeTool]);
  useEffect(() => {
    const refs = activeTool === 'cycles' ? [cyclesPanelRef, cyclesButtonRef]
      : activeTool === 'path' ? [pathPanelRef, pathButtonRef]
      : null;
    if (!refs) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The tool's own button handles its own toggle
      if (!refs.some(ref => ref.current?.contains(target))) {
        setActiveTool(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [activeTool]);

  // Search handlers
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setSelectedIndex(0);
    if (val.length > 1) {
      const filtered = nodes.filter(n =>
        n.label.toLowerCase().includes(val.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 6));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    onSearchSelect(node);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSelectNode(searchResults[selectedIndex]);
    } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  return (
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{ top: 0, left: -500, right: 500, bottom: 500 }}
        dragListener={false}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          x: '-50%',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          cursor: 'default',
          outline: 'none',
          border: 'none'
        }}
      >
        {/* Unified compact toolbar */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 6,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}
        >
          {/* Drag Handle */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 36,
              cursor: 'grab',
              borderRadius: 6,
              marginRight: 2
            }}
          >
            <GripVertical size={14} color="rgba(255,255,255,0.3)" />
          </div>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: isSearchFocused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: isSearchFocused ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              borderRadius: 10,
              transition: 'all 0.2s ease',
              minWidth: 200
            }}>
              <Search size={14} color={isSearchFocused ? 'white' : '#64748b'} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Search companies..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  color: 'white',
                  width: 140
                }}
              />
            </div>
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    zIndex: 100
                  }}
                >
                  {searchResults.length > 0 ? (
                    <div style={{ padding: 4 }}>
                      {searchResults.map((node, idx) => (
                        <motion.button
                          key={node.id}
                          onClick={() => handleSelectNode(node)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: idx === selectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (idx !== selectedIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (idx !== selectedIndex) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Building2 size={12} color={idx === selectedIndex ? 'white' : '#64748b'} />
                          <span style={{ 
                            color: idx === selectedIndex ? 'white' : 'rgba(255,255,255,0.7)',
                            fontSize: 12
                          }}>
                            {node.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                      No results
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Filter Button */}
          <motion.button
            onClick={() => handleToolClick('filter')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Filters"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              backgroundColor: activeTool === 'filter' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <Sliders size={16} color={activeTool === 'filter' ? 'white' : '#94a3b8'} />
            {enabledTypes.size < Object.values(EdgeType).length && (
              <div style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#f59e0b'
              }} />
            )}
          </motion.button>

          {/* Path Button */}
          <motion.button
            ref={pathButtonRef}
            onClick={() => handleToolClick('path')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Path Finder"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              backgroundColor: activeTool === 'path' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <GitBranch size={16} color={activeTool === 'path' ? 'white' : '#94a3b8'} />
          </motion.button>

          {/* Watchlist Button */}
          <motion.button
            onClick={onWatchlistClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Watchlist"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              backgroundColor: watchlistCount > 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <Star size={16} color={watchlistCount > 0 ? '#fbbf24' : '#94a3b8'} fill={watchlistCount > 0 ? '#fbbf24' : 'none'} />
            {watchlistCount > 0 && (
              <div style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#000',
                fontSize: 8,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px'
              }}>
                {watchlistCount > 9 ? '9+' : watchlistCount}
              </div>
            )}
          </motion.button>

          {/* Cycles Button */}
          <motion.button
            ref={cyclesButtonRef}
            onClick={() => handleToolClick('cycles')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Cycles"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              backgroundColor: cycleMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} color={cycleMode ? 'white' : '#94a3b8'} />
          </motion.button>
        </div>

        {/* Active tool panel - positioned below the bar */}
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
        </AnimatePresence>
        {pathPanelMounted && (
          <motion.div
            ref={pathPanelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={activeTool === 'path'
              ? { opacity: 1, y: 0, scale: 1, display: 'block' }
              : { opacity: 0, y: -10, scale: 0.95, transitionEnd: { display: 'none' } }}
            transition={{ duration: 0.2 }}
          >
            <PathFinderPanel
              nodes={nodes}
              onPathFound={onPathFound}
            />
          </motion.div>
        )}
        {/* Stays mounted while cycle mode is on so hiding the menu keeps the found cycles */}
        {cycleMode && (
          <motion.div
            ref={cyclesPanelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={activeTool === 'cycles'
              ? { opacity: 1, y: 0, scale: 1, display: 'block' }
              : { opacity: 0, y: -10, scale: 0.95, transitionEnd: { display: 'none' } }}
            transition={{ duration: 0.2 }}
          >
            <CyclesPanel
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onCyclesFound={onCyclesFound}
              onExit={() => onCycleModeToggle(false)}
            />
          </motion.div>
        )}
      </motion.div>
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
        backgroundColor: '#1a1a1a',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={18} color="rgba(255,255,255,0.7)" />
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
        backgroundColor: '#1a1a1a',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GitBranch size={18} color="rgba(255,255,255,0.7)" />
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
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Start Company
          </label>
          <div style={{ position: 'relative' }}>
            {fromSelected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 10
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{fromSelected.label}</span>
                <motion.button 
                  onClick={() => { setFromSelected(null); setFromQuery(''); }} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} color="rgba(255,255,255,0.7)" />
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
                    backgroundColor: '#1a1a1a',
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
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
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
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ArrowRight size={14} color="rgba(255,255,255,0.5)" style={{ transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* To Node */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            End Company
          </label>
          <div style={{ position: 'relative' }}>
            {toSelected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 10
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{toSelected.label}</span>
                <motion.button 
                  onClick={() => { setToSelected(null); setToQuery(''); }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} color="rgba(255,255,255,0.7)" />
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
                    backgroundColor: '#1a1a1a',
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
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
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
                  backgroundColor: maxDepth === depth ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: maxDepth === depth ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: maxDepth === depth ? 'white' : 'rgba(255,255,255,0.5)',
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
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                  Found {paths.length} path{paths.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <motion.button
                    onClick={handleSelectAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.7)',
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
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {isSelected ? (
                            <CheckSquare size={14} color="white" />
                          ) : (
                            <Square size={14} color="rgba(255,255,255,0.3)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header row with path number, hops, and exposure index */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'white' : 'rgba(255,255,255,0.8)' }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 3,
                              fontSize: 9,
                              color: 'rgba(255,255,255,0.7)'
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
                                  color: i === 0 || i === nodeLabels.length - 1 ? 'white' : 'rgba(255,255,255,0.7)',
                                  fontWeight: i === 0 || i === nodeLabels.length - 1 ? 600 : 400,
                                  backgroundColor: i === 0 || i === nodeLabels.length - 1 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.05)',
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
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
  onCyclesFound,
  onExit
}: { 
  nodes: GraphNode[]; 
  selectedNodeId?: string;
  onCyclesFound: (cycles: CycleResultWithEdges[] | null, highlightNodes: Set<string>, highlightEdges: Set<string>) => void;
  onExit: () => void;
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
      // Clicking a node that belongs to the detected cycles is just for inspecting it;
      // re-anchoring would refetch and collapse the view to that node's shortest cycle
      if (cycles.some(c => c.path.includes(selectedNodeId))) return;

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

  const getNodeLabel = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.label : nodeId;
  };

  return (
    <div
      style={{
        width: 380,
        backgroundColor: '#1a1a1a',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RefreshCw size={18} color="rgba(255,255,255,0.7)" />
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
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Select Company
          </label>
          <div style={{ position: 'relative' }}>
            {localSelectedNode ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RefreshCw size={12} color="rgba(255,255,255,0.7)" />
                  </div>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{localSelectedNode.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isLoading && <Loader2 size={14} color="rgba(255,255,255,0.7)" className="animate-spin" />}
                  <motion.button 
                    onClick={handleClearNode}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} color="rgba(255,255,255,0.7)" />
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
                    backgroundColor: '#1a1a1a',
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
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
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
                  backgroundColor: maxDepth === depth ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: maxDepth === depth ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: maxDepth === depth ? 'white' : 'rgba(255,255,255,0.5)',
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
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
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
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </motion.button>
                  <motion.button
                    // Leaves cycle mode entirely and returns to the full graph
                    onClick={onExit}
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
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>
                          {isSelected ? (
                            <CheckSquare size={14} color="white" />
                          ) : (
                            <Square size={14} color="rgba(255,255,255,0.3)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header row with cycle number and length */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'white' : 'rgba(255,255,255,0.8)' }}>
                              #{idx + 1}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 3,
                              fontSize: 9,
                              color: 'rgba(255,255,255,0.7)'
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
                                  color: i === 0 || i === nodeLabels.length - 1 ? 'white' : 'rgba(255,255,255,0.7)',
                                  fontWeight: i === 0 || i === nodeLabels.length - 1 ? 600 : 400,
                                  backgroundColor: i === 0 || i === nodeLabels.length - 1 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.05)',
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
