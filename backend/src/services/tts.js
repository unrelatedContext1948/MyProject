const  KokoroTTS = require('kokoro-js');
const path = require('path');

async function generateSpeech(adBreakText, audioFile) {
    const tts = await getTTSModel();

    const audio = await tts.generate(adBreakText, {
        voice: "af_jessica"
    });

    const adBreakAudio = path.join(__dirname, "..", "..", "audio", audioFile);

    await audio.save(adBreakAudio);
    console.log("Speech generated successfully:", adBreakAudio);
    return adBreakAudio;
}

module.exports = generateSpeech;