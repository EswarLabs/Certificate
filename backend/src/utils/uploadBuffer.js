import cloudinary from '../lib/cloudinary.js';

export function uploadBufferToCloudinary(buffer, resourceType = 'image') {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder: 'certificates' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
}
