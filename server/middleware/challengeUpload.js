import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const challengeUploadDirectory = path.resolve(serverDirectory, 'uploads', 'challenges');

const allowedTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.pdf', 'application/pdf'],
  ['.mp4', 'video/mp4']
]);

fs.mkdirSync(challengeUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, challengeUploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  }
});

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.has(extension) || allowedTypes.get(extension) !== file.mimetype) {
    return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'files'));
  }
  callback(null, true);
};

export const challengeUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 25 * 1024 * 1024
  }
});

export function parseChallengeUpload(req, res, next) {
  challengeUpload.array('files', 5)(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each attachment must be 25 MB or smaller'
      : 'Only JPG, JPEG, PNG, PDF, and MP4 attachments are allowed';
    const uploadedFiles = req.files || [];
    return Promise.all(uploadedFiles.map((file) => fs.promises.unlink(file.path).catch(() => undefined)))
      .then(() => res.status(status).json({ success: false, message }));
  });
}

export function isAllowedChallengeType(extension, mimeType) {
  return allowedTypes.get(extension.toLowerCase()) === mimeType;
}
