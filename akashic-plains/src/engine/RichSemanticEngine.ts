import { WordGenerator, type WordConcept } from './WordGenerator';

export interface Concept {
  id: string;
  word: string;
  definition: string;
  insight: string;
  etymology?: string;
  symbolism?: string;
  position: { x: number; y: number };
  elevation: number;
  discovered: boolean;
  bookmarked: boolean;
  visitors: Set<string>;
  relatedWords: string[];
  glowIntensity: number; // For undiscovered concepts
}

export interface GlobalSynthesis {
  id: string;
  name: string;
  sourceWords: string[];
  definition: string;
  revelation: string;
  symbol: string;
  position: { x: number; y: number };
  createdBy: string;
  createdAt: number;
  discoveredBy: Set<string>;
  coordinates: string; // For sharing/finding
}

export interface TerrainTile {
  elevation: number;
  conceptId?: string;
  synthesisId?: string;
  visited: boolean;
  trailIntensity: number;
  mystery: boolean; // Indicates something hidden here
}

export class RichSemanticEngine {
  private wordGen: WordGenerator;
  private concepts: Map<string, Concept> = new Map();
  private syntheses: Map<string, GlobalSynthesis> = new Map();
  private globalSyntheses: GlobalSynthesis[] = []; // Simulated global database
  private terrain: TerrainTile[][] = [];
  private worldSize = 256; // Much larger world
  private viewRadius = 20; // Larger view
  private discovered: Set<string> = new Set();
  
  constructor(apiKey: string) {
    this.wordGen = new WordGenerator(apiKey);
    this.initializeTerrain();
    this.loadGlobalSyntheses();
  }
  
  private initializeTerrain() {
    // Create varied terrain with multiple biomes
    for (let y = 0; y < this.worldSize; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < this.worldSize; x++) {
        // Create interesting topology with multiple peaks and valleys
        const centerX = this.worldSize / 2;
        const centerY = this.worldSize / 2;
        
        // Multiple elevation influences
        let elevation = 0;
        
        // Main mountain range
        const mainDist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        elevation += Math.max(0, 1 - (mainDist / (this.worldSize / 3)));
        
        // Secondary peaks
        for (let i = 0; i < 5; i++) {
          const peakX = centerX + Math.cos(i * Math.PI * 2 / 5) * 80;
          const peakY = centerY + Math.sin(i * Math.PI * 2 / 5) * 80;
          const peakDist = Math.sqrt(Math.pow(x - peakX, 2) + Math.pow(y - peakY, 2));
          elevation += Math.max(0, 0.7 - (peakDist / 50));
        }
        
        // Add noise for variety
        elevation += Math.sin(x * 0.05) * 0.1 + Math.cos(y * 0.07) * 0.1;
        elevation += Math.sin(x * 0.02 + y * 0.02) * 0.15;
        
        // Clamp and normalize
        elevation = Math.max(0, Math.min(1, elevation / 2));
        
        // Some tiles have mystery (higher chance in certain elevations)
        const mystery = Math.random() < 0.15 && elevation > 0.3 && elevation < 0.8;
        
        this.terrain[y][x] = {
          elevation,
          visited: false,
          trailIntensity: 0,
          mystery
        };
      }
    }
  }
  
  private loadGlobalSyntheses() {
    // In a real implementation, this would load from a database
    // For now, pre-populate with some interesting syntheses
    const exampleSyntheses: GlobalSynthesis[] = [
      {
        id: 'global-1',
        name: 'Quantum-Consciousness',
        sourceWords: ['quantum', 'consciousness'],
        definition: 'The probabilistic nature of awareness, where observation collapses potential thoughts into experience',
        revelation: 'Consciousness operates like quantum mechanics - undefined until observed, entangled with all possibilities',
        symbol: 'A wavering eye surrounded by probability clouds',
        position: { x: 140, y: 120 },
        createdBy: 'Ancient Explorer',
        createdAt: Date.now() - 1000000,
        discoveredBy: new Set(['Ancient Explorer']),
        coordinates: 'QC-140-120'
      },
      {
        id: 'global-2',
        name: 'Entropy-Garden',
        sourceWords: ['entropy', 'garden'],
        definition: 'A space where disorder creates beauty, where chaos seeds new forms of order',
        revelation: 'In the garden of entropy, decay becomes the soil for new growth',
        symbol: 'Flowers blooming from scattered seeds in swirling patterns',
        position: { x: 90, y: 170 },
        createdBy: 'Wandering Sage',
        createdAt: Date.now() - 500000,
        discoveredBy: new Set(['Wandering Sage']),
        coordinates: 'EG-90-170'
      }
    ];
    
    exampleSyntheses.forEach(synth => {
      this.globalSyntheses.push(synth);
      this.syntheses.set(synth.id, synth);
      // Place on terrain
      if (synth.position.x < this.worldSize && synth.position.y < this.worldSize) {
        this.terrain[synth.position.y][synth.position.x].synthesisId = synth.id;
      }
    });
  }
  
  async initializeWithSeed(seedWord: string) {
    console.log(`🌱 Initializing vast semantic space with seed: ${seedWord}`);
    
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);
    
    // Generate initial word cluster
    const initialWords = await this.wordGen.generateWordCluster(seedWord, 12, 'mixed');
    
    // Place words in interesting patterns
    const goldenRatio = 1.618;
    let angle = 0;
    let radius = 5;
    
    for (let i = 0; i < initialWords.length; i++) {
      const wordConcept = initialWords[i];
      
      // Spiral placement
      angle += Math.PI * 2 / goldenRatio;
      radius += 2;
      
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * radius);
      
      const concept: Concept = {
        id: this.generateId(wordConcept.word),
        word: wordConcept.word,
        definition: wordConcept.definition,
        insight: wordConcept.insight,
        etymology: wordConcept.etymology,
        symbolism: wordConcept.symbolism,
        position: { x, y },
        elevation: wordConcept.abstraction,
        discovered: false,
        bookmarked: false,
        visitors: new Set(),
        relatedWords: wordConcept.relatedWords,
        glowIntensity: 0.5 + Math.random() * 0.5
      };
      
      this.placeConcept(concept);
    }
    
    // Generate additional clusters at interesting points
    const biomeSeeds = [
      { word: 'abstract', pos: { x: centerX - 60, y: centerY - 60 } },
      { word: 'concrete', pos: { x: centerX + 60, y: centerY + 60 } },
      { word: 'mystical', pos: { x: centerX - 60, y: centerY + 60 } },
      { word: 'scientific', pos: { x: centerX + 60, y: centerY - 60 } }
    ];
    
    for (const biome of biomeSeeds) {
      const biomeWords = await this.wordGen.generateWordCluster(biome.word, 8, 'mixed');
      this.placeWordCluster(biomeWords, biome.pos.x, biome.pos.y, 20);
    }
    
    return this.concepts;
  }
  
  private placeWordCluster(words: WordConcept[], centerX: number, centerY: number, spread: number) {
    for (let i = 0; i < words.length; i++) {
      const angle = (i / words.length) * Math.PI * 2;
      const radius = spread * (0.5 + Math.random() * 0.5);
      
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * radius);
      
      if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
        const concept: Concept = {
          id: this.generateId(words[i].word),
          word: words[i].word,
          definition: words[i].definition,
          insight: words[i].insight,
          etymology: words[i].etymology,
          symbolism: words[i].symbolism,
          position: { x, y },
          elevation: words[i].abstraction,
          discovered: false,
          bookmarked: false,
          visitors: new Set(),
          relatedWords: words[i].relatedWords,
          glowIntensity: 0.5 + Math.random() * 0.5
        };
        
        this.placeConcept(concept);
      }
    }
  }
  
  async exploreTile(x: number, y: number, playerId: string): Promise<Concept | GlobalSynthesis | null> {
    if (x < 0 || x >= this.worldSize || y < 0 || y >= this.worldSize) return null;
    
    const tile = this.terrain[y][x];
    tile.visited = true;
    tile.trailIntensity++;
    
    // Check for synthesis first
    if (tile.synthesisId) {
      const synthesis = this.syntheses.get(tile.synthesisId);
      if (synthesis) {
        synthesis.discoveredBy.add(playerId);
        console.log(`✨ Discovered synthesis: ${synthesis.name}`);
        return synthesis;
      }
    }
    
    // Check for concept
    if (tile.conceptId) {
      const concept = this.concepts.get(tile.conceptId);
      if (concept) {
        concept.discovered = true;
        concept.visitors.add(playerId);
        this.discovered.add(tile.conceptId);
        
        // Generate more concepts around discovered ones
        if (concept.visitors.size === 1 && Math.random() < 0.7) {
          this.expandAroundConcept(concept);
        }
        
        return concept;
      }
    }
    
    // Mystery tiles have higher chance of spawning concepts
    if (tile.mystery && Math.random() < 0.6) {
      const nearestConcept = this.findNearestConcept(x, y);
      if (nearestConcept) {
        const newWords = await this.wordGen.generateWordCluster(
          nearestConcept.word, 
          4, 
          tile.elevation > 0.7 ? 'abstract' : 'concrete'
        );
        this.placeWordCluster(newWords, x, y, 5);
        
        // Return the concept placed at this position
        const placed = this.concepts.get(tile.conceptId!);
        if (placed) {
          placed.discovered = true;
          placed.visitors.add(playerId);
          return placed;
        }
      }
    }
    
    return null;
  }
  
  private async expandAroundConcept(concept: Concept) {
    console.log(`🌿 Expanding around ${concept.word}`);
    
    // Pick related words to generate
    const relatedWord = concept.relatedWords[Math.floor(Math.random() * concept.relatedWords.length)];
    if (relatedWord) {
      const newWords = await this.wordGen.generateWordCluster(relatedWord, 3, 'mixed');
      
      // Place them nearby
      const spread = 8;
      for (let i = 0; i < newWords.length; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * spread;
        const x = Math.round(concept.position.x + Math.cos(angle) * dist);
        const y = Math.round(concept.position.y + Math.sin(angle) * dist);
        
        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
          if (!this.terrain[y][x].conceptId && !this.terrain[y][x].synthesisId) {
            const newConcept: Concept = {
              id: this.generateId(newWords[i].word),
              word: newWords[i].word,
              definition: newWords[i].definition,
              insight: newWords[i].insight,
              etymology: newWords[i].etymology,
              symbolism: newWords[i].symbolism,
              position: { x, y },
              elevation: newWords[i].abstraction,
              discovered: false,
              bookmarked: false,
              visitors: new Set(),
              relatedWords: newWords[i].relatedWords,
              glowIntensity: 0.7
            };
            
            this.placeConcept(newConcept);
          }
        }
      }
    }
  }
  
  async createSynthesis(
    bookmarkedWords: string[],
    playerId: string,
    playerPos: { x: number; y: number }
  ): Promise<GlobalSynthesis | null> {
    if (bookmarkedWords.length < 2) return null;
    
    const synthesis = await this.wordGen.generateSynthesis(bookmarkedWords);
    
    // Calculate semantic position for synthesis
    const conceptPositions: Array<{ x: number; y: number }> = [];
    let totalAbstraction = 0;
    
    for (const word of bookmarkedWords) {
      const concept = Array.from(this.concepts.values()).find(c => c.word === word);
      if (concept) {
        conceptPositions.push(concept.position);
        totalAbstraction += concept.elevation;
      }
    }
    
    // Find center of semantic mass
    let synthX = playerPos.x;
    let synthY = playerPos.y;
    
    if (conceptPositions.length > 0) {
      synthX = Math.round(conceptPositions.reduce((sum, p) => sum + p.x, 0) / conceptPositions.length);
      synthY = Math.round(conceptPositions.reduce((sum, p) => sum + p.y, 0) / conceptPositions.length);
      
      // Add some variance so they don't stack
      synthX += Math.floor(Math.random() * 7 - 3);
      synthY += Math.floor(Math.random() * 7 - 3);
    }
    
    // Ensure within bounds
    synthX = Math.max(0, Math.min(this.worldSize - 1, synthX));
    synthY = Math.max(0, Math.min(this.worldSize - 1, synthY));
    
    const globalSynth: GlobalSynthesis = {
      id: `synth-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: synthesis.name,
      sourceWords: bookmarkedWords,
      definition: synthesis.definition,
      revelation: synthesis.revelation,
      symbol: synthesis.symbol,
      position: { x: synthX, y: synthY },
      createdBy: playerId,
      createdAt: Date.now(),
      discoveredBy: new Set([playerId]),
      coordinates: `${synthesis.name.substring(0, 2).toUpperCase()}-${synthX}-${synthY}`
    };
    
    // Add to global list
    this.globalSyntheses.push(globalSynth);
    this.syntheses.set(globalSynth.id, globalSynth);
    
    // Place on terrain
    this.terrain[synthY][synthX].synthesisId = globalSynth.id;
    
    console.log(`✨ Created synthesis "${globalSynth.name}" at coordinates: ${globalSynth.coordinates}`);
    
    return globalSynth;
  }
  
  teleportToCoordinates(coordinates: string): { x: number; y: number } | null {
    const synthesis = this.globalSyntheses.find(s => s.coordinates === coordinates);
    if (synthesis) {
      console.log(`🌀 Teleporting to ${synthesis.name}`);
      return synthesis.position;
    }
    return null;
  }
  
  getGlobalSyntheses(): GlobalSynthesis[] {
    return this.globalSyntheses;
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
    syntheses: GlobalSynthesis[]
  } {
    const tiles: TerrainTile[][] = [];
    const visibleConcepts: Concept[] = [];
    const visibleSyntheses: GlobalSynthesis[] = [];
    
    for (let dy = -this.viewRadius; dy <= this.viewRadius; dy++) {
      const row: TerrainTile[] = [];
      for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
          const tile = { ...this.terrain[y][x] };
          
          // Apply fog of war
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (!tile.visited) {
            if (dist > this.viewRadius * 0.7) {
              tile.elevation = tile.elevation * 0.2;
            } else if (dist > this.viewRadius * 0.5) {
              tile.elevation = tile.elevation * 0.5;
            }
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
          // Out of bounds - void
          row.push({
            elevation: 0,
            visited: false,
            trailIntensity: 0,
            mystery: false
          });
        }
      }
      tiles.push(row);
    }
    
    return { tiles, concepts: visibleConcepts, syntheses: visibleSyntheses };
  }
  
  private placeConcept(concept: Concept) {
    const { x, y } = concept.position;
    if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
      this.terrain[y][x].conceptId = concept.id;
      this.concepts.set(concept.id, concept);
    }
  }
  
  private findNearestConcept(x: number, y: number): Concept | null {
    let nearest: Concept | null = null;
    let minDist = Infinity;
    
    for (const concept of this.concepts.values()) {
      const dist = Math.sqrt(
        Math.pow(concept.position.x - x, 2) + 
        Math.pow(concept.position.y - y, 2)
      );
      if (dist < minDist && dist < 20) {
        minDist = dist;
        nearest = concept;
      }
    }
    
    return nearest;
  }
  
  private generateId(word: string): string {
    return word.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }
}