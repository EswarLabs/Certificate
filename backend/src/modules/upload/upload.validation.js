import multer from 'multer';
import { tmpdir } from 'os';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
}

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html', 'text/css', 'image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, Word, HTML, CSS, and image files are allowed!'), false);
    }   
}

export const imageUploadMiddleware = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export const fileUploadMiddleware = multer({ storage, fileFilter: fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });