
const EventEmitter = require('events');
const songsAdbreak = require('./songsadbreak');

const AD_BREAK_INTERVAL = 15 * 60 * 1000; // 15 minutes
const AD_BREAK_DURATION = 30 * 1000;       // 30 seconds

class MasterClock extends EventEmitter {
    constructor() {
        super();
        this.isAdBreaking = false;
        this.adTimer = null;
        this.streamStartTime = null;
        this.nextAdBreakTime = null;
        this.currentAdBreak = null;
    }

    start() {
        this.streamStartTime = Date.now();
        this.scheduleNextAdBreak();
        console.log('[MasterClock] Started – next ad break in 15 minutes.');
    }

    scheduleNextAdBreak() {
        this.nextAdBreakTime = Date.now() + AD_BREAK_INTERVAL;
        this.adTimer = setTimeout(() => this.triggerAdBreak(), AD_BREAK_INTERVAL);
    }

    triggerAdBreak() {
        if (this.isAdBreaking) return;

        const approved = songsAdbreak.getApprovedAdBreaks();
        if (approved.length === 0) {
            console.log('[MasterClock] No approved ad breaks available – skipping this break.');
            this.scheduleNextAdBreak();
            return;
        }

        const adBreak = approved[0];
        this.isAdBreaking = true;
        this.nextAdBreakTime = null;

        console.log('[MasterClock] Ad break starting:');
        this.emit('adBreakStart', adBreak);

        setTimeout(() => this.endAdBreak(), AD_BREAK_DURATION);
    }

    endAdBreak() {
        this.isAdBreaking = false;
        this.currentAdBreak = null;
        console.log('[MasterClock] Ad break ended.');
        this.emit('adBreakEnd');
        this.scheduleNextAdBreak();
    }
    
    stop() {
        if (this.adTimer) clearTimeout(this.adTimer);
    }
}

// Singleton – the whole app shares one clock.
module.exports = new MasterClock();
