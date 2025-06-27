export interface PlayerState {
  id: string;
  name: string;
  position: { x: number; y: number };
  lastUpdate: number;
  trail: Array<{ x: number; y: number; timestamp: number }>;
}

export interface WorldUpdate {
  type: 'player_joined' | 'player_left' | 'player_moved' | 'discovery' | 'synthesis_created' | 'chat';
  playerId: string;
  data: any;
  timestamp: number;
}

export interface Discovery {
  playerId: string;
  playerName: string;
  conceptWord: string;
  position: { x: number; y: number };
  timestamp: number;
}

export interface SynthesisCreated {
  synthesis: any; // GlobalSynthesis type
  creatorName: string;
  timestamp: number;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private messageQueue: WorldUpdate[] = [];
  private isConnected = false;
  
  private players: Map<string, PlayerState> = new Map();
  private localPlayerId: string;
  private localPlayerName: string;
  
  // Event handlers
  onPlayerJoined?: (player: PlayerState) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerMoved?: (player: PlayerState) => void;
  onDiscovery?: (discovery: Discovery) => void;
  onSynthesisCreated?: (data: SynthesisCreated) => void;
  onConnectionStateChange?: (connected: boolean) => void;
  
  constructor(playerId: string, playerName: string) {
    this.localPlayerId = playerId;
    this.localPlayerName = playerName;
  }
  
  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🌐 Connecting to multiplayer server...');
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to multiplayer server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionStateChange?.(true);
          
          // Send join message
          this.send({
            type: 'player_joined',
            playerId: this.localPlayerId,
            data: {
              name: this.localPlayerName,
              position: { x: 128, y: 128 }
            },
            timestamp: Date.now()
          });
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Flush message queue
          this.flushMessageQueue();
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const update: WorldUpdate = JSON.parse(event.data);
            this.handleUpdate(update);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('🔌 Disconnected from multiplayer server');
          this.isConnected = false;
          this.onConnectionStateChange?.(false);
          this.stopHeartbeat();
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(wsUrl), delay);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  disconnect() {
    if (this.ws) {
      // Send leave message
      this.send({
        type: 'player_left',
        playerId: this.localPlayerId,
        data: {},
        timestamp: Date.now()
      });
      
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
    this.onConnectionStateChange?.(false);
  }
  
  private handleUpdate(update: WorldUpdate) {
    switch (update.type) {
      case 'player_joined':
        if (update.playerId !== this.localPlayerId) {
          const player: PlayerState = {
            id: update.playerId,
            name: update.data.name,
            position: update.data.position,
            lastUpdate: update.timestamp,
            trail: []
          };
          this.players.set(update.playerId, player);
          this.onPlayerJoined?.(player);
        }
        break;
        
      case 'player_left':
        if (update.playerId !== this.localPlayerId) {
          this.players.delete(update.playerId);
          this.onPlayerLeft?.(update.playerId);
        }
        break;
        
      case 'player_moved':
        if (update.playerId !== this.localPlayerId) {
          const player = this.players.get(update.playerId);
          if (player) {
            // Add to trail
            player.trail.push({
              x: player.position.x,
              y: player.position.y,
              timestamp: player.lastUpdate
            });
            
            // Limit trail length
            if (player.trail.length > 50) {
              player.trail.shift();
            }
            
            // Update position
            player.position = update.data.position;
            player.lastUpdate = update.timestamp;
            
            this.onPlayerMoved?.(player);
          }
        }
        break;
        
      case 'discovery':
        const discovery: Discovery = {
          playerId: update.playerId,
          playerName: update.data.playerName,
          conceptWord: update.data.conceptWord,
          position: update.data.position,
          timestamp: update.timestamp
        };
        this.onDiscovery?.(discovery);
        break;
        
      case 'synthesis_created':
        this.onSynthesisCreated?.(update.data);
        break;
    }
  }
  
  sendPosition(x: number, y: number) {
    this.send({
      type: 'player_moved',
      playerId: this.localPlayerId,
      data: { position: { x, y } },
      timestamp: Date.now()
    });
  }
  
  sendDiscovery(conceptWord: string, position: { x: number; y: number }) {
    this.send({
      type: 'discovery',
      playerId: this.localPlayerId,
      data: {
        playerName: this.localPlayerName,
        conceptWord,
        position
      },
      timestamp: Date.now()
    });
  }
  
  sendSynthesisCreated(synthesis: any) {
    this.send({
      type: 'synthesis_created',
      playerId: this.localPlayerId,
      data: {
        synthesis,
        creatorName: this.localPlayerName
      },
      timestamp: Date.now()
    });
  }
  
  private send(update: WorldUpdate) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(update));
    } else {
      // Queue message for later
      this.messageQueue.push(update);
    }
  }
  
  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const update = this.messageQueue.shift();
      if (update) {
        this.send(update);
      }
    }
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }
  
  getPlayer(playerId: string): PlayerState | undefined {
    return this.players.get(playerId);
  }
  
  isPlayerOnline(playerId: string): boolean {
    return this.players.has(playerId);
  }
}