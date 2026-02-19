const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  item_name: String,
  category: String,
  description: String,
  location: String,
  date: Date,
  image: String,
  type: String, // lost or found
  status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Item", itemSchema);
