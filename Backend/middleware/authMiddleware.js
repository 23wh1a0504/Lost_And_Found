const jwt = require("jsonwebtoken");

const auth = (req,res,next)=>{
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i,"");

    if(!token) return res.status(401).json({message:"Authentication required"});

    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({message:"Invalid token"});
  }
};

const optionalAuth = (req,res,next)=>{
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i,"");

    if(token) {
      req.user = jwt.verify(token,process.env.JWT_SECRET);
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

const requireAdmin = (req,res,next)=>{
  if(req.user?.role !== "admin") {
    return res.status(403).json({message:"Admin access required"});
  }

  next();
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
module.exports.optionalAuth = optionalAuth;
