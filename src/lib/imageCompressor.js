/**
 * Client-side image compressor utility using HTML5 Canvas.
 * Automatically downscales oversized photos (e.g. from smartphones or DSLR)
 * to stay well within Cloudinary's 10MB (10,485,760 bytes) free tier limit.
 */

export async function compressImageIfNeeded(
  file,
  {
    maxDimension = 2048,
    quality = 0.88,
    maxSizeBytes = 8 * 1024 * 1024, // 8MB threshold to trigger compression
  } = {}
) {
  if (!file || typeof window === 'undefined') return file;

  // Only compress standard raster images (JPEG, PNG, WEBP)
  const isCompressible =
    file.type === 'image/jpeg' ||
    file.type === 'image/jpg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp';

  if (!isCompressible) {
    return file;
  }

  // If already under 3MB, no compression is necessary
  if (file.size <= 3 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert PNG to JPEG if large to achieve massive file size reduction
          const outputMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // If compression didn't produce a smaller file, use original
                resolve(file);
              } else {
                const ext = outputMime === 'image/webp' ? '.webp' : '.jpg';
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                const compressedFile = new File([blob], `${baseName}${ext}`, {
                  type: outputMime,
                  lastModified: Date.now(),
                });
                console.log(
                  `[imageCompressor] Compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
                );
                resolve(compressedFile);
              }
            },
            outputMime,
            quality
          );
        } catch (err) {
          console.warn('[imageCompressor] Canvas compression failed, using original:', err);
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
