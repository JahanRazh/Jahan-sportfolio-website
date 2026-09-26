import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ALLOWED_CATEGORIES = [
  'Web Application',
  'Mobile Application',
  'Mobile Game',
  'AI / Machine Learning',
  'UI/UX Design',
  'Desktop Application',
];

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

function extractImagesFromMarkdown(markdown, owner, repo, branch = 'main') {
  if (!markdown) return [];
  const urls = [];

  // Match Markdown ![alt](url)
  const mdRegex = /!\[.*?\]\((.+?)\)/g;
  let mdMatch;
  while ((mdMatch = mdRegex.exec(markdown)) !== null) {
    if (mdMatch[1]) {
      const rawUrl = mdMatch[1].trim().split(/\s+/)[0];
      urls.push(rawUrl);
    }
  }

  // Match HTML <img src="...">
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let htmlMatch;
  while ((htmlMatch = htmlRegex.exec(markdown)) !== null) {
    if (htmlMatch[1]) {
      urls.push(htmlMatch[1].trim());
    }
  }

  // Filter out badges, icons, and non-content images
  const filtered = urls.filter((url) => {
    const lower = url.toLowerCase();
    return (
      !lower.includes('shields.io') &&
      !lower.includes('badge') &&
      !lower.includes('codecov') &&
      !lower.includes('travis-ci') &&
      !lower.includes('github/workflow') &&
      !lower.includes('license') &&
      !lower.endsWith('.svg')
    );
  });

  // Convert relative paths to GitHub raw content URLs
  return filtered.map((url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanPath = url.replace(/^\.?\//, '');
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { githubUrl } = body;

    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid GitHub repository URL.' },
        { status: 400 }
      );
    }

    // Extract owner and repo from URL
    const match = githubUrl.trim().match(/github\.com\/([^\/\?#]+)\/([^\/\?#]+)/);
    if (!match || !match[1] || !match[2]) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Example: https://github.com/owner/repository' },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');

    // 1. Fetch Repository Metadata from GitHub API
    const ghApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const ghRes = await fetch(ghApiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-App',
      },
    });

    if (!ghRes.ok) {
      if (ghRes.status === 404) {
        return NextResponse.json(
          { error: `GitHub repository "${owner}/${repo}" was not found or is private.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: status ${ghRes.status}` },
        { status: ghRes.status }
      );
    }

    const repoData = await ghRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // 2. Fetch README content
    let readmeText = '';
    const readmeFilenames = ['README.md', 'readme.md', 'README.markdown', 'ReadMe.md'];

    for (const filename of readmeFilenames) {
      try {
        const rawReadmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filename}`;
        const readmeRes = await fetch(rawReadmeUrl);
        if (readmeRes.ok) {
          readmeText = await readmeRes.text();
          break;
        }
      } catch (err) {
        // try next
      }
    }

    // 3. Extract candidate image URLs from README
    const extractedImages = extractImagesFromMarkdown(readmeText, owner, repo, defaultBranch);
    const candidateImageUrl = extractedImages.length > 0 ? extractedImages[0] : '';

    // 4. Fallback default extraction from repo metadata if no Gemini key
    const fallbackData = {
      name: repoData.name
        ? repoData.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : repo,
      category: 'Web Application',
      shortDescription: repoData.description || 'Modern open-source application.',
      description:
        repoData.description ||
        `${repoData.name} is an open-source project hosted on GitHub with comprehensive documentation and modular architecture.`,
      technologies: Array.isArray(repoData.topics) && repoData.topics.length > 0
        ? repoData.topics.slice(0, 6)
        : repoData.language
        ? [repoData.language]
        : ['JavaScript', 'React'],
      githubUrl: repoData.html_url || githubUrl.trim(),
      liveUrl: repoData.homepage || '',
      imageUrl: candidateImageUrl,
    };

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: true, data: fallbackData });
    }

    // 5. Intelligent AI extraction using Gemini
    const prompt = `You are an expert technical portfolio builder. Analyze this GitHub repository and its README markdown to generate a polished, professional portfolio project entry.

Repository Metadata:
- Name: ${repoData.name}
- Description: ${repoData.description || 'None provided'}
- Topics / Tags: ${(repoData.topics || []).join(', ') || 'None'}
- Primary Language: ${repoData.language || 'Not specified'}
- Homepage / Live Demo: ${repoData.homepage || 'None'}
- Candidate Images in README: ${extractedImages.slice(0, 4).join(', ') || 'None found'}

README Markdown Content:
"""
${readmeText.substring(0, 7500)}
"""

Extract and generate the following fields in strict JSON format:
{
  "name": "A clean, professional display title for the project (e.g. 'Stellar ERP Management System')",
  "category": "Pick the single most accurate category strictly from: ['Web Application', 'Mobile Application', 'Mobile Game', 'AI / Machine Learning', 'UI/UX Design', 'Desktop Application']",
  "shortDescription": "A concise, engaging 1-sentence value proposition (strictly under 130 characters)",
  "description": "A comprehensive 2-3 sentence overview explaining what the project does, key features, and architecture",
  "technologies": ["Array of 4 to 8 primary technologies/frameworks/libraries used, e.g. 'React', 'Next.js', 'Tailwind CSS', 'Node.js', 'PostgreSQL'"],
  "liveUrl": "Live demo / deployment URL if found in the README or repository homepage, otherwise ''",
  "imageUrl": "The single best screenshot or preview image URL from candidate images or README, otherwise ''"
}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown codeblocks (\`\`\`json) or any conversational text.`;

    let aiResult = null;
    let lastError = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
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

          aiResult = JSON.parse(cleanedText);
          break;
        } else {
          lastError = data.error?.message || 'Error from Gemini';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!aiResult) {
      console.warn('Gemini extraction failed, using fallback repo data. Reason:', lastError);
      return NextResponse.json({ success: true, data: fallbackData });
    }

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(aiResult.category)) {
      aiResult.category = fallbackData.category;
    }

    // Ensure technologies is an array of clean strings
    let techArray = Array.isArray(aiResult.technologies) ? aiResult.technologies : fallbackData.technologies;
    techArray = techArray.filter((t) => typeof t === 'string' && t.trim().length > 0).slice(0, 8);

    const finalData = {
      name: (aiResult.name || fallbackData.name).trim(),
      category: aiResult.category || fallbackData.category,
      shortDescription: (aiResult.shortDescription || fallbackData.shortDescription).trim(),
      description: (aiResult.description || fallbackData.description).trim(),
      technologies: techArray.length > 0 ? techArray : fallbackData.technologies,
      githubUrl: repoData.html_url || githubUrl.trim(),
      liveUrl: (aiResult.liveUrl || repoData.homepage || '').trim(),
      imageUrl: (aiResult.imageUrl || candidateImageUrl || '').trim(),
    };

    return NextResponse.json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    console.error('Error in /api/extract-github-project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during GitHub extraction' },
      { status: 500 }
    );
  }
}
