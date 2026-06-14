/*
TTS Module – bridges Kokoro.js (ES module) with the rest of the app.

Kokoro.js must be loaded as type="module", but the rest of the app uses
plain scripts. This module exposes window.humanTTS so non-module scripts
(visualizer.js, player.js) can call speak() and read the AnalyserNode.

Flow:
  adBreak.AdBreakText
      → KokoroTTS.generate()         (browser-side TTS, no server needed)
      → AudioBufferSourceNode
      → AnalyserNode  ──────────────→ visualizer.js reads frequency data
      → AudioContext.destination      (speakers)
*/

import { KokoroTTS } from "kokoro-js";

let ttsInstance = null;
let audioCtx = null;
let analyser = null;
let loading = false;

async function ensureReady() {
    if (ttsInstance) return;
    if (loading) {
        // Wait until the ongoing init finishes
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (!loading) { clearInterval(check); resolve(); }
            }, 100);
        });
        return;
    }

    loading = true;
    console.log("[TTS] Loading Kokoro model (first run may take a moment)…");

    ttsInstance = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0", {
        dtype: "q8",
    });

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;           // 64 frequency bins – enough for 48 bars
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(audioCtx.destination);

    loading = false;
    console.log("[TTS] Ready.");
}

/*
Generate and play TTS audio for the given text.
Returns a Promise that resolves when playback finishes.
*/
async function speak(text) {
    await ensureReady();

    // Browser requires a user gesture before AudioContext can play.
    // If suspended, resume it (the ad break button click counts as a gesture).
    if (audioCtx.state === "suspended") await audioCtx.resume();

    console.log("[TTS] Generating audio…");
    const result = await ttsInstance.generate(text, { voice: "af_heart" });
    // result.audio  → Float32Array of PCM samples
    // result.sampling_rate → typically 24000 Hz

    const buffer = audioCtx.createBuffer(1, result.audio.length, result.sampling_rate);
    buffer.copyToChannel(result.audio, 0);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);   // → AnalyserNode → destination
    source.start();

    return new Promise(resolve => { source.onended = resolve; });
}

// Expose to non-module scripts
window.humanTTS = {
    speak,
    getAnalyser: () => analyser,
    isReady: () => !!ttsInstance && !loading,
};

// Pre-warm: start loading the model as soon as the page loads.
// Failures are caught so a missing kokoro-js install never breaks the app –
// the visualizer will just fall back to sine waves.
ensureReady().catch(err => {
    console.warn("[TTS] Could not load Kokoro model – visualizer will use sine-wave fallback.", err);
    window.humanTTS = null;
});
