const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const createAuthPayload = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: sanitizeUser(user)
  };
};

exports.register = async (req,res)=>{
  try {
    const { name, email, password } = req.body || {};

    if(!name || !email || !password) {
      return res.status(400).json({message:"Name, email, and password are required"});
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if(existingUser) {
      return res.status(409).json({message:"An account with this email already exists"});
    }

    const hash = await bcrypt.hash(password,10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role: "user"
    });

    return res.status(201).json(createAuthPayload(user));
  } catch (error) {
    if(error.code === 11000) {
      return res.status(409).json({message:"An account with this email already exists"});
    }

    return res.status(500).json({
      message: error.message || "Unable to register right now"
    });
  }
};

exports.login = async (req,res)=>{
  try {
    const { email, password, role } = req.body || {};

    if(!email || !password) {
      return res.status(400).json({message:"Email and password are required"});
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if(!user) return res.status(400).json({message:"User not found"});

    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.status(400).json({message:"Wrong password"});

    if(role && user.role !== role) {
      return res.status(403).json({message:`This account is not registered as ${role}`});
    }

    return res.json(createAuthPayload(user));
  } catch (error) {
    return res.status(500).json({message:"Unable to login right now"});
  }
};

exports.me = async (req,res)=>{
  try {
    const user = await User.findById(req.user.id).select("_id name email role");

    if(!user) {
      return res.status(404).json({message:"User not found"});
    }

    return res.json({user:sanitizeUser(user)});
  } catch (error) {
    return res.status(500).json({message:"Unable to fetch user details"});
  }
};
