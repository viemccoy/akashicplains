import Anthropic from '@anthropic-ai/sdk';

export interface SemanticAnalysis {
  dimensions: {
    technicalDepth: number;
    abstractionLevel: number;
    domains: string[];
    prerequisites: string[];
    complexity: number;
  };
  neighbors: Array<{
    concept: string;
    distance: number;
    relationshipType: string;
    strength: number;
    direction: string;
  }>;
  topology: {
    terrainType: string;
    elevation: number;
    density: number;
    connectionPatterns: string;
  };
}

export class SemanticEngine {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  
  async analyzeConcept(concept: string): Promise<SemanticAnalysis> {
    const prompt = `You are a semantic cartographer analyzing the concept "${concept}" for a knowledge exploration game.

Analyze this concept along multiple dimensions:

1. Technical Depth (0-1): How specialized/technical is this concept?
2. Abstraction Level (0-1): How abstract (1) vs concrete (0)?
3. Domains: What fields/disciplines does this relate to?
4. Prerequisites: What concepts must be understood first?
5. Complexity (0-1): How complex/nuanced is this concept?

Then identify semantic neighbors - related concepts with:
- Distance (0-100): How conceptually far apart they are
- Relationship type: prerequisite/application/parallel/emergence/subset/generalization
- Strength (0-1): How strong the connection is
- Direction: Where to place them (N/S/E/W/NE/SE/SW/NW)

Finally, determine topology features:
- Terrain type based on the concept's nature
- Elevation based on abstraction level
- Density based on information richness
- Connection pattern (hub/linear/cluster/isolated/bridge)

Return JSON:
{
  "dimensions": {
    "technicalDepth": 0.0-1.0,
    "abstractionLevel": 0.0-1.0,
    "domains": ["field1", "field2"],
    "prerequisites": ["concept1", "concept2"],
    "complexity": 0.0-1.0
  },
  "neighbors": [
    {
      "concept": "related concept",
      "distance": 0-100,
      "relationshipType": "type",
      "strength": 0.0-1.0,
      "direction": "N/S/E/W/NE/SE/SW/NW"
    }
  ],
  "topology": {
    "terrainType": "type",
    "elevation": 0-100,
    "density": 0.0-1.0,
    "connectionPatterns": "pattern"
  }
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 2048,
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
    } catch (error) {
      console.error('Failed to analyze concept:', error);
    }
    
    // Fallback
    return {
      dimensions: {
        technicalDepth: 0.5,
        abstractionLevel: 0.5,
        domains: ['general'],
        prerequisites: [],
        complexity: 0.5
      },
      neighbors: [
        {
          concept: `${concept} basics`,
          distance: 10,
          relationshipType: 'subset',
          strength: 0.8,
          direction: 'N'
        }
      ],
      topology: {
        terrainType: 'plains',
        elevation: 50,
        density: 0.5,
        connectionPatterns: 'cluster'
      }
    };
  }
}