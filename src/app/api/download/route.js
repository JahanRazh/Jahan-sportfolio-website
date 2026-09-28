import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'document.pdf';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL parameter ("url")' }, { status: 400 });
    }

    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!filename.includes('.')) {
      filename += '.pdf';
    }

    // Resolve target URL
    let targetUrl = fileUrl;
    if (fileUrl.startsWith('/')) {
      targetUrl = new URL(fileUrl, req.url).toString();
    } else if (fileUrl.includes('cloudinary.com') && fileUrl.includes('/upload/')) {
      // In Cloudinary URLs, ensure fl_attachment is added if not present
      if (!fileUrl.includes('fl_attachment')) {
        targetUrl = fileUrl.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(filename)}/`);
      }
    }

    const upstream = await fetch(targetUrl);
    if (!upstream.ok) {
      // If fetching with fl_attachment failed, retry with original fileUrl
      const fallback = await fetch(fileUrl.startsWith('/') ? new URL(fileUrl, req.url).toString() : fileUrl);
      if (!fallback.ok) {
        return NextResponse.json(
          { error: `Failed to fetch file from source (status: ${upstream.status})` },
          { status: upstream.status }
        );
      }

      const contentType = fallback.headers.get('content-type') || 'application/pdf';
      const arrayBuffer = await fallback.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const contentType = upstream.headers.get('content-type') || 'application/pdf';
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Error in /api/download:', err);
    return NextResponse.json({ error: err.message || 'Failed to download file' }, { status: 500 });
  }
}
