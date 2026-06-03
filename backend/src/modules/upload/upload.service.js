import cloudinary from '../../lib/cloudinary';

export const uploadImage = async (file) => {
  const result = await cloudinary.v2.uploader.upload(file.path, { folder: 'certificate-app/images' });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
};

export const uploadFile = async (file) => {
  const result = await cloudinary.v2.uploader.upload(file.path, { folder: 'certificate-app/files' });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
};