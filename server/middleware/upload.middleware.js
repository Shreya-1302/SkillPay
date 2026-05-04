const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
    files: 5 // Maximum 5 files
  }
});

const uploadImages = upload.array('images', 5);
const uploadAvatar = upload.single('avatar');

module.exports = { uploadImages, uploadAvatar };
