export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private worldSize: number;
  private scale: number;
  
  constructor(size: number = 200, worldSize: number = 256) {
    this.worldSize = worldSize;
    this.scale = size / worldSize;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.className = 'mini-map';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }
  
  render(
    playerPos: { x: number; y: number },
    visitedTiles: Set<string>,
    concepts: Map<string, any>,
    syntheses: Map<string, any>
  ): string {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw visited areas
    this.ctx.fillStyle = '#1a1a1a';
    for (const tileKey of visitedTiles) {
      const [x, y] = tileKey.split(',').map(Number);
      this.ctx.fillRect(
        x * this.scale,
        y * this.scale,
        Math.ceil(this.scale),
        Math.ceil(this.scale)
      );
    }
    
    // Draw discovered concepts
    for (const concept of concepts.values()) {
      if (concept.discovered) {
        this.ctx.fillStyle = this.getConceptColor(concept.elevation);
        this.ctx.fillRect(
          concept.position.x * this.scale - 1,
          concept.position.y * this.scale - 1,
          2,
          2
        );
      }
    }
    
    // Draw syntheses
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.shadowColor = '#00FFFF';
    this.ctx.shadowBlur = 3;
    for (const synthesis of syntheses.values()) {
      this.ctx.fillRect(
        synthesis.position.x * this.scale - 1,
        synthesis.position.y * this.scale - 1,
        3,
        3
      );
    }
    this.ctx.shadowBlur = 0;
    
    // Draw player position
    this.ctx.fillStyle = '#FFB000';
    this.ctx.shadowColor = '#FFB000';
    this.ctx.shadowBlur = 5;
    this.ctx.beginPath();
    this.ctx.arc(
      playerPos.x * this.scale,
      playerPos.y * this.scale,
      3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Draw view radius
    this.ctx.strokeStyle = '#FFB00033';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(
      playerPos.x * this.scale,
      playerPos.y * this.scale,
      20 * this.scale, // view radius
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
    
    // Return as data URL for embedding
    return this.canvas.toDataURL();
  }
  
  private getConceptColor(elevation: number): string {
    // Color based on abstraction level
    if (elevation > 0.8) return '#9370DB'; // Purple for abstract
    if (elevation > 0.6) return '#FFB000'; // Amber for mid
    if (elevation > 0.4) return '#DAA520'; // Gold for general
    if (elevation > 0.2) return '#00CED1'; // Aqua for applied
    return '#00FF00'; // Green for concrete
  }
  
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
}