import Anthropic from '@anthropic-ai/sdk';

// Common interesting words to seed explorations
const SEED_WORDS = {
  abstract: ['consciousness', 'emergence', 'entropy', 'infinity', 'paradox', 'chaos', 'order', 'void'],
  scientific: ['quantum', 'neuron', 'algorithm', 'fractal', 'genome', 'singularity', 'resonance'],
  philosophical: ['existence', 'truth', 'beauty', 'meaning', 'essence', 'being', 'nothingness'],
  natural: ['ocean', 'forest', 'crystal', 'storm', 'aurora', 'eclipse', 'nebula'],
  mystical: ['aether', 'akasha', 'mandala', 'chakra', 'oracle', 'prophecy', 'rune']
};

export interface WordConcept {
  word: string;
  definition: string;
  insight: string;
  category: string;
  abstraction: number;
  relatedWords: string[];
  etymology?: string;
  symbolism?: string;
}

export class WordGenerator {
  private client: Anthropic;
  private wordCache: Map<string, WordConcept[]> = new Map();
  
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  
  async generateWordCluster(
    baseWord: string,
    count: number = 6,
    focus: 'abstract' | 'concrete' | 'mixed' = 'mixed'
  ): Promise<WordConcept[]> {
    // Check cache first
    const cacheKey = `${baseWord}-${count}-${focus}`;
    if (this.wordCache.has(cacheKey)) {
      return this.wordCache.get(cacheKey)!;
    }
    
    console.log(`🔮 Generating ${count} words related to "${baseWord}" (${focus} focus)`);
    
    try {
      const prompt = `You are a semantic cartographer mapping the landscape of meaning around "${baseWord}".

Generate ${count} semantically related words that create an explorable conceptual space.

Requirements:
1. Mix of abstraction levels (${focus === 'abstract' ? 'favor abstract concepts' : focus === 'concrete' ? 'favor concrete examples' : 'balanced mix'})
2. Each word should open new paths of exploration
3. Include surprising connections and rare/beautiful words
4. Create a rich semantic topology

For each word provide:
- The word itself (prefer evocative, interesting words)
- A poetic yet clear definition (1-2 sentences)
- An insight connecting it to "${baseWord}" 
- Category (philosophical, scientific, poetic, etc.)
- Abstraction level (0-1)
- 4-6 related words for further exploration
- Etymology or origin (if interesting)
- Symbolic meaning or cultural significance

Return JSON array:
[{
  "word": "luminescence",
  "definition": "The emission of light by a substance that has not been heated, as in fireflies and deep-sea creatures",
  "insight": "Like consciousness, luminescence reveals inner light without external heat - a cold fire of awareness",
  "category": "natural phenomenon",
  "abstraction": 0.3,
  "relatedWords": ["bioluminescence", "phosphorescence", "aurora", "radiance", "glow", "shimmer"],
  "etymology": "From Latin 'lumen' (light) + '-escence' (becoming)",
  "symbolism": "Inner light, hidden knowledge revealed, beauty in darkness"
}]`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.9,
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
          this.wordCache.set(cacheKey, words);
          return words;
        }
      }
    } catch (error) {
      console.error('Failed to generate words:', error);
    }
    
    // Fallback to pre-defined words
    return this.generateFallbackWords(baseWord, count);
  }
  
  async generateSynthesis(
    words: string[],
    context: string = ''
  ): Promise<{
    name: string;
    definition: string;
    revelation: string;
    symbol: string;
  }> {
    console.log(`✨ Synthesizing: ${words.join(' + ')}`);
    
    try {
      const prompt = `You are crystallizing ${words.length} concepts into a new form of understanding.

Source concepts: ${words.join(', ')}
${context ? `Context: ${context}` : ''}

Create a synthesis that:
1. Fuses these concepts in an unexpected, revelatory way
2. Names the synthesis poetically (compound words, neologisms welcome)
3. Reveals hidden connections between the concepts
4. Suggests a new way of seeing/understanding

Return JSON:
{
  "name": "Luminal-Threshold",
  "definition": "The shimmering boundary where one state of being transforms into another, where ${words[0]} meets ${words[1]}",
  "revelation": "At the intersection of ${words.join(' and ')}, we discover that all boundaries are doorways, all edges are beginnings",
  "symbol": "A description of a visual symbol representing this synthesis"
}`;

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.95,
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
    } catch (error) {
      console.error('Synthesis generation failed:', error);
    }
    
    // Fallback
    return {
      name: words.join('-'),
      definition: `The fusion of ${words.join(' and ')}`,
      revelation: 'New understanding emerges from unexpected combinations',
      symbol: 'Interlocking circles of light'
    };
  }
  
  private generateFallbackWords(baseWord: string, count: number): WordConcept[] {
    const fallbackWords: WordConcept[] = [];
    
    // Get some related words from our seed collection
    const allWords: string[] = [];
    Object.values(SEED_WORDS).forEach(category => {
      allWords.push(...category);
    });
    
    // Simple related word generation
    for (let i = 0; i < Math.min(count, 3); i++) {
      const word = allWords[Math.floor(Math.random() * allWords.length)];
      fallbackWords.push({
        word,
        definition: `A concept related to ${baseWord}`,
        insight: `Connected to ${baseWord} through hidden patterns`,
        category: 'mystery',
        abstraction: 0.5 + Math.random() * 0.5,
        relatedWords: [baseWord],
        symbolism: 'Ancient wisdom'
      });
    }
    
    return fallbackWords;
  }
  
  // Get random interesting seed words for initial exploration
  getRandomSeedWords(count: number = 5): string[] {
    const allWords: string[] = [];
    Object.values(SEED_WORDS).forEach(category => {
      allWords.push(...category);
    });
    
    const selected: string[] = [];
    while (selected.length < count && selected.length < allWords.length) {
      const word = allWords[Math.floor(Math.random() * allWords.length)];
      if (!selected.includes(word)) {
        selected.push(word);
      }
    }
    
    return selected;
  }
}