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

        const NUM_POINTS = 160;
        const smoothedData = new Float32Array(NUM_POINTS).fill(0);
        let smoothedBass = 0;
        let time = 0;

        // Particles that fly off ring peaks
        const particles = [];

        function spawnParticle(x, y, color) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color,
                size: 1 + Math.random() * 2,
            });
        }

        function updateParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x   += p.vx;
                p.y   += p.vy;
                p.life -= 0.025;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }

        function drawParticles() {
            ctx.globalCompositeOperation = "screen";
            for (const p of particles) {
                ctx.globalAlpha = p.life * 0.8;
                ctx.shadowColor = p.color;
                ctx.shadowBlur  = 6;
                ctx.fillStyle   = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur  = 0;
        }

        function draw() {
            analyser.getByteFrequencyData(dataArray);
            time += 0.006;

            // Motion blur background
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(8, 8, 13, 0.45)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width  / 2;
            const cy = canvas.height / 2;
            const baseRadius = Math.min(cx, cy) * 0.55; // bigger ring

            // Smooth audio data
            let totalEnergy = 0;
            let bassEnergy  = 0;
            for (let i = 0; i < NUM_POINTS; i++) {
                const bin = Math.floor((i / NUM_POINTS) * (bufferLength * 0.6));
                const target = dataArray[bin] / 255;
                smoothedData[i] += (target - smoothedData[i]) * 0.1;
                totalEnergy += smoothedData[i];
                if (i < NUM_POINTS * 0.15) bassEnergy += smoothedData[i];
            }
            // Smooth bass for inner glow pulse
            const rawBass = bassEnergy / (NUM_POINTS * 0.15);
            smoothedBass += (rawBass - smoothedBass) * 0.08;

            const averageEnergy = totalEnergy / NUM_POINTS;
            const bassPulse     = 1 + (averageEnergy * 0.3);

            // ── Inner radial glow that pulses with bass ────────────────────
            ctx.globalCompositeOperation = "screen";
            const glowRadius = baseRadius * 0.7 * (1 + smoothedBass * 0.5);
            const innerGlow  = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
            innerGlow.addColorStop(0,   `rgba(0, 180, 255, ${smoothedBass * 0.35})`);
            innerGlow.addColorStop(0.5, `rgba(0, 255, 160, ${smoothedBass * 0.12})`);
            innerGlow.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // ── Aura bands ────────────────────────────────────────────────
            const bands = [
                { color: "rgba(0, 255, 136, 0.75)", blur: 14, lineWidth: 2,  offset: 20,  speed: 1.5, waves: 6 },
                { color: "rgba(0, 240, 255, 0.65)", blur: 20, lineWidth: 4,  offset: 8,   speed: 1.2, waves: 4 },
                { color: "rgba(0, 170, 255, 0.55)", blur: 26, lineWidth: 7,  offset: -4,  speed: 0.9, waves: 5 },
                { color: "rgba(20, 60,  255, 0.45)", blur: 36, lineWidth: 13, offset: -18, speed: 0.6, waves: 3 },
                { color: "rgba(10, 20,  200, 0.30)", blur: 52, lineWidth: 22, offset: -30, speed: 0.3, waves: 2 },
            ];

            bands.forEach((band, index) => {
                ctx.beginPath();
                const points = [];

                for (let i = 0; i < NUM_POINTS; i++) {
                    const angle = (i / NUM_POINTS) * Math.PI * 2;
                    const phase = (time * band.speed) + (index * 1.5);
                    const organicWave = Math.sin(angle * band.waves + phase) * 9
                                      + Math.cos(angle * (band.waves - 1) - phase) * 7;
                    const audioAmp = smoothedData[i] * 55; // stronger response
                    const r = (baseRadius + band.offset + audioAmp + organicWave) * bassPulse;
                    points.push({
                        x: cx + Math.cos(angle) * r,
                        y: cy + Math.sin(angle) * r,
                    });

                    // Spawn particles on outermost band at loud peaks
                    if (index === 0 && smoothedData[i] > 0.6 && Math.random() < 0.04) {
                        spawnParticle(
                            cx + Math.cos(angle) * r,
                            cy + Math.sin(angle) * r,
                            band.color.replace(/[\d.]+\)$/g, "1)")
                        );
                    }
                }

                // Smooth quadratic spline
                const s = points[NUM_POINTS - 1];
                ctx.moveTo((points[0].x + s.x) / 2, (points[0].y + s.y) / 2);
                for (let i = 0; i < NUM_POINTS; i++) {
                    const n   = points[(i + 1) % NUM_POINTS];
                    const mid = { x: (points[i].x + n.x) / 2, y: (points[i].y + n.y) / 2 };
                    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
                }
                ctx.closePath();

                ctx.globalCompositeOperation = "screen";
                ctx.strokeStyle = band.color;
                ctx.lineWidth   = band.lineWidth;
                ctx.shadowColor = band.color.replace(/[\d.]+\)$/g, "1)");
                ctx.shadowBlur  = band.blur;
                ctx.stroke();
            });

            updateParticles();
            drawParticles();

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
