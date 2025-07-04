import './style.css';
import type { GameState } from './types';
import { initializeGame } from './game';
import { SemanticGameManager } from './game/semanticGameManager';
import { renderAPIKeyScreen } from './components/apiKeyScreen';
import { renderSeedConceptScreen } from './components/seedConceptScreen';
import { renderGameScreen } from './components/gameScreen';
import { renderSemanticTerrainView } from './components/semanticTerrainView';
import { renderSynthesisModal } from './components/synthesisModal';
import { NotificationManager } from './utils/notifications';
import { StorageManager } from './utils/storage';
import { ParticleSystem } from './effects/particles';
import { DayNightCycle } from './effects/dayNightCycle';

let gameState: GameState | null = null;
let gameManager: SemanticGameManager | null = null;
let isProcessingMove = false;
let showingSynthesisModal = false;
let tempApiKey: string | null = null;
let showingSeedScreen = false;

// Initialize systems
const notifications = new NotificationManager();
const storage = new StorageManager();
const particles = new ParticleSystem();
const dayNight = new DayNightCycle(() => {
  // Update UI based on time of day
  // Could show time description in the UI somewhere
});

function render() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  
  if (!gameState || !gameState.apiKey) {
    if (showingSeedScreen && tempApiKey) {
      app.innerHTML = renderSeedConceptScreen();
      setupSeedConceptHandlers();
    } else {
      app.innerHTML = renderAPIKeyScreen();
      setupAPIKeyHandlers();
    }
  } else {
    app.innerHTML = renderGameScreen(gameState);
    
    // Add synthesis modal if showing
    if (showingSynthesisModal) {
      app.insertAdjacentHTML('beforeend', renderSynthesisModal(gameState.bookmarkedSites));
      setupSynthesisHandlers();
    }
    
    setupGameHandlers();
    updateLocationInfo();
  }
}

function updateLocationInfo() {
  if (!gameManager) return;
  
  const infoPanel = document.querySelector('.info-panel');
  if (infoPanel && gameState) {
    const currentLocation = gameManager.getCurrentLocation();
    const nearbyLocations = gameManager.getNearbyLocations(10); // Get more concepts
    const terrainInfo = gameManager.getTerrainInfo();
    const conceptMap = gameManager.getConceptMap();
    
    infoPanel.innerHTML = renderSemanticTerrainView(
      currentLocation, 
      nearbyLocations,
      terrainInfo,
      gameState.playerPosition,
      gameState.visitedChunks,
      conceptMap
    );
  }
}

function setupAPIKeyHandlers() {
  const input = document.querySelector<HTMLInputElement>('.api-key-input');
  const button = document.querySelector<HTMLButtonElement>('.button');
  
  if (input && button) {
    // Check for saved game
    if (storage.hasSave()) {
      const loadButton = document.createElement('button');
      loadButton.className = 'button';
      loadButton.textContent = 'Load Previous Journey';
      loadButton.style.marginTop = '10px';
      button.parentElement?.appendChild(loadButton);
      
      loadButton.addEventListener('click', () => {
        const apiKey = input.value.trim();
        if (apiKey) {
          const loadedState = storage.loadGameState(apiKey);
          if (loadedState) {
            gameState = loadedState;
            gameManager = new SemanticGameManager(gameState);
            notifications.show('Welcome back, wanderer...', 'info');
            render();
          }
        }
      });
    }
    
    const handleSubmit = () => {
      const apiKey = input.value.trim();
      if (apiKey) {
        // Store API key and show seed concept screen
        tempApiKey = apiKey;
        showingSeedScreen = true;
        render();
      }
    };
    
    button.addEventListener('click', handleSubmit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }
}

function setupSeedConceptHandlers() {
  const input = document.querySelector<HTMLInputElement>('.seed-input');
  const button = document.getElementById('begin-journey') as HTMLButtonElement;
  const suggestions = document.querySelectorAll('.suggestion');
  
  if (input && button && tempApiKey) {
    const handleBegin = async () => {
      const seedConcept = input.value.trim() || 'consciousness';
      
      button.disabled = true;
      button.textContent = 'The desert stirs...';
      
      try {
        gameState = initializeGame(tempApiKey!);
        gameState.seedConcept = seedConcept;
        gameManager = new SemanticGameManager(gameState);
        
        // Load initial chunks
        await gameManager.ensureNearbyChunksLoaded();
        
        // Start effects
        particles.start();
        dayNight.start();
        
        notifications.show(`The desert awakens to the concept of ${seedConcept}...`, 'info');
        showingSeedScreen = false;
        render();
      } catch (error) {
        console.error('Failed to initialize game:', error);
        button.disabled = false;
        button.textContent = 'Enter the Desert';
        alert('Failed to awaken the desert. Please try again.');
      }
    };
    
    button.addEventListener('click', handleBegin);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleBegin();
    });
    
    // Handle suggestion clicks
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        input.value = suggestion.getAttribute('data-concept') || '';
        input.focus();
      });
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
    synthesizeBtn.addEventListener('click', () => {
      showingSynthesisModal = true;
      render();
    });
  }
}

function setupSynthesisHandlers() {
  const cancelBtn = document.getElementById('cancel-synthesis');
  const performBtn = document.getElementById('perform-synthesis');
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      showingSynthesisModal = false;
      render();
    });
  }
  
  if (performBtn && gameManager) {
    performBtn.addEventListener('click', async () => {
      // Show processing animation
      const modal = document.querySelector('.synthesis-modal');
      if (modal) {
        modal.classList.add('processing');
        modal.innerHTML = renderSynthesisModal([], true).match(/<div class="crystallization-animation">[\s\S]*<\/div>/)?.[0] || '';
      }
      
      try {
        const synthesis = await gameManager!.performSynthesis();
        if (synthesis) {
          gameState = gameManager!.getState();
          
          // Show notification
          notifications.showSynthesis(synthesis.name);
          
          // Create particle effect at player position
          const mapRect = document.querySelector('.map-viewport')?.getBoundingClientRect();
          if (mapRect) {
            particles.createCrystalFormation(
              mapRect.left + mapRect.width / 2,
              mapRect.top + mapRect.height / 2
            );
          }
          
          showingSynthesisModal = false;
          render();
        }
      } catch (error) {
        console.error('Synthesis failed:', error);
        notifications.show('The synthesis failed... try again with different concepts.', 'info');
        showingSynthesisModal = false;
        render();
      }
    });
  }
}

async function handleKeyPress(e: KeyboardEvent) {
  if (!gameState || !gameManager || isProcessingMove || showingSynthesisModal) return;
  
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
        notifications.show(`Bookmarked: ${location.conceptName}`, 'info');
        render();
      }
      return;
    case 'Escape':
      if (showingSynthesisModal) {
        showingSynthesisModal = false;
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
    const prevLocation = gameManager.getCurrentLocation();
    await gameManager.movePlayer(dx, dy);
    gameState = gameManager.getState();
    
    // Check for new discovery
    const newLocation = gameManager.getCurrentLocation();
    if (newLocation && newLocation !== prevLocation && newLocation.pilgrims === 1) {
      notifications.showDiscovery(newLocation.conceptName, newLocation.siteType);
      
      // Particle burst for discovery
      const mapRect = document.querySelector('.map-viewport')?.getBoundingClientRect();
      if (mapRect) {
        particles.createDiscoveryBurst(
          mapRect.left + mapRect.width / 2,
          mapRect.top + mapRect.height / 2
        );
      }
    }
    
    render();
  } catch (error) {
    console.error('Movement failed:', error);
  } finally {
    isProcessingMove = false;
  }
}

// Energy regeneration
setInterval(() => {
  if (gameState && gameState.energy < gameState.maxEnergy) {
    // Apply time-based modifiers
    const timeModifiers = (window as any).timeModifiers || { energyRegen: 1.0 };
    const regenRate = 0.1 * timeModifiers.energyRegen;
    
    gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + regenRate);
    
    // Update energy bar
    const energyFill = document.querySelector('.energy-fill') as HTMLElement;
    if (energyFill) {
      const percent = (gameState.energy / gameState.maxEnergy) * 100;
      energyFill.style.width = `${percent}%`;
    }
  }
}, 1000);

// Auto-save every 30 seconds
setInterval(() => {
  if (gameState && gameManager) {
    storage.saveGameState(gameState);
  }
}, 30000);

// Save on page unload
window.addEventListener('beforeunload', () => {
  if (gameState) {
    storage.saveGameState(gameState);
  }
});

// Initial render
render();