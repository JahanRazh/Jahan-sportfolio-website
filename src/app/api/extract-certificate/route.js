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
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

export async function POST(request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    let mimeType = 'image/jpeg';
    let base64Data = '';

    const contentType = request.headers.get('content-type') || '';

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
      // JSON body with fileUrl
      const body = await request.json();
      const { fileUrl } = body;

      if (!fileUrl) {
        return NextResponse.json({ error: 'No fileUrl provided' }, { status: 400 });
      }

      // Fetch the file from URL
      const fetchRes = await fetch(fileUrl);
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

    // Prepare prompt
    const prompt = `You are an expert document parser. Analyze this certificate image or document and extract the relevant information.
Return ONLY a valid JSON object with the following fields:
{
  "title": "Exact title of the certificate or course completed (e.g. 'AWS Certified Solutions Architect - Associate')",
  "issuer": "Issuing organization or institution (e.g. 'Amazon Web Services', 'Coursera', 'Google', 'SLIIT', 'Udemy', 'HackerRank')",
  "category": "Pick the single most fitting category from: ['General', 'Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI / Machine Learning', 'Cybersecurity', 'UI/UX Design', 'Data Science', 'Database', 'Other']",
  "issuedDate": "Issue date formatted strictly as 'YYYY-MM-DD' (e.g. '2024-05-15'). If day is missing use 01 (e.g. '2024-05-01'). If no date found, return ''",
  "expiryDate": "Expiry date formatted strictly as 'YYYY-MM-DD' or '' if no expiration",
  "credentialId": "Credential / License / Certificate ID or serial number, or '' if not found",
  "credentialUrl": "Verification URL, verification link, or URL found in QR code/text, or '' if not found",
  "description": "A concise 1-2 sentence professional summary of what this certificate or skill validates"
}

IMPORTANT: Output ONLY the raw JSON object. Do not include markdown codeblocks (\`\`\`json) or any conversational text.`;

    let resultJson = null;
    let lastError = null;

    // Try candidate models in order of speed
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType.includes('pdf') ? 'application/pdf' : mimeType,
                        data: base64Data,
                      },
                    },
                    { text: prompt },
                  ],
                },
              ],
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
          // Clean possible markdown code fences
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
        credentialUrl: resultJson.credentialUrl || '',
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
