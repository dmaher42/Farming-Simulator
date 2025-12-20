import { gameState, resetGameState, saveGame } from './state.js';
import { dom, updateUI, logEvent, logAdvisor } from './ui.js';
import { SEASONS, WEATHER_EMOJIS, COMMUNITY_SIZE, FOOD_PER_PERSON, MANAGEMENT_PRACTICES, UPGRADES } from './data.js';
import { initializeMarket, updateMarketPrices, getCropPrice } from './market.js';
import { spawnNPC, updateNPCs } from './npcs.js';
import { audioManager } from './audio.js';
import { tutorialManager } from './tutorial.js';

let gameLoopId = null;
const TICK_RATE = 100; // ms
const SEASON_DURATION = 60000; // 60 seconds

export function initializeGame(biome) {
    const wantsTutorial = gameState.wantsTutorial; // Preserve flag
    resetGameState(biome);
    gameState.wantsTutorial = wantsTutorial; // Restore

    initializeMarket();

    dom.farmGrid.innerHTML = '';
    dom.cropSelections.innerHTML = '';
    dom.managementPractices.innerHTML = '';

    // Initialize Plots
    gameState.plots.forEach(p => {
        const plotEl = document.createElement('div');
        plotEl.className = 'plot';
        plotEl.dataset.plotId = p.id;
        plotEl.addEventListener('click', () => onPlotClick(p.id));

        // Add moisture indicator
        const moistureIndicator = document.createElement('div');
        moistureIndicator.className = 'moisture-indicator';
        moistureIndicator.style.opacity = p.moisture > 30 ? '1' : '0.3';
        plotEl.appendChild(moistureIndicator);

        dom.farmGrid.appendChild(plotEl);
    });

    // Create crop selection buttons
    for (const cropId in biome.crops) {
        const crop = biome.crops[cropId];
        const button = document.createElement('button');
        button.className = 'crop-card w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors flex items-center justify-between';
        button.dataset.cropId = cropId;

        const idealSeasonsText = crop.idealSeasons.map(s => s.substring(0, 3)).join(', ');
        const iconSrc = `assets/${crop.asset || 'sprout.svg'}`;

        button.innerHTML = `
            <div class="flex items-center">
                <div class="mr-3 w-8 h-8 flex items-center justify-center">
                    <img src="${iconSrc}" alt="${crop.name}" class="max-w-full max-h-full">
                </div>
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

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCrop(cropId, button);
        });

        dom.cropSelections.appendChild(button);
    }

    // Create management practice buttons
    for (const practiceId in MANAGEMENT_PRACTICES) {
        const practice = MANAGEMENT_PRACTICES[practiceId];
        const button = document.createElement('button');
        button.className = 'practice-card w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors';
        button.dataset.practiceId = practiceId;

        // Format cost text
        let costText = '';
        if (practice.cost.money) costText += `$${practice.cost.money} `;
        if (practice.cost.water) costText += `💧${practice.cost.water} `;
        if (practice.cost.food) costText += `🍗${practice.cost.food}`;

        // Check for Composting upgrade
        if (practiceId === 'fertilizer' && gameState.unlockedUpgrades.includes('composting')) {
             costText = `$${Math.floor(practice.cost.money * 0.5)} `;
        }

        button.innerHTML = `
            <div class="font-semibold text-sm">${practice.name}</div>
            <div class="text-xs text-gray-500 mt-1">${practice.description}</div>
            <div class="text-xs font-semibold mt-2">Cost: ${costText}</div>
        `;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            selectPractice(practiceId, button);
        });

        dom.managementPractices.appendChild(button);
    }

    dom.biomeName.textContent = `Farming the ${biome.name}`;
    logAdvisor("Welcome to your new farm! Start by planting some crops. Different crops thrive in different seasons, so plan carefully.");
    logEvent(`Your farm in the ${biome.name} has been established. The soil is fertile and ready for planting.`);

    audioManager.init();
    audioManager.startAmbience(biome.id);

    updateWeather();
    updateUI();

    tutorialManager.init();
    if (gameState.wantsTutorial) {
        tutorialManager.start();
    }

    startGameLoop();
}

function startGameLoop() {
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(gameTick, TICK_RATE);
}

function gameTick() {
    if (gameState.isPaused || dom.endGameModal.classList.contains('hidden') === false) return;

    // Advance Season Progress
    const increment = (TICK_RATE / SEASON_DURATION) * 100 * gameState.speed;
    gameState.seasonProgress += increment;

    // Soil Moisture Decay (Gradual)
    // Lose ~20 moisture per season -> 20 / (60000/100) = 0.033 per tick
    const moistureLossPerTick = 20 / (SEASON_DURATION / TICK_RATE);

    // Growth Tick (100% per season normally, so same increment as progress)
    // But crop has growthTime (in seasons).
    // So growth per tick = increment / growthTime

    gameState.plots.forEach(plot => {
        if (plot.crop && !plot.isMature) {
            // Moisture Decay
            plot.moisture = Math.max(0, plot.moisture - moistureLossPerTick);

            // Growth Logic
            if (plot.moisture > 20) {
                 const crop = gameState.currentBiome.crops[plot.crop];
                 const growthPerTick = increment / crop.growthTime;
                 plot.growthProgress += growthPerTick;

                 if (plot.growthProgress >= 100) {
                     plot.isMature = true;
                     plot.growthProgress = 100;
                     logEvent(`${crop.name} in plot ${plot.id + 1} is ready to harvest!`, "BOON");
                     tutorialManager.checkHarvest();
                 }
            } else {
                // Stunted growth due to drought
                // Optionally: could even damage the crop or reduce growthProgress?
            }
        } else if (plot.crop && plot.isMature) {
             // Still lose moisture even if mature? Yes.
             plot.moisture = Math.max(0, plot.moisture - moistureLossPerTick);
        }
    });

    // NPC Logic
    if (Math.random() < 0.005) { // Small chance per tick to spawn NPC
        spawnNPC();
    }
    updateNPCs();

    if (gameState.seasonProgress >= 100) {
        advanceSeason();
    } else {
        updateUI(); // Frequent UI updates for progress bars
    }
}

export function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    updateUI();
}

export function sleepSeason() {
    // Simulate passing of remaining time to prevent exploit
    const remainingProgress = 100 - gameState.seasonProgress;
    if (remainingProgress <= 0) return;

    // Calculate how many ticks that represents roughly
    // remainingPct / (100pct / duration) -> ratio
    // Simpler: Apply moisture loss proportional to remaining progress

    // Total moisture loss per season is ~20.
    const moistureLoss = (remainingProgress / 100) * 20;

    gameState.plots.forEach(plot => {
        if (plot.crop) {
            plot.moisture = Math.max(0, plot.moisture - moistureLoss);
            // We could also simulate growth here, but sleep implies "skipping work",
            // so maybe crops grow but soil dries out severely?
            // Let's grant growth too, assuming they survive the moisture drop.

            if (!plot.isMature && plot.moisture > 20) { // Check moisture AFTER drop? Or average?
                // Let's use current moisture state to decide if they grow during sleep
                // This penalizes sleeping if already low on water.
                const crop = gameState.currentBiome.crops[plot.crop];
                const growthGain = remainingProgress / crop.growthTime;
                plot.growthProgress += growthGain;
                if (plot.growthProgress >= 100) {
                    plot.isMature = true;
                    plot.growthProgress = 100;
                }
            }
        }
    });

    gameState.seasonProgress = 100; // Trigger advance next tick
    gameTick();
}

export function selectCrop(cropId, button) {
    gameState.selectedCrop = cropId;
    document.querySelectorAll('#crop-selections button').forEach(btn => {
        btn.classList.remove('bg-green-200', 'border-green-500');
    });
    button.classList.add('bg-green-200', 'border-green-500');

    const crop = gameState.currentBiome.crops[cropId];
    logAdvisor(`Selected ${crop.name}. ${getCropAdvice(crop)}`);
}

export function selectPractice(practiceId, button) {
    gameState.activePractice = practiceId;
    document.querySelectorAll('#management-practices button').forEach(btn => {
        btn.classList.remove('bg-blue-200', 'border-blue-500');
    });
    button.classList.add('bg-blue-200', 'border-blue-500');

    const practice = MANAGEMENT_PRACTICES[practiceId];
    logAdvisor(`Selected ${practice.name}. ${getPracticeAdvice(practice)}`);
}

export function handlePlotClick(plotIndex) {
    const plot = gameState.plots[plotIndex];
    if (gameState.selectedCrop && !plot.crop) {
        plantCrop(plotIndex);
    } else if (plot.crop) {
        openPlotModal(plotIndex);
    } else if (!plot.crop) {
        logAdvisor("Select a crop to plant on this empty plot, or consider using a management practice to improve soil quality.");
    }
}

function onPlotClick(plotIndex) {
    handlePlotClick(plotIndex);
}

function plantCrop(plotIndex) {
    const cropId = gameState.selectedCrop;
    if (!cropId) return;

    const crop = gameState.currentBiome.crops[cropId];

    // Seed Drill Upgrade: 20% discount
    let cost = crop.cost;
    if (gameState.unlockedUpgrades.includes('seed_drill')) {
        cost = Math.ceil(cost * 0.8);
    }

    if (gameState.money < cost) {
        logEvent(`Not enough money to plant ${crop.name}. Need $${cost} but only have $${gameState.money}.`, "error");
        return;
    }

    // Check if this is the same crop as last time (affects yield)
    const sameCrop = gameState.plots[plotIndex].lastCrop === cropId;
    if (sameCrop) {
        logEvent(`Planting ${crop.name} in the same plot again may reduce yield due to soil depletion. Consider crop rotation.`, "CHALLENGE");
    }

    gameState.money -= cost;
    gameState.plots[plotIndex] = {
        ...gameState.plots[plotIndex],
        crop: cropId,
        plantedAt: gameState.currentSeasonIndex + (gameState.year - 1) * 4 + (gameState.seasonProgress / 100), // Keep for stats
        growthProgress: 0,
        isMature: false,
        lastCrop: cropId,
        moisture: 50 // Reset moisture when planting
    };

    audioManager.playPlant();
    logEvent(`Planted ${crop.name} on plot ${plotIndex + 1}.`, 'BOON');

    // Animation effect
    const plotEl = document.querySelector(`.plot[data-plot-id="${plotIndex}"]`);
    plotEl.classList.add('pulse');
    setTimeout(() => plotEl.classList.remove('pulse'), 500);

    gameState.selectedCrop = null;
    document.querySelectorAll('#crop-selections button').forEach(btn => {
        btn.classList.remove('bg-green-200', 'border-green-500');
    });

    updateUI();
}

export function openPlotModal(plotIndex) {
    // Pause game while modal is open
    gameState.isPaused = true;
    updateUI(); // Reflect pause state

    const plot = gameState.plots[plotIndex];
    const crop = gameState.currentBiome.crops[plot.crop];

    let extraInfo = '';

    // Calculate current market value
    const currentPrice = getCropPrice(plot.crop);
    const estimatedValue = (crop.baseYield * currentPrice).toFixed(0);

    // Soil Testing Kit Upgrade
    if (gameState.unlockedUpgrades.includes('soil_testing')) {
        let matchQuality = 'Neutral';
        let matchColor = 'text-gray-600';

        const currentSeason = SEASONS[gameState.currentSeasonIndex];
        if (crop.idealSeasons.includes(currentSeason)) {
            matchQuality = 'Excellent';
            matchColor = 'text-green-600 font-bold';
        } else {
            matchQuality = 'Poor';
            matchColor = 'text-red-600';
        }

        extraInfo = `
            <div class="col-span-2 border-t mt-2 pt-2">
                <div class="font-semibold text-xs text-purple-700 mb-1">🔬 Lab Analysis</div>
                <div class="grid grid-cols-2">
                    <div>Season Match:</div>
                    <div class="text-right ${matchColor}">${matchQuality}</div>
                    <div>Soil Nutrients:</div>
                    <div class="text-right">${gameState.soilQuality}%</div>
                    <div>Est. Value:</div>
                    <div class="text-right font-bold text-green-700">$${estimatedValue}</div>
                </div>
            </div>
        `;
    } else {
        extraInfo = `
            <div class="col-span-2 border-t mt-2 pt-2">
                <div class="grid grid-cols-2">
                     <div>Est. Value:</div>
                    <div class="text-right font-bold text-green-700">$${estimatedValue}</div>
                </div>
            </div>
        `;
    }

    let infoText = `
        <div class="text-center mb-2 text-3xl">${crop.emoji}</div>
        <div class="text-center font-semibold">${crop.name}</div>
        <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>Moisture:</div>
            <div class="text-right">${Math.floor(plot.moisture)}%</div>
            <div>Status:</div>
            <div class="text-right">${plot.isMature ? 'Ready to harvest' : 'Growing'}</div>
            <div>Water need:</div>
            <div class="text-right">${crop.waterNeed}</div>
            ${extraInfo}
        </div>
    `;

    dom.harvestBtn.disabled = !plot.isMature;

    dom.harvestBtn.onclick = () => handleHarvest(plotIndex);
    dom.waterPlotBtn.onclick = () => waterPlot(plotIndex);
    dom.clearPlotBtn.onclick = () => { clearPlot(plotIndex); closeModal(); };

    dom.plotInfo.innerHTML = infoText;
    dom.plotModal.classList.remove('hidden');

    setTimeout(() => {
        dom.plotModal.classList.remove('opacity-0');
    }, 10);
}

export function closeModal() {
    dom.plotModal.classList.add('opacity-0');
    setTimeout(() => {
        dom.plotModal.classList.add('hidden');
    }, 300);
    gameState.isPaused = false; // Resume game
    updateUI();
}

function handleHarvest(plotIndex) {
    const plot = gameState.plots[plotIndex];
    const crop = gameState.currentBiome.crops[plot.crop];
    let yieldModifier = gameState.seasonalEffects.yieldModifier;

    // Apply modifiers based on conditions
    if (plot.isFertile) yieldModifier *= 1.25;
    if (plot.moisture < 20) yieldModifier *= 0.7; // Drought reduces yield
    if (plot.lastCrop === plot.crop) yieldModifier *= 0.8; // Same crop penalty

    // Soil Quality Impact
    if (gameState.soilQuality < 40) yieldModifier *= 0.8;
    if (gameState.soilQuality > 80) yieldModifier *= 1.1;

    // Check if current season is ideal for this crop
    const currentSeason = SEASONS[gameState.currentSeasonIndex];
    if (crop.idealSeasons.includes(currentSeason)) {
        yieldModifier *= 1.2;
        logEvent(`Perfect season for ${crop.name} resulted in a bountiful harvest!`, "BOON");
    }

    // Apply Market Connections Upgrade
    let sellPriceMultiplier = 1.0;
    if (gameState.unlockedUpgrades.includes('market_connections')) {
        sellPriceMultiplier = 1.1;
    }

    // Apply Hybrid Seeds Upgrade (Passive Yield Increase)
    if (gameState.unlockedUpgrades.includes('hybrid_seeds')) {
        yieldModifier *= 1.15;
    }

    // Calculate Yield Amount
    const yieldAmount = Math.floor(crop.baseYield * yieldModifier);

    // Calculate Price
    const pricePerUnit = getCropPrice(plot.crop);

    const moneyGained = Math.floor(yieldAmount * pricePerUnit * sellPriceMultiplier);
    const foodGained = crop.food;

    // Trait Effects
    if (crop.traits) {
        if (crop.traits.includes('nitrogen_fixer')) {
            gameState.soilQuality = Math.min(100, gameState.soilQuality + 5);
            logEvent("Legumes improved the soil quality!", "BOON");
        }
        if (crop.traits.includes('heavy_feeder')) {
            gameState.soilQuality = Math.max(0, gameState.soilQuality - 5);
        }
    }

    // Gain Knowledge
    let knowledgeGain = 1;
    if (gameState.plots[plotIndex].plantedAt === 0) {
         if (Math.random() > 0.7) knowledgeGain += 1;
    }

    // Agricultural Training Upgrade
    if (gameState.unlockedUpgrades.includes('ag_training')) {
        knowledgeGain = Math.ceil(knowledgeGain * 1.5);
    }

    gameState.knowledge += knowledgeGain;

    gameState.money += moneyGained;
    gameState.food += foodGained;

    // Animation effect
    const plotEl = document.querySelector(`.plot[data-plot-id="${plotIndex}"]`);
    plotEl.classList.add('pulse');
    setTimeout(() => plotEl.classList.remove('pulse'), 500);

    audioManager.playHarvest();
    audioManager.playMoney();
    logEvent(`Harvested ${crop.name}. Sold ${yieldAmount} units @ $${pricePerUnit.toFixed(1)}/unit for $${moneyGained}.`, 'BOON');

    if (plot.isFertile) {
        logEvent(`Fertile soil improved the harvest!`);
    }

    // Check Quest Progress
    if (gameState.activeQuest && gameState.activeQuest.cropId === plot.crop) {
        gameState.activeQuest.currentAmount += 1;
        if (gameState.activeQuest.currentAmount >= gameState.activeQuest.targetAmount) {
            completeQuest();
        }
    }

    clearPlot(plotIndex);
    closeModal();
}

function completeQuest() {
    const quest = gameState.activeQuest;
    gameState.money += quest.reward;
    logEvent(`Community Request Completed! Earned bonus $${quest.reward}.`, 'BOON');
    gameState.activeQuest = null;

    // Chance for bonus knowledge
    gameState.knowledge += 5;
    logEvent("The community shared their farming secrets. +5 Knowledge.", "BOON");
}

function waterPlot(plotIndex) {
    let waterCost = 5;

    // Drip Irrigation reduces manual watering cost
    if (gameState.unlockedUpgrades.includes('drip_irrigation')) {
        waterCost = 4; // 20% reduction
    }

    if (gameState.water < waterCost) {
        logEvent("Not enough water to irrigate this plot.", "error");
        return;
    }

    gameState.water -= waterCost;
    gameState.plots[plotIndex].moisture = Math.min(100, gameState.plots[plotIndex].moisture + 25);

    logEvent(`Watered plot ${plotIndex + 1}. Moisture increased.`, 'BOON');
    updateUI();
    closeModal();
}

function clearPlot(plotIndex) {
     gameState.plots[plotIndex] = {
         ...gameState.plots[plotIndex],
         crop: null,
         plantedAt: 0,
         isMature: false,
         isFertile: false,
         moisture: 50
     };
     updateUI();
}

export function advanceSeason() {
    gameState.seasonProgress = 0; // Reset progress

    // 1. Apply Management Practice & Deduct Food
    applyManagementPractice();
    const foodDemand = COMMUNITY_SIZE * FOOD_PER_PERSON;
    gameState.food -= foodDemand;

    // 2. Update soil moisture for all plots (Major drop on season change)
    // Note: gradual decay happens in gameTick, but we might want a seasonal hit too?
    // Let's reduce the seasonal hit since we have gradual decay.
    // gameState.plots.forEach(plot => {
    //    if (plot.crop) {
    //        plot.moisture = Math.max(0, plot.moisture - 10); // Reduced from 20
    //    }
    // });

    // 3. Grow crops
    // We rely on ticks, but double check? No, reliance on ticks is better for real-time consistency.

    // 4. Advance season & year
    gameState.currentSeasonIndex++;
    if (gameState.currentSeasonIndex === 4) {
        gameState.currentSeasonIndex = 0;
        gameState.year++;
    }

    // 5. Update weather and Market
    updateWeather();
    updateMarketPrices();

    // Passive Water Gain (Rainwater Catchment)
    if (gameState.unlockedUpgrades.includes('rainwater_catchment')) {
        gameState.water += 5;
        logEvent("Rainwater Catchment collected 5 water.", "BOON");
    }

    // 6. Trigger seasonal & biome health events
    const currentSeasonName = SEASONS[gameState.currentSeasonIndex];
    const potentialEvents = gameState.currentBiome.events[currentSeasonName];
    const event = potentialEvents[Math.floor(Math.random() * potentialEvents.length)];
    logEvent(event.text, event.type);
    applyEventEffect(event.effect);

    // 7. Random events based on biome health
    if (gameState.biomeHealth < 40 && Math.random() < 0.3) {
        // Integrated Pest Management Upgrade
        if (gameState.unlockedUpgrades.includes('pest_management')) {
             if (Math.random() < 0.5) { // 50% chance to completely avoid
                 logEvent("Integrated Pest Management prevented a pest outbreak.", "BOON");
             } else {
                 logEvent("Pest outbreak! But your management systems minimized the damage.", "CHALLENGE");
                 // No crop loss, just flavor text or minor impact?
                 // Let's prevent the effect call
             }
        } else {
            logEvent("Pest outbreak! Poor biome health has attracted pests, destroying a crop.", "CHALLENGE");
            applyEventEffect('crop_loss');
        }
    }

    if (gameState.biomeHealth > 80 && Math.random() < 0.2) {
        logEvent("The ecosystem is thriving! Natural pollinators increase your yield.", "BOON");
        applyEventEffect('yield_boost');
    }

    // 7b. Quest Management
    manageQuests();

    // 7c. Auto-save
    saveGame();

    // 8. Advisor Message
    giveAdvice();

    // 9. Check for End Game
    if (gameState.year > 3) {
        endGame(true);
        return;
    }

    if (gameState.money < 0 || (gameState.food < 0 && gameState.plots.every(p => !p.isMature))) {
        endGame(false);
        return;
    }

    updateUI();
    logEvent(`A new season has begun: ${SEASONS[gameState.currentSeasonIndex]}.`);

    // 10. Reset for next turn
    gameState.activePractice = null;
    gameState.seasonalEffects.yieldModifier = 1.0;
    document.querySelectorAll('#management-practices button').forEach(btn => {
        btn.classList.remove('bg-blue-200', 'border-blue-500');
    });
}

function updateWeather() {
    // Determine current weather
    if (gameState.nextWeather) {
        gameState.weather = gameState.nextWeather;
    } else {
        const currentSeason = SEASONS[gameState.currentSeasonIndex];
        const weatherOptions = gameState.currentBiome.weather[currentSeason];
        gameState.weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    }

    // Forecast next season's weather
    const nextSeasonIndex = (gameState.currentSeasonIndex + 1) % 4;
    const nextSeason = SEASONS[nextSeasonIndex];
    const nextWeatherOptions = gameState.currentBiome.weather[nextSeason];
    gameState.nextWeather = nextWeatherOptions[Math.floor(Math.random() * nextWeatherOptions.length)];

    dom.weatherText.textContent = gameState.weather;
    dom.weatherIcon.textContent = WEATHER_EMOJIS[gameState.weather] || '🌤️';

    // Update Forecast UI (handled in updateUI generally, but we can update specific element here if it exists)
    const forecastEl = document.getElementById('weather-forecast');
    if (forecastEl) {
        if (gameState.unlockedUpgrades.includes('meteorological_station')) {
            forecastEl.textContent = `Forecast: ${gameState.nextWeather} ${WEATHER_EMOJIS[gameState.nextWeather]}`;
            forecastEl.classList.remove('hidden');
        } else {
            forecastEl.classList.add('hidden');
        }
    }
}

function applyManagementPractice() {
    const practiceId = gameState.activePractice;
    if (!practiceId) {
        // logEvent("No management practice chosen for the season.");
        // Silent failure in real-time is better, or just a notification at end of season?
        return;
    }

    const practice = MANAGEMENT_PRACTICES[practiceId];

    if ((practice.cost.money && gameState.money < practice.cost.money) ||
        (practice.cost.water && gameState.water < practice.cost.water) ||
        (practice.cost.food && gameState.food < practice.cost.food)) {
        logEvent(`Not enough resources for ${practice.name}.`, 'error');
        return;
    }

    let moneyCost = practice.cost.money || 0;

    // Apply Composting Upgrade discount
    if (practiceId === 'fertilizer' && gameState.unlockedUpgrades.includes('composting')) {
        moneyCost = Math.floor(moneyCost * 0.5);
        logEvent("Composting reduced fertilizer cost!", "BOON");
    }

    if (moneyCost > 0) gameState.money -= moneyCost;
    if (practice.cost.water) gameState.water -= practice.cost.water;
    if (practice.cost.food) gameState.food -= practice.cost.food;

    logEvent(`${practice.name} is active.`, 'BOON');
    gameState.biomeHealth = Math.min(100, gameState.biomeHealth + practice.health_impact);

    switch(practice.effect) {
        case 'yield_boost_high':
            gameState.seasonalEffects.yieldModifier = 1.75;
            break;
        case 'yield_boost_med':
            gameState.seasonalEffects.yieldModifier = 1.4;
            break;
        case 'conserve_water':
            gameState.seasonalEffects.conserveWater = true;
            break;
        case 'enrich_soil':
            gameState.plots.forEach(p => {
                if (!p.crop) p.isFertile = true;
            });
            break;
        case 'soil_health':
            gameState.soilQuality = Math.min(100, gameState.soilQuality + 10);
            break;
    }
}

function applyEventEffect(effect) {
    let waterModifier = gameState.seasonalEffects.conserveWater ? 0.5 : 1;

    // Drip Irrigation Upgrade
    if (gameState.unlockedUpgrades.includes('drip_irrigation')) {
        waterModifier *= 0.8;
    }

    // Rainwater Catchment Upgrade: Double water gain from events
    let waterGainMultiplier = 1;
    if (gameState.unlockedUpgrades.includes('rainwater_catchment')) {
        waterGainMultiplier = 2;
    }

    switch(effect) {
        case 'water_gain_high':
            const gainHigh = 30 * waterGainMultiplier;
            gameState.water += gainHigh;
            if (waterGainMultiplier > 1) logEvent(`Rainwater Catchment doubled gain to ${gainHigh}!`, "BOON");
            break;
        case 'water_gain_med':
            const gainMed = 20 * waterGainMultiplier;
            gameState.water += gainMed;
            if (waterGainMultiplier > 1) logEvent(`Rainwater Catchment doubled gain to ${gainMed}!`, "BOON");
            break;
        case 'water_gain_low':
            const gainLow = 10 * waterGainMultiplier;
            gameState.water += gainLow;
            if (waterGainMultiplier > 1) logEvent(`Rainwater Catchment doubled gain to ${gainLow}!`, "BOON");
            break;
        case 'water_loss':
            let waterLost = Math.floor(25 * waterModifier);
            gameState.water -= waterLost;
            if (waterModifier < 1) logEvent(`Conservation measures prevented ${25 - waterLost} water loss!`, 'BOON');
            break;
        case 'water_loss_high':
            let waterLostHigh = Math.floor(40 * waterModifier);
            gameState.water -= waterLostHigh;
            if (waterModifier < 1) logEvent(`Conservation measures prevented ${40 - waterLostHigh} water loss!`, 'BOON');
            break;
        case 'crop_loss':
        case 'flood_risk':
            // Greenhouse Upgrade Protection
            if (effect === 'crop_loss' && gameState.unlockedUpgrades.includes('greenhouse')) {
                logEvent("Greenhouse protected your crops from the extreme weather!", "BOON");
                return;
            }

            // Filter crops that are NOT pest prone first if trait exists?
            // For now, simpler:
            const plotsToAffect = gameState.plots.filter(p => p.crop && !p.isMature);
            if (plotsToAffect.length > 0 && (effect === 'crop_loss' || (effect === 'flood_risk' && !gameState.seasonalEffects.conserveWater))) {
                const plotToLose = plotsToAffect[Math.floor(Math.random() * plotsToAffect.length)];
                logEvent(`The harsh weather destroyed the ${gameState.currentBiome.crops[plotToLose.crop].name} in plot ${plotToLose.id + 1}!`, 'CHALLENGE');
                plotToLose.crop = null;
                plotToLose.isMature = false;
            } else if(effect === 'flood_risk' && gameState.seasonalEffects.conserveWater) {
                    logEvent(`Mulching protected your crops from flooding!`, 'BOON');
            }
            break;
        case 'yield_boost':
            gameState.seasonalEffects.yieldModifier = 1.3;
            break;
        case 'money_loss':
            gameState.money -= 15;
            logEvent("Repairing damage from severe weather cost $15.", "CHALLENGE");
            break;
    }

    if (gameState.water < 0) gameState.water = 0;
    if (gameState.money < 0) gameState.money = 0;
}

function manageQuests() {
    // Check for expired quest
    const currentAbsoluteSeason = gameState.currentSeasonIndex + (gameState.year - 1) * 4;

    if (gameState.activeQuest) {
        if (currentAbsoluteSeason >= gameState.activeQuest.deadline) {
            logEvent("Community Request expired. The opportunity was missed.", "NEUTRAL");
            gameState.activeQuest = null;
        }
    } else {
        // Chance to spawn new quest
        if (Math.random() < 0.3) { // 30% chance per season
            spawnQuest();
        }
    }
}

function spawnQuest() {
    const crops = Object.keys(gameState.currentBiome.crops);
    const randomCropId = crops[Math.floor(Math.random() * crops.length)];
    const crop = gameState.currentBiome.crops[randomCropId];

    const targetAmount = Math.floor(Math.random() * 3) + 3; // 3 to 5 crops
    const reward = Math.floor(crop.cost * targetAmount * 1.5) + 20;
    const duration = 3; // Seasons to complete

    gameState.activeQuest = {
        cropId: randomCropId,
        description: `Local school needs ${targetAmount} plots of ${crop.name} for their cafeteria.`,
        targetAmount: targetAmount,
        currentAmount: 0,
        reward: reward,
        deadline: gameState.currentSeasonIndex + (gameState.year - 1) * 4 + duration
    };

    logEvent(`New Community Request: Harvest ${targetAmount} ${crop.name}!`, "NEUTRAL");
}

export function getCropAdvice(crop) {
    const currentSeason = SEASONS[gameState.currentSeasonIndex];
    if (crop.idealSeasons.includes(currentSeason)) {
        return `This crop grows well in ${currentSeason}. Ideal conditions for planting!`;
    } else {
        return `This crop is not in its ideal season. Consider waiting for ${crop.idealSeasons.join(' or ')}.`;
    }
}

export function getPracticeAdvice(practice) {
    if (practice.health_impact > 0) {
        return `This practice will improve your biome health by ${practice.health_impact}%.`;
    } else {
        return `This practice will decrease your biome health by ${Math.abs(practice.health_impact)}%. Use it sparingly.`;
    }
}

function giveAdvice() {
    const currentSeason = SEASONS[gameState.currentSeasonIndex];
    const nextSeason = SEASONS[(gameState.currentSeasonIndex + 1) % 4];

    if (gameState.biomeHealth < 50) {
        logAdvisor("Biome health is getting low. Consider using practices like Mulching or Cultural Burning to restore the land.");
    } else if (currentSeason === 'Summer' && gameState.currentBiome.name === 'Temperate Grassland') {
        logAdvisor("It's summer! Heatwaves are a risk. Do you have enough water, or a plan to conserve it?");
    } else if (currentSeason === 'Summer' && gameState.currentBiome.name === 'Tropical Savanna') {
            logAdvisor("The wet season is here! Mulching can protect your crops from being washed away by heavy rains.");
    } else if (currentSeason === 'Winter') {
        logAdvisor("Winter is a challenging season. Consider planting hardier crops like barley that can withstand the cold.");
    } else if (gameState.food < COMMUNITY_SIZE * FOOD_PER_PERSON * 2) {
        logAdvisor("Food supplies are running low. Focus on high-food yield crops like lentils to feed your community.");
    } else {
        logAdvisor(`The ${currentSeason} season is progressing. Prepare for ${nextSeason} by planning your crops and management practices.`);
    }
}

function endGame(isWin) {
    if (gameLoopId) clearInterval(gameLoopId); // Stop the loop

    // dom.nextSeasonBtn.disabled = true; // No longer relevant
    let message;

    if (isWin) {
        message = `
            <h2 class="text-3xl font-bold text-green-700 mb-4">Congratulations!</h2>
            <p class="mb-4">You successfully supported your community for 3 years! You have achieved food security.</p>
            <div class="text-5xl mb-4">🏆</div>
        `;
    } else {
        message = `
            <h2 class="text-3xl font-bold text-red-700 mb-4">Challenge Failed</h2>
            <p class="mb-4">You couldn't sustain your community for 3 years. Reflect on what could be done differently.</p>
            <div class="text-5xl mb-4">🌱</div>
        `;
    }

    message += `
        <div class="mt-6 text-left border-t pt-4">
            <p><strong>Final Biome Health:</strong> ${gameState.biomeHealth}%</p>
            <p><strong>Final Food Stores:</strong> ${gameState.food}</p>
            <p><strong>Final Money:</strong> $${gameState.money}</p>
            <p><strong>Final Water:</strong> ${gameState.water}</p>
        </div>
        <button id="restart-btn" class="mt-6 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            Play Again
        </button>
    `;

    dom.endGameContent.innerHTML = message;
    dom.endGameModal.classList.remove('hidden');

    setTimeout(() => {
        dom.endGameModal.classList.remove('opacity-0');
    }, 10);

    document.getElementById('restart-btn').addEventListener('click', () => location.reload());
}
