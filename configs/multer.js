const multer = require("multer");

exports.uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20_000_000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Not an image! Please upload only images."), false);
  },
}).array("images", 5);
