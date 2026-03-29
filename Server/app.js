import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./Routes/Api.routes.js";
import weatherRoutes from "./Routes/Weather.service.js";
import ChatRoutes from "./Routes/Chatbot.routes.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(cookieParser());

app.use("/api", apiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/v1/chat", ChatRoutes);

export { app };
