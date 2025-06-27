export interface SavedGameState {
  playerPosition: { x: number; y: number };
  discoveredConcepts: string[];
  visitedTiles: Array<{ x: number; y: number }>;
  bookmarks: string[];
  createdSyntheses: string[];
  statistics: {
    totalSteps: number;
    conceptsDiscovered: number;
    synthesesCreated: number;
    playTime: number;
  };
}

export class PersistenceManager {
  private dbName = 'AkashicPlainsDB';
  private version = 1;
  private db?: IDBDatabase;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Game saves
        if (!db.objectStoreNames.contains('saves')) {
          const saveStore = db.createObjectStore('saves', { keyPath: 'id' });
          saveStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Global syntheses
        if (!db.objectStoreNames.contains('globalSyntheses')) {
          const synthStore = db.createObjectStore('globalSyntheses', { keyPath: 'id' });
          synthStore.createIndex('coordinates', 'coordinates', { unique: true });
          synthStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Discovered concepts cache
        if (!db.objectStoreNames.contains('conceptCache')) {
          const conceptStore = db.createObjectStore('conceptCache', { keyPath: 'id' });
          conceptStore.createIndex('word', 'word', { unique: false });
        }
      };
    });
  }
  
  async saveGame(state: SavedGameState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['saves'], 'readwrite');
    const store = transaction.objectStore('saves');
    
    const save = {
      id: 'current',
      timestamp: Date.now(),
      ...state
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(save);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async loadGame(): Promise<SavedGameState | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['saves'], 'readonly');
    const store = transaction.objectStore('saves');
    
    return new Promise((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveGlobalSynthesis(synthesis: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['globalSyntheses'], 'readwrite');
    const store = transaction.objectStore('globalSyntheses');
    
    return new Promise((resolve, reject) => {
      const request = store.put(synthesis);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async loadGlobalSyntheses(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['globalSyntheses'], 'readonly');
    const store = transaction.objectStore('globalSyntheses');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveConcept(concept: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['conceptCache'], 'readwrite');
    const store = transaction.objectStore('conceptCache');
    
    return new Promise((resolve, reject) => {
      const request = store.put(concept);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getConceptByWord(word: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['conceptCache'], 'readonly');
    const store = transaction.objectStore('conceptCache');
    const index = store.index('word');
    
    return new Promise((resolve, reject) => {
      const request = index.get(word);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}