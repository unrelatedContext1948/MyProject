// I have deleted the restriction of 30 seconds ad break

const EventEmitter = require("events");
const songsAdbreak = require("./songsadbreak");

const AD_BREAK_INTERVAL = 15 * 60 * 1000; // 15 minutes

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
  //fira
  triggerAdBreak() {
    if (this.isAdBreaking) return;

    const approved = songsAdbreak.getApprovedAdBreaks();
    if (approved.length === 0) {
      console.log(
        "[MasterClock] No approved ad breaks available – skipping this break.",
      );
      this.scheduleNextAdBreak();
      return;
    }

    const adBreak = approved[0];
    this.isAdBreaking = true;
    this.scheduleNextAdBreak();  

    console.log("[MasterClock] Ad break starting:");
    this.emit("adBreakStart", adBreak);
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
