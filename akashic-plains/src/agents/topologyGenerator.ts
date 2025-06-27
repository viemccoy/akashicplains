import type { Position } from '../types';

export interface ElevationPoint {
  height: number;
  nearestSemanticDistance: number;
  dominantConcept?: string;
}

export interface ConceptInfluence {
  name: string;
  position: Position;
  elevation: number;
  semanticDistance: number;
}

export class TopologyGenerator {
  // ASCII shading characters from lowest to highest elevation
  private readonly ELEVATION_CHARS = [
    '·', // Deepest valley
    '░', // Valley
    '▒', // Plains
    '▓', // Hills
    '█', // Mountains
    '▀', // Peaks
  ];
  
  // Directional slope characters
  private readonly SLOPE_CHARS = {
    eastWest: ['╱', '╲'],
    northSouth: ['═', '─'],
    steep: ['/', '\\'],
  };
  
  // Semantic proximity indicators
  private readonly PROXIMITY_CHARS = {
    direct: '◉',
    veryClose: '●',
    close: '◐',
    medium: '◑',
    far: '○',
  };
  
  generateElevationMap(
    concepts: ConceptInfluence[],
    chunkX: number,
    chunkY: number,
    chunkSize: number = 16
  ): ElevationPoint[][] {
    const elevationMap: ElevationPoint[][] = Array(chunkSize)
      .fill(null)
      .map(() => Array(chunkSize).fill(null).map(() => ({
        height: 0,
        nearestSemanticDistance: 1.0
      })));
    
    // Calculate elevation for each tile based on concept influence
    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const worldX = chunkX * chunkSize + x;
        const worldY = chunkY * chunkSize + y;
        
        let totalInfluence = 0;
        let nearestDistance = 1.0;
        let dominantConcept: string | undefined;
        let maxInfluence = 0;
        
        // Calculate cumulative influence from all concepts
        for (const concept of concepts) {
          const distance = this.calculateDistance(worldX, worldY, concept.position.x, concept.position.y);
          const semanticFactor = concept.semanticDistance || 0.5;
          
          // Gaussian falloff for smooth elevation transitions
          const spatialInfluence = Math.exp(-distance * 0.08);
          const semanticInfluence = Math.exp(-semanticFactor * 2);
          const influence = spatialInfluence * semanticInfluence * concept.elevation;
          
          totalInfluence += influence;
          
          // Track nearest concept
          const effectiveDistance = distance * semanticFactor;
          if (effectiveDistance < nearestDistance) {
            nearestDistance = effectiveDistance;
          }
          
          // Track dominant concept for this tile
          if (influence > maxInfluence) {
            maxInfluence = influence;
            dominantConcept = concept.name;
          }
        }
        
        elevationMap[y][x] = {
          height: Math.min(1.0, totalInfluence),
          nearestSemanticDistance: nearestDistance,
          dominantConcept
        };
      }
    }
    
    // Smooth the elevation map
    return this.smoothElevation(elevationMap);
  }
  
  elevationToASCII(
    elevation: ElevationPoint,
    x: number,
    y: number,
    elevationMap: ElevationPoint[][]
  ): string {
    const height = elevation.height;
    const semanticDist = elevation.nearestSemanticDistance;
    
    // Override for very close semantic proximity
    if (semanticDist < 0.05) return this.PROXIMITY_CHARS.direct;
    if (semanticDist < 0.1) return this.PROXIMITY_CHARS.veryClose;
    if (semanticDist < 0.15) return this.PROXIMITY_CHARS.close;
    
    // Calculate slope for directional shading
    const slope = this.calculateSlope(x, y, elevationMap);
    
    if (slope.magnitude > 0.3) {
      // Steep slope - use directional characters
      if (Math.abs(slope.x) > Math.abs(slope.y)) {
        return slope.x > 0 ? '╱' : '╲';
      } else {
        return slope.y > 0 ? '═' : '─';
      }
    }
    
    // Use elevation-based shading
    const charIndex = Math.floor(height * (this.ELEVATION_CHARS.length - 1));
    return this.ELEVATION_CHARS[Math.max(0, Math.min(charIndex, this.ELEVATION_CHARS.length - 1))];
  }
  
  placeConceptLabels(
    terrain: string[],
    concepts: ConceptInfluence[],
    chunkX: number,
    chunkY: number,
    chunkSize: number = 16
  ): string[] {
    const LABEL_SPACING = 3;
    const placedLabels: Position[] = [];
    
    // Sort concepts by elevation (importance)
    const sortedConcepts = [...concepts].sort((a, b) => b.elevation - a.elevation);
    
    for (const concept of sortedConcepts) {
      const localX = concept.position.x - (chunkX * chunkSize);
      const localY = concept.position.y - (chunkY * chunkSize);
      
      // Skip if outside chunk
      if (localX < 0 || localX >= chunkSize || localY < 0 || localY >= chunkSize) {
        continue;
      }
      
      // Check spacing from other labels
      const tooClose = placedLabels.some(label =>
        Math.abs(label.x - localX) < LABEL_SPACING ||
        Math.abs(label.y - localY) < LABEL_SPACING
      );
      
      if (!tooClose && terrain[localY]) {
        // Place concept name (truncated to fit)
        const name = concept.name.substring(0, 8).toUpperCase();
        const startX = Math.max(0, localX - Math.floor(name.length / 2));
        
        let newRow = terrain[localY];
        for (let i = 0; i < name.length && startX + i < chunkSize; i++) {
          // Don't overwrite player position
          if (newRow[startX + i] !== '@') {
            newRow = newRow.substring(0, startX + i) + name[i] + newRow.substring(startX + i + 1);
          }
        }
        terrain[localY] = newRow;
        
        placedLabels.push({ x: localX, y: localY });
      }
    }
    
    return terrain;
  }
  
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private calculateSlope(x: number, y: number, elevationMap: ElevationPoint[][]): { x: number, y: number, magnitude: number } {
    const height = elevationMap[y]?.[x]?.height || 0;
    
    // Get neighboring heights
    const north = elevationMap[y - 1]?.[x]?.height || height;
    const south = elevationMap[y + 1]?.[x]?.height || height;
    const east = elevationMap[y]?.[x + 1]?.height || height;
    const west = elevationMap[y]?.[x - 1]?.height || height;
    
    const slopeX = east - west;
    const slopeY = south - north;
    const magnitude = Math.sqrt(slopeX * slopeX + slopeY * slopeY);
    
    return { x: slopeX, y: slopeY, magnitude };
  }
  
  private smoothElevation(elevationMap: ElevationPoint[][]): ElevationPoint[][] {
    const smoothed = elevationMap.map(row => row.map(point => ({ ...point })));
    const size = elevationMap.length;
    
    // Apply gaussian blur for smoother transitions
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        let totalHeight = 0;
        let count = 0;
        
        // 3x3 kernel
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const weight = (dx === 0 && dy === 0) ? 4 : 1;
            totalHeight += elevationMap[y + dy][x + dx].height * weight;
            count += weight;
          }
        }
        
        smoothed[y][x].height = totalHeight / count;
      }
    }
    
    return smoothed;
  }
}