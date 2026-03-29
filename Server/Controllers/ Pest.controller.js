import sharp from "sharp";

const LANG_NAMES = {
  en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
  kn: "Kannada", ml: "Malayalam", bn: "Bengali", gu: "Gujarati",
  pa: "Punjabi", mr: "Marathi", ur: "Urdu", or: "Odia",
};

// ═══════════════════════════════════════════════════════════════
// PEST DETECTION — real image analysis
// POST /api/pest/detect
// ═══════════════════════════════════════════════════════════════
async function detectPest(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded." });

    const lang = req.body.language || "en";
    const langName = LANG_NAMES[lang] || "English";
    const langInstruction = lang !== "en"
      ? `Respond in ${langName} language. All text fields must be in ${langName}.`
      : "";

    const resized = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = resized.toString("base64");

    if (!process.env.GROQ_API_KEY) {
      return res.json(generateMockPestResult());
    }

    const prompt = `You are an expert entomologist and plant pathologist specializing in Indian agriculture.
Analyze this crop image for pests, diseases, or deficiencies.
${langInstruction}

Return EXACTLY this JSON structure (no markdown, raw JSON):
{
  "pestName": "Specific name (e.g. Helicoverpa Bollworm, Leaf Rust, Aphids, White Fly) or 'No Pest Detected'",
  "type": "insect|disease|fungal|bacterial|viral|deficiency|none",
  "severity": "None|Mild|Moderate|Severe",
  "confidence": number (0-100),
  "affectedArea": number (0-100, estimated % of visible crop affected),
  "spreadRisk": "Low|Medium|High",
  "description": "2-3 sentence description of the pest/disease and its impact",
  "treatment": {
    "immediate": "Urgent action to take within 24-48 hours",
    "organic": "Organic/natural treatment option",
    "chemical": "Chemical pesticide recommendation with dosage",
    "preventive": "Long-term prevention strategy"
  },
  "similarPests": ["related pest 1", "related pest 2"],
  "reportToExtension": boolean (true if severe outbreak needing expert help)
}

If the image is not a crop/plant, set pestName to "Invalid Image" and confidence to 0.`;

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
                  image_url: { url: `data:image/jpeg;base64,${base64}` },
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
    const text = data.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(422).json({
        error: "Unable to analyze image. Please use a clear crop photo.",
      });
    }

    if (parsed.pestName === "Invalid Image") {
      return res
        .status(422)
        .json({ error: "Please upload a crop or plant image." });
    }

    res.json(parsed);
  } catch (err) {
    console.error("[PestDetection detect]", err.message);
    res.status(500).json({ error: "Detection failed: " + err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// PRE-PEST DETECTION — predictive risk analysis
// POST /api/pest/pre-detect
// ═══════════════════════════════════════════════════════════════
async function prePestDetect(req, res) {
  try {
    const {
      crop,
      region,
      month,
      temperature,
      humidity,
      rainfall,
      previousPestHistory,
      cropAge,
      irrigationMethod,
      language,
    } = req.body;

    const lang = language || "en";
    const langName = LANG_NAMES[lang] || "English";
    const langInstruction = lang !== "en"
      ? `Respond in ${langName} language. All text fields must be in ${langName}.`
      : "";

    if (!crop) return res.status(400).json({ error: '"crop" is required.' });
    if (!region)
      return res.status(400).json({ error: '"region" is required.' });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[parseInt(month) || new Date().getMonth()];

    if (!process.env.GROQ_API_KEY) {
      return res.json(generateMockPrePestResult(crop, monthName));
    }

    const prompt = `You are an expert agricultural entomologist specializing in integrated pest management for Indian farming.

Analyze pest risk for:
- Crop: ${crop}
- Region: ${region.replace(/_/g, " ")}
- Month: ${monthName}
- Crop age: ${cropAge || "unknown"} days
- Temperature: ${temperature || "unknown"}°C
- Humidity: ${humidity || "unknown"}%
- Recent rainfall: ${rainfall || "unknown"} mm
- Previous pest history: ${previousPestHistory ? "Yes" : "No"}
- Irrigation: ${irrigationMethod || "unknown"}
${langInstruction}

Return EXACTLY this JSON (no markdown, raw JSON):
{
  "overallRisk": "Low|Medium|High",
  "riskScore": number (0-100),
  "riskSummary": "One sentence overall assessment",
  "pestRisks": [
    {
      "name": "Pest name",
      "probability": number (0-100),
      "riskLevel": "Low|Medium|High",
      "peakPeriod": "e.g. 30-60 days after sowing",
      "preventionTip": "Specific preventive action"
    }
  ],
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "weeklyForecast": [
    { "label": "Day 1",  "risk": "Low|Medium|High" },
    { "label": "Day 2",  "risk": "..." },
    { "label": "Day 3",  "risk": "..." },
    { "label": "Day 4",  "risk": "..." },
    { "label": "Day 5",  "risk": "..." },
    { "label": "Day 6",  "risk": "..." },
    { "label": "Day 7",  "risk": "..." },
    { "label": "Day 8",  "risk": "..." },
    { "label": "Day 9",  "risk": "..." },
    { "label": "Day 10", "risk": "..." },
    { "label": "Day 11", "risk": "..." },
    { "label": "Day 12", "risk": "..." },
    { "label": "Day 13", "risk": "..." },
    { "label": "Day 14", "risk": "..." }
  ],
  "recommendedMonitoring": "How frequently to scout and what to look for"
}`;

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
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    const text = data.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.json(generateMockPrePestResult(crop, monthName));
    }

    res.json(parsed);
  } catch (err) {
    console.error("[PestDetection pre-detect]", err.message);
    res.status(500).json({ error: "Risk analysis failed: " + err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// PEST LIBRARY  —  GET /api/pest/library  (unchanged)
// ═══════════════════════════════════════════════════════════════
function getPestLibrary(req, res) {
  const library = [
    {
      id: "bollworm",
      name: "Helicoverpa Bollworm",
      scientificName: "Helicoverpa armigera",
      affectedCrops: ["cotton", "chickpea", "tomato", "maize"],
      season: ["kharif", "rabi"],
      symptoms: [
        "Circular holes in bolls",
        "Caterpillar visible inside boll",
        "Dry frass around entry point",
      ],
      treatment: {
        organic:
          "Neem-based insecticides @ 5ml/L, release Trichogramma egg parasitoids",
        chemical: "Chlorpyrifos 20 EC @ 2.5 ml/L or Spinosad 45 SC @ 0.75 ml/L",
      },
    },
    {
      id: "whitefly",
      name: "Whitefly",
      scientificName: "Bemisia tabaci",
      affectedCrops: ["cotton", "tomato", "chilli", "brinjal"],
      season: ["kharif"],
      symptoms: [
        "Yellow stippling on leaves",
        "White winged adults on leaf underside",
        "Sooty mould on honeydew",
      ],
      treatment: {
        organic: "Yellow sticky traps, neem oil spray 2%, soap solution",
        chemical:
          "Imidacloprid 17.8 SL @ 0.5 ml/L or Thiamethoxam 25 WG @ 0.3 g/L",
      },
    },
    {
      id: "aphid",
      name: "Aphids",
      scientificName: "Aphis gossypii",
      affectedCrops: ["wheat", "mustard", "potato", "cotton"],
      season: ["rabi"],
      symptoms: [
        "Curled and yellowing leaves",
        "Sticky honeydew on leaves",
        "Ant activity on plants",
      ],
      treatment: {
        organic: "Lady beetle release, neem extract spray, soapy water",
        chemical: "Dimethoate 30 EC @ 2 ml/L or Acetamiprid 20 SP @ 0.4 g/L",
      },
    },
    {
      id: "stem_borer",
      name: "Stem Borer",
      scientificName: "Chilo partellus",
      affectedCrops: ["rice", "maize", "sugarcane", "sorghum"],
      season: ["kharif"],
      symptoms: [
        "Dead heart in vegetative stage",
        "White ear in reproductive stage",
        "Entry hole in stem",
      ],
      treatment: {
        organic:
          "Trichogramma japonicum release @ 1.5 lakh/ha, pheromone traps",
        chemical:
          "Carbofuran 3G @ 33 kg/ha in soil or Chlorantraniliprole 0.4% GR",
      },
    },
  ];
  res.json({ library });
}

// ── Mock helpers ────────────────────────────────────────────────
function generateMockPestResult() {
  return {
    pestName: "Aphids (Aphis gossypii)",
    type: "insect",
    severity: "Moderate",
    confidence: 87,
    affectedArea: 35,
    spreadRisk: "Medium",
    description:
      "Cotton aphids are detected on the leaf undersides. They are sucking plant sap causing yellowing and curling. Honeydew secretion may lead to sooty mould growth.",
    treatment: {
      immediate:
        "Spray water forcefully on undersides of leaves to dislodge aphid colonies.",
      organic:
        "Apply 2% neem oil solution + 0.5% soap emulsifier every 7 days for 3 weeks.",
      chemical:
        "Acetamiprid 20 SP @ 0.4 g/L or Imidacloprid 17.8 SL @ 0.3 ml/L. Max 2 sprays.",
      preventive:
        "Release Chrysoperla carnea @ 10,000/acre. Avoid excess nitrogen fertilization.",
    },
    similarPests: ["Jassids", "Thrips", "Mealybug"],
    reportToExtension: false,
  };
}

function generateMockPrePestResult(crop, month) {
  return {
    overallRisk: "Medium",
    riskScore: 58,
    riskSummary: `${crop} in ${month} faces moderate pest pressure. Conditions are favorable for sucking pest outbreaks.`,
    pestRisks: [
      {
        name: "Aphids",
        probability: 72,
        riskLevel: "High",
        peakPeriod: "15-45 DAS",
        preventionTip: "Set up yellow sticky traps @ 8/acre from day 10",
      },
      {
        name: "Stem Borer",
        probability: 45,
        riskLevel: "Medium",
        peakPeriod: "30-60 DAS",
        preventionTip: "Release Trichogramma @ 1.5 lakh/ha before peak period",
      },
      {
        name: "Whitefly",
        probability: 30,
        riskLevel: "Low",
        peakPeriod: "45-75 DAS",
        preventionTip: "Monitor with yellow sticky traps weekly",
      },
    ],
    immediateActions: [
      "Install pheromone traps for early pest monitoring",
      "Ensure proper plant spacing for air circulation",
      "Apply preventive neem-based spray if humidity exceeds 80%",
    ],
    weeklyForecast: Array.from({ length: 14 }, (_, i) => ({
      label: `D${i + 1}`,
      risk: i < 3 ? "Low" : i < 7 ? "Medium" : i < 11 ? "High" : "Medium",
    })),
    recommendedMonitoring:
      "Scout every 3 days in early growth stages, weekly thereafter. Check 10 plants per acre.",
  };
}

export { detectPest, prePestDetect, getPestLibrary };
