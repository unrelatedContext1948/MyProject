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
        canvas.height = screen.clientHeight || 315;
    }

    function drawWaveform() {
        const { canvas } = getElements();
        if (!canvas || !analyser) return;

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const ctx         = canvas.getContext("2d");
        const bufferLength = analyser.frequencyBinCount;
        const dataArray   = new Uint8Array(bufferLength);

        const POINTS  = 180;
        const smoothed = new Float32Array(POINTS).fill(0);

        function draw() {
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width  / 2;
            const cy = canvas.height / 2;
            const baseRadius = Math.min(cx, cy) * 0.72;

            // Lerp each point toward its target frequency value
            for (let i = 0; i < POINTS; i++) {
                const bin = Math.floor((i / POINTS) * bufferLength * 0.75);
                smoothed[i] += (dataArray[bin] - smoothed[i]) * 0.12;
            }

            // Compute overall energy for global pulse
            const avgEnergy = dataArray.slice(0, bufferLength / 2)
                .reduce((s, v) => s + v, 0) / (bufferLength / 2);
            const pulse = 1 + (avgEnergy / 255) * 0.06;

            // Draw 3 rings: outer glow → mid → sharp inner
            const layers = [
                { lineWidth: 14, blur: 40, alpha: 0.25, scale: 1.02 },
                { lineWidth: 6,  blur: 20, alpha: 0.55, scale: 1.0  },
                { lineWidth: 2,  blur: 8,  alpha: 1.0,  scale: 0.98 },
            ];

            for (const layer of layers) {
                ctx.beginPath();
                for (let i = 0; i <= POINTS; i++) {
                    const idx   = i % POINTS;
                    const angle = (idx / POINTS) * Math.PI * 2 - Math.PI / 2;
                    const amp   = (smoothed[idx] / 255) * baseRadius * 0.28;
                    const r     = (baseRadius + amp) * layer.scale * pulse;
                    const x     = cx + Math.cos(angle) * r;
                    const y     = cy + Math.sin(angle) * r;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.closePath();

                // Rotating colour gradient so it shifts over time
                const t    = Date.now() * 0.0003;
                const gx1  = cx + Math.cos(t) * baseRadius;
                const gy1  = cy + Math.sin(t) * baseRadius;
                const gx2  = cx + Math.cos(t + Math.PI) * baseRadius;
                const gy2  = cy + Math.sin(t + Math.PI) * baseRadius;
                const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
                grad.addColorStop(0,    `rgba(0, 230, 210, ${layer.alpha})`);
                grad.addColorStop(0.33, `rgba(60, 210, 130, ${layer.alpha})`);
                grad.addColorStop(0.66, `rgba(0, 160, 255, ${layer.alpha})`);
                grad.addColorStop(1,    `rgba(0, 230, 210, ${layer.alpha})`);

                ctx.strokeStyle = grad;
                ctx.lineWidth   = layer.lineWidth;
                ctx.shadowColor = "#00e8d2";
                ctx.shadowBlur  = layer.blur;
                ctx.stroke();
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
