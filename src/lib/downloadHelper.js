/**
 * Helper to build a direct download link that forces the browser to download the file instead of opening it.
 */
export function getDirectDownloadUrl(fileUrl, fileName = 'document.pdf') {
  if (!fileUrl) return '';
  const cleanName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(cleanName)}`;
}

/**
 * Programmatically downloads any file directly to the user's computer without navigating or opening in a new tab.
 */
export async function downloadPdfDirectly(fileUrl, fileName = 'document.pdf') {
  if (!fileUrl || typeof window === 'undefined') return;

  const cleanName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const downloadUrl = getDirectDownloadUrl(fileUrl, cleanName);

  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Download response status: ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
  } catch (err) {
    console.warn('Direct blob download notice, falling back to attachment URL:', err);
    // Direct link fallback triggers browser native download through Content-Disposition: attachment
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
