document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("waveformCanvas");
  const ctx = canvas.getContext("2d");

  let audioContext = null;
  let analyser = null;
  // AI-GENERATED WITH Google Gemini (July 2026)
  // Prompt: Fix iOS audio swap issue by using AudioBufferSourceNode instead of HTML5 Audio.
  let bufferSource = null;
  // AI-GENERATED END
  let animationId = null;


  // AI-GENERATED WITH Google Gemini (July 2026)
  // Prompt: Implement a global unlockAudio function to unlock Web Audio API on first user interaction for iOS.
  const unlockAudio = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const buffer = audioContext.createBuffer(1, 1, 22050);
    const dummySource = audioContext.createBufferSource();
    dummySource.buffer = buffer;
    dummySource.connect(audioContext.destination);
    dummySource.start(0);

    const adVideo = document.getElementById("adVideo");
    if (adVideo) {
      adVideo.load();
    }

    document.body.removeEventListener("touchstart", unlockAudio);
    document.body.removeEventListener("click", unlockAudio);
  };

  document.body.addEventListener("touchstart", unlockAudio, { once: true });
  document.body.addEventListener("click", unlockAudio, { once: true });
  // AI-GENERATED END

  function resizeCanvas() {
    // AI-GENERATED WITH Google Gemini (July 2026)
    // Prompt: Add fallbacks to canvas sizing to prevent collapse on mobile devices.
    canvas.width = canvas.clientWidth || canvas.parentElement.clientWidth || 560; // set canvas width to match CSS size
    canvas.height = canvas.clientHeight || canvas.parentElement.clientHeight || 315; // set canvas height to match CSS size
    // AI-GENERATED END
  }

  function drawWaveform() {
    resizeCanvas();

    function draw() {
      ctx.fillStyle = "rgba(255, 253, 253, 0.8)"; // semi-transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height); // clear canvas

      ctx.lineWidth = 2; // set line width for waveform
      ctx.strokeStyle = "#3a3a38"; // set line color for waveform
      ctx.beginPath(); // start drawing path

      if (analyser) {
        const bufferLength = analyser.frequencyBinCount; // get number of frequency bins
        const dataArray = new Uint8Array(bufferLength); // create array to hold frequency data
        analyser.getByteTimeDomainData(dataArray); // get time domain data (waveform)

        const sliceWidth = canvas.width / bufferLength;
        let x = 0; // initial x position

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // normalize data to range [0, 2]
          const y = (v * canvas.height) / 2; // scale to canvas height
          if (i === 0) {
            ctx.moveTo(x, y); // move to initial position
          } else {
            ctx.lineTo(x, y); // increment x position
          }
          x += sliceWidth;
        }
      } else {
        // Fallback for missing Audio Dat
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
      }
      ctx.lineTo(canvas.width, canvas.height / 2); // draw line to end of canvas
      ctx.stroke(); // stroke the path to render waveform

      animationId = requestAnimationFrame(draw); // request next frame
    }
    draw();
  }

  // AI-GENERATED WITH Google Gemini (July 2026)
  // Prompt: Use fetch and AudioBufferSourceNode instead of HTML5 Audio to bypass iOS source swapping block.
  async function show(adBreak, audioUrl) {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.remove("hidden");

    document.getElementById("nowPlayingTitle").textContent = `${adBreak.AdBreakTitle}`;
    document.getElementById("nowPlayingSubmittedBy").textContent = `Submitted by: ${adBreak.SubmittedBy}`;

    // AI-GENERATED WITH Google Gemini (July 2026)
    // Prompt: Use fetch and AudioBufferSourceNode instead of HTML5 Audio to bypass iOS source swapping block.
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      bufferSource = audioContext.createBufferSource(); 
      bufferSource.buffer = audioBuffer;

      analyser = audioContext.createAnalyser(); // analyser node
      analyser.fftSize = 32768; // set Fast Fourier Transform (fft) size for better resolution

      // connect: file -> Analyser for the wave -> Speaker
      bufferSource.connect(analyser); // connect source to analyser
      analyser.connect(audioContext.destination); // connect analyser to output

      // Ensures that the visualizer disappear after the audio ends and check if the audio was disconnected and does not have any errors
      bufferSource.onended = () => {
        socket.emit("adBreakOver");
      };

      
      bufferSource.start(0); // start playing audio
      drawWaveform(); // start drawing waveform

    } catch (error) {
      console.error("Audio-Fetch fehlgeschlagen:", error);
      socket.emit("adBreakOver"); 
    }
  }
  // AI-GENERATED END

  function hide() {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.add("hidden");
    if (animationId) {
      cancelAnimationFrame(animationId); // stop animation
      animationId = null;
    }
    
    // AI-GENERATED WITH Google Gemini (July 2026)
    // Prompt: Cleanup bufferSource instead of HTML5 Audio.
    if (bufferSource) {
      try { bufferSource.stop(); } catch (e) {}
      bufferSource.disconnect();
      bufferSource = null;
    }
    // AI-GENERATED END
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.visualizer = { show, hide };
});