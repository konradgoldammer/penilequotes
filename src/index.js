import config from "config";
import { generatePenileQuoteImage } from "./content-creation/index.js";
import mongoose from "mongoose";

(async () => {
  console.log("Start...");
  await mongoose.connect(config.get("mongoURI"));
  console.log("Connected to MongoDB");

  await generatePenileQuoteImage();
  mongoose.connection.close();
})();
