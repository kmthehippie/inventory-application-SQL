const cloudinary = require("./cloudinaryConfig");

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.secure_url);
        }
      })
      .end(buffer);
  });
};

exports.resizeAndUploadImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  try {
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        transformation: [{ width: 200, height: 200, crop: "limit" }],
      })
    );
    const results = await Promise.all(uploadPromises);
    req.imgurls = results;
    next();
  } catch (err) {
    next(err);
  }
};
