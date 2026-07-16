const path = require("path");
const fs = require("fs");
let tts = null;
let selectedVoice = null;
const voiceList = [
  "af_heart",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_emma",
  "bf_isabella",
  "bm_george",
  "bm_lewis",
  "bf_alice",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
];


function getRandomVoice() {
  return voiceList[Math.floor(Math.random() * voiceList.length)];
}

async function initializeTTS() {
  try {
    // 1. import the AI model dynamically because node.js just use require statements
    const kokoroModule = await import("kokoro-js");
    const KokoroTTS = kokoroModule.KokoroTTS;

    // 2. we need a light comprimated data format to store
    tts = await KokoroTTS.from_pretrained(
      "onnx-community/Kokoro-82M-v1.0-ONNX",
      { dtype: "q8" },
    );

    // 3. select a random voice from the available voices
    selectedVoice = getRandomVoice();
    console.log("Selected voice:", selectedVoice);
  } catch (error) {
    console.error("Failed to initialize TTS:", error);
  }
}

async function generateSpeech(adBreakText, audioFile) {
  try {
    // 1. Initialize TTS if not already done
    if (!tts) {
      await initializeTTS();
    }

    // 2. Check if the selected voice is valid
    if (!selectedVoice) {
      throw new Error("No valid voice selected for TTS.");
    }

    // 3. Audio generation
    const audio = await tts.generate(adBreakText, { voice: selectedVoice });

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

async function generateAdBreakNotification() {
  const notificationText =
    "Attention! An ad break is coming up. Please stay tuned for the upcoming advertisements.";
  const audioFileName = "adBreakNotification.wav";
  await generateSpeech(notificationText, audioFileName);
  return `/assets/audio/${audioFileName}`;
}

module.exports = { generateSpeech, generateAdBreakNotification };
