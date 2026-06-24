const path = require('path');
const fs = require('fs');

async function generateSpeech(adBreakText, audioFile) {
    try {
        // 1. import the AI model dynamically because node.js just use require statements
        const kokoroModule = await import('kokoro-js');
        const KokoroTTS = kokoroModule.KokoroTTS;

        // 2. we need a light comprimated data format to store 
        const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32" });

        // 3. Audio generation
        const audio = await tts.generate(adBreakText, { voice: "af_jessica" });

        // 4. build file path 
        const audioDir = path.join(__dirname, "../../../frontend/assets/audio");
        const adBreakAudio = path.join(audioDir, audioFile);

        if (!fs.existsSync(audioDir)){
            fs.mkdirSync(audioDir, { recursive: true });
        }

        
        await audio.save(adBreakAudio);
        return adBreakAudio;
        
    } catch (error) {
        console.error("Fehler bei der Audio-Generierung:", error);
        throw error;
    }
}

module.exports = generateSpeech;