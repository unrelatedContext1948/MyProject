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

        const ctx         = canvas.getContext("2d");
        const bufferLength = analyser.frequencyBinCount;
        const dataArray   = new Uint8Array(bufferLength);

        function draw() {
            analyser.getByteTimeDomainData(dataArray); // oscilloscope-style

            // Background
            ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Center line (guide)
            ctx.strokeStyle = "rgba(107, 143, 113, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Waveform line
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#6b8f71"; // sage green
            ctx.shadowColor = "#6b8f71";
            ctx.shadowBlur = 8;
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
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
