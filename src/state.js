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
    marketMultiplier: 1.0,

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
    gameState.marketMultiplier = 1.0;
    gameState.activeQuest = null;
}
