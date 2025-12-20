import { gameState, resetGameState } from './state.js';
import { dom, updateUI, logEvent, logAdvisor } from './ui.js';
import { SEASONS, WEATHER_EMOJIS, COMMUNITY_SIZE, FOOD_PER_PERSON, MANAGEMENT_PRACTICES, UPGRADES } from './data.js';

export function initializeGame(biome) {
    resetGameState(biome);

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

    updateWeather();
    updateUI();
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

function onPlotClick(plotIndex) {
    const plot = gameState.plots[plotIndex];
    if (gameState.selectedCrop && !plot.crop) {
        plantCrop(plotIndex);
    } else if (plot.crop) {
        openPlotModal(plotIndex);
    } else if (!plot.crop) {
        logAdvisor("Select a crop to plant on this empty plot, or consider using a management practice to improve soil quality.");
    }
}

function plantCrop(plotIndex) {
    const cropId = gameState.selectedCrop;
    if (!cropId) return;

    const crop = gameState.currentBiome.crops[cropId];
    if (gameState.money < crop.cost) {
        logEvent(`Not enough money to plant ${crop.name}. Need $${crop.cost} but only have $${gameState.money}.`, "error");
        return;
    }

    // Check if this is the same crop as last time (affects yield)
    const sameCrop = gameState.plots[plotIndex].lastCrop === cropId;
    if (sameCrop) {
        logEvent(`Planting ${crop.name} in the same plot again may reduce yield due to soil depletion. Consider crop rotation.`, "CHALLENGE");
    }

    gameState.money -= crop.cost;
    gameState.plots[plotIndex] = {
        ...gameState.plots[plotIndex],
        crop: cropId,
        plantedAt: gameState.currentSeasonIndex + (gameState.year - 1) * 4,
        isMature: false,
        lastCrop: cropId,
        moisture: 50 // Reset moisture when planting
    };

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
    const plot = gameState.plots[plotIndex];
    const crop = gameState.currentBiome.crops[plot.crop];

    let extraInfo = '';

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
                </div>
            </div>
        `;
    }

    let infoText = `
        <div class="text-center mb-2 text-3xl">${crop.emoji}</div>
        <div class="text-center font-semibold">${crop.name}</div>
        <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>Moisture:</div>
            <div class="text-right">${plot.moisture}%</div>
            <div>Status:</div>
            <div class="text-right">${plot.isMature ? 'Ready to harvest' : 'Growing'}</div>
            <div>Water need:</div>
            <div class="text-right">${crop.waterNeed}</div>
            ${extraInfo}
        </div>
    `;

    dom.harvestBtn.disabled = !plot.isMature;
    // Store the active plot index in a data attribute or similar way if needed,
    // but here we might need to rely on a module-level variable or pass it to handlers.
    // We'll use a closure-like approach by updating the onclick handlers.

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
}

function handleHarvest(plotIndex) {
    const plot = gameState.plots[plotIndex];
    const crop = gameState.currentBiome.crops[plot.crop];
    let yieldModifier = gameState.seasonalEffects.yieldModifier;

    // Apply modifiers based on conditions
    if (plot.isFertile) yieldModifier *= 1.25;
    if (plot.moisture < 20) yieldModifier *= 0.7; // Drought reduces yield
    if (plot.lastCrop === plot.crop) yieldModifier *= 0.8; // Same crop penalty

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

    const moneyGained = Math.floor(crop.yield * yieldModifier * sellPriceMultiplier);
    const foodGained = crop.food;

    // Gain Knowledge
    let knowledgeGain = 1;
    if (gameState.plots[plotIndex].plantedAt === 0) { // First harvest ever? No, plantedAt is reset.
        // Simple logic for now: small chance for bonus
        if (Math.random() > 0.7) knowledgeGain += 1;
    }
    gameState.knowledge += knowledgeGain;

    gameState.money += moneyGained;
    gameState.food += foodGained;

    // Animation effect
    const plotEl = document.querySelector(`.plot[data-plot-id="${plotIndex}"]`);
    plotEl.classList.add('pulse');
    setTimeout(() => plotEl.classList.remove('pulse'), 500);

    logEvent(`Harvested ${crop.name} for $${moneyGained}, ${foodGained} food, and ${knowledgeGain} Knowledge.`, 'BOON');

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
    // 1. Apply Management Practice & Deduct Food
    applyManagementPractice();
    const foodDemand = COMMUNITY_SIZE * FOOD_PER_PERSON;
    gameState.food -= foodDemand;

    // 2. Update soil moisture for all plots
    gameState.plots.forEach(plot => {
        if (plot.crop) {
            // Moisture decreases each season
            plot.moisture = Math.max(0, plot.moisture - 20);

            // If moisture is too low, crop growth is stunted
            if (plot.moisture < 20) {
                logEvent(`Crop in plot ${plot.id + 1} is suffering from drought conditions.`, "CHALLENGE");
            }
        }
    });

    // 3. Grow crops
    gameState.plots.forEach(plot => {
        if (plot.crop) {
            const crop = gameState.currentBiome.crops[plot.crop];
            const seasonsGrown = (gameState.currentSeasonIndex + (gameState.year - 1) * 4) - plot.plantedAt;

            // Growth is slower if moisture is low
            const growthRate = plot.moisture > 30 ? 1 : 0.5;

            // Hybrid Seeds Upgrade
            // We can't easily change growth time, but we can ensure they are resilient

            if (seasonsGrown >= (crop.growthTime - 1) * growthRate) {
                plot.isMature = true;
            }
        }
    });

    // 4. Advance season & year
    gameState.currentSeasonIndex++;
    if (gameState.currentSeasonIndex === 4) {
        gameState.currentSeasonIndex = 0;
        gameState.year++;
    }

    // 5. Update weather
    updateWeather();

    // 6. Trigger seasonal & biome health events
    const currentSeasonName = SEASONS[gameState.currentSeasonIndex];
    const potentialEvents = gameState.currentBiome.events[currentSeasonName];
    const event = potentialEvents[Math.floor(Math.random() * potentialEvents.length)];
    logEvent(event.text, event.type);
    applyEventEffect(event.effect);

    // 7. Random events based on biome health
    if (gameState.biomeHealth < 40 && Math.random() < 0.3) {
        logEvent("Pest outbreak! Poor biome health has attracted pests, destroying a crop.", "CHALLENGE");
        applyEventEffect('crop_loss');
    }

    if (gameState.biomeHealth > 80 && Math.random() < 0.2) {
        logEvent("The ecosystem is thriving! Natural pollinators increase your yield.", "BOON");
        applyEventEffect('yield_boost');
    }

    // 7b. Quest Management
    manageQuests();

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
    const currentSeason = SEASONS[gameState.currentSeasonIndex];
    const weatherOptions = gameState.currentBiome.weather[currentSeason];
    gameState.weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    dom.weatherText.textContent = gameState.weather;
    dom.weatherIcon.textContent = WEATHER_EMOJIS[gameState.weather] || '🌤️';
}

function applyManagementPractice() {
    const practiceId = gameState.activePractice;
    if (!practiceId) {
        logEvent("No management practice chosen for the season.");
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

    switch(effect) {
        case 'water_gain_high':
            gameState.water += 30;
            break;
        case 'water_gain_med':
            gameState.water += 20;
            break;
        case 'water_gain_low':
            gameState.water += 10;
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

    // Check if it's feasible to grow (in season or coming up)
    // For simplicity, just pick a random one for now, adds challenge

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

function getCropAdvice(crop) {
    const currentSeason = SEASONS[gameState.currentSeasonIndex];
    if (crop.idealSeasons.includes(currentSeason)) {
        return `This crop grows well in ${currentSeason}. Ideal conditions for planting!`;
    } else {
        return `This crop is not in its ideal season. Consider waiting for ${crop.idealSeasons.join(' or ')}.`;
    }
}

function getPracticeAdvice(practice) {
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
    dom.nextSeasonBtn.disabled = true;
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
