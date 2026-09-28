import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
  'Other',
];

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
];

export async function POST(request) {
  try {
    if (!GEMINI_API_KEY) {
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

    // Try candidate models in order of speed and availability
    for (const model of CANDIDATE_MODELS) {
      try {
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

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
          const cleanedText = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();

          resultJson = JSON.parse(cleanedText);
          break;
        } else {
          lastError = data.error?.message || 'Unknown error from Gemini model';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!resultJson) {
      return NextResponse.json(
        { error: lastError || 'Failed to extract certificate details with AI.' },
        { status: 500 }
      );
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
