'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import GraphViz from '@/components/GraphViz';
import SearchBar from '@/components/SearchBar';
import Chatbot from '@/components/Chatbot';
import TradingCard from '@/components/TradingCard';
import RelationshipCard from '@/components/RelationshipCard';
import PathFinder from '@/components/PathFinder';
import RelationshipFilter from '@/components/RelationshipFilter';
import ToolsNavbar from '@/components/ToolsNavbar';
import WatchlistPopup from '@/components/WatchlistPopup';

import MarketPulse from '@/components/MarketPulse';
import { GraphData, GraphNode, GraphEdge, EdgeType, CycleResultWithEdges } from '@/types';
import { NewsAnalysis } from '@/services/aiService';

const WATCHLIST_STORAGE_KEY = 'orbit-watchlist';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ edge: GraphEdge; source: GraphNode; target: GraphNode } | null>(null);
  const [allRelationships, setAllRelationships] = useState<Array<{ edge: GraphEdge; source: GraphNode; target: GraphNode }>>([]);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightEdges, setHighlightEdges] = useState<Set<string>>(new Set());
  const [pathMode, setPathMode] = useState(false);
  const [newsMode, setNewsMode] = useState(false);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis | null>(null);
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState<Set<EdgeType>>(
    new Set(Object.values(EdgeType)) // All types enabled by default
  );
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [isWatchlistActive, setIsWatchlistActive] = useState(false);
  const [cycleMode, setCycleMode] = useState(false);
  const [detectedCycles, setDetectedCycles] = useState<CycleResultWithEdges[] | null>(null);

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWatchlist(new Set(parsed));
      } catch (e) {
        console.error('Failed to load watchlist:', e);
      }
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    if (watchlist.size > 0) {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([...watchlist]));
    } else {
      localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    }
  }, [watchlist]);

  // Load data
  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(error => console.error("Failed to fetch graph data:", error));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setAllRelationships([]);
    setHighlightNodes(new Set());
    setHighlightEdges(new Set());
    setPathMode(false);
    setNewsMode(false);
    setNewsAnalysis(null);
    // Don't clear cycle mode - user must toggle it off manually
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    // Always allow selecting the node to show its card
    setSelectedNode(node);

    // If in path mode or news mode, don't change highlighting on node click
    if (pathMode || newsMode) return;

    // If in cycle mode, the CyclesPanel will handle highlighting via useEffect
    // So we don't need to do neighbor highlighting
    if (cycleMode) return;

    // Simple neighbor highlighting
    const newHighlightNodes = new Set<string>([node.id]);
    const newHighlightEdges = new Set<string>();

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === node.id) {
        newHighlightNodes.add(targetId);
        newHighlightEdges.add(`${sourceId}-${targetId}`);
      } else if (targetId === node.id) {
        newHighlightNodes.add(sourceId);
        newHighlightEdges.add(`${sourceId}-${targetId}`);
      }
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightEdges(newHighlightEdges);
  }, [graphData.links, pathMode, newsMode, cycleMode]);

  const handlePathFound = useCallback((path: { nodes: string[]; edges: string[] } | null) => {
    if (path) {
      setPathMode(true);
      setHighlightNodes(new Set(path.nodes));
      setHighlightEdges(new Set(path.edges));
    } else {
      setPathMode(false);
      setHighlightNodes(new Set());
      setHighlightEdges(new Set());
    }
  }, []);

  const handleSearchSelect = useCallback((node: GraphNode) => {
    handleNodeClick(node);
  }, [handleNodeClick]);

  const handleToggleEdgeType = useCallback((type: EdgeType) => {
    setEnabledEdgeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleToggleAllEdgeTypes = useCallback(() => {
    setEnabledEdgeTypes(prev => {
      const allTypes = Object.values(EdgeType);
      const allEnabled = allTypes.every(type => prev.has(type));
      return allEnabled ? new Set<EdgeType>() : new Set(allTypes);
    });
  }, []);

  // AI-triggered path finding
  const handleAIFindPath = useCallback(async (fromId: string, toId: string) => {
    try {
      const res = await fetch(`/api/paths?from=${fromId}&to=${toId}&depth=4`);
      if (res.ok) {
        const data = await res.json();
        if (data.shortestPath) {
          const pathNodes = data.shortestPath.nodes;
          const pathEdges: string[] = [];
          
          // Build edge keys from the path
          for (let i = 0; i < pathNodes.length - 1; i++) {
            pathEdges.push(`${pathNodes[i]}-${pathNodes[i + 1]}`);
            pathEdges.push(`${pathNodes[i + 1]}-${pathNodes[i]}`); // Both directions
          }
          
          handlePathFound({ nodes: pathNodes, edges: pathEdges });
        }
      }
    } catch (error) {
      console.error('AI path finding failed:', error);
    }
  }, [handlePathFound]);

  // AI-triggered filter - show only specific types
  const handleShowOnlyFilters = useCallback((edgeTypes: EdgeType[]) => {
    setEnabledEdgeTypes(new Set(edgeTypes));
  }, []);

  // AI-triggered clear filters
  const handleClearAllFilters = useCallback(() => {
    setEnabledEdgeTypes(new Set(Object.values(EdgeType)));
  }, []);

  const handleLinkClick = useCallback((edge: GraphEdge, source: GraphNode, target: GraphNode) => {
    // Find ALL relationships between these two companies (bidirectional check)
    const allEdges: Array<{ edge: GraphEdge; source: GraphNode; target: GraphNode }> = [];
    
    graphData.links.forEach(link => {
      const linkSourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const linkTargetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // Check both directions: source->target and target->source
      if ((linkSourceId === source.id && linkTargetId === target.id) || 
          (linkSourceId === target.id && linkTargetId === source.id)) {
        const linkSource = linkSourceId === source.id ? source : target;
        const linkTarget = linkTargetId === target.id ? target : source;
        allEdges.push({ edge: link, source: linkSource, target: linkTarget });
      }
    });
    
    // Set the first relationship as selected, and store all relationships
    if (allEdges.length > 0) {
      setAllRelationships(allEdges);
      setSelectedEdge(allEdges[0]);
      setSelectedNode(null); // Close node card if open
    }
  }, [graphData.links]);

  const handleNewsAnalysis = useCallback((analysis: NewsAnalysis) => {
    setNewsAnalysis(analysis);
    setNewsMode(true);
    setPathMode(false);
    
    // Highlight affected companies
    const affectedIds = new Set(analysis.affectedCompanies.map(c => c.companyId));
    setHighlightNodes(affectedIds);
    
    // Also highlight edges connected to affected companies
    const affectedEdges = new Set<string>();
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (affectedIds.has(sourceId) || affectedIds.has(targetId)) {
        affectedEdges.add(`${sourceId}-${targetId}`);
        affectedEdges.add(`${targetId}-${sourceId}`);
      }
    });
    setHighlightEdges(affectedEdges);
  }, [graphData.links]);

  const handleCloseNewsPopup = useCallback(() => {
    // Keep the bottom sheet persistent - don't clear newsAnalysis
    // Only exit news mode to allow other interactions
    setNewsMode(false);
  }, []);

  const handleAddToWatchlist = useCallback((nodeId: string) => {
    setWatchlist(prev => new Set([...prev, nodeId]));
  }, []);

  const handleRemoveFromWatchlist = useCallback((nodeId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const handleClearWatchlist = useCallback(() => {
    setWatchlist(new Set());
    setIsWatchlistActive(false);
  }, []);

  const handleToggleWatchlistActive = useCallback(() => {
    setIsWatchlistActive(prev => !prev);
  }, []);

  const handleWatchlistClick = useCallback(() => {
    setShowWatchlist(prev => !prev);
  }, []);

  const handleCycleModeToggle = useCallback((enabled: boolean) => {
    setCycleMode(enabled);
    if (!enabled) {
      // Clear cycle highlighting when disabling
      setDetectedCycles(null);
      setHighlightNodes(new Set());
      setHighlightEdges(new Set());
    }
  }, []);

  const handleCyclesFound = useCallback((
    cycles: CycleResultWithEdges[] | null, 
    nodes: Set<string>, 
    edges: Set<string>
  ) => {
    setDetectedCycles(cycles);
    setHighlightNodes(nodes);
    setHighlightEdges(edges);
  }, []);
  
  // Create map of affected companies for GraphViz
  const affectedCompaniesMap = newsAnalysis 
    ? new Map(newsAnalysis.affectedCompanies.map(c => [c.companyId, c.impactType]))
    : undefined;

  // Get connected nodes for the selected node
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    
    const connectedIds = new Set<string>();
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === selectedNode.id) {
        connectedIds.add(targetId);
      } else if (targetId === selectedNode.id) {
        connectedIds.add(sourceId);
      }
    });
    
    return graphData.nodes.filter(n => connectedIds.has(n.id));
  }, [selectedNode, graphData]);

  return (
    <main className="relative w-screen h-screen bg-[#000011] overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Background Gradient - Deep space nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-[#000011] to-[#000011] pointer-events-none z-0" />

      {/* Graph Layer */}
      <div className="absolute inset-0 z-0">
        <GraphViz 
          data={graphData} 
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onBackgroundClick={clearSelection}
          highlightNodes={highlightNodes}
          highlightEdges={highlightEdges}
          focusedNodeId={selectedNode?.id}
          enabledEdgeTypes={enabledEdgeTypes}
          pathMode={pathMode}
          cycleMode={cycleMode}
          affectedCompanies={affectedCompaniesMap}
          watchlist={isWatchlistActive && watchlist.size > 0 ? watchlist : undefined}
        />
      </div>

      {/* UI Layer */}
      <SearchBar nodes={graphData.nodes} onSelect={handleSearchSelect} />
      
      <ToolsNavbar 
        nodes={graphData.nodes}
        enabledTypes={enabledEdgeTypes}
        onToggle={handleToggleEdgeType}
        onToggleAll={handleToggleAllEdgeTypes}
        onPathFound={handlePathFound}
        onWatchlistClick={handleWatchlistClick}
        watchlistCount={watchlist.size}
        cycleMode={cycleMode}
        onCycleModeToggle={handleCycleModeToggle}
        onCyclesFound={handleCyclesFound}
        selectedNodeId={selectedNode?.id}
      />
      
      <Chatbot 
        onNewsAnalysis={handleNewsAnalysis}
        nodes={graphData.nodes}
        onSearchSelect={handleSearchSelect}
        onFindPath={handleAIFindPath}
        onFilterToggle={handleToggleEdgeType}
        onShowOnlyFilters={handleShowOnlyFilters}
        onClearFilters={handleClearAllFilters}
      />

      {newsAnalysis && (
        <MarketPulse analysis={newsAnalysis} onClose={handleCloseNewsPopup} />
      )}

      {showWatchlist && (
        <WatchlistPopup
          nodes={graphData.nodes}
          watchlist={watchlist}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          onClearWatchlist={handleClearWatchlist}
          isWatchlistActive={isWatchlistActive}
          onToggleWatchlistActive={handleToggleWatchlistActive}
          onClose={() => setShowWatchlist(false)}
        />
      )}

      {selectedNode && (
        <TradingCard 
          node={selectedNode} 
          onClose={clearSelection}
          connectedNodes={connectedNodes}
          onNodeSelect={handleNodeClick}
        />
      )}

      {selectedEdge && (
        <RelationshipCard 
          edge={selectedEdge.edge} 
          sourceNode={selectedEdge.source}
          targetNode={selectedEdge.target}
          allRelationships={allRelationships}
          onRelationshipChange={(edge, source, target) => {
            setSelectedEdge({ edge, source, target });
          }}
          onClose={() => {
            setSelectedEdge(null);
            setAllRelationships([]);
          }}
        />
      )}
      
      {/* Overlay Title */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none select-none">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 font-light text-4xl tracking-[0.3em] font-mono drop-shadow-[0_0_25px_rgba(139,92,246,0.4)]">
          ORBIT
        </h1>
      </div>
    </main>
  );
}
