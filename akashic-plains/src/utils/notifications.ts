export type NotificationType = 'discovery' | 'synthesis' | 'achievement' | 'info';

export class NotificationManager {
  show(message: string, type: NotificationType = 'info', duration: number = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.style.animation = 'slide-out 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
  
  showDiscovery(siteName: string, siteType: string) {
    const messages = {
      temple: `You have discovered an Ancient Temple of ${siteName}!`,
      pyramid: `A Sacred Pyramid of ${siteName} rises from the sands!`,
      oasis: `You've found a Mystical Oasis of ${siteName}!`,
      crystals: `Crystal formations of ${siteName} shimmer before you!`,
      obelisk: `An Enigmatic Obelisk of ${siteName} pierces the sky!`
    };
    
    this.show(
      messages[siteType as keyof typeof messages] || `You've discovered ${siteName}!`,
      'discovery',
      6000
    );
  }
  
  showSynthesis(crystalName: string) {
    this.show(
      `✧ ${crystalName} has crystallized in the desert! ✧`,
      'synthesis',
      8000
    );
  }
  
  showAchievement(achievement: string) {
    this.show(
      `Achievement Unlocked: ${achievement}`,
      'achievement',
      6000
    );
  }
}

// Add slide-out animation to the document
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);