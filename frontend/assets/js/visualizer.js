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
  const CANVAS_ID = "waveformCanvas";
  const OVERLAY_ID = "adBreakOverlay";
  const AUDIO_ID = "adAudio";

  let audioContext = null;
  let analyser = null;
  let source = null;
  let animationId = null;

  function getElements() {
    return {
      canvas: document.getElementById(CANVAS_ID),
      overlay: document.getElementById(OVERLAY_ID),
      audio: document.getElementById(AUDIO_ID),
      adTitle: document.getElementById("adBreakTitle"),
      adText: document.getElementById("adBreakTextDisplay"),
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
    canvas.width = screen.clientWidth || 560;
    canvas.height = screen.clientHeight || 315;
  }

  function drawWaveform() {
        const { canvas } = getElements();
        if (!canvas || !analyser) return;

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.88;

        const ctx = canvas.getContext("2d");
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const NUM_POINTS = 120;
        const smoothedData = new Float32Array(NUM_POINTS).fill(0);
        let time = 0;

        function draw() {
            analyser.getByteFrequencyData(dataArray);
            time += 0.006;

            // Motion blur background
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(10, 10, 15, 0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Additive light blending for neon glow
            ctx.globalCompositeOperation = "screen";

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const baseRadius = Math.min(cx, cy) * 0.42;

            let totalEnergy = 0;
            for (let i = 0; i < NUM_POINTS; i++) {
                const bin = Math.floor((i / NUM_POINTS) * (bufferLength * 0.5));
                const targetValue = dataArray[bin] / 255;
                smoothedData[i] += (targetValue - smoothedData[i]) * 0.1;
                totalEnergy += smoothedData[i];
            }

            const averageEnergy = totalEnergy / NUM_POINTS;
            const bassPulse = 1 + (averageEnergy * 0.25);

            const bands = [
                { color: "rgba(0, 255, 136, 0.7)", blur: 15, lineWidth: 2,  offset: 15,  speed: 1.5, waves: 6 },
                { color: "rgba(0, 240, 255, 0.6)", blur: 20, lineWidth: 4,  offset: 5,   speed: 1.2, waves: 4 },
                { color: "rgba(0, 170, 255, 0.5)", blur: 25, lineWidth: 7,  offset: -5,  speed: 0.9, waves: 5 },
                { color: "rgba(20, 60,  255, 0.4)", blur: 35, lineWidth: 12, offset: -20, speed: 0.6, waves: 3 },
                { color: "rgba(10, 20,  200, 0.3)", blur: 50, lineWidth: 20, offset: -30, speed: 0.3, waves: 2 }
            ];

            bands.forEach((band, index) => {
                ctx.beginPath();
                let points = [];

                for (let i = 0; i < NUM_POINTS; i++) {
                    const angle = (i / NUM_POINTS) * Math.PI * 2;

                    const phase = (time * band.speed) + (index * 1.5);
                    const organicWave = Math.sin(angle * band.waves + phase) * 8
                                      + Math.cos(angle * (band.waves - 1) - phase) * 6;

                    const audioAmp = smoothedData[i] * 45;

                    const r = (baseRadius + band.offset + audioAmp + organicWave) * bassPulse;

                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    points.push({x, y});
                }

                // Smooth spline curves
                let startX = (points[0].x + points[NUM_POINTS - 1].x) / 2;
                let startY = (points[0].y + points[NUM_POINTS - 1].y) / 2;
                ctx.moveTo(startX, startY);

                for (let i = 0; i < NUM_POINTS; i++) {
                    const nextI = (i + 1) % NUM_POINTS;
                    const midX = (points[i].x + points[nextI].x) / 2;
                    const midY = (points[i].y + points[nextI].y) / 2;
                    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
                }

                ctx.closePath();

                ctx.strokeStyle = band.color;
                ctx.lineWidth = band.lineWidth;
                ctx.shadowColor = band.color.replace(/[\d.]+\)$/g, '1)');
                ctx.shadowBlur = band.blur;
                ctx.stroke();
            });

            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = "source-over";

            animationId = requestAnimationFrame(draw);
        }

        animationId = requestAnimationFrame(draw);
    }

  async function show(adBreak, audioUrl) {
    const { overlay, audio, adTitle, adText } = getElements();
    if (!overlay || !audio) return;

    if (adTitle)
      adTitle.textContent = adBreak ? adBreak.AdBreakTitle : "Ad Break";
    if (adText) adText.textContent = adBreak ? adBreak.AdBreakText : "";

    audio.src = audioUrl || "/assets/audio/test.mp3";

    overlay.classList.remove("hidden");
    overlay.classList.add("ad-break-visible");

    requestAnimationFrame(async () => {
      resizeCanvas();
      await setupAudio(audio);
      audio
        .play()
        .catch((err) => console.warn("[Visualizer] Audio play error:", err));
      drawWaveform();
    });

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
