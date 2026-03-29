function validateTTSParams(req, res, next) {
  const { speakingRate, pitch, volumeGainDb } = req.body;

  if (speakingRate !== undefined) {
    const r = Number(speakingRate);
    if (isNaN(r) || r < 0.25 || r > 4.0) {
      return res.status(400).json({
        error: '"speakingRate" must be a number between 0.25 and 4.0',
      });
    }
  }

  if (pitch !== undefined) {
    const p = Number(pitch);
    if (isNaN(p) || p < -20 || p > 20) {
      return res.status(400).json({
        error: '"pitch" must be a number between -20 and 20 semitones',
      });
    }
  }

  if (volumeGainDb !== undefined) {
    const v = Number(volumeGainDb);
    if (isNaN(v) || v < -96 || v > 16) {
      return res
        .status(400)
        .json({ error: '"volumeGainDb" must be a number between -96 and 16' });
    }
  }

  next();
}

export { validateTTSParams };
