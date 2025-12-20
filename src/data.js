export const NUM_PLOTS = 40;
export const COMMUNITY_SIZE = 20;
export const FOOD_PER_PERSON = 2;

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const SEASON_EMOJIS = ['🌱', '☀️', '🍂', '❄️'];
export const SEASON_CLASSES = ['spring', 'summer', 'autumn', 'winter'];

export const WEATHER_EMOJIS = {
    'Mild': '🌤️', 'Rainy': '🌧️', 'Windy': '💨', 'Hot': '🔥', 'Dry': '🏜️', 'Sunny': '☀️',
    'Cool': '🌤️', 'Misty': '🌫️', 'Breezy': '💨', 'Cold': '❄️', 'Frosty': '🌨️', 'Snowy': '❄️',
    'Wet': '🌧️', 'Humid': '💦', 'Stormy': '⛈️', 'Warm': '🌤️', 'Clear': '☀️'
};

export const BIOMES = {
    temperate: {
        id: 'temperate',
        name: "Temperate Grassland",
        description: "Mild climate with balanced seasons. Good for traditional grain crops.",
        location: "(e.g., South Australia)",
        crops: {
            wheat: {
                name: 'Wheat',
                emoji: '🌾',
                asset: 'wheat.svg',
                cost: 10,
                baseYield: 5,
                basePrice: 5, // 5 * 5 = 25 (Similar to old yield)
                food: 5,
                growthTime: 1,
                waterNeed: 15,
                idealSeasons: ['Spring', 'Autumn'],
                traits: ['heavy_feeder']
            },
            canola: {
                name: 'Canola',
                emoji: '🌻',
                asset: 'sunflower.svg',
                cost: 15,
                baseYield: 4,
                basePrice: 10, // 4 * 10 = 40
                food: 3,
                growthTime: 1,
                waterNeed: 20,
                idealSeasons: ['Spring'],
                traits: ['pest_prone']
            },
            barley: {
                name: 'Barley',
                emoji: '🍺',
                asset: 'barley.svg',
                cost: 8,
                baseYield: 5,
                basePrice: 4, // 5 * 4 = 20
                food: 4,
                growthTime: 1,
                waterNeed: 10,
                idealSeasons: ['Autumn', 'Winter'],
                traits: ['hardy']
            },
            lentils: {
                name: 'Lentils',
                emoji: '🌱',
                asset: 'lentil.svg',
                cost: 20,
                baseYield: 5,
                basePrice: 10, // 5 * 10 = 50
                food: 8,
                growthTime: 2,
                waterNeed: 25,
                idealSeasons: ['Spring'],
                traits: ['nitrogen_fixer']
            },
        },
        events: {
            Spring: [
                { type: 'BOON', text: 'Perfect growing conditions! Water reserves replenished.', effect: 'water_gain_high' },
                { type: 'NEUTRAL', text: 'Gentle rains help crops grow steadily.', effect: 'water_gain_med' }
            ],
            Summer: [
                { type: 'CHALLENGE', text: 'Heatwave! Water is scarce and evaporates quickly.', effect: 'water_loss' },
                { type: 'NEUTRAL', text: 'A calm, sunny summer.', effect: 'water_gain_low' },
                { type: 'CHALLENGE', text: 'Drought conditions persist. Crops need extra water.', effect: 'water_loss_high' }
            ],
            Autumn: [
                { type: 'NEUTRAL', text: 'Steady rains fall.', effect: 'water_gain_med' },
                { type: 'BOON', text: 'Mild weather perfect for harvesting.', effect: 'yield_boost' }
            ],
            Winter: [
                { type: 'CHALLENGE', text: 'Frost hits the farm! Unharvested crops are at risk.', effect: 'crop_loss' },
                { type: 'NEUTRAL', text: 'A cold but stable winter.', effect: 'water_gain_low' },
                { type: 'CHALLENGE', text: 'Heavy snowfall damages infrastructure.', effect: 'money_loss' }
            ],
        },
        weather: {
            Spring: ['Mild', 'Rainy', 'Windy'],
            Summer: ['Hot', 'Dry', 'Sunny'],
            Autumn: ['Cool', 'Misty', 'Breezy'],
            Winter: ['Cold', 'Frosty', 'Snowy']
        }
    },
    savanna: {
        id: 'savanna',
        name: "Tropical Savanna",
        description: "Distinct wet and dry seasons. Supports resilient, unique crops.",
        location: "(e.g., Northern Territory)",
        crops: {
            sorghum: {
                name: 'Sorghum',
                emoji: '🌽',
                asset: 'corn.svg',
                cost: 12,
                baseYield: 6,
                basePrice: 5, // 30 total
                food: 6,
                growthTime: 1,
                waterNeed: 15,
                idealSeasons: ['Summer'],
                traits: ['drought_resistant']
            },
            mango: {
                name: 'Mangoes',
                emoji: '🥭',
                asset: 'mango.svg',
                cost: 25,
                baseYield: 6,
                basePrice: 10, // 60 total
                food: 4,
                growthTime: 2,
                waterNeed: 30,
                idealSeasons: ['Summer', 'Autumn'],
                traits: ['standard']
            },
            peanut: {
                name: 'Peanuts',
                emoji: '🥜',
                asset: 'peanut.svg',
                cost: 10,
                baseYield: 5,
                basePrice: 5, // 25 total
                food: 3,
                growthTime: 1,
                waterNeed: 12,
                idealSeasons: ['Summer'],
                traits: ['nitrogen_fixer']
            },
            millet: {
                name: 'Millet',
                emoji: '🌾',
                asset: 'millet.svg',
                cost: 8,
                baseYield: 4,
                basePrice: 6, // 24 total
                food: 5,
                growthTime: 1,
                waterNeed: 10,
                idealSeasons: ['Autumn'],
                traits: ['drought_resistant', 'hardy']
            },
        },
        events: {
            Spring: [
                { type: 'NEUTRAL', text: 'The dry season ends. The air is tense with anticipation for the rains.', effect: 'water_gain_low' },
                { type: 'CHALLENGE', text: 'Unexpected late heatwave stresses crops.', effect: 'water_loss' }
            ],
            Summer: [
                { type: 'CHALLENGE', text: 'Monsoonal rains! Risk of flooding on unprepared land.', effect: 'flood_risk' },
                { type: 'BOON', text: 'Perfect wet season. Water is abundant!', effect: 'water_gain_high' },
                { type: 'BOON', text: 'The rains arrive right on schedule. Crops are thriving.', effect: 'yield_boost' }
            ],
            Autumn: [
                { type: 'NEUTRAL', text: 'The rains ease, leaving the land lush and fertile.', effect: 'water_gain_med' },
                { type: 'BOON', text: 'Ideal harvesting conditions with sunny days.', effect: 'yield_boost' }
            ],
            Winter: [
                { type: 'NEUTRAL', text: 'The dry season begins. The air is cool and clear.', effect: null },
                { type: 'CHALLENGE', text: 'Water sources are drying up faster than expected.', effect: 'water_loss' }
            ],
        },
        weather: {
            Spring: ['Hot', 'Dry', 'Windy'],
            Summer: ['Wet', 'Humid', 'Stormy'],
            Autumn: ['Warm', 'Breezy', 'Clear'],
            Winter: ['Cool', 'Dry', 'Sunny']
        }
    }
};

export const MANAGEMENT_PRACTICES = {
    fertilizer: {
        id: 'fertilizer',
        name: 'Chemical Fertilizer',
        description: 'Costs $30. Boosts yield but harms soil biodiversity.',
        cost: { money: 30 },
        effect: 'yield_boost_high',
        health_impact: -15,
        duration: 1
    },
    irrigation: {
        id: 'irrigation',
        name: 'Modern Irrigation',
        description: 'Costs $20 & 30 Water. Increases yield, minor environmental strain.',
        cost: { money: 20, water: 30 },
        effect: 'yield_boost_med',
        health_impact: -5,
        duration: 2
    },
    mulching: {
        id: 'mulching',
        name: 'Sustainable Mulching',
        description: 'Costs $10. Conserves water and protects soil health.',
        cost: { money: 10 },
        effect: 'conserve_water',
        health_impact: 5,
        duration: 1
    },
    cultural_burning: {
        id: 'cultural_burning',
        name: 'Cultural Burning',
        description: 'Costs 5 Food. Greatly improves soil health and prevents wildfires.',
        cost: { food: 5 },
        effect: 'enrich_soil',
        health_impact: 20,
        duration: 2
    },
    crop_rotation: {
        id: 'crop_rotation',
        name: 'Crop Rotation',
        description: 'Costs $15. Improves long-term soil health and reduces pests.',
        cost: { money: 15 },
        effect: 'soil_health',
        health_impact: 10,
        duration: 3
    }
};

export const UPGRADES = {
    drip_irrigation: {
        id: 'drip_irrigation',
        name: 'Drip Irrigation',
        description: 'Advanced watering system that reduces water usage for crops by 20%.',
        cost: 50,
        effect: 'water_efficiency'
    },
    composting: {
        id: 'composting',
        name: 'Community Composting',
        description: 'Reduces the cost of chemical fertilizers by 50% through organic recycling.',
        cost: 30,
        effect: 'fertilizer_discount'
    },
    hybrid_seeds: {
        id: 'hybrid_seeds',
        name: 'Hybrid Seeds',
        description: 'Scientifically improved seeds that increase overall yield by 15%.',
        cost: 60,
        effect: 'yield_increase_passive'
    },
    market_connections: {
        id: 'market_connections',
        name: 'Market Connections',
        description: 'Better trade routes increase crop sell prices by 10%.',
        cost: 40,
        effect: 'price_increase'
    },
    soil_testing: {
        id: 'soil_testing',
        name: 'Soil Testing Kit',
        description: 'Reveals detailed soil stats and prevents yield loss from poor soil match.',
        cost: 25,
        effect: 'soil_insight'
    },
    rainwater_catchment: {
        id: 'rainwater_catchment',
        name: 'Rainwater Catchment',
        description: 'Grants +5 water per season passively. Doubles water gain from rain events.',
        cost: 75,
        effect: 'water_gain_passive'
    },
    seed_drill: {
        id: 'seed_drill',
        name: 'Seed Drill',
        description: 'Reduces the money cost of planting crops by 20%.',
        cost: 60,
        effect: 'planting_discount'
    },
    greenhouse: {
        id: 'greenhouse',
        name: 'Greenhouse',
        description: 'Protects crops from being destroyed by extreme weather (Frost, Heatwaves).',
        cost: 100,
        effect: 'weather_protection'
    },
    pest_management: {
        id: 'pest_management',
        name: 'Integrated Pest Management',
        description: 'Reduces risk of pest outbreaks and prevents yield loss from pests.',
        cost: 50,
        effect: 'pest_resistance'
    },
    ag_training: {
        id: 'ag_training',
        name: 'Agricultural Training',
        description: 'Harvesting crops grants +50% more Knowledge.',
        cost: 80,
        effect: 'knowledge_boost'
    },
    meteorological_station: {
        id: 'meteorological_station',
        name: 'Adv. Met Station',
        description: 'Forecasts the weather pattern for the upcoming season.',
        cost: 45,
        effect: 'weather_forecast'
    }
};
