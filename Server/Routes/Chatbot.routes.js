import { Router } from "express";
import multer from "multer";
import {
  handleMessage,
  handleVoiceMessage,
  handleVoiceFull,
  getHistory,
  clearHistory,
} from "../Controllers/Chatbot.controller.js";

const router = Router();

// multer — in-memory storage for audio uploads (max 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio type: ${file.mimetype}`));
    }
  },
});

router
  .post("/message", handleMessage)

  .post("/voice", handleVoiceMessage)

  .post("/voice-full", upload.single("audio"), handleVoiceFull)

  .get("/history/:sessionId", getHistory)

  .delete("/history/:sessionId", clearHistory);

export default router;
