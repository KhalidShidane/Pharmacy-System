const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, `${req.user.id}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(new ApiError(400, 'Avatar must be a JPEG, PNG or WEBP image'));
    }
    cb(null, true);
  },
}).single('avatar');

module.exports = { uploadAvatar, AVATAR_DIR };
