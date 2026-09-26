import { NextResponse } from 'next/server';
import crypto from 'crypto';

function getCloudinaryCredentials() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    throw new Error('CLOUDINARY_URL environment variable is missing.');
  }

  // Format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) {
    throw new Error('Invalid CLOUDINARY_URL format.');
  }

  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3],
  };
}

export async function POST(req) {
  try {
    const { apiKey, apiSecret, cloudName } = getCloudinaryCredentials();

    const formData = await req.formData();
    const file = formData.get('file');
    const folderParam = formData.get('folder') || 'portfolio-projects';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const MAX_CLOUDINARY_BYTES = 10485760; // 10MB limit on Cloudinary free plan
    if (file.size > MAX_CLOUDINARY_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File size too large (${sizeMb}MB). Cloudinary free tier allows maximum 10MB per file. Please choose an image or document under 10MB.`,
        },
        { status: 400 }
      );
    }

    const isPdf = file.type === 'application/pdf';
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = folderParam;

    // Use resource_type=auto so Cloudinary detects images vs PDFs automatically.
    // Always include access_mode=public (signed alphabetically: access_mode < folder < timestamp)
    // so every uploaded file is publicly readable without authentication.
    const paramsToSign = `access_mode=public&folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('folder', folder);
    uploadFormData.append('access_mode', 'public');   // must match signature
    uploadFormData.append('signature', signature);

    // Upload to image/upload endpoint. Cloudinary natively handles images AND PDFs as image assets,
    // which allows automatic high-res JPG rendering and thumbnail generation for certificates.
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadFormData }
    );

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      console.error('Cloudinary API upload rejected:', data.error);
      return NextResponse.json(
        { error: data.error?.message || 'Cloudinary upload failed.' },
        { status: uploadRes.status >= 400 && uploadRes.status < 500 ? uploadRes.status : 400 }
      );
    }

    // For PDFs uploaded as image assets, page 1 can be delivered as a JPG picture
    let thumbnailUrl = data.secure_url;
    if (isPdf || data.format === 'pdf') {
      thumbnailUrl = data.secure_url.replace(/\.pdf$/i, '.jpg');
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      thumbnailUrl,
      publicId: data.public_id,
      resourceType: 'image',
    });
  } catch (error) {
    console.error('Cloudinary API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { apiKey, apiSecret, cloudName } = getCloudinaryCredentials();

    const { publicId, resourceType = 'image' } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: 'No publicId provided.' }, { status: 400 });
    }

    // Helper to destroy a target asset in Cloudinary
    async function attemptDestroy(id, resType) {
      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `public_id=${id}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const destroyFormData = new FormData();
      destroyFormData.append('public_id', id);
      destroyFormData.append('api_key', apiKey);
      destroyFormData.append('timestamp', timestamp.toString());
      destroyFormData.append('signature', signature);

      const destroyRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resType}/destroy`,
        {
          method: 'POST',
          body: destroyFormData,
        }
      );
      return destroyRes.json();
    }

    // 1. Strip file extension if any (Cloudinary image public_ids do not have extensions)
    const cleanId = publicId.replace(/\.[^/.]+$/, '');

    // Attempt 1: using clean ID with requested resource type
    let result = await attemptDestroy(cleanId, resourceType);

    // Attempt 2: if not found and original had extension, try with original ID
    if (result?.result === 'not found' && cleanId !== publicId) {
      result = await attemptDestroy(publicId, resourceType);
    }

    // Attempt 3: if not found, try the alternate resource type (e.g. image <-> raw for PDFs)
    if (result?.result === 'not found') {
      const altType = resourceType === 'image' ? 'raw' : 'image';
      result = await attemptDestroy(cleanId, altType);
      if (result?.result === 'not found' && cleanId !== publicId) {
        result = await attemptDestroy(publicId, altType);
      }
    }

    console.log(`[Cloudinary Destroy] Deleted publicId="${publicId}":`, result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary API delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Deletion failed.' },
      { status: 400 }
    );
  }
}
