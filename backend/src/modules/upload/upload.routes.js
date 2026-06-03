import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {uploadImageController, uploadFileController} from './upload.controller.js';
import {imageUploadMiddleware, fileUploadMiddleware} from './upload.validation.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/upload/image:
 *   post:
 *     summary: Upload an image file
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 public_id:
 *                   type: string
 *       400:
 *         description: Invalid file format
 *       401:
 *         description: Unauthorized
 */
router.post('/image', imageUploadMiddleware.single('file'), uploadImageController);

/**
 * @openapi
 * /api/upload/file:
 *   post:
 *     summary: Upload a document file
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 public_id:
 *                   type: string
 *       400:
 *         description: Invalid file format
 *       401:
 *         description: Unauthorized
 */
router.post('/file', fileUploadMiddleware.single('file'), uploadFileController);
export default router;