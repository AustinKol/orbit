import { loadGraph } from './graphService';
import { PathResult, CycleResult, CycleResultWithEdges, CyclesResponse, GraphEdge, PathItem } from '../types';
import { scorePath } from './pathScoringService';

/**
 * Finds ALL simple paths between two nodes up to maxDepth using DFS
 * Returns up to maxPaths paths, ensuring shortest path is included
 */
export const findAllPaths = (
  fromId: string, 
  toId: string, 
  maxDepth: number = 4,
  maxPaths: number = 15
): PathItem[] => {
  try {
    const graph = loadGraph();
    const adj = new Map<string, GraphEdge[]>();
    
    // Build adjacency list with edge details (undirected)
    graph.links.forEach(link => {
      // Handle both string and object sources/targets
      const sourceId = typeof link.source === 'string' ? link.source : (link.source?.id || String(link.source));
      const targetId = typeof link.target === 'string' ? link.target : (link.target?.id || String(link.target));
      
      if (!sourceId || !targetId) {
        console.warn('Skipping edge with invalid source or target:', link);
        return;
      }
      
      if (!adj.has(sourceId)) adj.set(sourceId, []);
      adj.get(sourceId)!.push(link);
      
      // Add reverse edge for undirected traversal
      if (!adj.has(targetId)) adj.set(targetId, []);
      adj.get(targetId)!.push({ ...link, source: targetId, target: sourceId });
    });

    const results: PathResult[] = [];
    let shortestPathLength: number | null = null;

    // DFS to find all simple paths
  const dfs = (
    currentId: string,
    pathNodes: string[],
    pathEdges: GraphEdge[],
    visitedInPath: Set<string>
  ) => {
    // Depth limit
    if (pathNodes.length > maxDepth + 1) return;

    // Found target
    if (currentId === toId && pathNodes.length > 1) {
      const length = pathNodes.length - 1;
      results.push({ nodes: [...pathNodes], edges: [...pathEdges], length });
      
      // Track shortest path length
      if (shortestPathLength === null || length < shortestPathLength) {
        shortestPathLength = length;
      }
      
      // Continue exploring - we'll limit results later after sorting
      return;
    }

    // Explore neighbors
    const neighbors = adj.get(currentId) || [];
    for (const link of neighbors) {
      const neighborId = typeof link.target === 'string' ? link.target : (link.target?.id || String(link.target));
      
      if (!neighborId) continue;
      
      // Simple path: don't revisit nodes in current path
      if (!visitedInPath.has(neighborId)) {
        visitedInPath.add(neighborId);
        pathNodes.push(neighborId);
        pathEdges.push(link);
        
        dfs(neighborId, pathNodes, pathEdges, visitedInPath);
        
        // Backtrack
        pathNodes.pop();
        pathEdges.pop();
        visitedInPath.delete(neighborId);
      }
    }
  };

    // Start DFS
    const initialVisited = new Set<string>([fromId]);
    dfs(fromId, [fromId], [], initialVisited);

    // Deduplicate paths by edge sequence
    const uniquePaths = new Map<string, PathResult>();
    for (const path of results) {
      const edgeKey = path.edges.map(e => {
        const src = typeof e.source === 'string' ? e.source : (e.source?.id || String(e.source));
        const tgt = typeof e.target === 'string' ? e.target : (e.target?.id || String(e.target));
        return `${src}-${tgt}-${e.type}`;
      }).join('|');
      
      if (!uniquePaths.has(edgeKey)) {
        uniquePaths.set(edgeKey, path);
      }
    }

    const deduplicatedPaths = Array.from(uniquePaths.values());

    // Calculate Exposure Index and convert to PathItem
    const scoredPaths: PathItem[] = deduplicatedPaths.map((path, idx) => {
      const { exposureIndex, breakdown, summary } = scorePath(path.edges, path.length);
      return {
        ...path,
        pathId: `path-${idx}`,
        exposureIndex,
        exposureBreakdown: breakdown,
        summary,
      };
    });

    // Sort: first by length (ascending), then by Exposure Index (descending)
    scoredPaths.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return b.exposureIndex - a.exposureIndex;
    });

    // Smart filtering: Group by length, keep top N per length to show variety
    // This ensures we show paths of different lengths while not overwhelming with too many similar paths
    const pathsByLength = new Map<number, PathItem[]>();
    for (const path of scoredPaths) {
      if (!pathsByLength.has(path.length)) {
        pathsByLength.set(path.length, []);
      }
      pathsByLength.get(path.length)!.push(path);
    }

    const finalPaths: PathItem[] = [];
    const maxPathsPerLength = 2; // Keep top 2 most meaningful paths per hop count
    const maxTotalPaths = maxPaths;

    // Always include shortest path first
    if (shortestPathLength !== null) {
      const shortestPaths = pathsByLength.get(shortestPathLength) || [];
      if (shortestPaths.length > 0) {
        finalPaths.push(shortestPaths[0]); // Always include the top shortest path
      }
    }

    // Add paths from each length group, prioritizing variety
    const sortedLengths = Array.from(pathsByLength.keys()).sort((a, b) => a - b);
    
    for (const length of sortedLengths) {
      if (finalPaths.length >= maxTotalPaths) break;
      
      const pathsAtLength = pathsByLength.get(length) || [];
      const pathsToAdd = pathsAtLength.slice(0, maxPathsPerLength);
      
      for (const path of pathsToAdd) {
        if (finalPaths.length >= maxTotalPaths) break;
        // Skip if already added (shortest path)
        if (finalPaths.find(p => p.pathId === path.pathId)) continue;
        finalPaths.push(path);
      }
    }

    // Re-sort final paths: length first, then Exposure Index
    finalPaths.sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return b.exposureIndex - a.exposureIndex;
    });

    return finalPaths;
  } catch (error) {
    console.error('Error in findAllPaths:', error);
    return [];
  }
};

/**
 * Legacy function for backward compatibility - finds paths using BFS (shorter paths first)
 */
export const findPaths = (fromId: string, toId: string, maxDepth: number = 5): PathResult[] => {
  const graph = loadGraph();
  const adj = new Map<string, GraphEdge[]>();
  
  // Build adjacency list with edge details
  graph.links.forEach(link => {
    if (!adj.has(link.source as string)) adj.set(link.source as string, []);
    adj.get(link.source as string)!.push(link);
    
    // For pathfinding, treat as undirected for now (can be refined)
    if (!adj.has(link.target as string)) adj.set(link.target as string, []);
    adj.get(link.target as string)!.push({ ...link, source: link.target, target: link.source }); // Reverse edge for undirected traversal
  });

  const queue: { id: string; pathNodes: string[]; pathEdges: GraphEdge[] }[] = [{ id: fromId, pathNodes: [fromId], pathEdges: [] }];
  const results: PathResult[] = [];
  const visited = new Set<string>(); 

  while (queue.length > 0) {
    const { id, pathNodes, pathEdges } = queue.shift()!;
    
    if (pathNodes.length > maxDepth + 1) continue;

    if (id === toId) {
      results.push({ nodes: pathNodes, edges: pathEdges, length: pathNodes.length - 1 });
      if (results.length >= 10) break; // Cap results
      continue;
    }

    // Simple path: do not revisit nodes within the current path
    // For non-simple paths, this logic would change
    if (visited.has(id) && pathNodes.length > 1) continue; 
    visited.add(id);

    const neighbors = adj.get(id) || [];
    for (const link of neighbors) {
      const neighborId = link.target as string;
      if (!pathNodes.includes(neighborId)) {
        queue.push({ 
          id: neighborId, 
          pathNodes: [...pathNodes, neighborId], 
          pathEdges: [...pathEdges, link] 
        });
      }
    }
  }
  
  return results.sort((a, b) => a.length - b.length);
};

/**
 * Finds the shortest path between two nodes using BFS
 * Returns null if no path exists
 */
export const findShortestPath = (fromId: string, toId: string, maxDepth: number = 10): PathResult | null => {
  const graph = loadGraph();
  const adj = new Map<string, GraphEdge[]>();
  
  // Build adjacency list with edge details (undirected)
  graph.links.forEach(link => {
    const sourceId = link.source as string;
    const targetId = link.target as string;
    
    if (!adj.has(sourceId)) adj.set(sourceId, []);
    adj.get(sourceId)!.push(link);
    
    // Add reverse edge for undirected traversal
    if (!adj.has(targetId)) adj.set(targetId, []);
    adj.get(targetId)!.push({ ...link, source: targetId, target: sourceId });
  });

  // BFS to find shortest path
  const queue: { id: string; pathNodes: string[]; pathEdges: GraphEdge[] }[] = [{ id: fromId, pathNodes: [fromId], pathEdges: [] }];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const { id, pathNodes, pathEdges } = queue.shift()!;
    
    if (pathNodes.length > maxDepth + 1) continue;

    if (id === toId) {
      return { nodes: pathNodes, edges: pathEdges, length: pathNodes.length - 1 };
    }

    const neighbors = adj.get(id) || [];
    for (const link of neighbors) {
      const neighborId = link.target as string;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ 
          id: neighborId, 
          pathNodes: [...pathNodes, neighborId], 
          pathEdges: [...pathEdges, link] 
        });
      }
    }
  }
  
  return null; // No path found
};

export const findCycles = (nodeId: string, maxDepth: number = 6): CycleResult[] => {
  const graph = loadGraph();
  const cycles: CycleResult[] = [];
  const adj = new Map<string, GraphEdge[]>();

  // Build adjacency list for directed edges
  graph.links.forEach(link => {
    if (!adj.has(link.source as string)) adj.set(link.source as string, []);
    adj.get(link.source as string)!.push(link);
  });

  const dfs = (u: string, path: string[], visitedEdges: Set<string>) => {
    path.push(u);

    if (path.length > maxDepth + 1) {
      path.pop();
      return;
    }

    const neighbors = adj.get(u) || [];
    for (const link of neighbors) {
      const v = link.target as string;
      // const edgeKey = `${link.source}-${link.target}`; // Unused

      if (v === nodeId && path.length > 2) { // Found a cycle back to the start node
        const cyclePath = [...path, v];
        // Deduplicate cycles (e.g., by sorting node IDs in path)
        const canonicalPath = [...cyclePath].sort().join('-');
        if (!visitedEdges.has(canonicalPath)) {
          cycles.push({ path: cyclePath, length: cyclePath.length - 1 });
          visitedEdges.add(canonicalPath);
        }
        if (cycles.length >= 50) return; // Cap results
      } else if (!path.includes(v)) { // Avoid immediate back-tracking
        dfs(v, path, visitedEdges);
        if (cycles.length >= 50) return;
      }
    }
    path.pop();
  };

  dfs(nodeId, [], new Set<string>());
  
  return cycles;
};

/**
 * Finds all directed cycles containing a specific node with detailed edge information
 * Uses DFS with bounded depth and deduplication via canonical representation
 * Returns up to maxCycles cycles to prevent UI freezing
 */
export const findCyclesWithEdges = (
  nodeId: string, 
  maxDepth: number = 8,
  maxCycles: number = 50
): CyclesResponse => {
  const graph = loadGraph();
  const cycles: CycleResultWithEdges[] = [];
  const seenCanonical = new Set<string>();
  
  // Build adjacency list for DIRECTED edges only
  const adj = new Map<string, GraphEdge[]>();
  graph.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source?.id || String(link.source));
    if (!adj.has(sourceId)) adj.set(sourceId, []);
    adj.get(sourceId)!.push(link);
  });

  let totalFound = 0;
  let capped = false;

  /**
   * DFS to find cycles starting and ending at nodeId
   * pathNodes: current path of node IDs
   * pathEdges: edges used to reach current position
   * visited: set of nodes in current path (for simple path enforcement)
   */
  const dfs = (
    current: string,
    pathNodes: string[],
    pathEdges: GraphEdge[],
    visited: Set<string>
  ) => {
    // Check if we've hit the cap
    if (cycles.length >= maxCycles) {
      capped = true;
      return;
    }

    // Depth limit check (pathNodes.length - 1 = number of hops so far)
    if (pathNodes.length > maxDepth) {
      return;
    }

    const neighbors = adj.get(current) || [];
    
    for (const edge of neighbors) {
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target?.id || String(edge.target));
      
      // Found a cycle back to the starting node
      if (targetId === nodeId && pathNodes.length >= 2) {
        totalFound++;
        
        // Create canonical representation for deduplication
        // Use sorted edge keys to identify unique cycles regardless of starting point
        const cycleEdgeKeys = [...pathEdges, edge].map(e => {
          const src = typeof e.source === 'string' ? e.source : (e.source?.id || String(e.source));
          const tgt = typeof e.target === 'string' ? e.target : (e.target?.id || String(e.target));
          return `${src}->${tgt}-${e.type}`;
        }).sort().join('|');
        
        if (!seenCanonical.has(cycleEdgeKeys)) {
          seenCanonical.add(cycleEdgeKeys);
          
          const completePath = [...pathNodes, nodeId];
          const completeEdges = [...pathEdges, edge];
          
          cycles.push({
            cycleId: `cycle-${cycles.length}`,
            path: completePath,
            edges: completeEdges,
            length: completeEdges.length
          });
        }
        
        if (cycles.length >= maxCycles) {
          capped = true;
          return;
        }
        
        // Don't continue exploring from this edge (it completes a cycle)
        continue;
      }
      
      // Only visit unvisited nodes (simple path)
      if (!visited.has(targetId)) {
        visited.add(targetId);
        pathNodes.push(targetId);
        pathEdges.push(edge);
        
        dfs(targetId, pathNodes, pathEdges, visited);
        
        // Backtrack
        pathEdges.pop();
        pathNodes.pop();
        visited.delete(targetId);
        
        if (capped) return;
      }
    }
  };

  // Start DFS from the node
  const initialVisited = new Set<string>([nodeId]);
  dfs(nodeId, [nodeId], [], initialVisited);

  // Sort cycles by length (shorter cycles first)
  cycles.sort((a, b) => a.length - b.length);

  return {
    nodeId,
    cycles,
    totalFound,
    capped
  };
};
