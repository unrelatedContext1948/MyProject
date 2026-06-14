/*
Waveform Audio Visualizer for HumanMusic.

When Kokoro.js TTS is active (window.humanTTS), bar heights are driven by
real frequency data from the AnalyserNode. Otherwise falls back to
synthesised sine waves so the canvas is never empty.

Public API:
  visualizer.show(adBreak)  – generate TTS audio, fade in, start animation
  visualizer.hide()          – stop animation, fade out
*/

const visualizer = (() => {
    const CANVAS_ID  = "waveformCanvas";
    const OVERLAY_ID = "adBreakOverlay";
    const BARS = 48;

    let animationId = null;
    let phase = 0;        // used for sine-wave fallback
    let energy = 1;
    let dataArray = null; // Uint8Array fed by AnalyserNode

    function getElements() {
        return {
            canvas:   document.getElementById(CANVAS_ID),
            overlay:  document.getElementById(OVERLAY_ID),
            adTitle:  document.getElementById("adBreakTitle"),
            adText:   document.getElementById("adBreakText"),
        };
    }

    function draw() {
        const { canvas } = getElements();
        if (!canvas) return;

        const ctx  = canvas.getContext("2d");
        const W    = canvas.width;
        const H    = canvas.height;
        const barW = W / BARS;

        ctx.clearRect(0, 0, W, H);

        const analyser = window.humanTTS ? window.humanTTS.getAnalyser() : null;

        if (analyser && dataArray) {
            // ── Real audio path ───────────────────────────────────────────
            analyser.getByteFrequencyData(dataArray);
            const bins = dataArray.length;

            for (let i = 0; i < BARS; i++) {
                // Map bar index → frequency bin (logarithmic feel)
                const binIndex = Math.floor((i / BARS) * bins);
                const amplitude = (dataArray[binIndex] / 255) * energy;
                const barH = Math.max(4, amplitude * H * 0.85);
                const x = i * barW;
                const y = (H - barH) / 2;

                const lightness = 35 + (i / BARS) * 20;
                ctx.fillStyle = `hsla(140, 35%, ${lightness}%, 0.9)`;
                ctx.fillRect(x + 2, y, Math.max(1, barW - 4), barH);
            }
        } else {
            // ── Sine-wave fallback (TTS not yet ready or not available) ──
            phase += 0.04;

            for (let i = 0; i < BARS; i++) {
                const norm = i / BARS;
                const raw =
                    Math.sin(phase + norm * 6.3)        * 0.40 +
                    Math.sin(phase * 1.6 + norm * 11)   * 0.25 +
                    Math.sin(phase * 0.7 + norm * 4.2)  * 0.20 +
                    Math.sin(phase * 2.3 + norm * 18)   * 0.15;

                const amplitude = Math.max(0.04, (raw + 1) / 2) * energy;
                const barH = amplitude * H * 0.75;
                const x = i * barW;
                const y = (H - barH) / 2;

                const lightness = 35 + norm * 20;
                ctx.fillStyle = `hsla(140, 35%, ${lightness}%, 0.85)`;
                ctx.fillRect(x + 2, y, Math.max(1, barW - 4), barH);
            }
        }

        animationId = requestAnimationFrame(draw);
    }

    function resizeCanvas() {
        const { canvas } = getElements();
        if (!canvas) return;
        const screen = canvas.closest(".tv-screen") || canvas.parentElement;
        canvas.width  = screen.clientWidth  || 560;
        canvas.height = Math.round((screen.clientHeight || 315) * 0.55);
    }

    function initDataArray() {
        const analyser = window.humanTTS ? window.humanTTS.getAnalyser() : null;
        if (analyser) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
    }

    function show(adBreak) {
        const { overlay, adTitle, adText } = getElements();
        if (!overlay) return;

        if (adTitle) adTitle.textContent = adBreak ? adBreak.AdBreakTitle : "Ad Break";
        if (adText)  adText.textContent  = adBreak ? adBreak.AdBreakText  : "";

        energy = adBreak ? Math.min(1.2, 0.7 + adBreak.AdBreakText.length / 2000) : 1;

        overlay.classList.remove("hidden");
        overlay.classList.add("ad-break-visible");

        requestAnimationFrame(() => {
            resizeCanvas();
            initDataArray();
            if (!animationId) draw();
        });

        // Start TTS if available – audio drives the visualizer automatically
        // via the shared AnalyserNode in tts.js
        if (window.humanTTS && adBreak) {
            window.humanTTS.speak(adBreak.AdBreakText).catch(err =>
                console.warn("[Visualizer] TTS speak error:", err)
            );
        }
    }

    function hide() {
        const { overlay } = getElements();
        if (!overlay) return;

        overlay.classList.remove("ad-break-visible");
        overlay.classList.add("ad-break-hiding");

        setTimeout(() => {
            overlay.classList.add("hidden");
            overlay.classList.remove("ad-break-hiding");
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            dataArray = null;
        }, 600);
    }

    window.addEventListener("resize", () => {
        const { overlay } = getElements();
        if (overlay && !overlay.classList.contains("hidden")) resizeCanvas();
    });

    return { show, hide };
})();
