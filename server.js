require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

connectDB();

app.use(express.json());
app.use(cors());
app.use("/uploads",express.static("uploads"));

app.use("/api/auth",require("./routes/authRoutes"));
app.use("/api/items",require("./routes/itemRoutes"));

app.listen(process.env.PORT,()=>{
  console.log("Server running");
});
