import { uploadImage, uploadFile } from './upload.service.js';
import { prisma } from '../../lib/prisma.js';

export const uploadImageController = async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadImage(file);
    const response = { url: result.secure_url, public_id: result.public_id };

    if (req.body.workspaceId) {
      const dbEntry = await prisma.file.create({
        data: {
          workspaceId: req.body.workspaceId,
          uploadedById: req.user.userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: BigInt(file.size || 0),
          storageKey: result.public_id,
          publicUrl: result.secure_url,
        },
      });
      response.dbEntry = dbEntry;
    }

    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadFileController = async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    const response = { url: result.secure_url, public_id: result.public_id };

    if (req.body.workspaceId) {
      const dbEntry = await prisma.file.create({
        data: {
          workspaceId: req.body.workspaceId,
          uploadedById: req.user.userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: BigInt(file.size || 0),
          storageKey: result.public_id,
          publicUrl: result.secure_url,
        },
      });
      response.dbEntry = dbEntry;
    }

    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};