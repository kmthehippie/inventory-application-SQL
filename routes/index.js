const express = require("express");
const router = express.Router();
const { uploadPhoto } = require("../configs/multer");
const { resizeAndUploadImage } = require("../configs/imageUploadMiddleware");

const indexController = require("../controllers/IndexController");

router.get("/", indexController.GetDashboard);
router.get("/inventory", indexController.GetInventory);
router.get("/batches/create", indexController.GetBatches);
router.post(
  "/batches/create",
  uploadPhoto,
  resizeAndUploadImage,
  indexController.CreateBatchesPost
);

module.exports = router;
