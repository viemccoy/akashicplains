# Akashic Plains Multiplayer Worker

This directory contains the Cloudflare Worker code for enabling real-time multiplayer in Akashic Plains.

## Setup Instructions

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create D1 Database**
   ```bash
   wrangler d1 create akashic-syntheses
   ```
   Copy the database ID to `wrangler.toml`

4. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create PLAYER_SESSIONS
   ```
   Copy the namespace ID to `wrangler.toml`

5. **Run Database Migrations**
   ```bash
   wrangler d1 execute akashic-syntheses --file=./schema.sql
   ```

6. **Deploy Worker**
   ```bash
   wrangler deploy
   ```

## Local Development

To run the worker locally:
```bash
wrangler dev
```

The WebSocket will be available at `ws://localhost:8787`

## Production URL

Once deployed, your WebSocket URL will be:
```
wss://akashic-plains-multiplayer.workers.dev
```

## Architecture

- **Durable Objects**: Manage world state per region
- **D1 Database**: Persistent storage for syntheses
- **KV Storage**: Player session caching
- **WebSockets**: Real-time player communication

## Testing

You can test the WebSocket connection using:
```javascript
const ws = new WebSocket('ws://localhost:8787');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'player_joined',
    playerId: 'test-player',
    data: { name: 'Test', position: { x: 128, y: 128 } }
  }));
};
```