import Anthropic from '@anthropic-ai/sdk';

export interface Concept {
  id: string;
  word: string;
  definition: string;
  insight: string;
  position: { x: number; y: number };
  elevation: number; // 0-1, pre-calculated based on abstractness
  discovered: boolean;
  bookmarked: boolean;
  visitors: Set<string>;
  relatedWords: string[];
}

export interface Synthesis {
  id: string;
  name: string;
  sourceWords: string[];
  definition: string;
  position: { x: number; y: number };
  createdBy: string;
  createdAt: number;
  collectedBy: Set<string>;
}

export interface TerrainTile {
  elevation: number;
  conceptId?: string;
  synthesisId?: string;
  visited: boolean;
  trailIntensity: number;
  char?: string; // Override character
}

export class EnhancedSemanticEngine {
  private client: Anthropic;
  private concepts: Map<string, Concept> = new Map();
  private syntheses: Map<string, Synthesis> = new Map();
  private terrain: TerrainTile[][] = [];
  private worldSize = 64;
  private viewRadius = 15;
  private discovered: Set<string> = new Set();
  
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    
    // Initialize terrain with base elevation
    this.initializeTerrain();
  }
  
  private initializeTerrain() {
    // Create terrain with interesting topology
    for (let y = 0; y < this.worldSize; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < this.worldSize; x++) {
        // Create elevation using multiple sine waves for interesting topology
        const centerX = this.worldSize / 2;
        const centerY = this.worldSize / 2;
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Base elevation - higher in center, lower at edges
        let elevation = Math.max(0, 1 - (distFromCenter / (this.worldSize / 2)));
        
        // Add some interesting features
        elevation += Math.sin(x * 0.1) * 0.2 + Math.sin(y * 0.15) * 0.15;
        elevation += Math.cos(x * 0.05 + y * 0.05) * 0.1;
        
        // Clamp between 0 and 1
        elevation = Math.max(0, Math.min(1, elevation));
        
        this.terrain[y][x] = {
          elevation,
          visited: false,
          trailIntensity: 0
        };
      }
    }
  }
  
  async initializeWithSeed(seedWord: string) {
    console.log(`🌱 Initializing semantic space with seed: ${seedWord}`);
    
    // Place seed concept at center
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);
    
    // Get initial concepts around the seed
    const initialConcepts = await this.generateConceptCluster(seedWord, centerX, centerY, 8);
    
    // Place concepts on terrain
    for (const concept of initialConcepts) {
      this.placeConcept(concept);
    }
    
    return this.concepts;
  }
  
  async exploreTile(x: number, y: number, playerId: string): Promise<Concept | null> {
    if (x < 0 || x >= this.worldSize || y < 0 || y >= this.worldSize) return null;
    
    const tile = this.terrain[y][x];
    tile.visited = true;
    tile.trailIntensity++;
    
    // Check if there's already a concept here
    if (tile.conceptId) {
      const concept = this.concepts.get(tile.conceptId);
      if (concept) {
        concept.discovered = true;
        concept.visitors.add(playerId);
        this.discovered.add(tile.conceptId);
        return concept;
      }
    }
    
    // Generate new concepts in unexplored areas
    if (!tile.conceptId && Math.random() < 0.3) { // 30% chance of finding a concept
      const nearestConcept = this.findNearestConcept(x, y);
      if (nearestConcept && this.distance(x, y, nearestConcept.position.x, nearestConcept.position.y) < 10) {
        const newConcepts = await this.generateConceptCluster(nearestConcept.word, x, y, 3);
        for (const concept of newConcepts) {
          this.placeConcept(concept);
        }
        return newConcepts[0]; // Return the concept at this position
      }
    }
    
    return null;
  }
  
  private async generateConceptCluster(
    baseWord: string,
    centerX: number,
    centerY: number,
    count: number
  ): Promise<Concept[]> {
    console.log(`🔮 Generating concepts related to "${baseWord}"`);
    
    try {
      const prompt = `Generate ${count} words semantically related to "${baseWord}".
For each word, provide:
1. The word itself
2. A concise definition (1 sentence)
3. An interesting connection or insight about how it relates to "${baseWord}"
4. Its abstraction level (0-1, where 1 is highly abstract)
5. 3-5 related words for future exploration

Return JSON array:
[{
  "word": "consciousness",
  "definition": "The state of being aware of one's existence and surroundings",
  "insight": "Consciousness emerges from complex neural patterns like thoughts emerge from neurons",
  "abstraction": 0.9,
  "related": ["awareness", "qualia", "sentience", "cognition", "mind"]
}]

Make the words progressively more specific/concrete as they get further from the base word.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 2048,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const words = JSON.parse(jsonMatch[0]);
          
          // Convert to Concept objects and place them around the center
          return words.map((w: any, i: number) => {
            const angle = (i / count) * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            const x = Math.round(centerX + Math.cos(angle) * radius);
            const y = Math.round(centerY + Math.sin(angle) * radius);
            
            const concept: Concept = {
              id: this.generateId(w.word),
              word: w.word,
              definition: w.definition,
              insight: w.insight,
              position: { x, y },
              elevation: w.abstraction || 0.5,
              discovered: false,
              bookmarked: false,
              visitors: new Set(),
              relatedWords: w.related || []
            };
            
            return concept;
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate concepts:', error);
    }
    
    // Fallback
    return [{
      id: this.generateId(baseWord),
      word: baseWord,
      definition: `The essence of ${baseWord}`,
      insight: 'Ancient wisdom awaits discovery',
      position: { x: centerX, y: centerY },
      elevation: 0.5,
      discovered: false,
      bookmarked: false,
      visitors: new Set(),
      relatedWords: []
    }];
  }
  
  private placeConcept(concept: Concept) {
    const { x, y } = concept.position;
    if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
      this.terrain[y][x].conceptId = concept.id;
      this.concepts.set(concept.id, concept);
    }
  }
  
  async createSynthesis(
    bookmarkedWords: string[],
    playerId: string,
    playerPos: { x: number; y: number }
  ): Promise<Synthesis | null> {
    if (bookmarkedWords.length < 2) return null;
    
    console.log(`✨ Creating synthesis from: ${bookmarkedWords.join(', ')}`);
    
    try {
      const prompt = `You are synthesizing ${bookmarkedWords.length} concepts into a new crystallized wisdom.
Concepts to fuse: ${bookmarkedWords.join(', ')}

Create a synthesis that:
1. Combines these concepts in an unexpected, insightful way
2. Reveals hidden connections between them
3. Generates a new compound concept name (like "Quantum-Consciousness" or "Entropy-Garden")

Return JSON:
{
  "name": "Emergent-Complexity",
  "definition": "The spontaneous arising of intricate patterns from simple interactions, revealing how ${bookmarkedWords[0]} and ${bookmarkedWords[1]} dance together",
  "insight": "When ${bookmarkedWords[0]} meets ${bookmarkedWords[1]}, new forms of order arise that neither could create alone"
}`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 1024,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Find a good position for the synthesis (between bookmarked concepts)
          let avgX = 0, avgY = 0;
          let validPositions = 0;
          
          for (const word of bookmarkedWords) {
            const concept = Array.from(this.concepts.values()).find(c => c.word === word);
            if (concept) {
              avgX += concept.position.x;
              avgY += concept.position.y;
              validPositions++;
            }
          }
          
          if (validPositions > 0) {
            avgX = Math.round(avgX / validPositions);
            avgY = Math.round(avgY / validPositions);
          } else {
            avgX = playerPos.x;
            avgY = playerPos.y;
          }
          
          // Add some randomness so syntheses don't stack
          avgX += Math.floor(Math.random() * 5 - 2);
          avgY += Math.floor(Math.random() * 5 - 2);
          
          const synthesis: Synthesis = {
            id: `synth-${Date.now()}`,
            name: result.name,
            sourceWords: bookmarkedWords,
            definition: result.definition || result.insight,
            position: { x: avgX, y: avgY },
            createdBy: playerId,
            createdAt: Date.now(),
            collectedBy: new Set([playerId])
          };
          
          // Place on terrain
          if (avgX >= 0 && avgX < this.worldSize && avgY >= 0 && avgY < this.worldSize) {
            this.terrain[avgY][avgX].synthesisId = synthesis.id;
            this.syntheses.set(synthesis.id, synthesis);
          }
          
          return synthesis;
        }
      }
    } catch (error) {
      console.error('Failed to create synthesis:', error);
    }
    
    return null;
  }
  
  bookmarkConcept(conceptId: string): boolean {
    const concept = this.concepts.get(conceptId);
    if (concept) {
      concept.bookmarked = !concept.bookmarked;
      return concept.bookmarked;
    }
    return false;
  }
  
  getBookmarkedConcepts(): Concept[] {
    return Array.from(this.concepts.values()).filter(c => c.bookmarked);
  }
  
  getTerrainView(centerX: number, centerY: number): {
    tiles: TerrainTile[][],
    concepts: Concept[],
    syntheses: Synthesis[]
  } {
    const tiles: TerrainTile[][] = [];
    const visibleConcepts: Concept[] = [];
    const visibleSyntheses: Synthesis[] = [];
    
    for (let dy = -this.viewRadius; dy <= this.viewRadius; dy++) {
      const row: TerrainTile[] = [];
      for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
          const tile = { ...this.terrain[y][x] };
          
          // Apply fog of war
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > this.viewRadius * 0.8 && !tile.visited) {
            tile.elevation = tile.elevation * 0.3; // Darken unexplored areas
          }
          
          row.push(tile);
          
          // Collect visible concepts
          if (tile.conceptId) {
            const concept = this.concepts.get(tile.conceptId);
            if (concept) visibleConcepts.push(concept);
          }
          
          if (tile.synthesisId) {
            const synthesis = this.syntheses.get(tile.synthesisId);
            if (synthesis) visibleSyntheses.push(synthesis);
          }
        } else {
          // Out of bounds
          row.push({
            elevation: 0,
            visited: false,
            trailIntensity: 0
          });
        }
      }
      tiles.push(row);
    }
    
    return { tiles, concepts: visibleConcepts, syntheses: visibleSyntheses };
  }
  
  private findNearestConcept(x: number, y: number): Concept | null {
    let nearest: Concept | null = null;
    let minDist = Infinity;
    
    for (const concept of this.concepts.values()) {
      const dist = this.distance(x, y, concept.position.x, concept.position.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = concept;
      }
    }
    
    return nearest;
  }
  
  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  private generateId(word: string): string {
    return word.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 5);
  }
}