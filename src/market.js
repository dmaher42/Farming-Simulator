import { gameState } from './state.js';
import { logEvent } from './ui.js';

// Base volatility ranges for market events
const MARKET_EVENTS = [
    { name: "Global Shortage", multiplier: 1.5, text: "Global food shortages have driven up prices!" },
    { name: "Bumper Crop", multiplier: 0.6, text: "A surplus in the region has lowered crop prices." },
    { name: "Trade Deal", multiplier: 1.2, text: "A new trade agreement boosts export prices." },
    { name: "Transport Strike", multiplier: 0.8, text: "Transport issues make it harder to sell crops." },
    { name: "Stable Market", multiplier: 1.0, text: "The market is stable." }
];

export function initializeMarket() {
    gameState.market = {
        prices: {},
        history: {}
    };

    // Pre-populate some history for the chart
    const biomeCrops = gameState.currentBiome.crops;
    for (const cropId in biomeCrops) {
        gameState.market.history[cropId] = [];
        const basePrice = biomeCrops[cropId].basePrice;

        // Generate 5 past seasons
        for (let i = 0; i < 5; i++) {
            const randomFluctuation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            const price = parseFloat((basePrice * randomFluctuation).toFixed(2));
            gameState.market.history[cropId].push(price);
        }
    }

    updateMarketPrices();
}

export function updateMarketPrices() {
    if (!gameState.market.history) {
        gameState.market.history = {};
    }

    // 1. Determine Global Market Trend
    // 20% chance of a significant event, otherwise minor fluctuations
    let marketEvent = MARKET_EVENTS[4]; // Default stable

    if (Math.random() < 0.25) {
        marketEvent = MARKET_EVENTS[Math.floor(Math.random() * (MARKET_EVENTS.length - 1))];
    }

    if (marketEvent.name !== "Stable Market") {
        logEvent(marketEvent.text, "NEUTRAL");
    }

    // 2. Calculate prices for each crop in the current biome
    const biomeCrops = gameState.currentBiome.crops;
    for (const cropId in biomeCrops) {
        const crop = biomeCrops[cropId];

        // Base fluctuation +/- 10%
        const randomFluctuation = 0.9 + Math.random() * 0.2;

        // Calculate final price per unit
        // Price = BasePrice * MarketEvent * RandomFluctuation
        let newPrice = crop.basePrice * marketEvent.multiplier * randomFluctuation;

        // Round to 2 decimals
        gameState.market.prices[cropId] = parseFloat(newPrice.toFixed(2));

        // Update History
        if (!gameState.market.history[cropId]) {
            gameState.market.history[cropId] = [];
        }
        gameState.market.history[cropId].push(gameState.market.prices[cropId]);

        // Limit history to last 12 seasons (3 years)
        if (gameState.market.history[cropId].length > 12) {
            gameState.market.history[cropId].shift();
        }
    }
}

export function getCropPrice(cropId) {
    if (!gameState.market || !gameState.market.prices[cropId]) {
        return gameState.currentBiome.crops[cropId].basePrice;
    }
    return gameState.market.prices[cropId];
}
