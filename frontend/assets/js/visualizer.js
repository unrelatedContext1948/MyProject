/*
Waveform Audio Visualizer for HumanMusic.

Uses the Web Audio API to visualize a real MP3 audio file (TTS output).
Instead of microphone input, it connects an <audio> element to an
AnalyserNode and draws the waveform on a canvas overlay inside the TV screen.

Public API:
  visualizer.show(adBreak, audioUrl)  – set audio, fade in, start waveform
  visualizer.hide()                    – stop audio, fade out
*/

const visualizer = (() => {
    const CANVAS_ID  = "waveformCanvas";
    const OVERLAY_ID = "adBreakOverlay";
    const AUDIO_ID   = "adAudio";

    let audioContext = null;
    let analyser     = null;
    let source       = null;
    let animationId  = null;

    function getElements() {
        return {
            canvas:   document.getElementById(CANVAS_ID),
            overlay:  document.getElementById(OVERLAY_ID),
            audio:    document.getElementById(AUDIO_ID),
            adTitle:  document.getElementById("adBreakTitle"),
            adText:   document.getElementById("adBreakTextDisplay"),
        };
    }

    // Connect <audio> element to Web Audio API analyser (only once)
    async function setupAudio(audioElement) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // higher = smoother waveform
            source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination); // so we hear it too
        }
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }
    }

    function resizeCanvas() {
        const { canvas } = getElements();
        if (!canvas) return;
        const screen = canvas.closest(".tv-screen") || canvas.parentElement;
        canvas.width  = screen.clientWidth  || 560;
        canvas.height = Math.round((screen.clientHeight || 315) * 0.6);
    }

    function drawWaveform() {
        const { canvas } = getElements();
        if (!canvas || !analyser) return;

        analyser.fftSize = 256; // 128 frequency bins → clean bar count
        analyser.smoothingTimeConstant = 0.8; // smooths rapid jumps

        const ctx         = canvas.getContext("2d");
        const bufferLength = analyser.frequencyBinCount; // 128
        const dataArray   = new Uint8Array(bufferLength);

        const BAR_COUNT = 64;        // number of bars shown
        const GAP       = 3;         // px gap between bars

        function draw() {
            analyser.getByteFrequencyData(dataArray); // equalizer-style

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background
            ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width - GAP * (BAR_COUNT - 1)) / BAR_COUNT;
            const step     = Math.floor(bufferLength / BAR_COUNT);

            for (let i = 0; i < BAR_COUNT; i++) {
                const value    = dataArray[i * step];
                const barHeight = (value / 255) * canvas.height * 0.85;
                const x        = i * (barWidth + GAP);
                const y        = canvas.height - barHeight;

                // Gradient: bright green at top → darker at bottom
                const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
                grad.addColorStop(0, "#a8d5b0");   // light sage
                grad.addColorStop(1, "#3a5c3f");   // dark sage

                ctx.shadowColor = "#6b8f71";
                ctx.shadowBlur  = 6;
                ctx.fillStyle   = grad;
                ctx.fillRect(x, y, barWidth, barHeight);
            }

            ctx.shadowBlur = 0;
            animationId = requestAnimationFrame(draw);
        }

        animationId = requestAnimationFrame(draw);
    }

    async function show(adBreak, audioUrl) {
        const { overlay, audio, adTitle, adText } = getElements();
        if (!overlay || !audio) return;

        // Fill in ad content
        if (adTitle) adTitle.textContent = adBreak ? adBreak.AdBreakTitle : "Ad Break";
        if (adText)  adText.textContent  = adBreak ? adBreak.AdBreakText  : "";

        // Set the MP3 source (from Kokoro.js output or test file)
        audio.src = audioUrl || "/assets/audio/test.mp3";

        overlay.classList.remove("hidden");
        overlay.classList.add("ad-break-visible");

        requestAnimationFrame(async () => {
            resizeCanvas();
            await setupAudio(audio);
            audio.play().catch(err => console.warn("[Visualizer] Audio play error:", err));
            drawWaveform();
        });

        // Auto-hide when audio finishes
        audio.onended = () => hide();
    }

    function hide() {
        const { overlay, audio } = getElements();

        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (!overlay) return;
        overlay.classList.remove("ad-break-visible");
        overlay.classList.add("ad-break-hiding");

        setTimeout(() => {
            overlay.classList.add("hidden");
            overlay.classList.remove("ad-break-hiding");
        }, 600);
    }

    window.addEventListener("resize", () => {
        const { overlay } = getElements();
        if (overlay && !overlay.classList.contains("hidden")) resizeCanvas();
    });

    return { show, hide };
})();
