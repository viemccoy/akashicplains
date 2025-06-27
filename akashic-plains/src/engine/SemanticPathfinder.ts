export interface PathNode {
  position: { x: number; y: number };
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent?: PathNode;
}

export class SemanticPathfinder {
  private worldSize: number;
  private terrain: any[][];
  
  constructor(worldSize: number, terrain: any[][]) {
    this.worldSize = worldSize;
    this.terrain = terrain;
  }
  
  findPath(
    start: { x: number; y: number },
    goal: { x: number; y: number },
    preferHighElevation: boolean = false
  ): Array<{ x: number; y: number }> | null {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    
    const startNode: PathNode = {
      position: start,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // Get node with lowest f score
      let current = openSet.reduce((min, node) => 
        node.f < min.f ? node : min, openSet[0]
      );
      
      // Check if we reached the goal
      if (current.position.x === goal.x && current.position.y === goal.y) {
        return this.reconstructPath(current);
      }
      
      // Remove current from open set
      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(`${current.position.x},${current.position.y}`);
      
      // Check neighbors
      const neighbors = this.getNeighbors(current.position);
      
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;
        
        // Calculate costs
        const terrainCost = this.getTerrainCost(neighbor, preferHighElevation);
        const g = current.g + terrainCost;
        
        // Check if neighbor is in open set
        let neighborNode = openSet.find(n => 
          n.position.x === neighbor.x && n.position.y === neighbor.y
        );
        
        if (!neighborNode) {
          // Add new node
          neighborNode = {
            position: neighbor,
            g: g,
            h: this.heuristic(neighbor, goal),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.push(neighborNode);
        } else if (g < neighborNode.g) {
          // Update existing node with better path
          neighborNode.g = g;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }
    
    return null; // No path found
  }
  
  private getNeighbors(pos: { x: number; y: number }): Array<{ x: number; y: number }> {
    const neighbors: Array<{ x: number; y: number }> = [];
    const dirs = [
      { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }
    ];
    
    for (const dir of dirs) {
      const x = pos.x + dir.x;
      const y = pos.y + dir.y;
      
      if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
        neighbors.push({ x, y });
      }
    }
    
    return neighbors;
  }
  
  private getTerrainCost(pos: { x: number; y: number }, preferHighElevation: boolean): number {
    const tile = this.terrain[pos.y][pos.x];
    const elevation = tile.elevation;
    
    // Base cost
    let cost = 1;
    
    // Adjust for elevation preference
    if (preferHighElevation) {
      // Lower cost for higher elevation (abstract paths)
      cost *= (2 - elevation);
    } else {
      // Lower cost for lower elevation (concrete paths)
      cost *= (1 + elevation);
    }
    
    // Well-traveled paths are easier
    if (tile.trailIntensity > 10) cost *= 0.5;
    else if (tile.trailIntensity > 5) cost *= 0.7;
    
    // Discovered areas are slightly preferred
    if (!tile.visited) cost *= 1.2;
    
    return cost;
  }
  
  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    // Manhattan distance with diagonal movement
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
  }
  
  private reconstructPath(node: PathNode): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = [];
    let current: PathNode | undefined = node;
    
    while (current) {
      path.unshift(current.position);
      current = current.parent;
    }
    
    return path;
  }
  
  findSemanticPath(
    concepts: Map<string, any>,
    fromWord: string,
    toWord: string
  ): Array<{ x: number; y: number }> | null {
    // Find positions of concepts
    let fromPos: { x: number; y: number } | null = null;
    let toPos: { x: number; y: number } | null = null;
    
    for (const concept of concepts.values()) {
      if (concept.word === fromWord) fromPos = concept.position;
      if (concept.word === toWord) toPos = concept.position;
    }
    
    if (!fromPos || !toPos) return null;
    
    // Prefer abstract paths if going between abstract concepts
    const fromConcept = Array.from(concepts.values()).find(c => c.word === fromWord);
    const toConcept = Array.from(concepts.values()).find(c => c.word === toWord);
    const preferHigh = fromConcept && toConcept && 
      (fromConcept.elevation + toConcept.elevation) / 2 > 0.5;
    
    return this.findPath(fromPos, toPos, preferHigh);
  }
}