/**
 * POST /api/crop-profit/predict
 */
async function predict(req, res) {
  try {
    const {
      crop,
      area,
      season,
      soilType,
      irrigation,
      seedCost,
      fertilizerCost,
      laborCost,
      expectedYield,
      marketPrice,
      language,
    } = req.body;

    const langNames = {
      en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
      kn: "Kannada", ml: "Malayalam", bn: "Bengali", gu: "Gujarati",
      pa: "Punjabi", mr: "Marathi", ur: "Urdu", or: "Odia",
    };
    const lang = language || "en";
    const langName = langNames[lang] || "English";
    const langInstruction = lang !== "en"
      ? `Respond in ${langName} language. All text fields including "recommendation" and "marketInsights" must be in ${langName}.`
      : "";

    if (!crop) return res.status(400).json({ error: '"crop" is required.' });
    if (!area || isNaN(area) || area <= 0)
      return res
        .status(400)
        .json({ error: '"area" must be a positive number.' });

    const totalArea = parseFloat(area);
    const _seed = parseFloat(seedCost || 0) || 0;
    const _fert = parseFloat(fertilizerCost || 0) || 0;
    const _labor = parseFloat(laborCost || 0) || 0;
    const _yield = parseFloat(expectedYield || 0) || 0;
    const _price = parseFloat(marketPrice || 0) || 0;

    const totalCost = (_seed + _fert + _labor) * totalArea;
    const totalYieldKg = _yield * totalArea;
    const totalYieldQuintal = totalYieldKg / 100;
    const grossRevenue = totalYieldQuintal * _price;
    const netProfit = grossRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    let recommendation = "";
    let marketInsights = [];

    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `You are an expert Indian agricultural economist. A farmer is growing ${crop} on ${area} acres in ${season} season.
Soil type: ${soilType}. Irrigation: ${irrigation}.
Input costs per acre: Seeds ₹${_seed}, Fertilizer ₹${_fert}, Labor ₹${_labor}.
Expected yield: ${_yield} kg/acre, Market price: ₹${_price}/quintal.
Calculated net profit: ₹${netProfit.toFixed(0)}, ROI: ${roi.toFixed(1)}%.
${langInstruction}

Provide a JSON response with exactly this structure (no markdown, raw JSON only):
{
  "recommendation": "2-3 sentence practical advice for this farmer",
  "marketInsights": ["insight 1", "insight 2", "insight 3"]
}`;

        // Replace the fetch block inside the try/catch in predict()

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
            }),
          }
        );

        const data = await response.json();

        // ── Guard: surface the real Groq error ──────────────────────────
        if (!response.ok || !data.choices?.[0]?.message?.content) {
          console.warn("[CropProfit AI] Groq error:", JSON.stringify(data));
          throw new Error(data.error?.message || "Empty response from Groq");
        }

        const text = data.choices[0].message.content
          .replace(/```json|```/g, "")
          .trim();
        const parsed = JSON.parse(text);
        recommendation = parsed.recommendation;
        marketInsights = parsed.marketInsights;
      } catch (aiErr) {
        console.warn("[CropProfit AI]", aiErr.message);
        recommendation = generateFallbackRecommendation(
          crop,
          netProfit,
          roi,
          season
        );
        marketInsights = generateFallbackInsights(crop, season);
      }
    } else {
      recommendation = generateFallbackRecommendation(
        crop,
        netProfit,
        roi,
        season
      );
      marketInsights = generateFallbackInsights(crop, season);
    }

    res.json({
      crop,
      area: totalArea,
      totalCost: Math.round(totalCost),
      grossRevenue: Math.round(grossRevenue),
      netProfit: Math.round(netProfit),
      roi: parseFloat(roi.toFixed(2)),
      totalYieldKg: Math.round(totalYieldKg),
      recommendation,
      marketInsights,
      breakEvenPrice:
        totalCost > 0 && totalYieldQuintal > 0
          ? Math.round(totalCost / totalYieldQuintal)
          : null,
    });
  } catch (err) {
    console.error("[CropProfit predict]", err.message);
    res.status(500).json({ error: "Prediction failed: " + err.message });
  }
}

/**
 * GET /api/crop-profit/msp
 */
async function getMSP(req, res) {
  const msp = {
    wheat: { price: 2275, unit: "quintal", year: "2024-25" },
    rice: { price: 2300, unit: "quintal", year: "2024-25" },
    maize: { price: 2090, unit: "quintal", year: "2024-25" },
    cotton: { price: 7121, unit: "quintal", year: "2024-25" },
    sugarcane: { price: 340, unit: "quintal", year: "2024-25" },
    soybean: { price: 4892, unit: "quintal", year: "2024-25" },
    mustard: { price: 5650, unit: "quintal", year: "2024-25" },
    potato: { price: 1200, unit: "quintal", year: "2024-25" },
    onion: { price: 1500, unit: "quintal", year: "2024-25" },
    tomato: { price: 800, unit: "quintal", year: "2024-25" },
  };
  res.json({ msp, source: "CACP India", lastUpdated: "2024-10-01" });
}

/**
 * GET /api/crop-profit/benchmark/:crop
 */
async function getBenchmark(req, res) {
  const { crop } = req.params;
  const benchmarks = {
    wheat: { min: 25, avg: 35, max: 55, unit: "quintal/acre" },
    rice: { min: 15, avg: 25, max: 40, unit: "quintal/acre" },
    cotton: { min: 8, avg: 15, max: 25, unit: "quintal/acre" },
    maize: { min: 20, avg: 30, max: 50, unit: "quintal/acre" },
    sugarcane: { min: 250, avg: 350, max: 500, unit: "quintal/acre" },
    soybean: { min: 8, avg: 12, max: 18, unit: "quintal/acre" },
    potato: { min: 60, avg: 100, max: 150, unit: "quintal/acre" },
    tomato: { min: 80, avg: 120, max: 200, unit: "quintal/acre" },
    onion: { min: 40, avg: 80, max: 130, unit: "quintal/acre" },
    mustard: { min: 6, avg: 10, max: 16, unit: "quintal/acre" },
  };

  const data = benchmarks[crop.toLowerCase()];
  if (!data)
    return res
      .status(404)
      .json({ error: `No benchmark data for crop: ${crop}` });
  res.json({ crop, ...data });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateFallbackRecommendation(crop, profit, roi, season) {
  if (profit > 0 && roi > 30) {
    return `Your ${crop} cultivation shows strong profitability with ${roi.toFixed(0)}% ROI. Consider scaling up operations or reinvesting in quality seeds and micro-irrigation for next ${season} season to further boost yields.`;
  } else if (profit > 0) {
    return `Your ${crop} farm shows positive returns but ROI can be improved. Focus on reducing input costs through group purchasing of fertilizers and optimizing irrigation schedules to increase net margins.`;
  } else {
    return `Current projections show a loss for ${crop}. Consider selling at higher market price, reducing labor costs through mechanization, or switching to a higher-value crop for the next season.`;
  }
}

function generateFallbackInsights(crop, season) {
  return [
    `${crop} prices typically peak 2-3 months after harvest — consider cold storage if feasible.`,
    `Joining a Farmer Producer Organization (FPO) can reduce input costs by 15-25%.`,
    `PM-KISAN and state subsidy schemes may reduce your effective fertilizer cost significantly.`,
  ];
}

export { predict, getMSP, getBenchmark };
