import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  private client: Anthropic | null = null;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }
  
  initialize(apiKey: string) {
    // In production, we use the user's API key
    // In development, we can use the env variable for testing
    const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!key) {
      throw new Error('No API key provided');
    }
    
    // Note: In a real app, you'd want to proxy this through your backend
    // to avoid exposing the API key in the browser
    this.client = new Anthropic({
      apiKey: key,
      dangerouslyAllowBrowser: true // Only for demo - use backend in production
    });
  }
  
  async generateTerrain(
    centerConcept: string,
    adjacentTerrain: string,
    direction: string
  ): Promise<any> {
    if (!this.client) throw new Error('Claude client not initialized');
    
    const prompt = `You are an ancient cartographer mapping the Akashic Plains, where knowledge crystallizes in desert sands.

Center of wisdom: "${centerConcept}"
Direction of travel: ${direction}
Adjacent terrain patterns: ${adjacentTerrain}

Generate a 16x16 grid of mystical desert terrain where:
- ░░░ = Shifting sands (unexplored potential)
- ... = Desert plains (basic connections)
- ∩∩∩ = Dunes (rising understanding)
- ▲▲▲ = Sacred pyramids (eternal truths about "${centerConcept}")
- ╫╫╫ = Obelisks (singular profound insights)
- ≈≈≈ = Oasis pools (where knowledge flows freely)
- ┌─┐ = Ancient temples (major related domains)
- ◊◊◊ = Crystal clusters (where ideas synthesize naturally)
- ※※※ = Mystic glyphs (hidden ancient wisdom)
- ═══ = Ley lines (energy flows connecting concepts)

The terrain should feel ancient yet alive, as if the desert itself dreams of "${centerConcept}".

Return JSON:
{
  "terrain": ["16 ASCII chars", ...], // 16 rows
  "sacred_sites": [
    {"x": 0-15, "y": 0-15, "glyph": "※", "whispered_name": "concept", "site_type": "temple|pyramid|oasis"}
  ],
  "ley_lines": [
    {"from": [x,y], "to": [x,y], "energy_type": "logical|mystical|harmonic"}
  ]
}`;

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
      try {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse terrain JSON:', e);
      }
    }
    
    throw new Error('Failed to generate terrain');
  }
  
  async revealSacredSite(
    concept: string,
    nearbySites: string[],
    terrainContext: string
  ): Promise<any> {
    if (!this.client) throw new Error('Claude client not initialized');
    
    const prompt = `You are an ancient oracle revealing wisdom at a sacred site in the Akashic Plains.

The seeker has discovered: "${concept}"
Nearby sacred sites: ${nearbySites.join(', ')}
Location type: ${terrainContext}

Channel the ancient wisdom in the style of 90s RPG discoveries. Make it feel like uncovering 
secret knowledge in an old DOS game, but with mystical depth.

Provide:
1. Ancient revelation (2-3 sentences) - as if reading weathered hieroglyphs
2. Ley line connections to 3 nearest sites (how energy flows between concepts)
3. A hidden truth rarely spoken of this concept
4. A riddle that points toward deeper mysteries
5. Mystical resonance levels (0.0-1.0) with nearby sites

Style: Blend technical accuracy with mystical prose. Write as if ancient ASCII sages encoded this.

Return JSON:
{
  "revelation": "The ancients knew that ${concept}...",
  "ley_connections": [
    {"site": "name", "flow": "how wisdom connects", "resonance": 0.0-1.0}
  ],
  "hidden_truth": "What few seekers realize...",
  "riddle": "Ancient question that opens new paths..."
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
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse oracle JSON:', e);
      }
    }
    
    throw new Error('Failed to reveal sacred site');
  }
  
  async crystallizeSynthesis(
    bookmarkedSites: Array<{name: string, core_wisdom: string}>,
    seekerPath: string
  ): Promise<any> {
    if (!this.client) throw new Error('Claude client not initialized');
    
    const prompt = `You are a mystical crystallizer who fuses disparate wisdoms into new forms.

The seeker has gathered wisdom from these sites:
${bookmarkedSites.map(s => `${s.name}: ${s.core_wisdom}`).join('\n')}

Their journey pattern: ${seekerPath}

In the style of discovering a legendary item in a 90s RPG:

1. Name this crystallized wisdom (like "Sphere of Quantum Consciousness")
2. Describe how these concepts fuse in unexpected ways (2-3 paragraphs)
3. What new powers/insights does this synthesis grant?
4. Where in the Akashic Plains should this crystal manifest?
5. What ancient prophecy does this fulfill?

Make it feel like a significant discovery - as if the player just found the Philosopher's Stone.

Return JSON:
{
  "name": "Epic name",
  "description": "How concepts fuse",
  "powers": ["insight1", "insight2"],
  "manifestLocation": {"x": 0-15, "y": 0-15},
  "prophecy": "Ancient prophecy fulfilled"
}`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1024,
      temperature: 0.85,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse synthesis JSON:', e);
      }
    }
    
    throw new Error('Failed to crystallize synthesis');
  }
}