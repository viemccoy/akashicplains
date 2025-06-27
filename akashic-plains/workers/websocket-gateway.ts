/**
 * Cloudflare Worker for handling WebSocket connections
 * Manages multiplayer state for Akashic Plains
 */

export interface Env {
  WORLD_STATE: DurableObjectNamespace;
  SYNTHESES_DB: D1Database;
  PLAYER_SESSIONS: KVNamespace;
}

// WebSocket handler worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }
    
    // Get or create world state durable object
    const id = env.WORLD_STATE.idFromName('main-world');
    const worldState = env.WORLD_STATE.get(id);
    
    // Forward the WebSocket connection to the Durable Object
    return worldState.fetch(request);
  }
};

// Durable Object for managing world state
export class WorldState {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, SessionData> = new Map();
  
  // Game state
  players: Map<string, PlayerInfo> = new Map();
  discoveries: Map<string, Set<string>> = new Map(); // conceptId -> Set<playerId>
  trails: Map<string, number> = new Map(); // "x,y" -> intensity
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }
  
  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    await this.handleSession(server, request);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  async handleSession(webSocket: WebSocket, request: Request) {
    webSocket.accept();
    
    // Initialize session
    const session: SessionData = {
      webSocket,
      playerId: null,
      playerName: null,
      lastActivity: Date.now(),
    };
    
    this.sessions.set(webSocket, session);
    
    // Handle messages
    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        await this.handleMessage(session, message);
      } catch (error) {
        console.error('Error handling message:', error);
        webSocket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnect
    webSocket.addEventListener('close', () => {
      this.handleDisconnect(session);
    });
    
    // Send initial world state
    this.sendWorldState(webSocket);
  }
  
  async handleMessage(session: SessionData, message: any) {
    const { type, playerId, data, timestamp } = message;
    
    switch (type) {
      case 'ping':
        session.webSocket.send(JSON.stringify({ type: 'pong' }));
        break;
        
      case 'player_joined':
        await this.handlePlayerJoined(session, playerId, data);
        break;
        
      case 'player_left':
        this.handlePlayerLeft(playerId);
        break;
        
      case 'player_moved':
        this.handlePlayerMoved(playerId, data);
        break;
        
      case 'discovery':
        await this.handleDiscovery(playerId, data);
        break;
        
      case 'synthesis_created':
        await this.handleSynthesisCreated(playerId, data);
        break;
    }
  }
  
  async handlePlayerJoined(session: SessionData, playerId: string, data: any) {
    session.playerId = playerId;
    session.playerName = data.name;
    
    // Add player to world
    const playerInfo: PlayerInfo = {
      id: playerId,
      name: data.name,
      position: data.position,
      joinedAt: Date.now(),
      discoveries: 0,
      syntheses: 0,
    };
    
    this.players.set(playerId, playerInfo);
    
    // Store in KV for persistence
    await this.env.PLAYER_SESSIONS.put(
      `player:${playerId}`,
      JSON.stringify(playerInfo),
      { expirationTtl: 86400 } // 24 hours
    );
    
    // Broadcast to all other players
    this.broadcast(
      {
        type: 'player_joined',
        playerId,
        data,
        timestamp: Date.now()
      },
      session.webSocket
    );
    
    // Send current players to new player
    for (const [otherId, otherPlayer] of this.players) {
      if (otherId !== playerId) {
        session.webSocket.send(JSON.stringify({
          type: 'player_joined',
          playerId: otherId,
          data: {
            name: otherPlayer.name,
            position: otherPlayer.position
          },
          timestamp: Date.now()
        }));
      }
    }
  }
  
  handlePlayerLeft(playerId: string) {
    this.players.delete(playerId);
    
    // Broadcast to all players
    this.broadcast({
      type: 'player_left',
      playerId,
      data: {},
      timestamp: Date.now()
    });
  }
  
  handlePlayerMoved(playerId: string, data: any) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Update position
    player.position = data.position;
    
    // Update trail intensity
    const trailKey = `${data.position.x},${data.position.y}`;
    const currentIntensity = this.trails.get(trailKey) || 0;
    this.trails.set(trailKey, Math.min(currentIntensity + 1, 100));
    
    // Broadcast to all other players
    this.broadcast(
      {
        type: 'player_moved',
        playerId,
        data,
        timestamp: Date.now()
      },
      this.getPlayerWebSocket(playerId)
    );
  }
  
  async handleDiscovery(playerId: string, data: any) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Track discovery
    const conceptId = `${data.position.x},${data.position.y}`;
    if (!this.discoveries.has(conceptId)) {
      this.discoveries.set(conceptId, new Set());
    }
    this.discoveries.get(conceptId)!.add(playerId);
    
    // Update player stats
    player.discoveries++;
    
    // Broadcast discovery
    this.broadcast({
      type: 'discovery',
      playerId,
      data,
      timestamp: Date.now()
    });
  }
  
  async handleSynthesisCreated(playerId: string, data: any) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Store synthesis in D1 database
    try {
      await this.env.SYNTHESES_DB.prepare(
        `INSERT INTO syntheses (
          id, name, definition, revelation, symbol,
          source_words, position_x, position_y,
          created_by, created_at, discovered_by, coordinates
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.synthesis.id,
        data.synthesis.name,
        data.synthesis.definition,
        data.synthesis.revelation,
        data.synthesis.symbol,
        JSON.stringify(data.synthesis.sourceWords),
        data.synthesis.position.x,
        data.synthesis.position.y,
        data.synthesis.createdBy,
        data.synthesis.createdAt,
        JSON.stringify(Array.from(data.synthesis.discoveredBy)),
        data.synthesis.coordinates
      ).run();
      
      // Update player stats
      player.syntheses++;
      
      // Broadcast to all players
      this.broadcast({
        type: 'synthesis_created',
        playerId,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to store synthesis:', error);
    }
  }
  
  handleDisconnect(session: SessionData) {
    this.sessions.delete(session.webSocket);
    
    if (session.playerId) {
      this.handlePlayerLeft(session.playerId);
    }
  }
  
  broadcast(message: any, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message);
    
    for (const [webSocket, session] of this.sessions) {
      if (webSocket !== exclude && webSocket.readyState === WebSocket.READY_STATE_OPEN) {
        webSocket.send(messageStr);
      }
    }
  }
  
  sendWorldState(webSocket: WebSocket) {
    // Send current world state to new player
    const worldState = {
      type: 'world_state',
      players: Array.from(this.players.values()),
      discoveries: Array.from(this.discoveries.entries()).map(([conceptId, playerIds]) => ({
        conceptId,
        playerIds: Array.from(playerIds)
      })),
      trails: Array.from(this.trails.entries()).map(([position, intensity]) => ({
        position,
        intensity
      }))
    };
    
    webSocket.send(JSON.stringify(worldState));
  }
  
  getPlayerWebSocket(playerId: string): WebSocket | undefined {
    for (const [webSocket, session] of this.sessions) {
      if (session.playerId === playerId) {
        return webSocket;
      }
    }
    return undefined;
  }
}

interface SessionData {
  webSocket: WebSocket;
  playerId: string | null;
  playerName: string | null;
  lastActivity: number;
}

interface PlayerInfo {
  id: string;
  name: string;
  position: { x: number; y: number };
  joinedAt: number;
  discoveries: number;
  syntheses: number;
}