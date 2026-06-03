import express from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import {uploadImageController, uploadFileController} from './upload.controller.js';
import {imageUploadMiddleware, fileUploadMiddleware} from './upload.validation.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/image', imageUploadMiddleware.single('file'), uploadImageController);
router.post('/file', fileUploadMiddleware.single('file'), uploadFileController);
export default router;