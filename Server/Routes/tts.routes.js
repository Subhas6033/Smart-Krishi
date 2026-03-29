import { Router } from "express";
import {
  synthesize,
  stream,
  getLanguages,
  getVoices,
} from "../Controllers/TTS.controller.js";

const router = Router();

router
  .get("/languages", getLanguages)
  .get("/voices/:language", getVoices)
  .post("/synthesize", synthesize)
  .post("/stream", stream);

export default router;
