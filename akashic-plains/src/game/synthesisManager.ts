import type { SacredSite, Synthesis, Position } from '../types';
import { ClaudeClient } from '../agents/claudeClient';
import { TERRAIN_SYMBOLS } from '../types';

export class SynthesisManager {
  private claude: ClaudeClient;
  
  constructor(apiKey: string) {
    this.claude = new ClaudeClient(apiKey);
  }
  
  async performSynthesis(
    bookmarkedSites: SacredSite[],
    playerPath: string,
    currentPosition: Position
  ): Promise<Synthesis> {
    // Prepare data for Claude
    const sitesData = bookmarkedSites.map(site => ({
      name: site.conceptName,
      core_wisdom: site.explanation || `The essence of ${site.conceptName}`
    }));
    
    // Get synthesis from Claude
    const result = await this.claude.crystallizeSynthesis(sitesData, playerPath);
    
    // Create synthesis object
    const synthesis: Synthesis = {
      id: `synth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: result.name,
      sourceGlyphs: bookmarkedSites.map(s => s.glyph),
      revelation: result.description,
      oracleId: 'player', // In a multiplayer version, this would be the player ID
      position: this.calculateManifestPosition(
        currentPosition,
        result.manifestLocation || { x: 0, y: 0 }
      ),
      crystallizedAt: Date.now()
    };
    
    return synthesis;
  }
  
  private calculateManifestPosition(
    playerPos: Position,
    relativePos: { x: number, y: number }
  ): Position {
    // Crystal manifests relative to player's current position
    // But within a reasonable distance (max 10 tiles away)
    const maxDistance = 10;
    
    const dx = Math.max(-maxDistance, Math.min(maxDistance, relativePos.x - 8));
    const dy = Math.max(-maxDistance, Math.min(maxDistance, relativePos.y - 8));
    
    return {
      x: playerPos.x + dx,
      y: playerPos.y + dy
    };
  }
  
  generateCrystalGlyph(): string {
    const crystalGlyphs = ['◊', '❋', '✦', '⟡', '◈', '◆'];
    return crystalGlyphs[Math.floor(Math.random() * crystalGlyphs.length)];
  }
  
  async revealSynthesisWisdom(synthesis: Synthesis): Promise<{
    fullRevelation: string;
    powers: string[];
    prophecy: string;
  }> {
    // In a full implementation, this would make another call to Claude
    // For now, we'll parse the existing revelation
    return {
      fullRevelation: synthesis.revelation,
      powers: [
        "Deeper understanding of interconnected concepts",
        "Ability to see hidden patterns in the desert",
        "Enhanced resonance with sacred sites"
      ],
      prophecy: "The seeker who fuses wisdom shall open new paths through the infinite sands."
    };
  }
}