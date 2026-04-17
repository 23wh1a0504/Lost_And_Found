const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { requireAdmin, optionalAuth } = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  createItem,
  getItems,
  getItemsCount,
  getItemById,
  updateItem,
  updateItemStatus,
  deleteItem
} = require("../controllers/itemController");

const storage = multer.diskStorage({
  destination:"uploads/",
  filename:(req,file,cb)=>cb(null,Date.now()+"-"+file.originalname)
});

const upload = multer({storage});

router.post("/",auth,upload.single("image"),createItem);
router.get("/",optionalAuth,getItems);
router.get("/count",optionalAuth,getItemsCount);
router.get("/:id",optionalAuth,getItemById);
router.put("/:id",auth,upload.single("image"),updateItem);
router.patch("/:id/status",auth,requireAdmin,updateItemStatus);
router.delete("/:id",auth,deleteItem);

module.exports = router;
