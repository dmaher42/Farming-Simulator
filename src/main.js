import { BIOMES } from './data.js';
import { initDOM, dom } from './ui.js';
import { initializeGame, advanceSeason, closeModal } from './game.js';
import { openResearchModal, closeResearchModal } from './upgrades.js';

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    setupBiomeSelection();

    // Global Event Listeners
    dom.nextSeasonBtn.addEventListener('click', advanceSeason);
    dom.closeModalBtn.addEventListener('click', closeModal);
    dom.researchBtn.addEventListener('click', openResearchModal);
    dom.closeResearchBtn.addEventListener('click', closeResearchModal);

    dom.guideBtn.addEventListener('click', () => {
        dom.guideModal.classList.remove('hidden');
        setTimeout(() => dom.guideModal.classList.remove('opacity-0'), 10);
    });

    dom.closeGuideBtn.addEventListener('click', () => {
        dom.guideModal.classList.add('opacity-0');
        setTimeout(() => dom.guideModal.classList.add('hidden'), 300);
    });
});

function setupBiomeSelection() {
    document.querySelectorAll('.biome-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const biomeId = btn.dataset.biome;
            const biome = BIOMES[biomeId];
            initializeGame(biome);
            dom.biomeSelectionModal.classList.add('hidden');
            dom.gameContainer.classList.remove('hidden');
        });
    });
}
