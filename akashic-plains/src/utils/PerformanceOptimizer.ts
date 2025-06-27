export class PerformanceOptimizer {
  private frameTimeTarget = 16.67; // 60 FPS
  private renderQueue: Array<() => void> = [];
  private isProcessing = false;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;
  
  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
      
      if (timeSinceLastCall >= delay) {
        lastCall = now;
        func(...args);
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          func(...args);
        }, delay - timeSinceLastCall);
      }
    };
  }
  
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
  
  // Batch DOM updates
  batchUpdate(updateFn: () => void) {
    this.renderQueue.push(updateFn);
    
    if (!this.isProcessing) {
      this.isProcessing = true;
      requestAnimationFrame(() => this.processQueue());
    }
  }
  
  private processQueue() {
    const startTime = performance.now();
    
    while (this.renderQueue.length > 0 && 
           performance.now() - startTime < this.frameTimeTarget) {
      const update = this.renderQueue.shift();
      update?.();
    }
    
    if (this.renderQueue.length > 0) {
      requestAnimationFrame(() => this.processQueue());
    } else {
      this.isProcessing = false;
    }
    
    // Update FPS counter
    this.updateFPS();
  }
  
  private updateFPS() {
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.lastFrameTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }
  
  getFPS(): number {
    return this.fps;
  }
  
  // Lazy load concepts
  createLazyLoader<T>(
    loadFn: (item: T) => Promise<void>,
    batchSize: number = 10
  ): (items: T[]) => Promise<void> {
    return async (items: T[]) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(item => loadFn(item)));
        
        // Give browser time to breathe
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
  }
  
  // Memoize expensive calculations
  memoize<T extends (...args: any[]) => any>(
    func: T,
    maxCacheSize: number = 100
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      
      // Limit cache size
      if (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    }) as T;
  }
  
  // Object pool for frequent allocations
  createObjectPool<T>(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10
  ) {
    const pool: T[] = [];
    const active = new Set<T>();
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn());
    }
    
    return {
      acquire(): T {
        let obj = pool.pop();
        if (!obj) {
          obj = createFn();
        }
        active.add(obj);
        return obj;
      },
      
      release(obj: T) {
        if (active.has(obj)) {
          active.delete(obj);
          resetFn(obj);
          pool.push(obj);
        }
      },
      
      getStats() {
        return {
          poolSize: pool.length,
          activeCount: active.size,
          totalCreated: pool.length + active.size
        };
      }
    };
  }
  
  // Visibility culling for terrain
  cullInvisibleTiles<T extends { x: number; y: number }>(
    tiles: T[],
    viewCenter: { x: number; y: number },
    viewRadius: number
  ): T[] {
    return tiles.filter(tile => {
      const dx = tile.x - viewCenter.x;
      const dy = tile.y - viewCenter.y;
      return Math.sqrt(dx * dx + dy * dy) <= viewRadius;
    });
  }
  
  // Request idle callback wrapper
  whenIdle(callback: () => void, timeout: number = 1000) {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 16);
    }
  }
}

// Global optimizer instance
export const optimizer = new PerformanceOptimizer();