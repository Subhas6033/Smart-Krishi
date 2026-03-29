import express from "express";
import multer from "multer";

const router = express.Router();

// ── Controllers ───────────────────────────────────────────────────────────────
// Controllers use named exports, so we use namespace imports (import * as)
// to keep the controller.method() call style throughout.
import * as ttsController from "../Controllers/TTS.controller.js";
import * as cropProfitController from "../Controllers/Cropprofit.controller.js";
import * as soilScannerController from "../Controllers/Soilscanner.controller.js";
import * as pestController from "../Controllers/ Pest.controller.js"; // fixed: removed stray space

// ── Multer — memory storage for image uploads (max 10MB) ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

// ── TTS Routes ────────────────────────────────────────────────────────────────
router.post("/tts/synthesize", ttsController.synthesize);
router.post("/tts/stream", ttsController.stream);
router.get("/tts/languages", ttsController.getLanguages);
router.get("/tts/voices/:language", ttsController.getVoices);

// ── Crop Profit Routes ────────────────────────────────────────────────────────
router.post("/crop-profit/predict", cropProfitController.predict);
router.get("/crop-profit/msp", cropProfitController.getMSP);
router.get("/crop-profit/benchmark/:crop", cropProfitController.getBenchmark);

// ── Soil Scanner Routes ───────────────────────────────────────────────────────
router.post(
  "/soil-scanner/analyze",
  upload.single("image"),
  soilScannerController.analyze
);
router.get("/soil-scanner/guide", soilScannerController.getGuide);
router.get("/soil-scanner/norms", soilScannerController.getNorms);

// ── Pest Routes ───────────────────────────────────────────────────────────────
router.post("/pest/detect", upload.single("image"), pestController.detectPest);
router.post("/pest/pre-detect", pestController.prePestDetect);
router.get("/pest/library", pestController.getPestLibrary);

// ── Health check ──────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    services: {
      tts: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      ai: !!process.env.GEMINI_API_KEY,
    },
  });
});

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("image")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
