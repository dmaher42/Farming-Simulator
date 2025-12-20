import { NUM_PLOTS } from './data.js';

export const gameState = {
    money: 100,
    food: 40,
    water: 50,
    biomeHealth: 100,
    currentSeasonIndex: 0,
    year: 1,
    soilQuality: 80,
    plots: Array.from({ length: NUM_PLOTS }, (_, i) => ({
        id: i,
        crop: null,
        plantedAt: 0,
        isMature: false,
        isFertile: false,
        moisture: 50,
        lastCrop: null
    })),
    selectedCrop: null,
    activePractice: null,
    seasonalEffects: { yieldModifier: 1.0, conserveWater: false },
    weather: 'Mild',
    currentBiome: null,

    // New features state
    knowledge: 0,
    unlockedUpgrades: [],

    // Market
    market: { prices: {} },

    // Quests
    activeQuest: null
};

export function resetGameState(biome) {
    gameState.money = 100;
    gameState.food = 40;
    gameState.water = 50;
    gameState.biomeHealth = 100;
    gameState.currentSeasonIndex = 0;
    gameState.year = 1;
    gameState.soilQuality = 80;
    gameState.plots = Array.from({ length: NUM_PLOTS }, (_, i) => ({
        id: i,
        crop: null,
        plantedAt: 0,
        isMature: false,
        isFertile: false,
        moisture: 50,
        lastCrop: null
    }));
    gameState.selectedCrop = null;
    gameState.activePractice = null;
    gameState.seasonalEffects = { yieldModifier: 1.0, conserveWater: false };
    gameState.weather = 'Mild';
    gameState.currentBiome = biome;
    gameState.knowledge = 0;
    gameState.unlockedUpgrades = [];
    gameState.market = { prices: {} };
    gameState.activeQuest = null;
}

export function saveGame() {
    try {
        const serializedState = JSON.stringify(gameState);
        localStorage.setItem('biomeFarmerSave', serializedState);
        console.log("Game saved.");
        return true;
    } catch (e) {
        console.error("Failed to save game", e);
        return false;
    }
}

export function loadGame() {
    try {
        const saved = localStorage.getItem('biomeFarmerSave');
        if (!saved) return false;

        const parsed = JSON.parse(saved);

        // Restore properties (shallow merge to ensure structure, but state replaces values)
        Object.assign(gameState, parsed);

        // Re-link biome object (since JSON only saved properties, not the reference to data.js constant)
        // We need to fetch the full biome object from data.js based on ID
        // This circular dependency is tricky. We'll handle biome restoration in main.js or game.js

        return true;
    } catch (e) {
        console.error("Failed to load game", e);
        return false;
    }
}
