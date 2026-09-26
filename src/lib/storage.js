const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validate image file format and size
 */
export function validateImageFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    throw new Error('Invalid file type. Supported formats: JPG, JPEG, PNG, WEBP, GIF.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  return true;
}

/**
 * Upload image to Cloudinary via Next.js backend API (/api/cloudinary)
 * using the CLOUDINARY_URL configured in .env
 */
import { compressImageIfNeeded } from './imageCompressor';

export async function uploadProjectImage(file, onProgress) {
  const processedFile = await compressImageIfNeeded(file);

  return new Promise((resolve, reject) => {
    try {
      validateImageFile(processedFile);

      const formData = new FormData();
      formData.append('file', processedFile);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary');

      // Upload progress callback
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.url) {
              resolve({
                downloadUrl: response.url,
                storagePath: response.publicId, // Cloudinary public_id
              });
            } else {
              reject(new Error(response.error || 'Failed to upload to Cloudinary.'));
            }
          } catch (err) {
            reject(new Error('Invalid response from upload server.'));
          }
        } else {
          try {
            const errResp = JSON.parse(xhr.responseText);
            reject(new Error(errResp.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during image upload.'));
      };

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete image from Cloudinary using publicId
 */
export async function deleteProjectImage(publicId) {
  if (!publicId) return;

  try {
    const response = await fetch('/api/cloudinary', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Could not delete Cloudinary image:', error.message);
  }
}

/**
 * Extract Cloudinary publicId from a secure_url
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    console.warn('Error extracting Cloudinary publicId:', e);
  }
  return null;
}
