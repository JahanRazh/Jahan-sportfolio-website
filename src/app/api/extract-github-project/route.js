import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

const CANDIDATE_HOMEPAGE_PATHS = [
  // App router (Next.js)
  { path: 'src/app/page.tsx', score: 100 },
  { path: 'src/app/page.jsx', score: 100 },
  { path: 'src/app/page.js', score: 100 },
  { path: 'app/page.tsx', score: 100 },
  { path: 'app/page.jsx', score: 100 },
  { path: 'app/page.js', score: 100 },
  // Route groups (Next.js)
  { path: 'app/(marketing)/page.tsx', score: 95 },
  { path: 'app/(marketing)/page.jsx', score: 95 },
  { path: 'app/(site)/page.tsx', score: 95 },
  { path: 'app/(site)/page.jsx', score: 95 },
  { path: 'app/(root)/page.tsx', score: 95 },
  { path: 'app/(root)/page.jsx', score: 95 },
  { path: 'src/app/(marketing)/page.tsx', score: 95 },
  { path: 'src/app/(site)/page.tsx', score: 95 },
  // Pages router (Next.js)
  { path: 'src/pages/index.tsx', score: 90 },
  { path: 'src/pages/index.jsx', score: 90 },
  { path: 'src/pages/index.js', score: 90 },
  { path: 'pages/index.tsx', score: 90 },
  { path: 'pages/index.jsx', score: 90 },
  { path: 'pages/index.js', score: 90 },
  // React / Vite / CRA
  { path: 'src/App.tsx', score: 85 },
  { path: 'src/App.jsx', score: 85 },
  { path: 'src/App.vue', score: 85 },
  { path: 'src/App.js', score: 85 },
  { path: 'App.tsx', score: 85 },
  { path: 'App.jsx', score: 85 },
  { path: 'App.js', score: 85 },
  { path: 'src/main.jsx', score: 82 },
  { path: 'src/main.tsx', score: 82 },
  // Key Hero / Landing Components
  { path: 'src/components/Hero.tsx', score: 80 },
  { path: 'src/components/Hero.jsx', score: 80 },
  { path: 'src/components/Landing.tsx', score: 80 },
  { path: 'src/components/Landing.jsx', score: 80 },
  { path: 'src/components/Home.tsx', score: 80 },
  { path: 'src/components/Home.jsx', score: 80 },
  { path: 'components/Hero.tsx', score: 80 },
  { path: 'components/Hero.jsx', score: 80 },
  // HTML & Static
  { path: 'index.html', score: 75 },
  { path: 'public/index.html', score: 75 },
  { path: 'templates/index.html', score: 70 },
  { path: 'templates/home.html', score: 70 },
  // Python / Streamlit / Flask
  { path: 'streamlit_app.py', score: 65 },
  { path: 'app.py', score: 65 },
  { path: 'main.py', score: 65 },
  // Mobile
  { path: 'lib/main.dart', score: 60 }
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

function sanitizeSvgString(svg) {
  if (!svg) return '';
  // Ensure XML entity escaping for ampersands outside of entities
  let cleaned = svg.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');
  // Ensure explicit dimensions if missing
  if (!cleaned.includes('width=') || !cleaned.includes('height=')) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg width="1200" height="750" ');
  }
  return cleaned;
}

function createFallbackMockupSvg({ name, category, shortDescription, technologies }) {
  const brandName = (name || 'Project Application').replace(/&/g, '&amp;');
  const cat = (category || 'Web Application').replace(/&/g, '&amp;');
  const desc = (shortDescription || 'Modern high-performance web application designed with modular architecture.').replace(/&/g, '&amp;');
  const techList = Array.isArray(technologies) && technologies.length > 0
    ? technologies.slice(0, 3).map((t) => String(t).replace(/&/g, '&amp;'))
    : ['Next.js', 'React', 'Tailwind CSS'];

  const t1 = techList[0] || 'Modern Architecture';
  const t2 = techList[1] || 'Realtime Performance';
  const t3 = techList[2] || 'Cloud Deployment';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750" font-family="system-ui, -apple-system, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070c18"/>
      <stop offset="50%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00c9ff"/>
      <stop offset="100%" stop-color="#92fe9d"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6e57e0"/>
      <stop offset="100%" stop-color="#12f7ff"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131e36" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0c1424" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
    </filter>
  </defs>

  <rect width="1200" height="750" fill="url(#bg)"/>
  <circle cx="200" cy="180" r="160" fill="#6e57e0" opacity="0.15" filter="url(#glow)"/>
  <circle cx="1000" cy="350" r="180" fill="#12f7ff" opacity="0.12" filter="url(#glow)"/>

  <!-- macOS Window Frame Header -->
  <rect width="1200" height="52" fill="#0c121e" stroke="#1e293b" stroke-width="1"/>
  <circle cx="30" cy="26" r="6.5" fill="#ef4444"/>
  <circle cx="50" cy="26" r="6.5" fill="#f59e0b"/>
  <circle cx="70" cy="26" r="6.5" fill="#10b981"/>

  <!-- Address Bar Pill -->
  <rect x="360" y="13" width="480" height="26" rx="8" fill="#070c18" stroke="#1e293b" stroke-width="1"/>
  <path d="M 378 26 L 378 23 C 378 21.3 379.3 20 381 20 C 382.7 20 384 21.3 384 23 L 384 26 M 376 26 L 386 26 L 386 31 L 376 31 Z" stroke="#64748b" stroke-width="1.2" fill="none"/>
  <text x="400" y="30" font-size="11.5" fill="#94a3b8" letter-spacing="0.4">https://${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.app</text>

  <!-- Navbar inside Mockup -->
  <g transform="translate(0, 52)">
    <g transform="translate(48, 20)">
      <rect width="36" height="36" rx="10" fill="url(#accent)"/>
      <text x="18" y="24" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${brandName.charAt(0).toUpperCase()}</text>
      <text x="50" y="24" font-size="18" font-weight="bold" fill="#ffffff">${brandName}</text>
    </g>

    <g transform="translate(760, 32)" font-size="14" fill="#94a3b8">
      <text x="0" y="0">Overview</text>
      <text x="90" y="0">Features</text>
      <text x="180" y="0">Tech Stack</text>
    </g>

    <g transform="translate(1010, 20)">
      <rect width="140" height="36" rx="10" fill="url(#primary)"/>
      <text x="70" y="23" font-size="13" font-weight="bold" fill="#050811" text-anchor="middle">Live Demo</text>
    </g>
  </g>

  <line x1="0" y1="124" x2="1200" y2="124" stroke="#1e293b" stroke-opacity="0.8"/>

  <!-- Hero Section -->
  <g transform="translate(0, 160)">
    <g transform="translate(470, 0)">
      <rect width="260" height="30" rx="15" fill="#6e57e0" fill-opacity="0.15" stroke="#6e57e0" stroke-opacity="0.4"/>
      <text x="130" y="19" font-size="12" font-weight="600" fill="#12f7ff" text-anchor="middle">✨ ${cat}</text>
    </g>

    <text x="600" y="90" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="-1">${brandName}</text>
    <text x="600" y="145" font-size="17" fill="#94a3b8" text-anchor="middle">${desc.substring(0, 85)}</text>

    <g transform="translate(475, 185)">
      <rect width="120" height="42" rx="10" fill="url(#accent)"/>
      <text x="60" y="26" font-size="13.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Launch App</text>
      <g transform="translate(136, 0)">
        <rect width="115" height="42" rx="10" fill="#10192e" stroke="#334155" stroke-width="1"/>
        <text x="57" y="26" font-size="13.5" font-weight="600" fill="#cbd5e1" text-anchor="middle">GitHub Code</text>
      </g>
    </g>

    <!-- 3 Glassmorphic Feature Cards -->
    <g transform="translate(70, 275)">
      <g transform="translate(0, 0)">
        <rect width="330" height="150" rx="16" fill="url(#card)" stroke="#1e293b" stroke-width="1.2"/>
        <circle cx="48" cy="46" r="20" fill="#12f7ff" fill-opacity="0.15"/>
        <text x="48" y="52" font-size="16" fill="#12f7ff" text-anchor="middle">⚡</text>
        <text x="80" y="52" font-size="16" font-weight="700" fill="#ffffff">${t1}</text>
        <text x="32" y="92" font-size="13" fill="#94a3b8">Modular component architecture with</text>
        <text x="32" y="112" font-size="13" fill="#94a3b8">optimized state rendering.</text>
      </g>

      <g transform="translate(365, 0)">
        <rect width="330" height="150" rx="16" fill="url(#card)" stroke="#1e293b" stroke-width="1.2"/>
        <circle cx="48" cy="46" r="20" fill="#6e57e0" fill-opacity="0.15"/>
        <text x="48" y="52" font-size="16" fill="#6e57e0" text-anchor="middle">🛡️</text>
        <text x="80" y="52" font-size="16" font-weight="700" fill="#ffffff">${t2}</text>
        <text x="32" y="92" font-size="13" fill="#94a3b8">High-throughput data flow with safe</text>
        <text x="32" y="112" font-size="13" fill="#94a3b8">error boundaries and audit logs.</text>
      </g>

      <g transform="translate(730, 0)">
        <rect width="330" height="150" rx="16" fill="url(#card)" stroke="#1e293b" stroke-width="1.2"/>
        <circle cx="48" cy="46" r="20" fill="#10b981" fill-opacity="0.15"/>
        <text x="48" y="52" font-size="16" fill="#10b981" text-anchor="middle">🚀</text>
        <text x="80" y="52" font-size="16" font-weight="700" fill="#ffffff">${t3}</text>
        <text x="32" y="92" font-size="13" fill="#94a3b8">Production-ready build artifacts</text>
        <text x="32" y="112" font-size="13" fill="#94a3b8">ready for zero-downtime deployment.</text>
      </g>
    </g>
  </g>
</svg>`;
}

async function uploadUrlToCloudinary(remoteUrl) {
  const creds = getCloudinaryCredentials();
  if (!creds || !remoteUrl) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'portfolio-projects';
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
    console.warn('Failed to rehost remote image to Cloudinary:', err.message);
  }
  return null;
}

async function uploadSvgToCloudinary(svgString, fallbackMeta = {}) {
  const creds = getCloudinaryCredentials();
  const sanitized = sanitizeSvgString(svgString);

  // Helper to attempt upload
  async function attemptUpload(content) {
    if (!creds) return null;
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'portfolio-projects';
    const paramsToSign = `access_mode=public&folder=${folder}&timestamp=${timestamp}${creds.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const dataUri = `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;

    const fd = new FormData();
    fd.append('file', dataUri);
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
      // Return .png transformation for universal browser rendering
      return data.secure_url.replace(/\.svg$/i, '.png');
    }
    return null;
  }

  // Attempt 1: Upload sanitized SVG
  if (sanitized) {
    const url = await attemptUpload(sanitized);
    if (url) return url;
  }

  // Attempt 2: If rejected by Cloudinary, use guaranteed valid template mockup
  const guaranteedSvg = createFallbackMockupSvg(fallbackMeta);
  const guaranteedUrl = await attemptUpload(guaranteedSvg);
  if (guaranteedUrl) return guaranteedUrl;

  // Ultimate fallback: valid base64 data URI
  return `data:image/svg+xml;base64,${Buffer.from(guaranteedSvg).toString('base64')}`;
}

async function findHomepageFile(owner, repo, defaultBranch = 'main') {
  // 1. Try Git tree API for repository structure
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          'User-Agent': 'Portfolio-App',
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (treeRes.ok) {
      const data = await treeRes.json();
      if (Array.isArray(data.tree)) {
        const filePaths = data.tree.filter((i) => i.type === 'blob').map((i) => i.path);

        // Check defined candidate list in priority order
        for (const candidate of CANDIDATE_HOMEPAGE_PATHS) {
          const matched = filePaths.find((p) => p.toLowerCase() === candidate.path.toLowerCase());
          if (matched) return matched;
        }

        // Fuzzy match: page or App entry point
        const pageMatch = filePaths.find((p) => /(^|\/)page\.(tsx|jsx|js|vue)$/i.test(p));
        if (pageMatch) return pageMatch;

        const appMatch = filePaths.find((p) => /(^|\/)App\.(tsx|jsx|js|vue)$/i.test(p));
        if (appMatch) return appMatch;

        const indexMatch = filePaths.find((p) => /(^|\/)index\.(html|tsx|jsx)$/i.test(p));
        if (indexMatch) return indexMatch;
      }
    }
  } catch (err) {
    console.warn('Git tree fetch error:', err.message);
  }

  // 2. Direct probe fallback for top candidates
  for (const candidate of CANDIDATE_HOMEPAGE_PATHS.slice(0, 10)) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${candidate.path}`;
      const res = await fetch(rawUrl, { method: 'HEAD', headers: { 'User-Agent': 'Portfolio-App' } });
      if (res.ok) return candidate.path;
    } catch {}
  }

  return null;
}

async function fetchHomepageCode(owner, repo, defaultBranch, filePath) {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`;
    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Portfolio-App' },
    });
    if (!res.ok) return '';
    let code = await res.text();

    // If file is short (< 800 chars) and imports a Hero/Landing/Navbar component, try fetching that too
    if (code.length < 800) {
      const importMatch = code.match(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/);
      if (
        importMatch &&
        (importMatch[1].toLowerCase().includes('hero') ||
          importMatch[1].toLowerCase().includes('home') ||
          importMatch[1].toLowerCase().includes('landing') ||
          importMatch[1].toLowerCase().includes('navbar'))
      ) {
        let compRel = importMatch[2].replace(/^@\//, 'src/').replace(/^\.\//, '');
        if (!compRel.includes('.')) {
          compRel += filePath.endsWith('.tsx') ? '.tsx' : '.jsx';
        }
        try {
          const compUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${compRel}`;
          const compRes = await fetch(compUrl, { headers: { 'User-Agent': 'Portfolio-App' } });
          if (compRes.ok) {
            const compCode = await compRes.text();
            code += `\n\n// Linked Component (${importMatch[1]}):\n` + compCode.substring(0, 3000);
          }
        } catch {}
      }
    }

    return code.substring(0, 7500);
  } catch (err) {
    console.warn(`Failed to fetch source code for ${filePath}:`, err.message);
    return '';
  }
}

async function generateAiVisualPreview({
  repoName,
  description,
  homepageCode,
  filePath,
  technologies,
  topics,
}) {
  const prompt = `You are a world-class UI/UX designer and SVG visual artist.
Analyze the provided frontend homepage source code (JSX / HTML / Tailwind / CSS) and repository details to synthesize a realistic, high-fidelity visual preview mockup of this project's user interface as a standalone SVG graphic.

Project Details:
- Project Name: ${repoName}
- Description: ${description || 'Modern web application'}
- Technologies: ${(technologies || []).join(', ') || 'React, Tailwind CSS'}
- Source File: ${filePath || 'Homepage UI'}
- Topics: ${(topics || []).join(', ') || 'None'}

Homepage Source Code (JSX / HTML / Tailwind / CSS):
"""
${(homepageCode || '').substring(0, 7000)}
"""

Design & SVG Mockup Specifications:
1. Output format: A complete, self-contained SVG graphic starting with <svg and ending with </svg>.
2. Dimensions & ViewBox: width="1200" height="750" viewBox="0 0 1200 750"
3. Layout Structure:
   - Outer Container: Realistic macOS/modern dark browser window frame (background #0B0F19 or #0F172A) with rounded corners (rx="16") and subtle drop shadow.
   - Titlebar:
     - Window control circles: Red (#EF4444), Yellow (#F59E0B), Green (#10B981) at top-left.
     - Centered address bar pill showing: "https://${repoName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.app" with a small lock icon.
   - App Navigation Bar:
     - Project Brand logo icon + bold title matching the repo or brand name in the code.
     - 3-4 navigation links reflecting the pages/links in the source code.
     - Modern CTA button with gradient styling.
   - Hero Section:
     - Pill badge with sparkles or icon (matching the category or tagline).
     - Bold multi-line headline text extracted directly from the homepage code.
     - Tagline / subtitle text matching the code.
     - Primary gradient action button + secondary ghost button.
   - Feature Cards / UI Grid:
     - 2 to 3 modern glassmorphic cards depicting the exact features, components, or stats described in the JSX/HTML code.
     - Card icons (geometric SVG paths), card titles, and concise descriptions.
   - Theme & Aesthetic:
     - Modern dark theme. Use the color palette found in the code's Tailwind classes (e.g. cyan, violet, indigo, emerald, blue, or slate).
     - Rich linear gradients (<linearGradient>) and subtle glow filters in <defs>.
     - Font family: font-family="system-ui, -apple-system, sans-serif".
4. CRITICAL RULES:
   - Output ONLY valid, standalone SVG code starting with <svg and ending with </svg>.
   - XML escaping: Any ampersand inside text MUST be written as &amp; (never standalone &).
   - Do NOT wrap in markdown codeblocks (\`\`\`xml or \`\`\`svg).
   - Do NOT include any explanations or conversational text.
   - Ensure all tags are strictly closed.`;

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
            },
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawText = data.candidates[0].content.parts[0].text;
        const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
          return sanitizeSvgString(svgMatch[0].trim());
        }
      }
    } catch (err) {
      console.warn(`Model ${model} failed for SVG generation:`, err.message);
    }
  }

  return null;
}

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
    const { githubUrl, forceAiPreview = false } = body;

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

    // 3. Extract candidate image URLs from README and test if valid & reachable
    const extractedImages = extractImagesFromMarkdown(readmeText, owner, repo, defaultBranch);
    let validReadmeImageUrl = '';

    // Rehost valid README image to Cloudinary so it becomes a permanent, reliable asset (no expiring tokens)
    if (!forceAiPreview && extractedImages.length > 0) {
      for (const candidate of extractedImages.slice(0, 3)) {
        try {
          const testRes = await fetch(candidate, { method: 'HEAD', headers: { 'User-Agent': 'Portfolio-App' } });
          if (testRes.ok) {
            const rehosted = await uploadUrlToCloudinary(candidate);
            if (rehosted) {
              validReadmeImageUrl = rehosted;
              break;
            }
          }
        } catch {
          // try next candidate
        }
      }
    }

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
      imageUrl: validReadmeImageUrl,
    };

    let finalData = { ...fallbackData };

    // 5. Intelligent AI extraction using Gemini
    if (GEMINI_API_KEY) {
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
  "imageUrl": "${validReadmeImageUrl ? validReadmeImageUrl : ''}"
}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown codeblocks (\`\`\`json) or any conversational text.`;

      let aiResult = null;

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
          }
        } catch (err) {
          // try next model
        }
      }

      if (aiResult) {
        // Validate category
        const category = ALLOWED_CATEGORIES.includes(aiResult.category)
          ? aiResult.category
          : fallbackData.category;

        // Ensure technologies is an array of clean strings
        let techArray = Array.isArray(aiResult.technologies)
          ? aiResult.technologies
          : fallbackData.technologies;
        techArray = techArray.filter((t) => typeof t === 'string' && t.trim().length > 0).slice(0, 8);

        finalData = {
          name: (aiResult.name || fallbackData.name).trim(),
          category,
          shortDescription: (aiResult.shortDescription || fallbackData.shortDescription).trim(),
          description: (aiResult.description || fallbackData.description).trim(),
          technologies: techArray.length > 0 ? techArray : fallbackData.technologies,
          githubUrl: repoData.html_url || githubUrl.trim(),
          liveUrl: (aiResult.liveUrl || repoData.homepage || '').trim(),
          imageUrl: validReadmeImageUrl || (aiResult.imageUrl && aiResult.imageUrl.startsWith('https://res.cloudinary.com') ? aiResult.imageUrl : ''),
        };
      }
    }

    // 6. Automatic or Forced Visual Preview Generation:
    // If no valid permanent screenshot exists from README OR user explicitly forced AI preview generation,
    // read the frontend homepage source code and synthesize a high-fidelity UI mockup SVG/PNG
    const shouldGeneratePreview = forceAiPreview || !finalData.imageUrl;

    if (shouldGeneratePreview) {
      try {
        const homepagePath = await findHomepageFile(owner, repo, defaultBranch);
        let homepageCode = '';
        if (homepagePath) {
          homepageCode = await fetchHomepageCode(owner, repo, defaultBranch, homepagePath);
        }

        let generatedSvg = null;
        if (GEMINI_API_KEY) {
          generatedSvg = await generateAiVisualPreview({
            repoName: finalData.name,
            description: finalData.shortDescription || finalData.description,
            homepageCode,
            filePath: homepagePath,
            technologies: finalData.technologies,
            topics: repoData.topics || [],
          });
        }

        // Upload SVG or guaranteed fallback mockup to Cloudinary as permanent PNG
        const hostedUrl = await uploadSvgToCloudinary(generatedSvg, finalData);
        if (hostedUrl) {
          finalData.imageUrl = hostedUrl;
          finalData.isAiGeneratedPreview = true;
          finalData.aiPreviewSourceFile = homepagePath || 'Repository Overview';
        }
      } catch (previewErr) {
        console.warn('AI UI preview generation error:', previewErr);
        // Fallback to guaranteed template mockup if anything went wrong
        const fallbackUrl = await uploadSvgToCloudinary(null, finalData);
        if (fallbackUrl) {
          finalData.imageUrl = fallbackUrl;
          finalData.isAiGeneratedPreview = true;
        }
      }
    }

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
