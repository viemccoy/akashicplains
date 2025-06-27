export function renderAPIKeyScreen(): string {
  return `
    <div class="api-key-screen">
      <div class="api-key-container">
        <pre class="ascii-title">
╔═══════════════════════════════════════════════════════════════╗
║     ___   _  __   ___   ____  _   _ ___ ____                 ║
║    / _ \\ | |/ /  / _ \\ / ___|| | | |_ _/ ___|                ║
║   | |_| || ' /  | |_| |\\___ \\| |_| || | |                    ║
║   |  _  || . \\  |  _  | ___) |  _  || | |___                 ║
║   |_| |_||_|\\_\\ |_| |_||____/|_| |_|___\\____|                ║
║                                                               ║
║   ____  _        _    ___ _   _ ____                         ║
║  |  _ \\| |      / \\  |_ _| \\ | / ___|                        ║
║  | |_) | |     / _ \\  | ||  \\| \\___ \\                        ║
║  |  __/| |___ / ___ \\ | || |\\  |___) |                       ║
║  |_|   |_____/_/   \\_\\___|_| \\_|____/                        ║
║                                                               ║
║          Where Knowledge Crystallizes in Sand                 ║
╚═══════════════════════════════════════════════════════════════╝
        </pre>
        
        <h1 class="api-key-title">Enter the Sacred Key</h1>
        
        <div class="api-key-description">
          Welcome, wanderer. To traverse the infinite desert of knowledge,<br>
          you must provide your Claude API key. This key opens the gates<br>
          to the Akashic Records, where all wisdom awaits discovery.
        </div>
        
        <input 
          type="password" 
          class="api-key-input" 
          placeholder="sk-ant-api..." 
          autocomplete="off"
          spellcheck="false"
        />
        
        <button class="button">Begin Your Journey</button>
        
        <div class="api-key-description" style="margin-top: 30px; font-size: 12px; opacity: 0.7;">
          Your key is stored locally and never sent to any server.<br>
          Visit <a href="https://console.anthropic.com/api-keys" target="_blank" style="color: var(--color-cyan);">console.anthropic.com</a> to obtain your key.
        </div>
      </div>
    </div>
  `;
}