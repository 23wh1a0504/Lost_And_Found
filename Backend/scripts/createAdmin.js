require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  const name = process.env.ADMIN_NAME || "Hostel Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@hostel.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log(`Updated admin account: ${email}`);
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin"
      });
      console.log(`Created admin account: ${email}`);
    }
  } catch (error) {
    console.error("Unable to create admin account.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();
