export type ErrorType = 'api' | 'network' | 'storage' | 'game' | 'unknown';

export interface GameError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

export class ErrorHandler {
  private errorLog: GameError[] = [];
  private maxRetries = 3;
  private retryDelays = [1000, 3000, 5000];
  
  async handleError(error: any, context: string): Promise<void> {
    const gameError = this.categorizeError(error, context);
    this.errorLog.push(gameError);
    
    console.error(`[${gameError.type}] ${context}:`, gameError.message, gameError.details);
    
    // Show user-friendly notification
    this.showErrorNotification(gameError);
    
    // Log to remote service in production
    if (this.shouldLogRemotely(gameError)) {
      this.logToRemote(gameError);
    }
  }
  
  private categorizeError(error: any, context: string): GameError {
    const timestamp = Date.now();
    
    // API errors
    if (error.message?.includes('API') || error.message?.includes('Claude')) {
      return {
        type: 'api',
        message: 'Failed to connect to AI service',
        details: error,
        timestamp,
        retryable: true
      };
    }
    
    // Network errors
    if (error.message?.includes('fetch') || error.code === 'NETWORK_ERROR') {
      return {
        type: 'network',
        message: 'Network connection issue',
        details: error,
        timestamp,
        retryable: true
      };
    }
    
    // Storage errors
    if (error.message?.includes('IndexedDB') || error.message?.includes('storage')) {
      return {
        type: 'storage',
        message: 'Failed to save/load game data',
        details: error,
        timestamp,
        retryable: true
      };
    }
    
    // Game logic errors
    if (context.includes('game') || context.includes('engine')) {
      return {
        type: 'game',
        message: 'Game error occurred',
        details: error,
        timestamp,
        retryable: false
      };
    }
    
    // Unknown errors
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
      details: error,
      timestamp,
      retryable: false
    };
  }
  
  async retry<T>(
    operation: () => Promise<T>,
    context: string,
    retryCount: number = 0
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const gameError = this.categorizeError(error, context);
      
      if (gameError.retryable && retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount] || 5000;
        console.log(`Retrying ${context} in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(operation, context, retryCount + 1);
      }
      
      await this.handleError(error, context);
      return null;
    }
  }
  
  private showErrorNotification(error: GameError) {
    const notifications = {
      api: {
        title: 'AI Connection Issue',
        message: 'Unable to generate new concepts. Using cached data.',
        icon: '⚠️'
      },
      network: {
        title: 'Network Issue',
        message: 'Check your internet connection.',
        icon: '🔌'
      },
      storage: {
        title: 'Save Error',
        message: 'Unable to save game progress.',
        icon: '💾'
      },
      game: {
        title: 'Game Error',
        message: 'Something went wrong. Please refresh.',
        icon: '🎮'
      },
      unknown: {
        title: 'Error',
        message: error.message,
        icon: '❌'
      }
    };
    
    const notification = notifications[error.type];
    this.displayNotification(notification);
  }
  
  private displayNotification(notification: any) {
    const div = document.createElement('div');
    div.className = 'error-notification';
    div.innerHTML = `
      <span class="error-icon">${notification.icon}</span>
      <div class="error-content">
        <div class="error-title">${notification.title}</div>
        <div class="error-message">${notification.message}</div>
      </div>
    `;
    
    document.body.appendChild(div);
    
    setTimeout(() => {
      div.classList.add('fade-out');
      setTimeout(() => div.remove(), 500);
    }, 5000);
  }
  
  private shouldLogRemotely(error: GameError): boolean {
    // Only log serious errors in production
    return error.type === 'game' || error.type === 'unknown';
  }
  
  private async logToRemote(error: GameError) {
    // In production, send to error tracking service
    console.log('Would log to remote:', error);
  }
  
  getErrorLog(): GameError[] {
    return this.errorLog;
  }
  
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Add CSS for error notifications
const style = document.createElement('style');
style.textContent = `
.error-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #FF0000;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 10000;
  animation: slide-down 0.3s ease-out;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
}

.error-notification.fade-out {
  animation: fade-out 0.5s ease-out forwards;
}

.error-icon {
  font-size: 24px;
}

.error-content {
  color: #F4E8D0;
}

.error-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #FFB000;
}

.error-message {
  font-size: 12px;
  opacity: 0.8;
}

@keyframes slide-down {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes fade-out {
  to {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
}
`;
document.head.appendChild(style);