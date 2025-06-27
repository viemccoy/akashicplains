# Akashic Plains - Complete Deployment Guide

This guide will walk you through deploying the full Akashic Plains experience with multiplayer support.

## Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+ installed
- Git repository with your code
- Cloudflare Pages already deployed (which you have)

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers.

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

## Step 2: Authenticate with Cloudflare

Login to your Cloudflare account:
```bash
wrangler login
```

This will open a browser window for authentication.

## Step 3: Create D1 Database

D1 is Cloudflare's serverless SQL database. Create one for storing syntheses:

```bash
wrangler d1 create akashic-syntheses
```

You'll see output like:
```
✅ Successfully created DB 'akashic-syntheses' in account 'your-account'
Created your new D1 database.

[[d1_databases]]
binding = "SYNTHESES_DB"
database_name = "akashic-syntheses"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copy the `database_id` value.

## Step 4: Create KV Namespace

KV is Cloudflare's key-value storage. Create one for player sessions:

```bash
wrangler kv:namespace create "PLAYER_SESSIONS"
```

You'll see output like:
```
✅ Successfully created namespace with ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "PLAYER_SESSIONS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Important**: Copy the `id` value.

## Step 5: Update Worker Configuration

Navigate to the workers directory:
```bash
cd workers
```

Edit `wrangler.toml` and replace the placeholder IDs:

```toml
name = "akashic-plains-multiplayer"
main = "websocket-gateway.ts"
compatibility_date = "2024-01-01"

# Durable Objects binding
[[durable_objects.bindings]]
name = "WORLD_STATE"
class_name = "WorldState"
script_name = "akashic-plains-multiplayer"

# D1 Database for syntheses
[[d1_databases]]
binding = "SYNTHESES_DB"
database_name = "akashic-syntheses"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- Replace this

# KV Namespace for player sessions
[[kv_namespaces]]
binding = "PLAYER_SESSIONS"
id = "YOUR_KV_NAMESPACE_ID_HERE"  # <-- Replace this

# WebSocket configuration
[env.production]
vars = { WEBSOCKET_MAX_CONNECTIONS = "1000" }
```

## Step 6: Run Database Migrations

Create the database tables:

```bash
wrangler d1 execute akashic-syntheses --file=./schema.sql
```

You should see:
```
✅ Successfully executed SQL queries
```

## Step 7: Deploy the Worker

Deploy your WebSocket server to Cloudflare:

```bash
wrangler deploy
```

You'll see output like:
```
Uploaded akashic-plains-multiplayer (X.XX sec)
Published akashic-plains-multiplayer (X.XX sec)
  https://akashic-plains-multiplayer.your-subdomain.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Important**: Copy the worker URL (e.g., `https://akashic-plains-multiplayer.your-subdomain.workers.dev`)

## Step 8: Update Frontend WebSocket URL

Go back to your main project directory:
```bash
cd ..
```

Edit `src/CenteredSemanticGame.ts` and update the WebSocket URL:

```typescript
const wsUrl = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8787' 
  : 'wss://akashic-plains-multiplayer.your-subdomain.workers.dev';  // <-- Update this
```

## Step 9: Build and Deploy Frontend

Build the frontend with the updated WebSocket URL:

```bash
npm run build
```

Commit and push your changes:
```bash
git add .
git commit -m "Add multiplayer support with global discovery feed"
git push
```

Cloudflare Pages will automatically rebuild and deploy.

## Step 10: Verify Deployment

1. Visit your Cloudflare Pages URL
2. Open browser console (F12)
3. Look for: `🌐 Multiplayer: Connected`
4. Open the game in another browser/tab
5. You should see the online player count increase

## Testing Multiplayer Features

### Test Player Synchronization
1. Open the game in two browser windows
2. Move in one window
3. You should see the other player as a ☺ symbol

### Test Discovery Feed
1. Discover a new concept
2. Check the Global Discoveries feed (top-right)
3. The discovery should appear in both windows

### Test Synthesis Sharing
1. Bookmark 2+ concepts and create a synthesis
2. Note the coordinates (e.g., "QC-140-120")
3. In the other window, press T and enter the coordinates
4. You should teleport to the synthesis location

## Monitoring and Debugging

### View Worker Logs
```bash
wrangler tail
```

### Check D1 Database
```bash
wrangler d1 execute akashic-syntheses --command="SELECT COUNT(*) FROM syntheses"
```

### Monitor WebSocket Connections
In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View Analytics tab

## Troubleshooting

### "WebSocket connection failed"
- Check if worker is deployed: `wrangler deployments list`
- Verify WebSocket URL in frontend code
- Check browser console for CORS errors

### "Database error"
- Ensure migrations ran: Re-run `wrangler d1 execute`
- Check worker logs: `wrangler tail`

### "Players not visible"
- Verify both players are connected (check online count)
- Ensure players are within view distance (20 tiles)
- Check network tab for WebSocket messages

## Production Optimizations

### Enable Caching
Add to `wrangler.toml`:
```toml
[build]
command = ""
[build.upload]
format = "service-worker"
```

### Set Rate Limits
Update worker code to add rate limiting per player.

### Enable Analytics
```bash
wrangler analytics enable
```

## Cost Considerations

With Cloudflare's free tier:
- 100,000 requests/day
- 1GB D1 storage
- 1,000 KV operations/day
- Unlimited bandwidth

This should handle hundreds of concurrent players.

## Next Steps

1. **Custom Domain**: Add a custom domain in Cloudflare Pages settings
2. **Monitoring**: Set up alerts for worker errors
3. **Backup**: Schedule D1 database backups
4. **Scaling**: Consider regional Workers for global players

## Congratulations! 🎉

You've successfully deployed Akashic Plains with full multiplayer support. Players around the world can now explore the semantic landscape together, discovering concepts and creating syntheses that persist in the shared desert of knowledge.

Welcome to the infinite plains, where meaning crystallizes in the sand.