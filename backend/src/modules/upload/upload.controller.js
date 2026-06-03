import {uploadImage, uploadFile} from './upload.service.js';

export const uploadImageController = async (req, res) => {
  try {
    const result = await uploadImage(req.file);
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};

export const uploadFileController = async (req, res) => {
  try {
    const result = await uploadFile(req.file);
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
};