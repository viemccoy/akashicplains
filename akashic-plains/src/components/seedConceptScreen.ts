export function renderSeedConceptScreen(): string {
  return `
    <div class="seed-concept-screen">
      <div class="seed-concept-container">
        <pre class="ascii-title">
╔═══════════════════════════════════════════════════════════════╗
║              CHOOSE YOUR STARTING WISDOM                      ║
╚═══════════════════════════════════════════════════════════════╝
        </pre>
        
        <div class="seed-description">
          <p>Every journey through the Akashic Plains begins with a single thought.</p>
          <p>What concept shall seed your exploration of the infinite desert?</p>
        </div>
        
        <input 
          type="text" 
          class="seed-input" 
          placeholder="consciousness, time, love, quantum, dream..." 
          autocomplete="off"
          spellcheck="false"
          autofocus
        />
        
        <div class="seed-suggestions">
          <p>Suggestions:</p>
          <div class="suggestion-list">
            <span class="suggestion" data-concept="consciousness">Consciousness</span>
            <span class="suggestion" data-concept="emergence">Emergence</span>
            <span class="suggestion" data-concept="infinity">Infinity</span>
            <span class="suggestion" data-concept="void">Void</span>
            <span class="suggestion" data-concept="paradox">Paradox</span>
          </div>
        </div>
        
        <button class="button" id="begin-journey">Enter the Desert</button>
      </div>
    </div>
  `;
}