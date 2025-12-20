import { gameState } from './state.js';
import { dom, logEvent } from './ui.js';

const NPC_TYPES = {
    MERCHANT: {
        id: 'merchant',
        name: 'Traveling Merchant',
        icon: '🛒',
        dialogues: [
            {
                text: "I have some rare seeds. Want to trade?",
                options: [
                    { text: "Buy Seeds ($20)", action: 'buy_seeds', cost: { money: 20 } },
                    { text: "No thanks", action: 'leave' }
                ]
            },
            {
                text: "I'm looking to buy crops in bulk. I pay well.",
                options: [
                    { text: "Sell 50 Food ($100)", action: 'sell_food', cost: { food: 50 } },
                    { text: "Not today", action: 'leave' }
                ]
            }
        ]
    },
    NEIGHBOR: {
        id: 'neighbor',
        name: 'Friendly Neighbor',
        icon: '👩‍🌾',
        dialogues: [
            {
                text: "My well has run dry. Can you spare some water?",
                options: [
                    { text: "Give Water (10 units)", action: 'give_water', cost: { water: 10 } },
                    { text: "Sorry, I'm low too", action: 'refuse_water' }
                ]
            },
            {
                text: "I have extra fertilizer. Do you want some?",
                options: [
                    { text: "Accept Gift", action: 'accept_gift' },
                    { text: "Pass it to someone else", action: 'leave' }
                ]
            }
        ]
    },
    BEGGAR: {
        id: 'beggar',
        name: 'Wandering Traveler',
        icon: '🚶',
        dialogues: [
            {
                text: "I'm hungry... haven't eaten in days.",
                options: [
                    { text: "Give Food (5 units)", action: 'give_food', cost: { food: 5 } },
                    { text: "Turn away", action: 'turn_away' }
                ]
            }
        ]
    }
};

export function spawnNPC() {
    if (gameState.activeNPC) return; // Only one at a time

    const types = Object.values(NPC_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];

    // Pick a random dialogue
    const dialogue = type.dialogues[Math.floor(Math.random() * type.dialogues.length)];

    gameState.activeNPC = {
        type: type,
        dialogue: dialogue,
        expiresAt: gameState.seasonProgress + 25 // Stays for 1/4 season
    };

    logEvent(`A ${type.name} has arrived at the farm!`, "NEUTRAL");
    updateNPCUI();
}

export function updateNPCs() {
    if (!gameState.activeNPC) return;

    // Check expiry (wrap around check handled by season change clearing it mostly,
    // but if it spawns at 90%, it expires next season.
    // For simplicity, clear on season change in game.js, or just check here)
    // Actually, let's just use a simple timer or check if season changed?
    // Let's rely on game.js clearing it or just let it persist until clicked/dismissed for now
    // but we added expiresAt logic.
    // If season progress wrapped, it might look like it expired.
    // Let's keep it simple: NPC leaves at end of season automatically (handled in advanceSeason reset?)
    // No, advanceSeason resets seasonProgress to 0.

    // For now, let's just show it.
    updateNPCUI();
}

function updateNPCUI() {
    if (!gameState.activeNPC) {
        // Remove from DOM if exists
        const existing = document.getElementById('npc-container');
        if (existing) existing.remove();
        return;
    }

    let container = document.getElementById('npc-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'npc-container';
        container.className = 'absolute top-20 right-4 cursor-pointer animate-bounce';
        container.onclick = openNPCDialogue;
        document.getElementById('game-container').appendChild(container);
    }

    container.innerHTML = `
        <div class="bg-white border-2 border-yellow-500 rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg relative">
            ${gameState.activeNPC.type.icon}
            <div class="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"></div>
        </div>
        <div class="text-center text-xs font-bold bg-white rounded px-1 mt-1 shadow border">${gameState.activeNPC.type.name}</div>
    `;
}

function openNPCDialogue() {
    // Pause game
    gameState.isPaused = true;

    const npc = gameState.activeNPC;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'npc-modal';

    let optionsHtml = '';
    npc.dialogue.options.forEach((opt, index) => {
        // Check costs
        let disabled = '';
        let costText = '';
        if (opt.cost) {
            if (opt.cost.money && gameState.money < opt.cost.money) disabled = 'disabled';
            if (opt.cost.food && gameState.food < opt.cost.food) disabled = 'disabled';
            if (opt.cost.water && gameState.water < opt.cost.water) disabled = 'disabled';

            const costs = [];
            if (opt.cost.money) costs.push(`$${opt.cost.money}`);
            if (opt.cost.food) costs.push(`${opt.cost.food} Food`);
            if (opt.cost.water) costs.push(`${opt.cost.water} Water`);
            costText = `(${costs.join(', ')})`;
        }

        optionsHtml += `
            <button class="w-full text-left p-3 border rounded hover:bg-gray-50 mb-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                ${disabled}
                data-index="${index}">
                <div class="font-bold">${opt.text}</div>
                <div class="text-xs text-red-600">${costText}</div>
            </button>
        `;
    });

    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div class="flex items-center mb-4">
                <div class="text-4xl mr-4">${npc.type.icon}</div>
                <div>
                    <h3 class="text-xl font-bold">${npc.type.name}</h3>
                    <p class="text-gray-600">Visitor</p>
                </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded mb-4 border border-yellow-100">
                "${npc.dialogue.text}"
            </div>

            <div class="space-y-2">
                ${optionsHtml}
            </div>

            <button class="mt-4 text-gray-500 text-sm hover:underline w-full text-center" id="close-npc-modal">
                Ignore (Resume Game)
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    modal.querySelectorAll('button[data-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            handleNPCAction(npc.dialogue.options[index]);
            closeNPCModal();
        });
    });

    document.getElementById('close-npc-modal').addEventListener('click', () => {
        closeNPCModal();
    });
}

function handleNPCAction(option) {
    // Pay costs
    if (option.cost) {
        if (option.cost.money) gameState.money -= option.cost.money;
        if (option.cost.food) gameState.food -= option.cost.food;
        if (option.cost.water) gameState.water -= option.cost.water;
    }

    // Effects
    switch(option.action) {
        case 'buy_seeds':
            // Give a random upgrade or just generic benefit?
            // Let's unlock a random upgrade or give "Hybrid Seeds" if not unlocked
            if (!gameState.unlockedUpgrades.includes('hybrid_seeds')) {
                gameState.unlockedUpgrades.push('hybrid_seeds');
                logEvent("Bought Hybrid Seeds! Yields increased.", "BOON");
            } else {
                gameState.soilQuality = Math.min(100, gameState.soilQuality + 20);
                logEvent("Bought high quality compost instead. Soil quality improved.", "BOON");
            }
            break;
        case 'sell_food':
            gameState.money += 100;
            logEvent("Sold food bulk shipment.", "BOON");
            break;
        case 'give_water':
            gameState.biomeHealth = Math.min(100, gameState.biomeHealth + 5);
            gameState.knowledge += 2;
            logEvent("Helped neighbor with water. Reputation (Biome Health) increased.", "BOON");
            break;
        case 'refuse_water':
            logEvent("Refused neighbor request.", "NEUTRAL");
            break;
        case 'accept_gift':
            gameState.soilQuality = Math.min(100, gameState.soilQuality + 15);
            logEvent("Accepted fertilizer gift from neighbor.", "BOON");
            break;
        case 'give_food':
            gameState.biomeHealth = Math.min(100, gameState.biomeHealth + 10); // Karma
            logEvent("Shared food with the needy. Felt good.", "BOON");
            break;
        case 'turn_away':
            gameState.biomeHealth = Math.max(0, gameState.biomeHealth - 5); // Bad Karma
            logEvent("Turned away the beggar.", "CHALLENGE");
            break;
    }

    // Remove NPC
    gameState.activeNPC = null;
    const container = document.getElementById('npc-container');
    if (container) container.remove();
}

function closeNPCModal() {
    const modal = document.getElementById('npc-modal');
    if (modal) modal.remove();
    gameState.isPaused = false;
}
