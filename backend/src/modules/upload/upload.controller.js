import { uploadImage, uploadFile } from './upload.service.js';
import { prisma } from '../../lib/prisma.js';

export const uploadImageController = async (req, res, next) => {
  try {
    const file = req.file;
    const result = await uploadImage(file);
    const response = { url: result.secure_url, public_id: result.public_id };

    if (req.body.workspaceId) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.user.userId,
          workspaceId: req.body.workspaceId,
          role: { in: ["OWNER", "ADMIN", "MEMBER"] },
        }
      });
      if (!membership) {
        throw new Error("User is not a member of the organization");
      }
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
    next(error);
  }
};

export const uploadFileController = async (req, res, next) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    const response = { url: result.secure_url, public_id: result.public_id };

    if (req.body.workspaceId) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.user.userId,
          workspaceId: req.body.workspaceId,
          role: { in: ["OWNER", "ADMIN", "MEMBER"] },
        }
      });
      if (!membership) {
        throw new Error("User is not a member of the organization");
      }
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
    next(error);
  }
};