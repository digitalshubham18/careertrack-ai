const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const env = require('./env');

const useCloudinary = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

let cloudinary = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!useCloudinary && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

/**
 * Uploads a file buffer to configured storage (Cloudinary if configured,
 * otherwise local disk). Returns { url, storageKey }.
 */
async function uploadResumeBuffer(buffer, originalName, userId) {
  const safeName = `${userId}_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'careertrack-ai/resumes', public_id: safeName },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, storageKey: result.public_id });
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return { url: `/uploads/${safeName}`, storageKey: safeName };
}

async function deleteResumeFile(storageKey) {
  if (useCloudinary) {
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'raw' });
    return;
  }
  const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/**
 * Uploads an image (profile picture, company logo, etc.) using Cloudinary's
 * `image` resource type when available - which gets automatic optimization
 * and format negotiation - or local disk otherwise. Kept separate from
 * uploadResumeBuffer since resumes are stored as `raw` (arbitrary binary),
 * while images benefit from Cloudinary treating them as actual images.
 */
async function uploadImageBuffer(buffer, originalName, userId) {
  const safeName = `${userId}_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'careertrack-ai/avatars',
          public_id: safeName,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, storageKey: result.public_id });
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return { url: `/uploads/${safeName}`, storageKey: safeName };
}

async function deleteImageFile(storageKey) {
  if (useCloudinary) {
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'image' });
    return;
  }
  const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = {
  uploadResumeBuffer, deleteResumeFile, uploadImageBuffer, deleteImageFile, useCloudinary, LOCAL_UPLOAD_DIR,
};
