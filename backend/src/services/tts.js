const path = require("path");
const fs = require("fs");

let ttsInstance = null;

async function generateSpeech(adBreakText, audioFile) {
  try {
    if (!ttsInstance) {
      // 1. import the AI model dynamically because node.js just use require statements
      const kokoroModule = await import("kokoro-js");
      const KokoroTTS = kokoroModule.KokoroTTS;

      // 2. we need a light comprimated data format to store
      ttsInstance = await KokoroTTS.from_pretrained(
        "onnx-community/Kokoro-82M-v1.0-ONNX",
        { dtype: "q8" },
      );
    }

    // 3. Audio generation
    const audio = await ttsInstance.generate(adBreakText, {
      voice: "af_jessica",
    });

    // 4. build file path
    const audioDir = path.join(__dirname, "../../../frontend/assets/audio");
    const adBreakAudio = path.join(audioDir, audioFile);

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    await audio.save(adBreakAudio);
    return adBreakAudio;
  } catch (error) {
    console.error("Audio generation has failed:", error);
    throw error;
  }
}

module.exports = generateSpeech;
