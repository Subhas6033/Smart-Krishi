export const VOICE_CATALOGUE = {
  english: {
    languageCode: "en-IN",
    displayName: "English",
    nativeScript: "English",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "neha", ssmlGender: "FEMALE" },
      "female-expressive": { speaker: "ishita", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
      "male-expressive": { speaker: "rohan", ssmlGender: "MALE" },
    },
  },
  hindi: {
    languageCode: "hi-IN",
    displayName: "Hindi",
    nativeScript: "हिन्दी",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "neha", ssmlGender: "FEMALE" },
      "female-expressive": { speaker: "simran", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
      "male-expressive": { speaker: "rohan", ssmlGender: "MALE" },
    },
  },
  bengali: {
    languageCode: "bn-IN",
    displayName: "Bengali",
    nativeScript: "বাংলা",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "niharika", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
    },
  },
  telugu: {
    languageCode: "te-IN",
    displayName: "Telugu",
    nativeScript: "తెలుగు",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "kavya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
    },
  },
  tamil: {
    languageCode: "ta-IN",
    displayName: "Tamil",
    nativeScript: "தமிழ்",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "kavitha", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
    },
  },
  marathi: {
    languageCode: "mr-IN",
    displayName: "Marathi",
    nativeScript: "मराठी",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "female-neutral": { speaker: "pooja", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
      "male-neutral": { speaker: "rahul", ssmlGender: "MALE" },
    },
  },
  gujarati: {
    languageCode: "gu-IN",
    displayName: "Gujarati",
    nativeScript: "ગુજરાતી",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
    },
  },
  kannada: {
    languageCode: "kn-IN",
    displayName: "Kannada",
    nativeScript: "ಕನ್ನಡ",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
    },
  },
  malayalam: {
    languageCode: "ml-IN",
    displayName: "Malayalam",
    nativeScript: "മലയാളം",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
    },
  },
  punjabi: {
    languageCode: "pa-IN",
    displayName: "Punjabi",
    nativeScript: "ਪੰਜਾਬੀ",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
    },
  },
  odia: {
    languageCode: "od-IN",
    displayName: "Odia",
    nativeScript: "ଓଡ଼ିଆ",
    voices: {
      "female-warm": { speaker: "priya", ssmlGender: "FEMALE" },
      "male-warm": { speaker: "aditya", ssmlGender: "MALE" },
    },
  },
};

/**
 * resolveVoice(language, voiceType)
 * Returns { languageCode, voice } or throws if language not found.
 */
export function resolveVoice(language, voiceType = "female-warm") {
  const lang = VOICE_CATALOGUE[language?.toLowerCase()];
  if (!lang) {
    const keys = Object.keys(VOICE_CATALOGUE).join(", ");
    throw new Error(`Unknown language "${language}". Available: ${keys}`);
  }
  const voice = lang.voices[voiceType] || Object.values(lang.voices)[0];
  return { languageCode: lang.languageCode, voice };
}
