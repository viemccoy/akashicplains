export interface DiscoveryEvent {
  id: string;
  timestamp: number;
  type: 'concept' | 'synthesis';
  playerName: string;
  playerId: string;
  itemName: string;
  position: { x: number; y: number };
  coordinates?: string; // For syntheses
}

export class GlobalDiscoveryFeed {
  private events: DiscoveryEvent[] = [];
  private maxEvents = 50;
  private container: HTMLElement;
  private isMinimized = false;
  private autoScroll = true;
  
  constructor() {
    this.container = this.createContainer();
    this.setupEventHandlers();
    this.loadStoredEvents();
  }
  
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'global-discovery-feed';
    container.innerHTML = `
      <div class="feed-header">
        <h3 class="feed-title">
          <span class="feed-icon">🌐</span>
          GLOBAL DISCOVERIES
        </h3>
        <div class="feed-controls">
          <button class="feed-control" id="feed-minimize" title="Minimize">_</button>
          <button class="feed-control" id="feed-clear" title="Clear">✕</button>
        </div>
      </div>
      <div class="feed-content">
        <div class="feed-events" id="feed-events"></div>
      </div>
      <div class="feed-status">
        <span id="feed-count">0</span> discoveries
      </div>
    `;
    
    return container;
  }
  
  private setupEventHandlers() {
    const minimizeBtn = this.container.querySelector('#feed-minimize');
    const clearBtn = this.container.querySelector('#feed-clear');
    const eventsContainer = this.container.querySelector('.feed-events');
    
    minimizeBtn?.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      this.container.classList.toggle('minimized', this.isMinimized);
      minimizeBtn.textContent = this.isMinimized ? '□' : '_';
    });
    
    clearBtn?.addEventListener('click', () => {
      if (confirm('Clear all discovery events?')) {
        this.clearEvents();
      }
    });
    
    eventsContainer?.addEventListener('scroll', () => {
      const el = eventsContainer as HTMLElement;
      const isAtBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 5;
      this.autoScroll = isAtBottom;
    });
  }
  
  addDiscovery(
    type: 'concept' | 'synthesis',
    playerName: string,
    playerId: string,
    itemName: string,
    position: { x: number; y: number },
    coordinates?: string
  ) {
    const event: DiscoveryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      playerName,
      playerId,
      itemName,
      position,
      coordinates
    };
    
    this.events.unshift(event);
    
    // Limit events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    
    this.render();
    this.saveEvents();
    
    // Flash animation for new event
    this.flashNewEvent();
  }
  
  private render() {
    const eventsContainer = this.container.querySelector('#feed-events');
    const countElement = this.container.querySelector('#feed-count');
    
    if (!eventsContainer || !countElement) return;
    
    countElement.textContent = this.events.length.toString();
    
    eventsContainer.innerHTML = this.events.map(event => {
      const timeAgo = this.getTimeAgo(event.timestamp);
      const icon = event.type === 'synthesis' ? '✨' : '📖';
      
      return `
        <div class="feed-event ${event.type}" data-id="${event.id}">
          <div class="event-header">
            <span class="event-icon">${icon}</span>
            <span class="event-player">${this.escapeHtml(event.playerName)}</span>
            <span class="event-time">${timeAgo}</span>
          </div>
          <div class="event-content">
            ${event.type === 'synthesis' ? 
              `synthesized <span class="event-item-name">${this.escapeHtml(event.itemName)}</span>` :
              `discovered <span class="event-item-name">${this.escapeHtml(event.itemName)}</span>`
            }
          </div>
          <div class="event-location">
            ${event.coordinates ? 
              `<span class="event-coords clickable" data-coords="${event.coordinates}">${event.coordinates}</span>` :
              `<span class="event-pos">(${event.position.x}, ${event.position.y})</span>`
            }
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers for coordinates
    eventsContainer.querySelectorAll('.event-coords.clickable').forEach(el => {
      el.addEventListener('click', (e) => {
        const coords = (e.target as HTMLElement).dataset.coords;
        if (coords) {
          this.dispatchTeleportEvent(coords);
        }
      });
    });
    
    // Auto-scroll to bottom if enabled
    if (this.autoScroll) {
      eventsContainer.scrollTop = 0;
    }
  }
  
  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  private flashNewEvent() {
    const firstEvent = this.container.querySelector('.feed-event');
    if (firstEvent) {
      firstEvent.classList.add('new-event');
      setTimeout(() => {
        firstEvent.classList.remove('new-event');
      }, 1000);
    }
  }
  
  private dispatchTeleportEvent(coordinates: string) {
    window.dispatchEvent(new CustomEvent('teleport-to-coordinates', {
      detail: { coordinates }
    }));
  }
  
  private saveEvents() {
    try {
      localStorage.setItem('akashic-discovery-feed', JSON.stringify(this.events));
    } catch (e) {
      console.warn('Failed to save discovery feed:', e);
    }
  }
  
  private loadStoredEvents() {
    try {
      const stored = localStorage.getItem('akashic-discovery-feed');
      if (stored) {
        this.events = JSON.parse(stored);
        this.render();
      }
    } catch (e) {
      console.warn('Failed to load discovery feed:', e);
    }
  }
  
  private clearEvents() {
    this.events = [];
    this.render();
    this.saveEvents();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  minimize() {
    this.isMinimized = true;
    this.container.classList.add('minimized');
  }
  
  maximize() {
    this.isMinimized = false;
    this.container.classList.remove('minimized');
  }
}

// CSS for the feed
const style = document.createElement('style');
style.textContent = `
.global-discovery-feed {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid var(--color-amber);
  font-family: var(--font-mono);
  font-size: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(255, 176, 0, 0.2);
  transition: all 0.3s ease;
}

.global-discovery-feed.minimized {
  height: auto;
  max-height: none;
}

.global-discovery-feed.minimized .feed-content,
.global-discovery-feed.minimized .feed-status {
  display: none;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid var(--color-amber);
  background: rgba(255, 176, 0, 0.1);
}

.feed-title {
  margin: 0;
  font-size: 14px;
  color: var(--color-gold);
  display: flex;
  align-items: center;
  gap: 8px;
}

.feed-icon {
  font-size: 16px;
}

.feed-controls {
  display: flex;
  gap: 5px;
}

.feed-control {
  background: transparent;
  border: 1px solid var(--color-amber);
  color: var(--color-amber);
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.feed-control:hover {
  background: rgba(255, 176, 0, 0.2);
}

.feed-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.feed-events {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  max-height: 300px;
}

.feed-event {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 176, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.feed-event:hover {
  border-color: var(--color-amber);
  background: rgba(255, 176, 0, 0.1);
}

.feed-event.synthesis {
  background: rgba(0, 255, 255, 0.05);
}

.feed-event.synthesis:hover {
  border-color: var(--color-cyan);
  background: rgba(0, 255, 255, 0.1);
}

.feed-event.new-event {
  animation: feed-flash 1s ease;
}

@keyframes feed-flash {
  0% { background: rgba(255, 255, 255, 0.3); }
  100% { background: rgba(255, 176, 0, 0.05); }
}

.event-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.event-icon {
  font-size: 14px;
}

.event-player {
  color: var(--color-gold);
  font-weight: bold;
  flex: 1;
}

.event-time {
  color: var(--color-sand);
  opacity: 0.7;
  font-size: 10px;
}

.event-content {
  color: var(--color-sand);
  margin-bottom: 4px;
}

.event-item-name {
  color: var(--color-amber);
  font-weight: bold;
}

.event-location {
  font-size: 10px;
  color: var(--color-sand);
  opacity: 0.8;
}

.event-coords {
  color: var(--color-cyan);
  text-decoration: underline;
}

.event-coords.clickable {
  cursor: pointer;
}

.event-coords.clickable:hover {
  color: var(--color-gold);
  text-shadow: 0 0 5px currentColor;
}

.feed-status {
  padding: 8px 15px;
  border-top: 1px solid rgba(255, 176, 0, 0.3);
  text-align: center;
  color: var(--color-sand);
  font-size: 11px;
}

/* Scrollbar styling */
.feed-events::-webkit-scrollbar {
  width: 6px;
}

.feed-events::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
}

.feed-events::-webkit-scrollbar-thumb {
  background: var(--color-amber);
  border-radius: 3px;
}

.feed-events::-webkit-scrollbar-thumb:hover {
  background: var(--color-gold);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .global-discovery-feed {
    width: 280px;
    top: 60px;
    right: 10px;
    max-height: 300px;
  }
}
`;
document.head.appendChild(style);