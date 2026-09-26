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
      throw new Error(data.error?.message || 'Cloudinary upload failed.');
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
    console.error('Cloudinary API upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed.' },
      { status: 500 }
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

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const destroyFormData = new FormData();
    destroyFormData.append('public_id', publicId);
    destroyFormData.append('api_key', apiKey);
    destroyFormData.append('timestamp', timestamp.toString());
    destroyFormData.append('signature', signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      {
        method: 'POST',
        body: destroyFormData,
      }
    );

    const data = await destroyRes.json();
    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Cloudinary API delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Deletion failed.' },
      { status: 500 }
    );
  }
}
