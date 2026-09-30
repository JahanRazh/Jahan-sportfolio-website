import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALLOWED_CATEGORIES = [
  'General',
  'Web Development',
  'Mobile Development',
  'Cloud & DevOps',
  'AI / Machine Learning',
  'Cybersecurity',
  'UI/UX Design',
  'Data Science',
  'Database',
  'Digital Badge',
  'Other',
];

function getCloudinaryCredentials() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) return null;

  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^\r\n]+)/);
  if (!match) return null;

  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3].trim(),
  };
}

async function uploadUrlToCloudinary(remoteUrl) {
  const creds = getCloudinaryCredentials();
  if (!creds || !remoteUrl) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'portfolio-certificates';
    const paramsToSign = `access_mode=public&folder=${folder}&timestamp=${timestamp}${creds.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const fd = new FormData();
    fd.append('file', remoteUrl);
    fd.append('api_key', creds.apiKey);
    fd.append('timestamp', timestamp.toString());
    fd.append('folder', folder);
    fd.append('access_mode', 'public');
    fd.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`, {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    if (res.ok && data.secure_url) {
      return data.secure_url;
    }
  } catch (err) {
    console.warn('Failed to rehost remote badge image to Cloudinary:', err.message);
  }
  return null;
}

/**
 * Dedicated parser for Open Badges v2 (Badgr / Parchment Digital Badges)
 * Example: https://badges.parchment.com/public/assertions/N6taIz2BSt2B55ZiwBooXw
 */
async function extractParchmentBadge(targetUrl) {
  try {
    const match = targetUrl.match(/assertions\/([a-zA-Z0-9_\-]+)/i);
    const assertionId = match ? match[1] : null;
    if (!assertionId) return null;

    const jsonUrl = `https://badges.parchment.com/public/assertions/${assertionId}.json`;
    const res = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json, application/ld+json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!res.ok) return null;
    const assertion = await res.json();

    let badgeClass = {};
    if (typeof assertion.badge === 'string') {
      try {
        const bRes = await fetch(assertion.badge, {
          headers: { 'Accept': 'application/json, application/ld+json', 'User-Agent': 'Mozilla/5.0' },
        });
        if (bRes.ok) badgeClass = await bRes.json();
      } catch {}
    } else if (typeof assertion.badge === 'object' && assertion.badge) {
      badgeClass = assertion.badge;
    }

    let issuerName = 'Parchment';
    if (typeof badgeClass.issuer === 'string') {
      try {
        const iRes = await fetch(badgeClass.issuer, {
          headers: { 'Accept': 'application/json, application/ld+json', 'User-Agent': 'Mozilla/5.0' },
        });
        if (iRes.ok) {
          const issuerData = await iRes.json();
          issuerName = issuerData.name || issuerName;
        }
      } catch {}
    } else if (typeof badgeClass.issuer === 'object' && badgeClass.issuer?.name) {
      issuerName = badgeClass.issuer.name;
    }

    const rawBadgeImg =
      (typeof badgeClass.image === 'string' ? badgeClass.image : badgeClass.image?.id) ||
      (typeof assertion.image === 'string' ? assertion.image : assertion.image?.id) ||
      `https://api.badgr.io/public/assertions/${assertionId}/image`;

    // Rehost to Cloudinary for permanent hosting and lightning-fast loading
    const hostedImage = (await uploadUrlToCloudinary(rawBadgeImg)) || rawBadgeImg;

    const title = badgeClass.name || 'Digital Badge';
    const description = badgeClass.description || assertion.narrative || '';
    const issuedDate = assertion.issuedOn ? assertion.issuedOn.split('T')[0] : '';

    const tags = Array.isArray(badgeClass.tags) ? badgeClass.tags.map((t) => String(t).toLowerCase()) : [];
    const textAll = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

    let category = 'Web Development';
    if (/\b(cloud|aws|azure|gcp|devops|docker|kubernetes)\b/i.test(textAll)) {
      category = 'Cloud & DevOps';
    } else if (/\b(ai|machine learning|deep learning|data science|ml)\b/i.test(textAll)) {
      category = 'AI / Machine Learning';
    } else if (/\b(security|cyber|cybersecurity|pentest|ethical)\b/i.test(textAll)) {
      category = 'Cybersecurity';
    } else if (/\b(mobile|android|ios|flutter|react native|swift|kotlin)\b/i.test(textAll)) {
      category = 'Mobile Development';
    } else if (/\b(ui|ux|design|figma|prototype)\b/i.test(textAll)) {
      category = 'UI/UX Design';
    } else if (/\b(api|web|frontend|backend|rest|javascript|node|postman)\b/i.test(textAll)) {
      category = 'Web Development';
    }

    return {
      title,
      issuer: issuerName,
      category,
      issuedDate,
      expiryDate: '',
      credentialId: assertionId,
      credentialUrl: targetUrl,
      imageUrl: hostedImage,
      description,
      isBadge: true,
    };
  } catch (err) {
    console.warn('Parchment badge extraction failed:', err.message);
    return null;
  }
}

// Active Gemini models ordered for optimal rate-limits and token quotas
// 100% Free-tier Gemini models ordered by high free quota, speed, and reliability
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

function getGeminiApiKeys() {
  const keys = [];
  const primary = process.env.GEMINI_API_KEY || '';
  const backup = process.env.GEMINI_BACKUP_KEY || '';
  const list = process.env.GEMINI_API_KEYS || '';
  for (const item of [primary, backup, list]) {
    if (!item) continue;
    item.split(',').forEach((k) => {
      const trimmed = k.trim();
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    });
  }
  return keys;
}

function parseJsonSafely(rawText) {
  if (!rawText) return null;
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Extract first JSON object block if surrounded by markdown commentary
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch { }
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let isVerificationUrlMode = false;
    let targetVerificationUrl = '';
    let mimeType = 'image/jpeg';
    let base64Data = '';
    let webpagePrompt = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      // JSON body
      const body = await request.json();
      const { fileUrl, verificationUrl } = body;

      const urlToInspect = verificationUrl || fileUrl;
      if (!urlToInspect) {
        return NextResponse.json({ error: 'No fileUrl or verificationUrl provided' }, { status: 400 });
      }

      // 1. Specialized instant resolver for Parchment & Badgr Open Badges
      if (
        urlToInspect.includes('badges.parchment.com') ||
        urlToInspect.includes('badgr.com') ||
        urlToInspect.includes('badgr.io')
      ) {
        console.log('[extract-certificate] Resolving Open Badge from Parchment / Badgr:', urlToInspect);
        const badgeData = await extractParchmentBadge(urlToInspect.trim());
        if (badgeData) {
          return NextResponse.json({
            success: true,
            data: badgeData,
          });
        }
      }

      // Check if it's explicitly a verification URL or webpage (e.g. Credly, Coursera, Udemy, etc.)
      const isHtmlPage =
        Boolean(verificationUrl) ||
        !urlToInspect.match(/\.(pdf|jpeg|jpg|png|webp|gif)($|\?)/i) ||
        urlToInspect.includes('credly.com') ||
        urlToInspect.includes('coursera.org/verify') ||
        urlToInspect.includes('udemy.com/certificate') ||
        urlToInspect.includes('learn.microsoft.com') ||
        urlToInspect.includes('linkedin.com') ||
        urlToInspect.includes('hackerrank.com/certificates');

      if (isHtmlPage) {
        isVerificationUrlMode = true;
        targetVerificationUrl = urlToInspect.trim();

        // Fetch the verification page
        const fetchRes = await fetch(targetVerificationUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!fetchRes.ok) {
          return NextResponse.json(
            { error: `Could not access verification link (status ${fetchRes.status}). Please check that the URL is public and valid.` },
            { status: 400 }
          );
        }

        const html = await fetchRes.text();

        // 2. Specialized resolver for Credly digital badges
        if (targetVerificationUrl.includes('credly.com')) {
          const ogTitle =
            html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1] ||
            html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
          const ogImg =
            html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1] || '';
          const ogDesc =
            html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/content=["']([^"']+)["']\s+property=["']og:description["']/i)?.[1] || '';

          if (ogImg) {
            console.log('[extract-certificate] Resolving Credly Badge:', targetVerificationUrl);
            const hostedBadgeImg = (await uploadUrlToCloudinary(ogImg)) || ogImg;
            const credMatch = targetVerificationUrl.match(/badges\/([a-zA-Z0-9_\-]+)/i);
            const titleClean = ogTitle ? ogTitle.replace(/\s*\|\s*Credly.*$/i, '').trim() : 'Verified Digital Badge';

            return NextResponse.json({
              success: true,
              data: {
                title: titleClean,
                issuer: 'Credly',
                category: 'General',
                issuedDate: '',
                expiryDate: '',
                credentialId: credMatch ? credMatch[1] : '',
                credentialUrl: targetVerificationUrl,
                imageUrl: hostedBadgeImg,
                description: ogDesc || 'Verified digital badge credential issued via Credly.',
                isBadge: true,
              },
            });
          }
        }

        // Extract OpenGraph / Meta tags
        const ogTitle =
          html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1] ||
          html.match(/<title>([^<]+)<\/title>/i)?.[1] ||
          '';

        const ogDesc =
          html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:description["']/i)?.[1] ||
          '';

        const ogImg =
          html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1] ||
          '';

        // Extract clean text from HTML
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 5000);

        webpagePrompt = `You are an expert credential and certificate parser.
Analyze this certificate verification webpage content, metadata, and OpenGraph tags to extract structured certificate details.

Verification URL: ${targetVerificationUrl}
Page / OpenGraph Title: ${ogTitle}
OpenGraph Description: ${ogDesc}
OpenGraph Image / Badge URL: ${ogImg}

Webpage text excerpt:
${cleanText}

Return ONLY a valid JSON object with the following fields:
{
  "title": "Exact title of the certificate or course completed (e.g. 'AWS Certified Solutions Architect')",
  "issuer": "Issuing organization or institution (e.g. 'Amazon Web Services', 'Microsoft', 'Coursera', 'Google', 'SLIIT', 'Udemy', 'HackerRank')",
  "category": "Pick the single most fitting category from: ['General', 'Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI / Machine Learning', 'Cybersecurity', 'UI/UX Design', 'Data Science', 'Database', 'Other']",
  "issuedDate": "Issue date formatted strictly as 'YYYY-MM-DD' (e.g. '2024-05-15') or '' if not found",
  "expiryDate": "Expiry date formatted strictly as 'YYYY-MM-DD' or '' if no expiration",
  "credentialId": "Credential / Badge ID or serial number or code from URL / text, or '' if not found",
  "credentialUrl": "${targetVerificationUrl}",
  "imageUrl": "${ogImg}",
  "description": "A concise 1-2 sentence professional summary of what this certificate or skill validates"
}
Output ONLY raw JSON. Do not include markdown codeblocks or conversational text.`;
      } else {
        // Direct image/PDF URL
        const fetchRes = await fetch(urlToInspect);
        if (!fetchRes.ok) {
          return NextResponse.json(
            { error: `Failed to fetch file from URL (status ${fetchRes.status})` },
            { status: 400 }
          );
        }

        mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      }
    }

    const documentPrompt = `You are an expert document parser. Analyze this certificate image or document and extract the relevant information.
Return ONLY a valid JSON object with the following fields:
{
  "title": "Exact title of the certificate or course completed (e.g. 'AWS Certified Solutions Architect - Associate')",
  "issuer": "Issuing organization or institution (e.g. 'Amazon Web Services', 'Coursera', 'Google', 'SLIIT', 'Udemy', 'HackerRank')",
  "category": "Pick the single most fitting category from: ['General', 'Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI / Machine Learning', 'Cybersecurity', 'UI/UX Design', 'Data Science', 'Database', 'Other']",
  "issuedDate": "Issue date formatted strictly as 'YYYY-MM-DD' (e.g. '2024-05-15'). If day is missing use 01 (e.g. '2024-05-01'). If no date found, return ''",
  "expiryDate": "Expiry date formatted strictly as 'YYYY-MM-DD' or '' if no expiration",
  "credentialId": "Credential / License / Certificate ID or serial number, or '' if not found",
  "credentialUrl": "Verification URL, verification link, or URL found in QR code/text, or '' if not found",
  "imageUrl": "",
  "description": "A concise 1-2 sentence professional summary of what this certificate or skill validates"
}
IMPORTANT: Output ONLY the raw JSON object. Do not include markdown codeblocks (\`\`\`json) or any conversational text.`;

    let resultJson = null;
    let lastError = null;

    const contents = isVerificationUrlMode
      ? [{ parts: [{ text: webpagePrompt }] }]
      : [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.includes('pdf') ? 'application/pdf' : mimeType,
                data: base64Data,
              },
            },
            { text: documentPrompt },
          ],
        },
      ];

    // Try available API keys and candidate models in order
    modelLoop: for (const key of apiKeys) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                generationConfig: {
                  temperature: 0.1,
                  topP: 0.8,
                },
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawText = data.candidates[0].content.parts[0].text.trim();
            const parsed = parseJsonSafely(rawText);
            if (parsed && typeof parsed === 'object') {
              resultJson = parsed;
              console.log(`[extract-certificate] Successfully extracted with model: ${model}`);
              break modelLoop;
            }
          }

          // Error handling & quota limit detection (RPM, RPD, TPM, 429, 503, 404, RESOURCE_EXHAUSTED)
          const errorMsg = data?.error?.message || data?.error?.status || `HTTP ${response.status}`;
          lastError = errorMsg;

          console.warn(
            `[extract-certificate] Model "${model}" unavailable or rate-limited (${response.status}: ${errorMsg}). Automatically switching to next candidate model...`
          );
        } catch (err) {
          lastError = err.message;
          console.warn(`[extract-certificate] Error with model "${model}": ${err.message}. Trying next candidate model...`);
        }
      }
    }

    if (!resultJson) {
      // If AI models all reached free-tier rate limits, fallback gracefully to extracted webpage metadata
      if (isVerificationUrlMode && (targetVerificationUrl || webpagePrompt)) {
        console.log('[extract-certificate] AI free tier limit reached — falling back to extracted page metadata');
        resultJson = {
          title: 'Certificate Credential',
          issuer: targetVerificationUrl.includes('credly') ? 'Credly' :
                  targetVerificationUrl.includes('coursera') ? 'Coursera' :
                  targetVerificationUrl.includes('udemy') ? 'Udemy' :
                  targetVerificationUrl.includes('hackerrank') ? 'HackerRank' :
                  targetVerificationUrl.includes('microsoft') ? 'Microsoft' : '',
          category: 'General',
          issuedDate: '',
          expiryDate: '',
          credentialId: '',
          credentialUrl: targetVerificationUrl,
          imageUrl: '',
          description: 'Verified digital certificate credential.',
        };
      } else {
        const isQuota =
          String(lastError).includes('429') ||
          String(lastError).toLowerCase().includes('quota') ||
          String(lastError).toLowerCase().includes('rate limit') ||
          String(lastError).toLowerCase().includes('resource_exhausted') ||
          String(lastError).toLowerCase().includes('billing');

        return NextResponse.json(
          {
            error: isQuota
              ? 'Free-tier request limit momentarily reached on Gemini. Please wait 15-30 seconds and try again (no paid account needed).'
              : 'Could not extract certificate details with free AI tier. Please try again shortly.',
          },
          { status: 500 }
        );
      }
    }

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(resultJson.category)) {
      resultJson.category = 'General';
    }

    return NextResponse.json({
      success: true,
      data: {
        title: resultJson.title || '',
        issuer: resultJson.issuer || '',
        category: resultJson.category || 'General',
        issuedDate: resultJson.issuedDate || '',
        expiryDate: resultJson.expiryDate || '',
        credentialId: resultJson.credentialId || '',
        credentialUrl: resultJson.credentialUrl || targetVerificationUrl || '',
        imageUrl: resultJson.imageUrl || '',
        description: resultJson.description || '',
        isBadge: Boolean(resultJson.isBadge || resultJson.category === 'Digital Badge'),
      },
    });
  } catch (error) {
    console.error('Error in /api/extract-certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during certificate extraction' },
      { status: 500 }
    );
  }
}
