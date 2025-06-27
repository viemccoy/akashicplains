# Akashic Plains - Where Knowledge Crystallizes in Sand

A mystical ASCII semantic explorer where users traverse an infinite desert of knowledge rendered in terminal aesthetics. Powered by Claude AI, each step reveals new concepts and sacred sites of wisdom.

## Features

- **Infinite Procedural Generation**: AI-generated terrain that adapts based on explored concepts
- **Sacred Site Discovery**: Find temples, pyramids, oases, and mysterious obelisks
- **Knowledge Synthesis**: Combine discovered concepts to create crystallized wisdom
- **90s Terminal Aesthetics**: CRT effects, phosphor glow, and ASCII art
- **Day/Night Cycle**: Experience the desert across different times with varying effects
- **Particle Effects**: Sand particles drift across the screen, with special effects for discoveries
- **Local Save System**: Your journey persists across sessions
- **Energy Management**: Balance exploration with mystical energy consumption

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Deployment to Cloudflare Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Cloudflare Pages
3. No environment variables needed - users provide their own Claude API keys

## How to Play

1. **Enter Your Claude API Key**: Get one from [console.anthropic.com](https://console.anthropic.com)
2. **Explore**: Use WASD or arrow keys to move through the desert
3. **Discover**: Find sacred sites that reveal ancient wisdom
4. **Bookmark**: Press 'B' at any sacred site to bookmark it
5. **Synthesize**: With 2+ bookmarks and 30 energy, create new crystallized wisdom

## Controls

- **Movement**: WASD or Arrow Keys
- **Bookmark**: B (when at a sacred site)
- **Cancel**: ESC (in modals)

## Architecture

The game is built with:
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Claude AI** for dynamic content generation
- **LocalStorage** for game persistence
- **Pure CSS** for all visual effects

## Security Note

API keys are stored only in the browser's memory and localStorage. They are never sent to any server except Anthropic's API directly from the browser.

## License

MIT