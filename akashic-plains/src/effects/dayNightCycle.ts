export type TimeOfDay = 'day' | 'dusk' | 'night' | 'dawn';

export class DayNightCycle {
  private currentTime: TimeOfDay = 'day';
  private cycleInterval?: ReturnType<typeof setTimeout>;
  private onTimeChange?: (time: TimeOfDay) => void;
  
  // Duration of each phase in milliseconds (shorter for demo, extend for production)
  private phaseDurations = {
    day: 120000,    // 2 minutes
    dusk: 30000,    // 30 seconds
    night: 120000,  // 2 minutes
    dawn: 30000     // 30 seconds
  };
  
  constructor(onTimeChange?: (time: TimeOfDay) => void) {
    this.onTimeChange = onTimeChange;
  }
  
  start() {
    this.updateTime();
    this.scheduleNextPhase();
  }
  
  stop() {
    if (this.cycleInterval) {
      clearTimeout(this.cycleInterval);
    }
  }
  
  getCurrentTime(): TimeOfDay {
    return this.currentTime;
  }
  
  private scheduleNextPhase() {
    const duration = this.phaseDurations[this.currentTime];
    
    this.cycleInterval = setTimeout(() => {
      this.advanceTime();
      this.scheduleNextPhase();
    }, duration);
  }
  
  private advanceTime() {
    const progression: Record<TimeOfDay, TimeOfDay> = {
      day: 'dusk',
      dusk: 'night',
      night: 'dawn',
      dawn: 'day'
    };
    
    this.currentTime = progression[this.currentTime];
    this.updateTime();
  }
  
  private updateTime() {
    const container = document.querySelector('.terminal-container');
    if (container) {
      // Remove all time classes
      container.classList.remove('day', 'dusk', 'night', 'dawn');
      // Add current time class
      container.classList.add(this.currentTime);
    }
    
    // Call the callback if provided
    if (this.onTimeChange) {
      this.onTimeChange(this.currentTime);
    }
    
    // Update any time-specific text
    this.updateTimeBasedElements();
  }
  
  private updateTimeBasedElements() {
    // Update visibility and energy regeneration based on time
    const modifiers = {
      day: { visibility: 1.0, energyRegen: 1.0 },
      dusk: { visibility: 0.8, energyRegen: 0.9 },
      night: { visibility: 0.6, energyRegen: 1.2 }, // Better energy regen at night
      dawn: { visibility: 0.8, energyRegen: 1.1 }
    };
    
    const modifier = modifiers[this.currentTime];
    
    // Store modifiers for game logic
    (window as any).timeModifiers = modifier;
  }
  
  // Get a descriptive message for the current time
  getTimeDescription(): string {
    const descriptions = {
      day: "The desert sun blazes overhead, revealing all in harsh clarity.",
      dusk: "Shadows lengthen as the sun descends toward the horizon.",
      night: "Stars pierce the darkness, and the desert whispers ancient secrets.",
      dawn: "The first light breaks the darkness, painting the sands in gold."
    };
    
    return descriptions[this.currentTime];
  }
}