document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("waveformCanvas");
  const ctx = canvas.getContext("2d");

  let audioContext = null;
  let analyser = null;
  let source = null;
  let animationId = null;

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

  function drawAuraRing() {
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    resizeCanvas();

    function draw() {
      analyser.getByteFrequencyData(dataArray);

      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.4;
      const usedBins = Math.floor(bufferLength * 0.7);

      // Smooth the data with a simple moving average for organic feel
      const smoothed = new Float32Array(usedBins);
      for (let i = 0; i < usedBins; i++) {
        const prev = dataArray[Math.max(0, i - 1)] / 255.0;
        const curr = dataArray[i] / 255.0;
        const next = dataArray[Math.min(usedBins - 1, i + 1)] / 255.0;
        smoothed[i] = (prev + curr * 2 + next) / 4;
      }

      ctx.beginPath();
      for (let i = 0; i < usedBins; i++) {
        const r = baseRadius + smoothed[i] * baseRadius * 0.7;
        const angle = (i / usedBins) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const auraGradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      auraGradient.addColorStop(0,   "rgba(0, 255, 0, 0.4)");
      auraGradient.addColorStop(0.5, "rgba(0, 255, 0, 0.1)");
      auraGradient.addColorStop(1,   "rgba(0, 255, 0, 0)");
      ctx.fillStyle = auraGradient;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "lime";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "lime";
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    }
    draw();
  }

  async function show(adBreak, audioUrl) {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.remove("hidden");
    const audioElement = document.getElementById("adAudio");
    audioElement.src = audioUrl;
    resizeCanvas();
    await setupAudio(audioElement);
    audioElement.play();
    drawAuraRing();
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
