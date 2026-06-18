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

  function drawVisualizer() {
    analyser.fftSize = 128;
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

      ctx.beginPath();

      // Upper half (left to right)
      for (let i = 0; i < bufferLength; i++) {
        if (i > bufferLength * 0.8) continue;
        const amplitude = dataArray[i] / 255.0;
        const r = baseRadius + (amplitude * baseRadius * 0.8);
        const angle = Math.PI + (i / (bufferLength * 0.8)) * Math.PI;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Lower half (mirrored, right to left)
      for (let i = Math.floor(bufferLength * 0.8); i >= 0; i--) {
        const amplitude = dataArray[i] / 255.0;
        const r = baseRadius + (amplitude * baseRadius * 0.8);
        const angle = (i / (bufferLength * 0.8)) * Math.PI;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        ctx.lineTo(x, y);
      }

      ctx.closePath();

      ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "lime";
      ctx.shadowBlur = 30;
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
    drawVisualizer();
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
