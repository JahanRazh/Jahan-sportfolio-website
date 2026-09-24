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

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'portfolio-projects';

    // Cloudinary signature parameters in alphabetical order
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    // Create Cloudinary API payload
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('folder', folder);
    uploadFormData.append('signature', signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const data = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(data.error?.message || 'Cloudinary upload failed.');
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error) {
    console.error('Cloudinary API upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Image upload failed.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { apiKey, apiSecret, cloudName } = getCloudinaryCredentials();

    const { publicId } = await req.json();
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
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
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
      { error: error.message || 'Image deletion failed.' },
      { status: 500 }
    );
  }
}
