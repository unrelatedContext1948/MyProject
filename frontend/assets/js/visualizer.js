document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("waveformCanvas");
  const ctx = canvas.getContext("2d");
  const audioElement = document.getElementById("adAudio");
  const unlockButton = document.getElementById("audioUnlockButton");

  let audioContext = null;
  let analyser = null;
  let source = null;
  let animationId = null;
  let pendingAudioUrl = null; // set when play() was blocked, retried by the unlock button


  const LABELS = [
    { name: "TREBLE",   angle: -Math.PI / 2 },
    { name: "HIGH-MID", angle: -Math.PI / 4 },
    { name: "MID",      angle: 0 },
    { name: "LOW-MID",  angle: Math.PI / 4 },
    { name: "BASS",     angle: Math.PI / 2 },
    { name: "SUB-BASS", angle: (3 * Math.PI) / 4 },
    { name: "LOW",      angle: Math.PI },
    { name: "MID-HIGH", angle: -(3 * Math.PI) / 4 },
  ];

  function drawRingIdle() {
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const ringRadius = Math.min(cx, cy) * 0.45;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(draw);
    }
    draw();
  }


  // Builds the Web Audio graph exactly once. A <audio> element may only ever
  // be bound to a single MediaElementSourceNode for its entire lifetime
  // (a second createMediaElementSource() call throws InvalidStateError), and
  // on iOS a freshly-created AudioContext starts 'suspended' again unless the
  // page has already been unlocked by a user gesture – so we never close()
  // this context and recreate it per ad break, we just reuse it.
  function ensureAudioGraph() {
    if (audioContext) return audioContext;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.88;
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    return audioContext;
  }

  async function setupAudio() {
    ensureAudioGraph();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  // ─── iOS / Safari user-gesture unlock ────────────────────────────────────
  //
  // AudioContext.resume() and the very first HTMLMediaElement.play() must
  // both happen synchronously inside a real user gesture (click/touchend) on
  // iOS – an async socket.io callback never counts. Once any audio has been
  // started that way, the whole page is "blessed" for its remaining
  // lifetime, so we only need to catch the first genuine tap anywhere.
  function unlockAudioSync() {
    ensureAudioGraph();
    if (audioContext.state === "suspended") audioContext.resume();

    // Bless the <audio> element itself too: play()+pause() inside the same
    // gesture satisfies iOS's separate HTMLMediaElement gesture requirement,
    // so later programmatic play() calls from the socket handler succeed.
    const wasMuted = audioElement.muted;
    audioElement.muted = true;
    audioElement.play()
      .then(() => {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.muted = wasMuted;
      })
      .catch(() => {
        audioElement.muted = wasMuted;
      });
  }

  // Multiple event types for safety across iOS/Safari versions – whichever
  // fires first wins, the others are removed automatically ({ once: true }).
  ["pointerdown", "touchend", "click", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, unlockAudioSync, { once: true, passive: true });
  });

  // Fallback UI: if an ad break arrives before the user has interacted with
  // the page at all, autoplay will still be blocked. Offer an explicit tap
  // target so unlocking happens inside a real gesture instead of leaving the
  // visualizer frozen with no way to recover.
  unlockButton.addEventListener("click", () => {
    unlockButton.classList.add("hidden");
    if (pendingAudioUrl) {
      const urlToRetry = pendingAudioUrl;
      pendingAudioUrl = null;
      startPlayback(urlToRetry);
    }
  });

  async function startPlayback(audioUrl) {
    audioElement.src = audioUrl;
    await setupAudio();

    try {
      await audioElement.play();
      unlockButton.classList.add("hidden");
    } catch (err) {
      console.warn("[Visualizer] Audio play blocked, waiting for user tap:", err);
      pendingAudioUrl = audioUrl;
      unlockButton.classList.remove("hidden");
    }
  }

  function resizeCanvas() {
    const screen = canvas.closest(".tv-screen") || canvas.parentElement;
    canvas.width  = screen.clientWidth  || 560;
    canvas.height = screen.clientHeight || 315;
  }

  function drawAuraRing() {
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.88;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);

    const NUM_POINTS   = 160;
    const smoothedData = new Float32Array(NUM_POINTS).fill(0);
    let smoothedBass   = 0;
    let time           = 0;

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
        p.x    += p.vx;
        p.y    += p.vy;
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

      const cx         = canvas.width  / 2;
      const cy         = canvas.height / 2;
      const baseRadius = Math.min(cx, cy) * 0.55;

      // Smooth audio data
      let totalEnergy = 0;
      let bassEnergy  = 0;
      for (let i = 0; i < NUM_POINTS; i++) {
        const bin    = Math.floor((i / NUM_POINTS) * (bufferLength * 0.6));
        const target = dataArray[bin] / 255;
        smoothedData[i] += (target - smoothedData[i]) * 0.1;
        totalEnergy += smoothedData[i];
        if (i < NUM_POINTS * 0.15) bassEnergy += smoothedData[i];
      }
      const rawBass = bassEnergy / (NUM_POINTS * 0.15);
      smoothedBass += (rawBass - smoothedBass) * 0.08;

      const averageEnergy = totalEnergy / NUM_POINTS;
      const bassPulse     = 1 + (averageEnergy * 0.3);

      // Inner radial glow pulsing with bass
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

      // Aura bands
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
          const angle       = (i / NUM_POINTS) * Math.PI * 2;
          const phase       = (time * band.speed) + (index * 1.5);
          const organicWave = Math.sin(angle * band.waves + phase) * 9
                            + Math.cos(angle * (band.waves - 1) - phase) * 7;
          const audioAmp    = smoothedData[i] * 55;
          const r           = (baseRadius + band.offset + audioAmp + organicWave) * bassPulse;
          points.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
          });

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
    draw();
  }

  async function show(adBreak, audioUrl) {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.remove("hidden");

    document.getElementById("adBreakTitle").textContent =
        adBreak && adBreak.AdBreakTitle ? adBreak.AdBreakTitle : "";
    document.getElementById("adBreakTextDisplay").textContent =
        adBreak && adBreak.SubmittedBy ? `Submitted By ${adBreak.SubmittedBy}` : "";

    if (!audioUrl) {
      resizeCanvas();
      drawRingIdle();
      return;
    }

    resizeCanvas();
    ensureAudioGraph(); // must exist before drawAuraRing() reads from `analyser`
    // Runs the analyser-driven ring immediately. If playback below turns out
    // to be blocked, the loop just keeps rendering silence (flat ring) until
    // the user taps the unlock button and audio actually starts flowing –
    // no need to tear down and restart the animation loop.
    drawAuraRing();
    audioElement.onended = () => hide();

    await startPlayback(audioUrl);
  }

  function hide() {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.add("hidden");
    unlockButton.classList.add("hidden");
    pendingAudioUrl = null;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // Suspend rather than close(): the AudioContext/MediaElementSource pair
    // is reused across ad breaks (see ensureAudioGraph) so the next show()
    // doesn't need a fresh, un-unlocked context or a second (illegal)
    // createMediaElementSource() call on the same <audio> element.
    if (audioContext && audioContext.state === "running") {
      audioContext.suspend();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", () => {
    if (!document.getElementById("adBreakOverlay").classList.contains("hidden")) {
      resizeCanvas();
    }
  });

  window.visualizer = { show, hide };
});
