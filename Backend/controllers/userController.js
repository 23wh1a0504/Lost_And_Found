const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role createdAt updatedAt").sort({
      createdAt: -1
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch users" });
  }
};
