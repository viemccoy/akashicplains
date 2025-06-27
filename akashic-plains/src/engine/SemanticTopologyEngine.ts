import Anthropic from '@anthropic-ai/sdk';

export interface SemanticConcept {
  id: string;
  name: string;
  position: { x: number; y: number; z: number }; // z = elevation/abstraction
  definition: string;
  insight: string;
  abstractionLevel: number; // 0-1
  connections: string[]; // IDs of connected concepts
  discovered: boolean;
  discoveredBy?: string;
  visitors: number;
}

export interface SemanticTerrain {
  concepts: Map<string, SemanticConcept>;
  topology: number[][]; // Elevation map
  semanticField: string[][]; // Concept influence at each point
  trails: Map<string, number>; // Path intensity
}

export interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
  currentConcept?: string;
  trail: Array<{ x: number; y: number; time: number }>;
}

export class SemanticTopologyEngine {
  private client: Anthropic;
  private terrain: SemanticTerrain;
  private players: Map<string, Player> = new Map();
  private chunkSize = 32; // Larger chunks for better topology
  
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    
    this.terrain = {
      concepts: new Map(),
      topology: [],
      semanticField: [],
      trails: new Map()
    };
  }
  
  async generateSemanticTopology(
    centerConcept: string,
    radius: number = 16
  ): Promise<SemanticTerrain> {
    console.log(`🌍 Generating semantic topology for "${centerConcept}"`);
    
    try {
      // Generate the semantic landscape
      const landscape = await this.callClaude(centerConcept, radius);
      
      // Process concepts into proper topology
      this.processConceptsIntoTopology(landscape.concepts);
      
      // Generate elevation map based on abstraction levels
      this.generateElevationMap(radius);
      
      // Create semantic influence field
      this.generateSemanticField(radius);
      
      return this.terrain;
    } catch (error) {
      console.error('Failed to generate topology:', error);
      // Return basic topology as fallback
      return this.generateFallbackTopology(centerConcept, radius);
    }
  }
  
  private async callClaude(centerConcept: string, radius: number) {
    const prompt = `You are generating a semantic topology map centered on "${centerConcept}".

Create a rich landscape of interconnected concepts where:
- Abstract concepts have HIGH elevation (0.8-1.0)
- Concrete examples have LOW elevation (0.0-0.3)
- Related concepts cluster at similar elevations
- Each concept MUST have a clear definition and insight

Generate ${radius} concepts that form a meaningful semantic landscape.

Return JSON with this EXACT structure:
{
  "concepts": [
    {
      "name": "consciousness",
      "x": 0,
      "y": 0,
      "abstractionLevel": 0.9,
      "definition": "The state of being aware of and able to think about one's existence, sensations, and thoughts",
      "insight": "Consciousness may be the universe's way of understanding itself",
      "connections": ["self-awareness", "qualia", "neural activity"],
      "category": "philosophy of mind"
    }
  ],
  "landscape": "Description of the overall semantic topology"
}

CRITICAL: Every concept must have:
1. A concise, clear definition (1-2 sentences)
2. A fascinating insight or connection
3. Its abstraction level (0-1)
4. Related concepts it connects to`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    throw new Error('Failed to parse response');
  }
  
  private processConceptsIntoTopology(concepts: any[]) {
    for (const concept of concepts) {
      const id = this.generateConceptId(concept.name);
      
      const semanticConcept: SemanticConcept = {
        id,
        name: concept.name,
        position: {
          x: concept.x || 0,
          y: concept.y || 0,
          z: concept.abstractionLevel || 0.5
        },
        definition: concept.definition || `The essence of ${concept.name}`,
        insight: concept.insight || 'Ancient wisdom awaits discovery',
        abstractionLevel: concept.abstractionLevel || 0.5,
        connections: concept.connections || [],
        discovered: false,
        visitors: 0
      };
      
      this.terrain.concepts.set(id, semanticConcept);
    }
  }
  
  private generateElevationMap(radius: number) {
    const size = radius * 2;
    this.terrain.topology = Array(size).fill(null).map(() => Array(size).fill(0));
    
    // Generate elevation based on concept positions and abstraction levels
    for (const concept of this.terrain.concepts.values()) {
      const cx = concept.position.x + radius;
      const cy = concept.position.y + radius;
      
      // Create gaussian influence around each concept
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
          const influence = Math.exp(-distance * distance / 50) * concept.abstractionLevel;
          this.terrain.topology[y][x] = Math.max(this.terrain.topology[y][x], influence);
        }
      }
    }
  }
  
  private generateSemanticField(radius: number) {
    const size = radius * 2;
    this.terrain.semanticField = Array(size).fill(null).map(() => Array(size).fill(''));
    
    // Mark concept positions
    for (const concept of this.terrain.concepts.values()) {
      const x = concept.position.x + radius;
      const y = concept.position.y + radius;
      
      if (x >= 0 && x < size && y >= 0 && y < size) {
        this.terrain.semanticField[y][x] = concept.id;
      }
    }
  }
  
  private generateFallbackTopology(centerConcept: string, radius: number): SemanticTerrain {
    // Create a basic topology with the center concept
    const centralId = this.generateConceptId(centerConcept);
    
    this.terrain.concepts.set(centralId, {
      id: centralId,
      name: centerConcept,
      position: { x: 0, y: 0, z: 0.7 },
      definition: `The fundamental concept of ${centerConcept}`,
      insight: 'This is where your journey begins',
      abstractionLevel: 0.7,
      connections: [],
      discovered: true,
      visitors: 1
    });
    
    this.generateElevationMap(radius);
    this.generateSemanticField(radius);
    
    return this.terrain;
  }
  
  private generateConceptId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Multiplayer methods
  addPlayer(id: string, name: string, position: { x: number; y: number }): void {
    this.players.set(id, {
      id,
      name,
      position,
      trail: []
    });
  }
  
  movePlayer(playerId: string, newPosition: { x: number; y: number }): void {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Add to trail
    player.trail.push({
      ...player.position,
      time: Date.now()
    });
    
    // Keep trail limited
    if (player.trail.length > 100) {
      player.trail.shift();
    }
    
    // Update position
    player.position = newPosition;
    
    // Mark trail intensity
    const trailKey = `${player.position.x},${player.position.y}`;
    const currentIntensity = this.terrain.trails.get(trailKey) || 0;
    this.terrain.trails.set(trailKey, currentIntensity + 1);
    
    // Check if player discovered a concept
    const conceptId = this.getConceptAtPosition(newPosition);
    if (conceptId) {
      const concept = this.terrain.concepts.get(conceptId);
      if (concept && !concept.discovered) {
        concept.discovered = true;
        concept.discoveredBy = player.name;
      }
      if (concept) {
        concept.visitors++;
      }
      player.currentConcept = conceptId;
    } else {
      player.currentConcept = undefined;
    }
  }
  
  getConceptAtPosition(position: { x: number; y: number }): string | null {
    const radius = 16; // Assuming default radius
    const x = position.x + radius;
    const y = position.y + radius;
    
    if (x >= 0 && x < this.terrain.semanticField.length && 
        y >= 0 && y < this.terrain.semanticField[0]?.length) {
      return this.terrain.semanticField[y][x] || null;
    }
    
    return null;
  }
  
  getElevationAt(x: number, y: number): number {
    const radius = 16;
    const tx = x + radius;
    const ty = y + radius;
    
    if (tx >= 0 && tx < this.terrain.topology.length &&
        ty >= 0 && ty < this.terrain.topology[0]?.length) {
      return this.terrain.topology[ty][tx];
    }
    
    return 0;
  }
  
  getTerrain(): SemanticTerrain {
    return this.terrain;
  }
  
  getPlayers(): Map<string, Player> {
    return this.players;
  }
}