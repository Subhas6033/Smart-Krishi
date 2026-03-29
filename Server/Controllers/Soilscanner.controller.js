import sharp from "sharp";

/**
 * POST /api/soil-scanner/analyze
 */
async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }

    const langNames = {
      en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
      kn: "Kannada", ml: "Malayalam", bn: "Bengali", gu: "Gujarati",
      pa: "Punjabi", mr: "Marathi", ur: "Urdu", or: "Odia",
    };
    const lang = req.body.language || "en";
    const langName = langNames[lang] || "English";
    const langInstruction = lang !== "en"
      ? `Respond in ${langName} language. All text fields must be in ${langName}.`
      : "";

    const resized = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64Image = resized.toString("base64");

    if (!process.env.GROQ_API_KEY) {
      return res.json(generateMockSoilResult(lang));
    }

    const prompt = `You are an expert soil scientist and agronomist. Analyze this soil sample image.
${langInstruction}

Return a JSON response with EXACTLY this structure (no markdown, raw JSON only):
{
  "soilType": "string (e.g. Black Cotton Soil, Alluvial Soil, Red Laterite, Sandy Loam)",
  "overallHealth": "Excellent|Good|Average|Poor",
  "healthScore": number (0-100),
  "color": "description of soil color",
  "texture": "Sandy|Loamy|Clayey|Silty|Sandy Loam|Clay Loam",
  "parameters": {
    "ph": number (4.0-9.0),
    "nitrogen": number (0-300, kg/ha),
    "phosphorus": number (0-100, kg/ha),
    "potassium": number (0-300, kg/ha),
    "organicMatter": number (0-10, percentage),
    "moisture": number (0-100, percentage)
  },
  "recommendedCrops": ["crop1", "crop2", "crop3", "crop4"],
  "deficiencies": [
    { "nutrient": "Nutrient name", "treatment": "specific treatment recommendation" }
  ],
  "recommendation": "2-3 sentence actionable advice for this soil",
  "imageQuality": "Good|Acceptable|Poor"
}

If the image is not a soil sample, return:
{ "error": "Not a soil image", "imageQuality": "Poor" }`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    const data = await response.json();
    const responseText = data.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return res.status(422).json({
        error: "Could not parse soil analysis. Please use a clearer image.",
      });
    }

    if (parsed.error) {
      return res.status(422).json({ error: parsed.error });
    }

    res.json(parsed);
  } catch (err) {
    console.error("[SoilScanner analyze]", err.message);
    res.status(500).json({ error: "Soil analysis failed: " + err.message });
  }
}

/**
 * GET /api/soil-scanner/guide  (unchanged)
 */
function getGuide(req, res) {
  const guide = {
    soilTypes: [
      {
        name: "Alluvial Soil",
        color: "Light brown to dark grey",
        regions: ["Punjab", "Haryana", "UP", "Bihar", "West Bengal"],
        crops: ["wheat", "rice", "sugarcane", "cotton"],
        characteristics:
          "Highly fertile, good water retention, found in river plains",
      },
      {
        name: "Black Cotton Soil",
        color: "Deep black",
        regions: ["Maharashtra", "MP", "Gujarat", "Andhra Pradesh"],
        crops: ["cotton", "soybean", "wheat", "sorghum"],
        characteristics:
          "High clay content, swells when wet, rich in calcium and potassium",
      },
      {
        name: "Red Laterite Soil",
        color: "Red to yellow",
        regions: ["Odisha", "Karnataka", "Tamil Nadu", "Kerala"],
        crops: ["rice", "groundnut", "cashew", "tea"],
        characteristics: "Iron-rich, low fertility, acidic, needs amendments",
      },
      {
        name: "Sandy Soil",
        color: "Light tan to grey",
        regions: ["Rajasthan", "Gujarat desert regions"],
        crops: ["bajra", "jowar", "sesame", "groundnut"],
        characteristics:
          "Low water retention, good drainage, requires organic matter",
      },
    ],
    photoTips: [
      "Take photo in daylight — avoid shadows",
      "Place sample on clean white paper",
      "Include both moist and dry portions",
      "Use macro mode for texture details",
      "Capture from 30cm distance",
    ],
  };
  res.json(guide);
}

/**
 * GET /api/soil-scanner/norms  (unchanged)
 */
function getNorms(req, res) {
  res.json({
    parameters: {
      ph: {
        low: 5.5,
        optimal_low: 6.0,
        optimal_high: 7.5,
        high: 8.5,
        unit: "",
      },
      nitrogen: {
        low: 40,
        optimal_low: 80,
        optimal_high: 200,
        high: 300,
        unit: "kg/ha",
      },
      phosphorus: {
        low: 10,
        optimal_low: 20,
        optimal_high: 60,
        high: 100,
        unit: "kg/ha",
      },
      potassium: {
        low: 50,
        optimal_low: 100,
        optimal_high: 250,
        high: 300,
        unit: "kg/ha",
      },
      organicMatter: {
        low: 0.5,
        optimal_low: 2.0,
        optimal_high: 5.0,
        high: 8.0,
        unit: "%",
      },
      moisture: {
        low: 15,
        optimal_low: 30,
        optimal_high: 70,
        high: 90,
        unit: "%",
      },
    },
    source: "ICAR Soil Health Card Guidelines",
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function generateMockSoilResult(_lang) {
  return {
    soilType: "Alluvial Soil",
    overallHealth: "Good",
    healthScore: 72,
    color: "Dark brown",
    texture: "Loamy",
    parameters: {
      ph: 6.8,
      nitrogen: 145,
      phosphorus: 32,
      potassium: 185,
      organicMatter: 3.2,
      moisture: 48,
    },
    recommendedCrops: ["Wheat", "Rice", "Sugarcane", "Mustard", "Chickpea"],
    deficiencies: [
      {
        nutrient: "Phosphorus",
        treatment: "Apply DAP @ 50 kg/acre before sowing",
      },
      {
        nutrient: "Zinc",
        treatment: "Apply ZnSO4 @ 25 kg/acre in soil or 0.5% foliar spray",
      },
    ],
    recommendation:
      "Your soil is in good condition with adequate nitrogen and moisture. Focus on phosphorus replenishment before the next crop cycle. Adding vermicompost at 2 tonnes/acre will improve organic matter and micronutrient availability.",
    imageQuality: "Good",
  };
}

export { analyze, getGuide, getNorms };
