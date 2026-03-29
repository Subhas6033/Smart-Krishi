import {
  synthesizeSpeech,
  synthesizeSpeechSSML,
} from "../Service/TTS.service.js";

import { resolveVoice } from "../Config/voice.config.js";

/**
 * Registers TTS streaming events on a socket.io socket.
 *
 * Client emits:  "tts:stream"  → { text, language, voiceType, speakingRate, pitch }
 * Server emits:  "tts:chunk"   → ArrayBuffer (binary chunk)
 *                "tts:done"    → (no payload)
 *                "tts:error"   → { message }
 *
 * The socket is set to binary type for chunk events.
 */
function registerTTSSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[TTS Socket] Client connected: ${socket.id}`);

    socket.on("tts:stream", async (payload) => {
      const {
        text,
        ssml,
        language = "english",
        voiceType = "female-warm",
        speakingRate = 1.0,
        pitch = 0,
        volumeGainDb = 0,
      } = payload || {};

      // Validation
      if (!text && !ssml) {
        return socket.emit("tts:error", {
          message: "Either 'text' or 'ssml' is required.",
        });
      }
      if (text && text.length > 5000) {
        return socket.emit("tts:error", {
          message: "Text too long (max 5000 chars).",
        });
      }

      let languageCode, voice;
      try {
        ({ languageCode, voice } = resolveVoice(language, voiceType));
      } catch (e) {
        return socket.emit("tts:error", { message: e.message });
      }

      try {
        const audioBuffer = ssml
          ? await synthesizeSpeechSSML({
              ssml,
              languageCode,
              voice,
              speakingRate,
              pitch,
              volumeGainDb,
            })
          : await synthesizeSpeech({
              text,
              languageCode,
              voice,
              speakingRate,
              pitch,
              volumeGainDb,
            });

        // Stream in 64KB chunks
        const CHUNK_SIZE = 65536;
        for (
          let offset = 0;
          offset < audioBuffer.length;
          offset += CHUNK_SIZE
        ) {
          const chunk = audioBuffer.slice(offset, offset + CHUNK_SIZE);
          socket.emit("tts:chunk", chunk);
        }

        socket.emit("tts:done");
      } catch (err) {
        console.error(
          `[TTS Socket] Synthesis error for ${socket.id}:`,
          err.message
        );
        socket.emit("tts:error", {
          message: "TTS synthesis failed: " + err.message,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[TTS Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });
}

export { registerTTSSocket };
