export const audioManager = {
    ctx: null,
    isMuted: false,
    masterGain: null,
    ambienceNodes: [],
    initialized: false,

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default volume
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
        }
        return this.isMuted;
    },

    // --- Synthesis Helpers ---

    playTone(freq, type, duration, startTime = 0) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    },

    playNoise(duration) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    },

    // --- SFX Presets ---

    playClick() {
        // High pitched short blip
        this.playTone(800, 'sine', 0.05);
    },

    playPlant() {
        // Earthy thud/rustle
        this.playTone(150, 'triangle', 0.1);
        this.playTone(100, 'sawtooth', 0.15, 0.05);
    },

    playHarvest() {
        // Happy ascending chime
        this.playTone(440, 'sine', 0.1, 0);
        this.playTone(554, 'sine', 0.1, 0.1); // C#
        this.playTone(659, 'sine', 0.2, 0.2); // E
    },

    playMoney() {
        // Coin sound
        this.playTone(1200, 'sine', 0.1, 0);
        this.playTone(1600, 'sine', 0.3, 0.05);
    },

    playError() {
        // Low buzzer
        this.playTone(150, 'sawtooth', 0.2);
        this.playTone(130, 'sawtooth', 0.2, 0.1);
    },

    playBoon() {
        // Major chord sweep
        this.playTone(300, 'sine', 0.3, 0);
        this.playTone(400, 'sine', 0.3, 0.1);
        this.playTone(500, 'sine', 0.5, 0.2);
    },

    playChallenge() {
        // Dissonant/Minor warning
        this.playTone(300, 'sawtooth', 0.4, 0);
        this.playTone(290, 'sawtooth', 0.4, 0.1);
    },

    // --- Ambience ---

    startAmbience(biomeType) {
        if (!this.ctx) return;
        this.stopAmbience();

        // Create a noise loop for wind
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();

        if (biomeType === 'savanna') {
            // Hot wind / insects - High pass
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            filter.Q.value = 1;
        } else {
            // Temperate wind - Low pass
            filter.type = 'lowpass';
            filter.frequency.value = 400;
        }

        const gain = this.ctx.createGain();
        gain.gain.value = 0.02; // Very quiet

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();

        this.ambienceNodes = [noise, gain];
    },

    stopAmbience() {
        this.ambienceNodes.forEach(node => {
            try { node.stop ? node.stop() : node.disconnect(); } catch(e) {}
        });
        this.ambienceNodes = [];
    }
};
