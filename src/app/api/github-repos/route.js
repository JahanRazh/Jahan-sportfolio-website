import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get('username') || 'JahanRazh').trim();

    if (!username) {
      return NextResponse.json(
        { error: 'GitHub username is required.' },
        { status: 400 }
      );
    }

    const ghUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=50`;
    const res = await fetch(ghUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-App',
      },
      next: { revalidate: 60 }, // cache for 60 seconds
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${username}" was not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: status ${res.status}` },
        { status: res.status }
      );
    }

    const repos = await res.json();

    if (!Array.isArray(repos)) {
      return NextResponse.json(
        { error: 'Invalid response from GitHub.' },
        { status: 500 }
      );
    }

    const formattedRepos = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      htmlUrl: r.html_url,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      homepage: r.homepage || '',
      topics: r.topics || [],
      updatedAt: r.updated_at,
      isFork: r.fork,
    }));

    return NextResponse.json({
      success: true,
      username,
      repos: formattedRepos,
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories from GitHub.' },
      { status: 500 }
    );
  }
}
