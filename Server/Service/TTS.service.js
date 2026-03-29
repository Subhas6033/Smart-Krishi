/**
 * TTS.service.js
 * Powered by Sarvam AI Bulbul v3 — 11 Indian languages, no credit card needed.
 * Sign up at dashboard.sarvam.ai to get your free API key (₹1000 free credits).
 *
 * API docs: https://docs.sarvam.ai/api-reference-docs/api-guides-tutorials/text-to-speech/rest-api
 */

const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

/**
 * synthesizeSpeech
 * Converts plain text → WAV audio buffer using Sarvam AI Bulbul v3.
 *
 * @param {object} opts
 * @param {string}  opts.text           - Text to synthesize (≤ 2500 chars)
 * @param {string}  opts.languageCode   - BCP-47 code e.g. "hi-IN", "bn-IN"
 * @param {object}  opts.voice          - { speaker } from voice.config.js
 * @param {number}  [opts.speakingRate] - 0.5–2.0 (mapped to Sarvam's pace)
 */
async function synthesizeSpeech({
  text,
  languageCode = "en-IN",
  voice = {},
  speakingRate = 1.0,
}) {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error(
      "SARVAM_API_KEY is not set. Sign up free at dashboard.sarvam.ai"
    );
  }

  const speaker = voice.speaker || "priya"; // default female Indian voice (bulbul:v3 verified)
  const pace = clamp(speakingRate, 0.5, 2.0);

  const response = await fetch(SARVAM_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": process.env.SARVAM_API_KEY,
    },
    body: JSON.stringify({
      text,
      target_language_code: languageCode,
      speaker,
      model: "bulbul:v3",
      pace,
      audio_format: "wav",
      sample_rate: 22050,
      enable_preprocessing: true, // handles numbers, dates, abbreviations
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sarvam TTS HTTP ${response.status}`);
  }

  const data = await response.json();

  // Sarvam returns base64-encoded audio in data.audios[0]
  if (!data.audios || !data.audios[0]) {
    throw new Error("Sarvam TTS returned no audio data");
  }

  return Buffer.from(data.audios[0], "base64");
}

/**
 * synthesizeSpeechSSML
 * Sarvam doesn't support SSML — strip tags and synthesize plain text.
 */
async function synthesizeSpeechSSML({ ssml, ...rest }) {
  const text = ssml.replace(/<[^>]+>/g, "").trim();
  return synthesizeSpeech({ text, ...rest });
}

/**
 * listVoices — Sarvam Bulbul v3 speakers (verified compatible list)
 * Full list at: https://dashboard.sarvam.ai/text-to-speech
 */
async function listVoices(languageCode) {
  // All voices work across all supported languages in bulbul:v3
  return [
    // Female
    { name: "priya", gender: "FEMALE", style: "warm" },
    { name: "neha", gender: "FEMALE", style: "neutral" },
    { name: "pooja", gender: "FEMALE", style: "warm" },
    { name: "simran", gender: "FEMALE", style: "expressive" },
    { name: "kavya", gender: "FEMALE", style: "warm" },
    { name: "ishita", gender: "FEMALE", style: "expressive" },
    { name: "shreya", gender: "FEMALE", style: "neutral" },
    { name: "ritu", gender: "FEMALE", style: "warm" },
    { name: "roopa", gender: "FEMALE", style: "neutral" },
    { name: "shruti", gender: "FEMALE", style: "warm" },
    { name: "suhani", gender: "FEMALE", style: "warm" },
    { name: "kavitha", gender: "FEMALE", style: "neutral" },
    { name: "rupali", gender: "FEMALE", style: "neutral" },
    { name: "niharika", gender: "FEMALE", style: "warm" },
    { name: "tanya", gender: "FEMALE", style: "neutral" },
    { name: "amelia", gender: "FEMALE", style: "neutral" },
    { name: "sophia", gender: "FEMALE", style: "warm" },
    // Male
    { name: "aditya", gender: "MALE", style: "warm" },
    { name: "rahul", gender: "MALE", style: "neutral" },
    { name: "rohan", gender: "MALE", style: "expressive" },
    { name: "ashutosh", gender: "MALE", style: "warm" },
    { name: "amit", gender: "MALE", style: "neutral" },
    { name: "dev", gender: "MALE", style: "expressive" },
    { name: "ratan", gender: "MALE", style: "neutral" },
    { name: "varun", gender: "MALE", style: "warm" },
    { name: "manan", gender: "MALE", style: "neutral" },
    { name: "sumit", gender: "MALE", style: "neutral" },
    { name: "kabir", gender: "MALE", style: "warm" },
    { name: "aayan", gender: "MALE", style: "expressive" },
    { name: "shubh", gender: "MALE", style: "warm" },
    { name: "advait", gender: "MALE", style: "neutral" },
    { name: "anand", gender: "MALE", style: "warm" },
    { name: "tarun", gender: "MALE", style: "neutral" },
    { name: "sunny", gender: "MALE", style: "warm" },
    { name: "mani", gender: "MALE", style: "expressive" },
    { name: "gokul", gender: "MALE", style: "warm" },
    { name: "vijay", gender: "MALE", style: "neutral" },
    { name: "mohit", gender: "MALE", style: "neutral" },
    { name: "rehan", gender: "MALE", style: "expressive" },
    { name: "soham", gender: "MALE", style: "warm" },
  ];
}

function clamp(val, min, max) {
  return Math.min(Math.max(Number(val), min), max);
}

export { synthesizeSpeech, synthesizeSpeechSSML, listVoices };
