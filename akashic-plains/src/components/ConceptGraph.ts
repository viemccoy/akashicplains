export interface ConceptNode {
  id: string;
  word: string;
  x: number;
  y: number;
  abstraction: number;
  discovered: boolean;
}

export interface ConceptEdge {
  source: string;
  target: string;
  strength: number;
  type: 'related' | 'synthesis' | 'discovered';
}

export class ConceptGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Map<string, ConceptNode> = new Map();
  private edges: ConceptEdge[] = [];
  private centerNode?: string;
  private scale = 1;
  private offset = { x: 0, y: 0 };
  
  constructor(width: number = 400, height: number = 300) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.className = 'concept-graph';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    
    this.setupInteraction();
  }
  
  private setupInteraction() {
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    
    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.offset.x += e.clientX - lastPos.x;
        this.offset.y += e.clientY - lastPos.y;
        lastPos = { x: e.clientX, y: e.clientY };
        this.render();
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.max(0.5, Math.min(3, this.scale * delta));
      this.render();
    });
  }
  
  updateFromConcepts(
    concepts: Map<string, any>,
    currentConcept?: any,
    bookmarks?: any[]
  ) {
    this.nodes.clear();
    this.edges = [];
    
    // Add discovered concepts as nodes
    for (const concept of concepts.values()) {
      if (concept.discovered) {
        this.nodes.set(concept.id, {
          id: concept.id,
          word: concept.word,
          x: concept.position.x,
          y: concept.position.y,
          abstraction: concept.elevation,
          discovered: true
        });
      }
    }
    
    // Create edges for related concepts
    for (const concept of concepts.values()) {
      if (concept.discovered && concept.relatedWords) {
        for (const relatedWord of concept.relatedWords) {
          const related = Array.from(concepts.values()).find(c => 
            c.word === relatedWord && c.discovered
          );
          if (related) {
            this.edges.push({
              source: concept.id,
              target: related.id,
              strength: 0.5,
              type: 'related'
            });
          }
        }
      }
    }
    
    // Highlight current concept
    if (currentConcept) {
      this.centerNode = currentConcept.id;
    }
    
    // Add bookmark connections
    if (bookmarks && bookmarks.length > 1) {
      for (let i = 0; i < bookmarks.length - 1; i++) {
        for (let j = i + 1; j < bookmarks.length; j++) {
          this.edges.push({
            source: bookmarks[i].id,
            target: bookmarks[j].id,
            strength: 1,
            type: 'synthesis'
          });
        }
      }
    }
    
    this.render();
  }
  
  render() {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, width, height);
    
    // Apply transformations
    this.ctx.save();
    this.ctx.translate(centerX + this.offset.x, centerY + this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    
    // Find bounds for centering
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of this.nodes.values()) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }
    
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;
    
    // Draw edges
    this.ctx.strokeStyle = '#FFB00033';
    this.ctx.lineWidth = 1;
    
    for (const edge of this.edges) {
      const source = this.nodes.get(edge.source);
      const target = this.nodes.get(edge.target);
      
      if (source && target) {
        this.ctx.globalAlpha = edge.strength * 0.5;
        
        if (edge.type === 'synthesis') {
          this.ctx.strokeStyle = '#00FFFF66';
          this.ctx.lineWidth = 2;
        } else {
          this.ctx.strokeStyle = '#FFB00033';
          this.ctx.lineWidth = 1;
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(source.x - graphCenterX, source.y - graphCenterY);
        this.ctx.lineTo(target.x - graphCenterX, target.y - graphCenterY);
        this.ctx.stroke();
      }
    }
    
    this.ctx.globalAlpha = 1;
    
    // Draw nodes
    for (const node of this.nodes.values()) {
      const x = node.x - graphCenterX;
      const y = node.y - graphCenterY;
      
      // Node color based on abstraction
      if (node.abstraction > 0.7) {
        this.ctx.fillStyle = '#9370DB';
      } else if (node.abstraction > 0.4) {
        this.ctx.fillStyle = '#FFB000';
      } else {
        this.ctx.fillStyle = '#00CED1';
      }
      
      // Highlight current node
      if (node.id === this.centerNode) {
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 10;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
      
      // Label for important nodes
      if (node.id === this.centerNode || this.scale > 1.5) {
        this.ctx.fillStyle = '#F4E8D0';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.word, x, y - 6);
      }
    }
    
    this.ctx.restore();
  }
  
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
}