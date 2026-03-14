import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";
import { connectDB } from "./Config/db.config.js";
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("Welcome to our Server");
    });

    app.listen(PORT, () => {
      console.log(`Server is running on the PORT : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Err While Starting the Server ${err}`);
  });
