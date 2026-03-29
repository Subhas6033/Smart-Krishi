import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
const PORT = process.env.PORT || 3000;
import { registerTTSSocket } from "./Controllers/ Tts.socket.js";
import { registerChatSocket } from "./Controllers/Chatbot.controller.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // Must match the origin Vite is running on so the handshake succeeds
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

registerTTSSocket(io);
registerChatSocket(io);

app.get("/", (req, res) => {
  res.send("Welcome to our Server");
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on the PORT : ${PORT}`);
});
