import { resolveVoice, VOICE_CATALOGUE } from "../Config/voice.config.js";
import {
  synthesizeSpeech,
  synthesizeSpeechSSML,
  listVoices,
} from "../Service/TTS.service.js";

async function synthesize(req, res) {
  try {
    const {
      text,
      ssml,
      language,
      voiceType = "female-warm",
      speakingRate = 1.0,
    } = req.body;

    if (!language) {
      return res.status(400).json({
        error:
          '"language" is required. See GET /api/tts/languages for options.',
      });
    }
    if (!text && !ssml) {
      return res
        .status(400)
        .json({ error: 'Either "text" or "ssml" is required.' });
    }
    if (text && text.length > 2500) {
      return res.status(400).json({
        error: '"text" must be ≤ 2500 characters (Sarvam Bulbul v3 limit).',
      });
    }

    let languageCode, voice;
    try {
      ({ languageCode, voice } = resolveVoice(language, voiceType));
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const audioBuffer = ssml
      ? await synthesizeSpeechSSML({ ssml, languageCode, voice, speakingRate })
      : await synthesizeSpeech({ text, languageCode, voice, speakingRate });

    res.set({
      "Content-Type": "audio/wav", // Sarvam returns WAV
      "Content-Length": audioBuffer.length,
      "Content-Disposition": `inline; filename="tts-${language}-${Date.now()}.wav"`,
      "X-Language-Code": languageCode,
      "X-Voice-Name": voice.speaker,
      "Cache-Control": "no-store",
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error("[TTS synthesize error]", err.message);
    res.status(500).json({ error: "TTS synthesis failed: " + err.message });
  }
}

/**
 * POST /api/tts/stream
 * Chunked HTTP stream of WAV audio.
 */
async function stream(req, res) {
  try {
    const {
      text,
      ssml,
      language,
      voiceType = "female-warm",
      speakingRate = 1.0,
    } = req.body;

    if (!language)
      return res.status(400).json({ error: '"language" is required.' });
    if (!text && !ssml)
      return res
        .status(400)
        .json({ error: 'Either "text" or "ssml" is required.' });

    let languageCode, voice;
    try {
      ({ languageCode, voice } = resolveVoice(language, voiceType));
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const audioBuffer = ssml
      ? await synthesizeSpeechSSML({ ssml, languageCode, voice, speakingRate })
      : await synthesizeSpeech({ text, languageCode, voice, speakingRate });

    res.set({
      "Content-Type": "audio/wav",
      "X-Language-Code": languageCode,
      "X-Voice-Name": voice.speaker,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    });

    const CHUNK = 65536;
    for (let offset = 0; offset < audioBuffer.length; offset += CHUNK) {
      const ok = res.write(audioBuffer.slice(offset, offset + CHUNK));
      if (!ok) await new Promise((r) => res.once("drain", r));
    }
    res.end();
  } catch (err) {
    console.error("[TTS stream error]", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "TTS stream failed: " + err.message });
    } else {
      res.end();
    }
  }
}

/**
 * GET /api/tts/languages
 */
function getLanguages(req, res) {
  const catalogue = Object.entries(VOICE_CATALOGUE).map(([key, lang]) => ({
    key,
    languageCode: lang.languageCode,
    displayName: lang.displayName,
    nativeScript: lang.nativeScript,
    voiceTypes: Object.keys(lang.voices),
  }));
  res.json({ languages: catalogue });
}

/**
 * GET /api/tts/voices/:language
 */
async function getVoices(req, res) {
  try {
    const { language } = req.params;
    let languageCode;
    try {
      ({ languageCode } = resolveVoice(language));
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const voices = await listVoices(languageCode);
    res.json({ languageCode, voices });
  } catch (err) {
    console.error("[TTS listVoices error]", err.message);
    res.status(500).json({ error: err.message });
  }
}

export { synthesize, stream, getLanguages, getVoices };
