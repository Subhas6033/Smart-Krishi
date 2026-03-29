import { configureStore } from "@reduxjs/toolkit";
import cropProfitReducer from "../Features/Cropprofitslice";
import soilScannerReducer from "../Features/Soilscannerslice";
import pestReducer from "../Features/Pestslice";
import prePestReducer from "../Features/Prepestslice";
import marketReducer from "../Features/Marketslice";
import WeatherReducer from "../Features/WeatherSlice";
import kisanChatReducer from "../Features/ChatbotSlice";

export const store = configureStore({
  reducer: {
    cropProfit: cropProfitReducer,
    soilScanner: soilScannerReducer,
    pest: pestReducer,
    prePest: prePestReducer,
    market: marketReducer,
    weather: WeatherReducer,
    kisanChat: kisanChatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types — FormData / Blob are not serializable
        ignoredActions: ["soilScanner/analyze/pending", "pest/detect/pending"],
      },
    }),
});

export default store;
