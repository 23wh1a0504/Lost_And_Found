require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
require("./models/User");
require("./models/Item");

const app = express();
const frontendDistPath = path.join(__dirname,"..","Frontend","dist");

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads",express.static("uploads"));

app.get("/api/health",(req,res)=>{
  return res.json({
    success: true,
    message: "Lost and Found API is running"
  });
});

app.use("/api/auth",require("./routes/authRoutes"));
app.use("/api/users",require("./routes/userRoutes"));
app.use("/api/items",require("./routes/itemRoutes"));

app.use(express.static(frontendDistPath));
app.get(/^(?!\/api).*/,(req,res)=>{
  if(req.path.startsWith("/api")) {
    return res.status(404).json({message:"Route not found"});
  }

  return res.sendFile(path.join(frontendDistPath,"index.html"));
});

const port = process.env.PORT || 5000;

app.listen(port,()=>{
  console.log(`Server running on port ${port}`);
});
