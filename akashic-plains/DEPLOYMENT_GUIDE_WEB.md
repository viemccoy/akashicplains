# Akashic Plains - Web Portal Deployment Guide (No Wrangler)

This guide shows you how to deploy the multiplayer functionality using only the Cloudflare web dashboard - no command line needed!

## Prerequisites

- Cloudflare account (free tier works)
- Your Akashic Plains code ready
- Cloudflare Pages already deployed (which you have)

## Step 1: Create D1 Database

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. In the left sidebar, click **Workers & Pages**
3. Click the **D1** tab at the top
4. Click **Create database**
5. Name it: `akashic-syntheses`
6. Click **Create**

Once created:
- Click on your new database
- Copy the **Database ID** (you'll need this later)

## Step 2: Initialize Database Tables

1. While viewing your D1 database, click **Console** tab
2. Click **Execute query**
3. Copy and paste the entire contents of `workers/schema.sql`:

```sql
-- Paste the schema.sql content here
CREATE TABLE IF NOT EXISTS syntheses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  revelation TEXT,
  symbol TEXT,
  source_words TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  discovered_by TEXT NOT NULL,
  coordinates TEXT NOT NULL
);

-- ... (paste all the SQL from schema.sql)
```

4. Click **Execute**
5. You should see "Query executed successfully"

## Step 3: Create KV Namespace

1. In the Workers & Pages section, click **KV** tab
2. Click **Create namespace**
3. Name it: `PLAYER_SESSIONS`
4. Click **Create**
5. Copy the **Namespace ID** (you'll need this later)

## Step 4: Create the Worker

1. In Workers & Pages, click **Create application**
2. Select **Create Worker**
3. Name it: `akashic-plains-multiplayer`
4. Click **Deploy**

## Step 5: Configure Worker Settings

1. Click on your new worker
2. Go to **Settings** tab
3. Click **Variables** in the left menu

### Add KV Namespace Binding:
1. Under **KV Namespace Bindings**, click **Add binding**
2. Variable name: `PLAYER_SESSIONS`
3. KV namespace: Select `PLAYER_SESSIONS` from dropdown
4. Click **Save**

### Add D1 Database Binding:
1. Under **D1 Database Bindings**, click **Add binding**
2. Variable name: `SYNTHESES_DB`
3. D1 database: Select `akashic-syntheses` from dropdown
4. Click **Save**

### Add Durable Object Binding:
1. Under **Durable Object Bindings**, click **Add binding**
2. Variable name: `WORLD_STATE`
3. Durable Object class: `WorldState`
4. Script: `akashic-plains-multiplayer` (this worker)
5. Click **Save**

## Step 6: Add Worker Code

1. Go back to your worker's main page
2. Click **Quick edit**
3. Delete all the default code
4. Copy the entire contents of `workers/websocket-gateway.ts`
5. Paste it into the editor

### Important Code Modifications:

At the very top of the code, add this export to make the Durable Object available:

```typescript
export { WorldState } from "./websocket-gateway";
```

Also, ensure the Env interface matches your bindings:

```typescript
export interface Env {
  WORLD_STATE: DurableObjectNamespace;
  SYNTHESES_DB: D1Database;
  PLAYER_SESSIONS: KVNamespace;
}
```

6. Click **Save and deploy**

## Step 7: Enable Durable Objects

1. In your worker settings, go to **Durable Objects**
2. You should see `WorldState` listed
3. If not, click **Create Durable Object class**:
   - Name: `WorldState`
   - Click **Create**

## Step 8: Update Frontend Code

1. In your local code, edit `src/CenteredSemanticGame.ts`
2. Find the WebSocket URL configuration
3. Update it with your worker URL:

```typescript
const wsUrl = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8787' 
  : 'wss://akashic-plains-multiplayer.YOUR-SUBDOMAIN.workers.dev';
```

Your worker URL is shown in the worker dashboard, typically:
`https://akashic-plains-multiplayer.YOUR-SUBDOMAIN.workers.dev`

4. Build your project: `npm run build`
5. Commit and push to trigger Cloudflare Pages rebuild

## Step 9: Test WebSocket Connection

1. Go to your worker dashboard
2. Click **Logs** → **Begin log stream**
3. Open your Akashic Plains game
4. You should see WebSocket connection logs

## Alternative: Using Worker Editor for Multiple Files

If you need to organize the code better:

1. In the worker editor, click the **+** icon to add files
2. Create separate files for different classes
3. Use ES modules imports/exports

Example structure:
```
worker.js (main file)
├── worldState.js
├── types.js
└── utils.js
```

## Monitoring Your Deployment

### View Real-time Logs
1. Go to your worker
2. Click **Logs** → **Begin log stream**
3. Watch connections and messages in real-time

### Check Database Contents
1. Go to your D1 database
2. Click **Console**
3. Run queries like:
   ```sql
   SELECT COUNT(*) FROM syntheses;
   SELECT * FROM syntheses ORDER BY created_at DESC LIMIT 10;
   ```

### Monitor Usage
1. Go to your worker
2. Click **Analytics**
3. View requests, errors, and performance

## Troubleshooting

### "Failed to fetch" errors
- Check that your worker URL is correct in the frontend
- Ensure the worker is deployed (green status)
- Check CORS headers in worker code

### Database errors
- Verify D1 binding name matches code (`SYNTHESES_DB`)
- Check that tables were created (run SELECT query)
- Look at worker logs for specific errors

### WebSocket won't connect
- Make sure URL uses `wss://` (not `https://`)
- Check browser console for errors
- Verify Durable Objects are enabled

## Advantages of Web Portal Method

✅ **No command line needed** - Everything in the browser  
✅ **Visual interface** - See your configuration clearly  
✅ **Integrated logs** - Real-time debugging in dashboard  
✅ **Easy rollbacks** - Version history for worker code  
✅ **No local setup** - Deploy from any computer  

## Next Steps

1. **Custom domain**: Add in Pages settings
2. **Environment variables**: Add API keys in worker settings
3. **Backup automation**: Schedule D1 exports
4. **Usage alerts**: Set up in Analytics

## Tips

- Keep the worker editor open while testing for quick fixes
- Use the "Preview" feature before deploying changes
- Save your worker code locally as backup
- Check the Cloudflare status page if things aren't working

You've now deployed Akashic Plains multiplayer without touching the command line! 🎉

Players can explore the semantic desert together, with all discoveries and syntheses shared globally through Cloudflare's edge network.