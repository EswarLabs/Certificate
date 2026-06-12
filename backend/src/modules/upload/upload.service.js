import cloudinary from '../../lib/cloudinary.js';

export const uploadImage = async (file) => {
  if (process.env.NODE_ENV === 'test') {
    return {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v12345/images/mock-file.png',
      public_id: 'mock-image-id',
    };
  }
  const result = await cloudinary.uploader.upload(file.path, { folder: 'certificate-app/images', resource_type: 'auto' });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
};

export const uploadFile = async (file) => {
  if (process.env.NODE_ENV === 'test') {
    return {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v12345/files/mock-file.pdf',
      public_id: 'mock-file-id',
    };
  }
  const result = await cloudinary.uploader.upload(file.path, { folder: 'certificate-app/files', resource_type: 'auto' });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
};