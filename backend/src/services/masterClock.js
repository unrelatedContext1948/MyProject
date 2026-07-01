/*
MasterClock – authoritative server-side timer for the stream.

Responsibilities:
  - Set adBreakPending = true every 15 minutes
  - Wait for the current song to finish (videoEnded in server.js triggers the break)
  - Emit 'adBreakStart' (with ad data) and 'adBreakEnd' events

server.js listens to these events and forwards them to all Socket.IO clients.
*/

const EventEmitter = require('events');
const songsAdbreak = require('./songsadbreak');

const AD_BREAK_INTERVAL = 15 * 60 * 1000; // 15 minutes

class MasterClock extends EventEmitter {
    constructor() {
        super();
        this.isAdBreaking = false;
        this.adBreakPending = false;
        this.adTimer = null;
        this.streamStartTime = null;
        this.nextAdBreakTime = null;
        this.currentAdBreak = null;
    }

    start() {
        this.streamStartTime = Date.now();
        this._scheduleNextAdBreak();
        console.log('[MasterClock] Started – next ad break in 15 minutes.');
    }

    _scheduleNextAdBreak() {
        this.nextAdBreakTime = Date.now() + AD_BREAK_INTERVAL;
        this.adTimer = setTimeout(() => {
            this.adBreakPending = true;
            console.log('[MasterClock] Ad break pending – waiting for current song to end.');
        }, AD_BREAK_INTERVAL);
    }

    triggerAdBreak() {
        if (this.isAdBreaking) return;

        const approved = songsAdbreak.getApprovedAdBreaks();
        if (approved.length === 0) {
            console.log('[MasterClock] No approved ad breaks – skipping this break.');
            this.adBreakPending = false;
            this._scheduleNextAdBreak();
            return;
        }

        this.currentAdBreak = approved[Math.floor(Math.random() * approved.length)];
        this.isAdBreaking = true;
        this.adBreakPending = false;
        this.nextAdBreakTime = null;

        console.log('[MasterClock] Ad break starting:', this.currentAdBreak.AdBreakTitle);
        this.emit('adBreakStart', this.currentAdBreak);
    }

    endAdBreak() {
        this.isAdBreaking = false;
        this.currentAdBreak = null;
        console.log('[MasterClock] Ad break ended.');
        this.emit('adBreakEnd');
        this._scheduleNextAdBreak();
    }

    // Returns a snapshot of the current clock state for new clients joining.
    getStatus() {
        return {
            isAdBreaking: this.isAdBreaking,
            currentAdBreak: this.currentAdBreak,
            nextAdBreakIn: this.nextAdBreakTime
                ? Math.max(0, Math.floor((this.nextAdBreakTime - Date.now()) / 1000))
                : null,
            streamTime: this.streamStartTime
                ? Math.floor((Date.now() - this.streamStartTime) / 1000)
                : 0,
        };
    }

    stop() {
        if (this.adTimer) clearTimeout(this.adTimer);
    }
}

// Singleton – the whole app shares one clock.
module.exports = new MasterClock();
