import './style.css';
import './semantic-explorer.css';
import { SemanticExplorerGame } from './SemanticExplorerGame';

class AkashicPlainsApp {
  private game?: SemanticExplorerGame;
  private apiKey?: string;
  private seedConcept?: string;
  
  constructor() {
    this.init();
  }
  
  private init() {
    this.render();
  }
  
  private render() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    
    if (!this.apiKey) {
      app.innerHTML = this.renderApiKeyScreen();
      this.setupApiKeyHandlers();
    } else if (!this.seedConcept) {
      app.innerHTML = this.renderSeedScreen();
      this.setupSeedHandlers();
    } else {
      // Game is rendered by SemanticExplorerGame itself
      if (!this.game) {
        app.innerHTML = '<div>Loading...</div>';
      }
    }
  }
  
  private renderApiKeyScreen(): string {
    return `
      <div class="setup-screen">
        <div class="setup-container">
          <pre class="ascii-title">
     ___   _  __   ___   ____  _   _ ___ ____   ____  _        _    ___ _   _ ____  
    / _ \\ | |/ /  / _ \\ / ___|| | | |_ _/ ___| |  _ \\| |      / \\  |_ _| \\ | / ___| 
   / /_\\ \\| ' /  / /_\\ \\\\___  \\| |_| || | |     | |_) | |     / _ \\  | ||  \\| \\___ \\ 
  / /_____| . \\ / /_____\\_____) |  _  || | |___  |  __/| |___ / ___ \\ | || |\\  |___) |
  \\____|  |_|\\_\\\\____|  |______|_| |_|___\\____| |_|   |_____/_/   \\_\\___|_| \\_|____/ 
          </pre>
          
          <h2 class="setup-title">SEMANTIC TOPOLOGY ENGINE</h2>
          
          <p class="setup-description">
            Enter your Anthropic API key to begin exploring the infinite semantic landscape.
            Your key is stored locally and never sent to any server.
          </p>
          
          <input 
            type="password" 
            class="api-key-input" 
            placeholder="sk-ant-api03-..." 
            autocomplete="off"
          />
          
          <button class="setup-button" id="api-key-submit">
            INITIALIZE TOPOLOGY ENGINE
          </button>
          
          <div class="setup-note">
            Need an API key? Get one at 
            <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderSeedScreen(): string {
    return `
      <div class="setup-screen">
        <div class="setup-container">
          <h2 class="setup-title">CHOOSE YOUR ORIGIN CONCEPT</h2>
          
          <p class="setup-description">
            Select a seed concept to generate your initial semantic landscape.
            The topology will expand based on conceptual relationships.
          </p>
          
          <input 
            type="text" 
            class="seed-input" 
            placeholder="consciousness" 
            value="consciousness"
            autocomplete="off"
          />
          
          <div class="seed-suggestions">
            <div class="suggestion-group">
              <button class="suggestion-btn" data-concept="consciousness">consciousness</button>
              <button class="suggestion-btn" data-concept="emergence">emergence</button>
              <button class="suggestion-btn" data-concept="complexity">complexity</button>
              <button class="suggestion-btn" data-concept="information">information</button>
              <button class="suggestion-btn" data-concept="entropy">entropy</button>
              <button class="suggestion-btn" data-concept="intelligence">intelligence</button>
            </div>
          </div>
          
          <button class="setup-button" id="seed-submit">
            GENERATE SEMANTIC TOPOLOGY
          </button>
        </div>
      </div>
    `;
  }
  
  private setupApiKeyHandlers() {
    const input = document.querySelector<HTMLInputElement>('.api-key-input');
    const button = document.querySelector<HTMLButtonElement>('#api-key-submit');
    
    if (input && button) {
      const handleSubmit = () => {
        const key = input.value.trim();
        if (key) {
          this.apiKey = key;
          localStorage.setItem('akashic-api-key', key);
          this.render();
        }
      };
      
      button.addEventListener('click', handleSubmit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });
    }
  }
  
  private setupSeedHandlers() {
    const input = document.querySelector<HTMLInputElement>('.seed-input');
    const button = document.querySelector<HTMLButtonElement>('#seed-submit');
    const suggestions = document.querySelectorAll<HTMLButtonElement>('.suggestion-btn');
    
    suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        if (input) {
          input.value = btn.dataset.concept || '';
        }
      });
    });
    
    if (input && button) {
      const handleSubmit = async () => {
        const concept = input.value.trim() || 'consciousness';
        button.disabled = true;
        button.textContent = 'GENERATING TOPOLOGY...';
        
        try {
          this.seedConcept = concept;
          this.game = new SemanticExplorerGame(this.apiKey!, 'Explorer');
          await this.game.initialize(concept);
          // Game renders itself, no need to call render()
        } catch (error) {
          console.error('Failed to initialize:', error);
          button.disabled = false;
          button.textContent = 'GENERATE SEMANTIC TOPOLOGY';
          alert('Failed to generate topology. Please check your API key and try again.');
        }
      };
      
      button.addEventListener('click', handleSubmit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });
    }
  }
  
}

// Check for saved API key
const savedKey = localStorage.getItem('akashic-api-key');
if (savedKey) {
  console.log('Found saved API key');
}

// Start the app
new AkashicPlainsApp();