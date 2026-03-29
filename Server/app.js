import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./Routes/Api.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "50kb",
  })
);

app.use(
  express.urlencoded({
    limit: "50kb",
  })
);

app.use(cookieParser());

app.use("/api", apiRoutes);

export { app };
