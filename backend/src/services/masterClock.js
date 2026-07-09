// I have deleted the restriction of 30 seconds ad break

const EventEmitter = require("events");
const songsAdbreak = require("./songsadbreak");
const streanState = require("./streamState.js");

const AD_BREAK_INTERVAL = 1 * 60 * 1000; // 15 minutes

class MasterClock extends EventEmitter {
  constructor() {
    super();
    this.isAdBreaking = false;
    this.streamStartTime = null;
    this.nextAdBreakTime = null;
    this.currentAdBreak = null;
  }

  start() {
    this.streamStartTime = Date.now();
    this.scheduleNextAdBreak();
    console.log("[MasterClock] Started – next ad break in 15 minutes.");
  }

  scheduleNextAdBreak() {
    this.nextAdBreakTime = Date.now() + AD_BREAK_INTERVAL;
    setTimeout(() => {
      this.adBreakPending = true;
      console.log(
        "[MasterClock] Ad break pending – waiting for current song to end.",
      );
    }, AD_BREAK_INTERVAL);
  }

  triggerAdBreak(adBreakData) {
    
    if (this.isAdBreaking) return;

    if (!adBreakData) {
      console.log(
        "[MasterClock] No ad break data provided – skipping this break.",
      );
      this.scheduleNextAdBreak();
      return;
    }

    this.currentAdBreak = adBreakData;
    this.isAdBreaking = true;
    this.scheduleNextAdBreak();

    console.log("[MasterClock] Ad break starting:");
    this.emit("adBreakStart", adBreakData);
  }

  endAdBreak() {
    this.isAdBreaking = false;
    this.currentAdBreak = null;
    console.log("[MasterClock] Ad break ended.");
    this.emit("adBreakEnd");
  }
}

// Singleton – the whole app shares one clock.
module.exports = new MasterClock();
