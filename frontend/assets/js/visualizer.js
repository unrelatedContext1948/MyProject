document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("waveformCanvas");
  const ctx = canvas.getContext("2d");

  let audioContext = null;
  let analyser = null;
  let source = null;
  let animationId = null;

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

  async function setupAudio(audioElement) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function drawRing() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const NUM_BARS = 64;

    function draw() {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const ringRadius = Math.min(cx, cy) * 0.45;
      const barMaxLength = ringRadius * 0.5;
      const barWidth = (2 * Math.PI * ringRadius) / NUM_BARS * 0.5;

      // Draw glowing ring
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw frequency bars around the ring
      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * Math.PI * 2 - Math.PI / 2;
        const binIndex = Math.floor((i / NUM_BARS) * bufferLength);
        const value = dataArray[binIndex] / 255;
        const barLength = value * barMaxLength;

        const x1 = cx + Math.cos(angle) * ringRadius;
        const y1 = cy + Math.sin(angle) * ringRadius;
        const x2 = cx + Math.cos(angle) * (ringRadius + barLength);
        const y2 = cy + Math.sin(angle) * (ringRadius + barLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = barWidth;
        ctx.lineCap = "round";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Draw labels
      ctx.fillStyle = "#00ff88";
      ctx.font = `bold ${Math.min(cx, cy) * 0.07}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const labelRadius = ringRadius + barMaxLength + Math.min(cx, cy) * 0.12;

      LABELS.forEach(({ name, angle }) => {
        const lx = cx + Math.cos(angle) * labelRadius;
        const ly = cy + Math.sin(angle) * labelRadius;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(name, 0, 0);
        ctx.restore();
      });

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
        adBreak && adBreak.AdText ? adBreak.AdText : "";

    if (!audioUrl) {
      resizeCanvas();
      drawRingIdle();
      return;
    }

    const audioElement = document.getElementById("adAudio");
    audioElement.src = audioUrl;
    resizeCanvas();
    await setupAudio(audioElement);
    audioElement.play();
    drawRing();
  }

  function hide() {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.add("hidden");
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
    if (source) {
      source.disconnect();
      source = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.visualizer = { show, hide };
});
