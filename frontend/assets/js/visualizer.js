/*
Waveform Audio Visualizer for HumanMusic.

Renders an animated waveform on a <canvas> overlay inside the TV screen
during ad breaks. Because YouTube audio is cross-origin we can't access
the real audio stream, so the waveform is synthesised from overlapping
sine waves – it reacts to the ad text length to vary the "energy" slightly.

Public API:
  visualizer.show(adBreak)  – fade in + start animation
  visualizer.hide()          – fade out + stop animation
*/

const visualizer = (() => {
    const CANVAS_ID = "waveformCanvas";
    const OVERLAY_ID = "adBreakOverlay";

    let animationId = null;
    let phase = 0;
    let energy = 1;

    function getElements() {
        return {
            canvas: document.getElementById(CANVAS_ID),
            overlay: document.getElementById(OVERLAY_ID),
            adTitle: document.getElementById("adBreakTitle"),
            adText: document.getElementById("adBreakText"),
        };
    }

    function draw() {
        const { canvas } = getElements();
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;
        const BARS = 48;
        const barW = W / BARS;

        ctx.clearRect(0, 0, W, H);

        phase += 0.04;

        for (let i = 0; i < BARS; i++) {
            const norm = i / BARS;

            // Layered sine waves create an organic, varied shape
            const raw =
                Math.sin(phase + norm * 6.3) * 0.40 +
                Math.sin(phase * 1.6 + norm * 11) * 0.25 +
                Math.sin(phase * 0.7 + norm * 4.2) * 0.20 +
                Math.sin(phase * 2.3 + norm * 18) * 0.15;

            const amplitude = Math.max(0.04, (raw + 1) / 2) * energy;
            const barH = amplitude * H * 0.75;
            const x = i * barW;
            const y = (H - barH) / 2;

            // Sage-green gradient matching the site palette
            const lightness = 35 + norm * 20;
            ctx.fillStyle = `hsla(140, 35%, ${lightness}%, 0.85)`;
            ctx.fillRect(x + 2, y, Math.max(1, barW - 4), barH);
        }

        animationId = requestAnimationFrame(draw);
    }

    function resizeCanvas() {
        const { canvas } = getElements();
        if (!canvas) return;
        // Measure from the tv-screen so we always get real pixel values,
        // even if the overlay itself hasn't been laid out yet.
        const screen = canvas.closest(".tv-screen") || canvas.parentElement;
        canvas.width  = screen.clientWidth  || 560;
        canvas.height = Math.round((screen.clientHeight || 315) * 0.55);
    }

    function show(adBreak) {
        const { overlay, adTitle, adText } = getElements();
        if (!overlay) return;

        // Fill in ad content
        if (adTitle) adTitle.textContent = adBreak ? adBreak.AdBreakTitle : "Ad Break";
        if (adText) adText.textContent = adBreak ? adBreak.AdBreakText : "";

        // Energy scales subtly with text length so longer ads feel more lively
        energy = adBreak ? Math.min(1.2, 0.7 + adBreak.AdBreakText.length / 2000) : 1;

        overlay.classList.remove("hidden");
        overlay.classList.add("ad-break-visible");

        // Wait one frame so the browser finishes layout (going from display:none
        // → display:flex) before measuring canvas dimensions.
        requestAnimationFrame(() => {
            resizeCanvas();
            if (!animationId) draw();
        });
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
        }, 600); // matches CSS transition duration
    }

    // Handle window resize while ad is active
    window.addEventListener("resize", () => {
        const { overlay } = getElements();
        if (overlay && !overlay.classList.contains("hidden")) resizeCanvas();
    });

    return { show, hide };
})();
