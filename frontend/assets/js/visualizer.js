document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("waveformCanvas");
  const ctx = canvas.getContext("2d");

  let audioContext = null;
  let analyser = null;
  let source = null;
  let animationId = null;

  // Connect <audio> element to Web Audio API analyser (only once)
  async function setupAudio(audioElement) {
    if (source === null) {
      audioContext = new AudioContext(); // audio source
      source = audioContext.createMediaElementSource(audioElement); // audio element source
      analyser = audioContext.createAnalyser(); // analyser node
      source.connect(analyser); // connect source to analyser
      analyser.connect(audioContext.destination); // connect analyser to output
    }
    analyser.fftSize = 32768; // set Fast Fourier Transform (fft) size for better resolution
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth; // set canvas width to match CSS size
    canvas.height = canvas.clientHeight; // set canvas height to match CSS size
  }

  function drawWaveform() {
    const bufferLength = analyser.frequencyBinCount; // get number of frequency bins
    const dataArray = new Uint8Array(bufferLength); // create array to hold frequency data
    resizeCanvas(); // ensure canvas is sized correctly

    function draw() {
      analyser.getByteTimeDomainData(dataArray); // get time domain data (waveform)

      ctx.fillStyle = "rgb(255, 253, 253)"; // semi-transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height); // clear canvas

      ctx.lineWidth = 2; // set line width for waveform
      ctx.strokeStyle = "#3a3a38"; // set line color for waveform
      ctx.beginPath(); // start drawing path

      const sliceWidth = canvas.width / bufferLength;
      let x = 0; // initial x position

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // normalize data to range [0, 2]
        const y = (v * canvas.height) / 2; // scale to canvas height
        if (i === 0) {
          ctx.moveTo(x, y); // move to initial position
        } else {
          ctx.lineTo(x, y); // draw line to next point
        }
        x += sliceWidth; // increment x position
      }

      ctx.lineTo(canvas.width, canvas.height / 2); // draw line to end of canvas
      ctx.stroke(); // stroke the path to render waveform

      animationId = requestAnimationFrame(draw); // request next frame
    }
    draw();
  }

  async function show(adBreak, audioUrl) {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.remove("hidden");

    document.getElementById("nowPlayingTitle").textContent = "Ad Break";
    document.getElementById("nowPlayingSubmittedBy").textContent =
      `Submitted by: ${adBreak.SubmittedBy}`;

    const audioElement = document.getElementById("adAudio");
    audioElement.src = audioUrl; //create audio element with provided URL
    // Ensures that the visualizer disappear after the audio ends and check if the audio was disconnected and does not have any errors
    audioElement.onended = () => {
      socket.emit("adBreakOver");
    };
    audioElement.onerror = () => {
      socket.emit("adBreakOver");
    };
    if (audioElement) {
      await setupAudio(audioElement); // set up audio context and analyser
    }
    audioElement.play(); // start playing audio
    drawWaveform(); // start drawing waveform
  }

  function hide() {
    const adBreakOverlay = document.getElementById("adBreakOverlay");
    adBreakOverlay.classList.add("hidden");
    if (animationId) {
      cancelAnimationFrame(animationId); // stop animation
      animationId = null;
    }
    const audioElement = document.getElementById("adAudio");
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0; // Spult zum Anfang zurück
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  }

  window.visualizer = { show, hide };
});
