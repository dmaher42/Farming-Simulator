import { gameState } from './state.js';
import { SEASONS, SEASON_EMOJIS, SEASON_CLASSES, COMMUNITY_SIZE, FOOD_PER_PERSON } from './data.js';

export const dom = {};

export function initDOM() {
    dom.gameContainer = document.getElementById('game-container');
    dom.biomeSelectionModal = document.getElementById('biome-selection-modal');
    dom.farmGrid = document.getElementById('farm-grid');
    dom.moneyDisplay = document.getElementById('money-display');
    dom.foodDisplay = document.getElementById('food-display');
    dom.waterDisplay = document.getElementById('water-display');
    dom.cropSelections = document.getElementById('crop-selections');
    dom.managementPractices = document.getElementById('management-practices');
    dom.eventLog = document.getElementById('event-log');
    dom.advisorLog = document.getElementById('advisor-log');
    dom.nextSeasonBtn = document.getElementById('next-season-btn');
    dom.plotModal = document.getElementById('plot-modal');
    dom.plotInfo = document.getElementById('plot-info');
    dom.harvestBtn = document.getElementById('harvest-btn');
    dom.waterPlotBtn = document.getElementById('water-plot-btn');
    dom.clearPlotBtn = document.getElementById('clear-plot-btn');
    dom.closeModalBtn = document.getElementById('close-modal-btn');
    dom.biomeName = document.getElementById('biome-name');
    dom.goalStatus = document.getElementById('goal-status');
    dom.foodStatusDisplay = document.getElementById('food-status-display');
    dom.healthBarInner = document.getElementById('health-bar-inner');
    dom.endGameModal = document.getElementById('end-game-modal');
    dom.endGameContent = document.getElementById('end-game-content');
    dom.seasonHeader = document.getElementById('season-header');
    dom.weatherIcon = document.getElementById('weather-icon');
    dom.weatherText = document.getElementById('weather-text');
    dom.soilQuality = document.getElementById('soil-quality');
    dom.nextSeason = document.getElementById('next-season');
    dom.healthPercent = document.getElementById('health-percent');
    dom.foodDays = document.getElementById('food-days');
    dom.waterDays = document.getElementById('water-days');

    // Research DOM
    dom.researchBtn = document.getElementById('research-btn');
    dom.researchModal = document.getElementById('research-modal');
    dom.closeResearchBtn = document.getElementById('close-research-btn');
    dom.researchGrid = document.getElementById('research-grid');
    dom.knowledgeDisplay = document.getElementById('knowledge-display');

    // Quest DOM
    dom.questPanel = document.getElementById('quest-panel');
    dom.questTimer = document.getElementById('quest-timer');

    // Guide DOM
    dom.guideBtn = document.getElementById('guide-btn');
    dom.guideModal = document.getElementById('guide-modal');
    dom.closeGuideBtn = document.getElementById('close-guide-btn');
    dom.weatherEffectOverlay = document.getElementById('weather-effect-overlay');
}

export function updateUI() {
    if (!gameState.currentBiome) return;

    // Update resource displays
    dom.moneyDisplay.textContent = `$${gameState.money}`;
    dom.foodDisplay.textContent = gameState.food;
    dom.waterDisplay.textContent = `💧 ${gameState.water}`;

    // Update goal status
    dom.goalStatus.textContent = `Year ${gameState.year}, ${SEASONS[gameState.currentSeasonIndex]} ${SEASON_EMOJIS[gameState.currentSeasonIndex]}`;

    // Update food status
    const foodBalance = gameState.food - (COMMUNITY_SIZE * FOOD_PER_PERSON);
    const foodDays = Math.floor(gameState.food / (COMMUNITY_SIZE * FOOD_PER_PERSON));
    dom.foodStatusDisplay.textContent = foodBalance >= 0 ? `Surplus: ${foodBalance}` : `Deficit: ${Math.abs(foodBalance)}`;
    dom.foodStatusDisplay.className = `text-xl font-semibold ${foodBalance >= 0 ? 'text-green-600' : 'text-red-600'}`;
    dom.foodDays.textContent = `${foodDays} days`;
    dom.foodDays.className = `text-xs px-2 py-1 rounded-full ${foodDays > 2 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;

    // Update water days
    const waterDays = Math.floor(gameState.water / 10);
    dom.waterDays.textContent = `${waterDays} days`;
    dom.waterDays.className = `text-xs px-2 py-1 rounded-full ${waterDays > 2 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`;

    // Update biome health
    dom.healthBarInner.style.width = `${gameState.biomeHealth}%`;
    dom.healthBarInner.className = `health-bar-inner h-3 rounded-full ${gameState.biomeHealth > 60 ? 'bg-green-600' : gameState.biomeHealth > 30 ? 'bg-yellow-500' : 'bg-red-600'}`;
    dom.healthPercent.textContent = `${gameState.biomeHealth}%`;

    // Update soil quality
    let soilQualityText = '';
    let soilQualityColor = '';
    if (gameState.soilQuality > 70) {
        soilQualityText = 'Excellent';
        soilQualityColor = 'text-green-600';
    } else if (gameState.soilQuality > 40) {
        soilQualityText = 'Good';
        soilQualityColor = 'text-yellow-600';
    } else {
        soilQualityText = 'Poor';
        soilQualityColor = 'text-red-600';
    }
    dom.soilQuality.textContent = soilQualityText;
    dom.soilQuality.className = `text-lg font-semibold ${soilQualityColor}`;

    // Update season header background
    dom.seasonHeader.classList.remove('spring', 'summer', 'autumn', 'winter');
    dom.seasonHeader.classList.add(SEASON_CLASSES[gameState.currentSeasonIndex]);

    // Update weather
    dom.weatherText.textContent = gameState.weather;
    updateWeatherEffects();

    // Update next season
    const nextSeasonIndex = (gameState.currentSeasonIndex + 1) % 4;
    dom.nextSeason.textContent = SEASONS[nextSeasonIndex];

    // Update Quest UI
    updateQuestUI();

    // Update plots
    renderPlots();
}

function updateQuestUI() {
    if (!gameState.activeQuest) {
        dom.questPanel.innerHTML = '<p class="text-gray-500 italic">No active requests from the community.</p>';
        dom.questTimer.classList.add('hidden');
        return;
    }

    const quest = gameState.activeQuest;
    const cropName = gameState.currentBiome.crops[quest.cropId].name;

    dom.questPanel.innerHTML = `
        <div class="font-semibold text-yellow-900">${quest.description}</div>
        <div class="mt-2 flex justify-between items-center">
            <span class="text-xs font-bold text-gray-600">Progress: ${quest.currentAmount} / ${quest.targetAmount} ${cropName}</span>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">Reward: $${quest.reward}</span>
        </div>
        <div class="w-full bg-yellow-200 rounded-full h-2 mt-1">
            <div class="bg-yellow-600 h-2 rounded-full" style="width: ${(quest.currentAmount / quest.targetAmount) * 100}%"></div>
        </div>
    `;

    dom.questTimer.textContent = `Expires in: ${quest.deadline - (gameState.currentSeasonIndex + (gameState.year - 1) * 4)} seasons`;
    dom.questTimer.classList.remove('hidden');
}

function updateWeatherEffects() {
    // Simple CSS based weather effects using gradients or colors
    const overlay = dom.weatherEffectOverlay;
    if (!overlay) return;

    overlay.className = 'absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000';

    // Reset styles
    overlay.style.background = 'transparent';
    overlay.style.opacity = '0';

    const weather = gameState.weather.toLowerCase();

    if (weather.includes('rain') || weather.includes('wet') || weather.includes('storm')) {
        overlay.style.backgroundImage = 'linear-gradient(to bottom, transparent, rgba(0,0,100,0.1))';
        overlay.style.opacity = '1';
    } else if (weather.includes('hot') || weather.includes('sunny') || weather.includes('dry')) {
        overlay.style.backgroundImage = 'radial-gradient(circle at top right, rgba(255,200,0,0.2), transparent)';
        overlay.style.opacity = '1';
    } else if (weather.includes('snow') || weather.includes('frost') || weather.includes('cold')) {
        overlay.style.backgroundImage = 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)';
        overlay.style.opacity = '1';
    } else if (weather.includes('mist') || weather.includes('humid')) {
        overlay.style.backgroundColor = 'rgba(255,255,255,0.3)';
        overlay.style.opacity = '1';
    }
}

function renderPlots() {
    const plotElements = document.querySelectorAll('.plot');
    // Ensure we match plots by ID or Index.
    // gameState.plots array index corresponds to DOM order if initialized correctly.

    gameState.plots.forEach((plot, index) => {
        const plotEl = plotElements[index];
        if (!plotEl) return;

        plotEl.className = 'plot'; // Reset classes
        plotEl.innerHTML = ''; // Clear content

        // Moisture indicator
        const moistureIndicator = document.createElement('div');
        moistureIndicator.className = 'moisture-indicator';
        moistureIndicator.style.opacity = plot.moisture > 30 ? '1' : '0.3';
        plotEl.appendChild(moistureIndicator);

        if (plot.crop) {
            const crop = gameState.currentBiome.crops[plot.crop];
            const seasonsGrown = (gameState.currentSeasonIndex + (gameState.year - 1) * 4) - plot.plantedAt;
            let growthPercentage = Math.min(100, (seasonsGrown / crop.growthTime) * 100);
            if (plot.isMature) growthPercentage = 100;

            // Visual Growth Stages
            let cropContent = document.createElement('div');
            cropContent.className = 'flex flex-col items-center justify-center h-full w-full relative z-10';

            let iconSize = 'text-xl';
            let icon = '🌱'; // Default Sprout

            if (growthPercentage < 50) {
                icon = '🌱';
                iconSize = 'text-lg';
            } else if (growthPercentage < 100) {
                icon = '🌿';
                iconSize = 'text-2xl';
            } else {
                icon = crop.emoji;
                iconSize = 'text-4xl';
            }

            cropContent.innerHTML = `<div class="${iconSize} transition-all duration-500">${icon}</div>`;

            plotEl.appendChild(cropContent);
            plotEl.classList.add('planted');

            // Add growth bar only if growing
            if (!plot.isMature) {
                const bar = document.createElement('div');
                bar.className = 'growth-bar';
                bar.innerHTML = `<div class="growth-bar-inner" style="width: ${growthPercentage}%"></div>`;
                plotEl.appendChild(bar);
            } else {
                // Mature glow
                plotEl.classList.add('ring-2', 'ring-yellow-400');
            }

        } else {
            if (plot.isFertile) {
                plotEl.classList.add('fertile');
                // Maybe a small sparkle icon for fertile?
                const fertileIcon = document.createElement('div');
                fertileIcon.className = 'absolute top-1 left-1 text-xs opacity-50';
                fertileIcon.textContent = '✨';
                plotEl.appendChild(fertileIcon);
            }
        }
    });
}

export function logEvent(message, type = "NEUTRAL") {
    const colors = {
        CHALLENGE: 'text-red-700 bg-red-50 border-red-200',
        error: 'text-red-700 bg-red-50 border-red-200',
        BOON: 'text-green-700 bg-green-50 border-green-200',
        NEUTRAL: 'text-gray-700 bg-gray-50 border-gray-200'
    };

    const icons = {
        CHALLENGE: '❗',
        error: '❌',
        BOON: '✅',
        NEUTRAL: '📝'
    };

    const eventElement = document.createElement('div');
    eventElement.className = `border rounded p-2 mb-2 ${colors[type]}`;
    eventElement.innerHTML = `<span class="font-semibold">${icons[type]} ${type}:</span> ${message}`;

    if (dom.eventLog) {
        dom.eventLog.prepend(eventElement);
        // Limit to 10 messages
        if (dom.eventLog.children.length > 10) {
            dom.eventLog.removeChild(dom.eventLog.lastChild);
        }
    }
}

export function logAdvisor(message) {
    if (dom.advisorLog) {
        dom.advisorLog.innerHTML = `
            <div class="bg-blue-100 border border-blue-200 rounded p-3">
                <div class="font-semibold text-blue-800">💡 Advisor:</div>
                <div class="mt-1 text-blue-700">${message}</div>
            </div>
        `;
    }
}
