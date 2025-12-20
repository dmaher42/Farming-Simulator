import { gameState } from './state.js';
import { dom } from './ui.js';

export const tutorialManager = {
    isActive: false,
    stepIndex: 0,
    overlay: null,
    steps: [
        {
            text: "Welcome to Biome Farmer! Your goal is to feed your community for 3 years. Let's start by choosing a crop.",
            target: "#crop-selections button:first-child",
            action: "click",
            position: "right"
        },
        {
            text: "Great! Now plant this crop in one of your plots.",
            target: ".plot:first-child",
            action: "click",
            position: "bottom"
        },
        {
            text: "Crops need water to grow. Since it's Spring, the soil is moist, but keep an eye on the water level!",
            target: "#water-display",
            action: "next", // Just a text prompt
            position: "bottom"
        },
        {
            text: "You can speed up time or wait. Once the crop is mature, click it to harvest.",
            target: "#season-header",
            action: "wait_harvest",
            position: "bottom"
        },
        {
            text: "Harvesting gives you Money and Food. Use Money to buy more seeds and upgrades!",
            target: "#money-display",
            action: "finish",
            position: "bottom"
        }
    ],

    init() {
        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'fixed inset-0 z-50 pointer-events-none hidden';
        this.overlay.innerHTML = `
            <div id="tutorial-spotlight" class="absolute transition-all duration-300 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"></div>
            <div id="tutorial-box" class="absolute bg-white p-4 rounded shadow-xl w-64 pointer-events-auto transition-all duration-300">
                <p id="tutorial-text" class="mb-4 text-gray-800"></p>
                <button id="tutorial-next-btn" class="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700">Next</button>
            </div>
        `;
        document.body.appendChild(this.overlay);

        document.getElementById('tutorial-next-btn').addEventListener('click', () => {
             this.advance();
        });
    },

    start() {
        this.isActive = true;
        this.stepIndex = 0;
        this.overlay.classList.remove('hidden');
        this.showStep();
    },

    stop() {
        this.isActive = false;
        this.overlay.classList.add('hidden');
    },

    showStep() {
        const step = this.steps[this.stepIndex];
        const targetEl = document.querySelector(step.target);

        const spotlight = document.getElementById('tutorial-spotlight');
        const box = document.getElementById('tutorial-box');
        const text = document.getElementById('tutorial-text');
        const btn = document.getElementById('tutorial-next-btn');

        text.textContent = step.text;

        if (step.action === 'finish') {
            btn.textContent = "Finish";
            btn.onclick = () => this.stop();
        } else if (step.action === 'next') {
            btn.textContent = "Next";
            btn.classList.remove('hidden');
            btn.onclick = () => this.advance();
        } else {
            btn.classList.add('hidden');
            // Attach temporary listener to target to auto-advance
            const oneTimeClick = () => {
                targetEl.removeEventListener('click', oneTimeClick);
                // small delay to let game logic process
                setTimeout(() => this.advance(), 500);
            };

            // Special case for harvest which might need waiting
            if (step.action === 'wait_harvest') {
                 // We will rely on game.js calling checkTutorialHarvest
                 btn.textContent = "Skip";
                 btn.classList.remove('hidden');
                 btn.onclick = () => this.advance();
            } else {
                 targetEl.addEventListener('click', oneTimeClick);
            }
        }

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();

            // Position Spotlight
            spotlight.style.top = `${rect.top}px`;
            spotlight.style.left = `${rect.left}px`;
            spotlight.style.width = `${rect.width}px`;
            spotlight.style.height = `${rect.height}px`;

            // Position Box
            let boxTop = 0;
            let boxLeft = 0;

            if (step.position === 'right') {
                boxTop = rect.top;
                boxLeft = rect.right + 20;
            } else if (step.position === 'bottom') {
                boxTop = rect.bottom + 20;
                boxLeft = rect.left;
            }

            // Screen bounds check
            if (boxLeft + 256 > window.innerWidth) boxLeft = window.innerWidth - 270;
            if (boxTop + 150 > window.innerHeight) boxTop = window.innerHeight - 160;

            box.style.top = `${boxTop}px`;
            box.style.left = `${boxLeft}px`;
        }
    },

    advance() {
        this.stepIndex++;
        if (this.stepIndex >= this.steps.length) {
            this.stop();
        } else {
            this.showStep();
        }
    },

    checkHarvest() {
        if (this.isActive && this.steps[this.stepIndex].action === 'wait_harvest') {
            this.advance();
        }
    }
};
