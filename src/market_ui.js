import { gameState } from './state.js';
import { dom } from './ui.js';

export function openMarketModal() {
    dom.marketModal.classList.remove('hidden');
    setTimeout(() => {
        dom.marketModal.classList.remove('opacity-0');
    }, 10);
    renderMarketChart();
}

export function closeMarketModal() {
    dom.marketModal.classList.add('opacity-0');
    setTimeout(() => {
        dom.marketModal.classList.add('hidden');
    }, 300);
}

function renderMarketChart() {
    const canvas = dom.marketCanvas;
    if (!canvas) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=1; i<5; i++) {
        const y = (height / 5) * i;
        ctx.moveTo(30, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    const crops = gameState.currentBiome.crops;
    const colors = ['#e53e3e', '#3182ce', '#38a169', '#d69e2e'];
    let colorIndex = 0;

    // Draw Lines
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find Max Price for Y Scale
    let maxPrice = 0;
    for (const cropId in crops) {
        if (gameState.market.history && gameState.market.history[cropId]) {
            maxPrice = Math.max(maxPrice, ...gameState.market.history[cropId]);
        }
    }
    maxPrice = Math.ceil(maxPrice * 1.2); // +20% buffer

    // Draw Y Axis Labels
    ctx.fillStyle = '#718096';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for(let i=0; i<=4; i++) {
        const val = Math.round(maxPrice * (i/4));
        const y = height - paddingBottom - (chartHeight * (i/4));
        ctx.fillText(`$${val}`, 25, y + 3);
    }

    for (const cropId in crops) {
        const history = gameState.market.history ? gameState.market.history[cropId] : [];
        if (!history || history.length < 2) continue;

        const color = colors[colorIndex % colors.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const stepX = chartWidth / (history.length - 1);

        history.forEach((price, index) => {
            const x = paddingLeft + (index * stepX);
            const y = height - paddingBottom - ((price / maxPrice) * chartHeight);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw Legend
        ctx.fillStyle = color;
        ctx.fillRect(paddingLeft + (colorIndex * 80), height - 15, 10, 10);
        ctx.fillStyle = '#2d3748';
        ctx.textAlign = 'left';
        ctx.fillText(crops[cropId].name, paddingLeft + (colorIndex * 80) + 15, height - 6);

        colorIndex++;
    }
}
