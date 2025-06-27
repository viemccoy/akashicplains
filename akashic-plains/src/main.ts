import './style.css';
import type { GameState } from './types';
import { initializeGame, GameManager } from './game';
import { renderAPIKeyScreen } from './components/apiKeyScreen';
import { renderGameScreen } from './components/gameScreen';
import { renderLocationInfo } from './components/locationInfo';

let gameState: GameState | null = null;
let gameManager: GameManager | null = null;
let isProcessingMove = false;

function render() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  
  if (!gameState || !gameState.apiKey) {
    app.innerHTML = renderAPIKeyScreen();
    setupAPIKeyHandlers();
  } else {
    app.innerHTML = renderGameScreen(gameState);
    setupGameHandlers();
    updateLocationInfo();
  }
}

function updateLocationInfo() {
  if (!gameManager) return;
  
  const infoPanel = document.querySelector('.info-panel');
  if (infoPanel) {
    const currentLocation = gameManager.getCurrentLocation();
    const nearbyLocations = gameManager.getNearbyLocations();
    infoPanel.innerHTML = renderLocationInfo(currentLocation, nearbyLocations);
  }
}

function setupAPIKeyHandlers() {
  const input = document.querySelector<HTMLInputElement>('.api-key-input');
  const button = document.querySelector<HTMLButtonElement>('.button');
  
  if (input && button) {
    const handleSubmit = async () => {
      const apiKey = input.value.trim();
      if (apiKey) {
        button.disabled = true;
        button.textContent = 'Awakening the desert...';
        
        try {
          gameState = initializeGame(apiKey);
          gameManager = new GameManager(gameState);
          
          // Load initial chunks
          await gameManager.ensureNearbyChunksLoaded();
          
          render();
        } catch (error) {
          console.error('Failed to initialize game:', error);
          button.disabled = false;
          button.textContent = 'Begin Your Journey';
          alert('Failed to connect to the Akashic Records. Please check your API key.');
        }
      }
    };
    
    button.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }
}

function setupGameHandlers() {
  document.addEventListener('keydown', handleKeyPress);
  
  // Setup bookmark handlers
  const bookmarkItems = document.querySelectorAll('.bookmark-item');
  bookmarkItems.forEach(item => {
    item.addEventListener('click', () => {
      const siteId = item.getAttribute('data-site-id');
      if (siteId && gameManager) {
        gameManager.unbookmarkSite(siteId);
        render();
      }
    });
  });
  
  // Setup synthesize button
  const synthesizeBtn = document.querySelector('.synthesize-button');
  if (synthesizeBtn && gameManager) {
    synthesizeBtn.addEventListener('click', handleSynthesize);
  }
}

async function handleKeyPress(e: KeyboardEvent) {
  if (!gameState || !gameManager || isProcessingMove) return;
  
  let dx = 0, dy = 0;
  
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
      dy = -1;
      break;
    case 'ArrowDown':
    case 's':
      dy = 1;
      break;
    case 'ArrowLeft':
    case 'a':
      dx = -1;
      break;
    case 'ArrowRight':
    case 'd':
      dx = 1;
      break;
    case 'b':
      // Bookmark current location
      const location = gameManager.getCurrentLocation();
      if (location) {
        gameManager.bookmarkSite(location);
        render();
      }
      return;
    default:
      return;
  }
  
  e.preventDefault();
  
  // Process move
  isProcessingMove = true;
  try {
    await gameManager.movePlayer(dx, dy);
    gameState = gameManager.getState();
    render();
  } catch (error) {
    console.error('Movement failed:', error);
  } finally {
    isProcessingMove = false;
  }
}

async function handleSynthesize() {
  if (!gameManager || !gameManager.canSynthesize()) return;
  
  // TODO: Implement synthesis
  console.log('Synthesis not yet implemented');
}

// Energy regeneration
setInterval(() => {
  if (gameState && gameState.energy < gameState.maxEnergy) {
    gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 0.1);
    
    // Update energy bar
    const energyFill = document.querySelector('.energy-fill') as HTMLElement;
    if (energyFill) {
      const percent = (gameState.energy / gameState.maxEnergy) * 100;
      energyFill.style.width = `${percent}%`;
    }
  }
}, 1000);

// Initial render
render();