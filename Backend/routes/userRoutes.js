const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");
const { getUsers } = require("../controllers/userController");

router.get("/", auth, requireAdmin, getUsers);

module.exports = router;
