import { gameState } from './state.js';
import { UPGRADES } from './data.js';
import { dom, logEvent, updateUI } from './ui.js';

export function openResearchModal() {
    dom.knowledgeDisplay.textContent = gameState.knowledge;
    renderResearchGrid();

    dom.researchModal.classList.remove('hidden');
    setTimeout(() => {
        dom.researchModal.classList.remove('opacity-0');
    }, 10);
}

export function closeResearchModal() {
    dom.researchModal.classList.add('opacity-0');
    setTimeout(() => {
        dom.researchModal.classList.add('hidden');
    }, 300);
}

function renderResearchGrid() {
    dom.researchGrid.innerHTML = '';

    for (const upgradeId in UPGRADES) {
        const upgrade = UPGRADES[upgradeId];
        const isUnlocked = gameState.unlockedUpgrades.includes(upgradeId);
        const canAfford = gameState.knowledge >= upgrade.cost;

        const card = document.createElement('div');
        card.className = `border rounded-lg p-4 transition-all ${isUnlocked ? 'bg-purple-100 border-purple-300' : 'bg-white hover:shadow-md'}`;

        let buttonHtml = '';
        if (isUnlocked) {
            buttonHtml = `<button disabled class="w-full mt-3 bg-green-500 text-white font-bold py-1 px-3 rounded opacity-50 cursor-default">Unlocked</button>`;
        } else {
            buttonHtml = `<button class="upgrade-btn w-full mt-3 ${canAfford ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'} text-white font-bold py-1 px-3 rounded transition-colors" data-id="${upgradeId}">Unlock (${upgrade.cost} Knowledge)</button>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-lg ${isUnlocked ? 'text-purple-800' : 'text-gray-800'}">${upgrade.name}</h3>
                ${isUnlocked ? '<span class="text-xl">🔬</span>' : ''}
            </div>
            <p class="text-sm text-gray-600 mt-1">${upgrade.description}</p>
            ${buttonHtml}
        `;

        dom.researchGrid.appendChild(card);

        if (!isUnlocked && canAfford) {
            const btn = card.querySelector('.upgrade-btn');
            btn.addEventListener('click', () => unlockUpgrade(upgradeId));
        }
    }
}

function unlockUpgrade(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (gameState.knowledge < upgrade.cost) return;

    gameState.knowledge -= upgrade.cost;
    gameState.unlockedUpgrades.push(upgradeId);

    logEvent(`Researched ${upgrade.name}!`, 'BOON');

    // Apply immediate effects if any
    if (upgrade.effect === 'soil_insight') {
        // Just a flag, handled in UI
        updateUI();
    }

    openResearchModal(); // Re-render
    updateUI();
}
