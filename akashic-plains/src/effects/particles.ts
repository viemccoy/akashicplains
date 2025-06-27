export class ParticleSystem {
  private container: HTMLElement;
  private particles: Set<HTMLElement> = new Set();
  private isRunning: boolean = false;
  
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'particle-container';
    document.body.appendChild(this.container);
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Create initial particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => this.createSandParticle(), i * 200);
    }
    
    // Continuously create new particles
    this.particleInterval = setInterval(() => {
      if (this.particles.size < 30) {
        this.createSandParticle();
      }
    }, 1000);
  }
  
  stop() {
    this.isRunning = false;
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
    }
    
    // Remove all particles
    this.particles.forEach(particle => particle.remove());
    this.particles.clear();
  }
  
  private particleInterval?: ReturnType<typeof setInterval>;
  
  private createSandParticle() {
    const particles = ['·', '∴', '∵', ':', '∙'];
    const particle = document.createElement('div');
    particle.className = 'sand-particle';
    particle.textContent = particles[Math.floor(Math.random() * particles.length)];
    
    // Random starting position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    // Random animation duration
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    this.container.appendChild(particle);
    this.particles.add(particle);
    
    // Remove particle after animation
    particle.addEventListener('animationend', () => {
      particle.remove();
      this.particles.delete(particle);
    });
  }
  
  // Special effect for sacred site discovery
  createDiscoveryBurst(x: number, y: number) {
    const glyphs = ['✦', '✧', '✶', '✳', '✴'];
    const burst = 8;
    
    for (let i = 0; i < burst; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = 'var(--color-purple)';
      particle.style.textShadow = '0 0 10px currentColor';
      particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '2000';
      
      const angle = (i / burst) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const duration = 1 + Math.random() * 0.5;
      
      particle.style.transition = `all ${duration}s ease-out`;
      document.body.appendChild(particle);
      
      // Animate outward
      requestAnimationFrame(() => {
        particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        particle.style.opacity = '0';
      });
      
      // Remove after animation
      setTimeout(() => particle.remove(), duration * 1000);
    }
  }
  
  // Crystal formation effect
  createCrystalFormation(x: number, y: number) {
    const crystal = document.createElement('div');
    crystal.style.position = 'absolute';
    crystal.style.left = `${x}px`;
    crystal.style.top = `${y}px`;
    crystal.style.color = 'var(--color-purple)';
    crystal.style.fontSize = '24px';
    crystal.style.textShadow = '0 0 20px currentColor';
    crystal.textContent = '◊';
    crystal.style.pointerEvents = 'none';
    crystal.style.zIndex = '2000';
    crystal.style.transform = 'scale(0) rotate(0deg)';
    crystal.style.transition = 'all 2s ease-out';
    
    document.body.appendChild(crystal);
    
    // Animate crystal growth
    requestAnimationFrame(() => {
      crystal.style.transform = 'scale(1) rotate(360deg)';
    });
    
    // Pulse effect
    setTimeout(() => {
      crystal.style.animation = 'crystal-pulse 2s ease-in-out infinite';
    }, 2000);
    
    // Remove after 5 seconds
    setTimeout(() => {
      crystal.style.transition = 'all 1s ease-out';
      crystal.style.transform = 'scale(0) rotate(-360deg)';
      crystal.style.opacity = '0';
      setTimeout(() => crystal.remove(), 1000);
    }, 5000);
  }
}