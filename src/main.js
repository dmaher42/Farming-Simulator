import { BIOMES, MANAGEMENT_PRACTICES } from './data.js';
import { initDOM, dom, logEvent, updateUI, logAdvisor } from './ui.js';
import {
    initializeGame,
    advanceSeason,
    closeModal,
    selectCrop,
    selectPractice,
    openPlotModal,
    getCropAdvice,
    getPracticeAdvice,
    handlePlotClick,
    togglePause,
    sleepSeason
} from './game.js';
import { openResearchModal, closeResearchModal } from './upgrades.js';
import { loadGame, gameState } from './state.js';
import { initializeMarket } from './market.js';

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    setupBiomeSelection();

    // Global Event Listeners
    dom.nextSeasonBtn.addEventListener('click', advanceSeason);
    dom.closeModalBtn.addEventListener('click', closeModal);
    dom.researchBtn.addEventListener('click', openResearchModal);
    dom.closeResearchBtn.addEventListener('click', closeResearchModal);

    // Time Controls
    dom.pauseBtn.addEventListener('click', togglePause);
    dom.sleepBtn.addEventListener('click', sleepSeason);

    dom.guideBtn.addEventListener('click', () => {
        dom.guideModal.classList.remove('hidden');
        setTimeout(() => dom.guideModal.classList.remove('opacity-0'), 10);
    });

    dom.closeGuideBtn.addEventListener('click', () => {
        dom.guideModal.classList.add('opacity-0');
        setTimeout(() => dom.guideModal.classList.add('hidden'), 300);
    });

    // Load Game Button Logic
    const loadBtn = document.getElementById('load-game-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            if (loadGame()) {
                // Re-link biome
                if (gameState.currentBiome && gameState.currentBiome.id) {
                    gameState.currentBiome = BIOMES[gameState.currentBiome.id];
                }

                // Initialize Market if it wasn't saved or needs re-init
                if (!gameState.market || !gameState.market.prices) {
                    initializeMarket();
                }

                dom.biomeSelectionModal.classList.add('hidden');
                dom.gameContainer.classList.remove('hidden');

                resumeGame();
                logEvent("Game Loaded Successfully.", "BOON");
            } else {
                alert("No saved game found!");
            }
        });
    }
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

function resumeGame() {
    dom.farmGrid.innerHTML = '';
    dom.cropSelections.innerHTML = '';
    dom.managementPractices.innerHTML = '';

    // Initialize Plots
    gameState.plots.forEach(p => {
        const plotEl = document.createElement('div');
        plotEl.className = 'plot';
        plotEl.dataset.plotId = p.id;

        plotEl.addEventListener('click', () => {
             handlePlotClick(p.id);
        });

        const moistureIndicator = document.createElement('div');
        moistureIndicator.className = 'moisture-indicator';
        plotEl.appendChild(moistureIndicator);

        dom.farmGrid.appendChild(plotEl);
    });

    const biome = gameState.currentBiome;
     for (const cropId in biome.crops) {
        const crop = biome.crops[cropId];
        const button = document.createElement('button');
        button.className = 'crop-card w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors flex items-center justify-between';
        button.dataset.cropId = cropId;
        const idealSeasonsText = crop.idealSeasons.map(s => s.substring(0, 3)).join(', ');
        button.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3">${crop.emoji}</span>
                <div>
                    <div class="font-semibold">${crop.name}</div>
                    <div class="text-xs text-gray-500">Ideal: ${idealSeasonsText}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-semibold">$${crop.cost}</div>
                <div class="text-xs text-gray-500">Water: ${crop.waterNeed}</div>
            </div>
        `;
        button.addEventListener('click', (e) => { e.stopPropagation(); selectCrop(cropId, button); });
        dom.cropSelections.appendChild(button);
    }

    for (const practiceId in MANAGEMENT_PRACTICES) {
        const practice = MANAGEMENT_PRACTICES[practiceId];
        const button = document.createElement('button');
        button.className = 'practice-card w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors';
        button.dataset.practiceId = practiceId;
        let costText = '';
        if (practice.cost.money) costText += `$${practice.cost.money} `;
        if (practice.cost.water) costText += `💧${practice.cost.water} `;
        if (practice.cost.food) costText += `🍗${practice.cost.food}`;

        button.innerHTML = `
            <div class="font-semibold text-sm">${practice.name}</div>
            <div class="text-xs text-gray-500 mt-1">${practice.description}</div>
            <div class="text-xs font-semibold mt-2">Cost: ${costText}</div>
        `;
        button.addEventListener('click', (e) => { e.stopPropagation(); selectPractice(practiceId, button); });
        dom.managementPractices.appendChild(button);
    }

    dom.biomeName.textContent = `Farming the ${biome.name}`;
    updateUI();
}
