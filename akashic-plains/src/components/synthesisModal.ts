import type { SacredSite } from '../types';

export function renderSynthesisModal(
  bookmarkedSites: SacredSite[],
  isProcessing: boolean = false
): string {
  if (isProcessing) {
    return renderProcessingAnimation();
  }
  
  return `
    <div class="synthesis-modal-overlay">
      <div class="synthesis-modal">
        <div class="modal-header">
          <pre class="synthesis-title">
╔═══════════════════════════════════════════════════════════╗
║             CRYSTALLIZATION CHAMBER                       ║
║         Where Separate Wisdoms Become One                 ║
╚═══════════════════════════════════════════════════════════╝
          </pre>
        </div>
        
        <div class="modal-body">
          <div class="synthesis-description">
            You have gathered ${bookmarkedSites.length} fragments of ancient wisdom.
            The crystallization ritual will fuse these concepts into a new form,
            revealing hidden connections and emergent truths.
          </div>
          
          <div class="bookmarked-concepts">
            ${bookmarkedSites.map(site => `
              <div class="concept-item">
                <span class="concept-glyph">${site.glyph}</span>
                <span class="concept-name">${site.conceptName}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="synthesis-warning">
            This ritual requires 30 energy and will consume your bookmarks.
            The resulting crystal will manifest somewhere in the desert.
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="button" id="cancel-synthesis">Cancel</button>
          <button class="button synthesize-button" id="perform-synthesis">
            ✧ Begin Crystallization ✧
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderProcessingAnimation(): string {
  return `
    <div class="synthesis-modal-overlay">
      <div class="synthesis-modal processing">
        <div class="crystallization-animation">
          <pre class="crystal-forming">
         ◊
        ◊◊◊
       ◊◊◊◊◊
      ◊◊◊◊◊◊◊
       ◊◊◊◊◊
        ◊◊◊
         ◊
          </pre>
          <div class="processing-text">
            The concepts swirl and merge...
            Ancient patterns align...
            A new crystal forms in the desert...
          </div>
        </div>
      </div>
    </div>
  `;
}