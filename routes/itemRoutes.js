const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const {createItem,getItems,approveItem} = require("../controllers/itemController");

const storage = multer.diskStorage({
  destination:"uploads/",
  filename:(req,file,cb)=>cb(null,Date.now()+"-"+file.originalname)
});

const upload = multer({storage});

router.post("/",auth,upload.single("image"),createItem);
router.get("/",getItems);
router.put("/approve/:id",auth,approveItem);

module.exports = router;
