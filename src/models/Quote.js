import mongoose from "mongoose";

const Schema = mongoose.Schema;

const quoteSchema = new Schema({
  date: { type: Date, default: () => new Date() },
  quote: { type: String, required: true },
});

export const Quote = mongoose.model("quote", quoteSchema);
