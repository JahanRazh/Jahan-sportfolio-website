const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB for certificates

/**
 * Validate certificate file (image or PDF)
 */
export function validateCertificateFile(file) {
  if (!file) throw new Error('No file selected.');

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
  const isPdf = ALLOWED_PDF_TYPES.includes(file.type.toLowerCase());

  if (!isImage && !isPdf) {
    throw new Error('Invalid file type. Supported formats: JPG, PNG, WEBP, GIF, PDF.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 15MB limit.');
  }

  return { isImage, isPdf };
}

/**
 * Upload a certificate image or PDF to Cloudinary via the /api/cloudinary endpoint.
 * Returns { downloadUrl, storagePath, resourceType }
 */
import { compressImageIfNeeded } from './imageCompressor';

export async function uploadCertificateFile(file, onProgress) {
  const processedFile = await compressImageIfNeeded(file);

  return new Promise((resolve, reject) => {
    try {
      validateCertificateFile(processedFile);

      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('folder', 'portfolio-certificates');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary');

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
                thumbnailUrl: response.thumbnailUrl || response.url,
                storagePath: response.publicId,
                resourceType: response.resourceType || 'image',
              });
            } else {
              reject(new Error(response.error || 'Failed to upload to Cloudinary.'));
            }
          } catch {
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

      xhr.onerror = () => reject(new Error('Network error during file upload.'));
      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete a certificate file from Cloudinary
 * resourceType should be 'image' or 'raw' (for PDFs)
 */
export async function deleteCertificateFile(publicId, resourceType = 'image') {
  if (!publicId) return;
  try {
    const response = await fetch('/api/cloudinary', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Could not delete Cloudinary certificate file:', error.message);
  }
}
