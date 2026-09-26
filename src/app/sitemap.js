export default function sitemap() {
  const baseUrl = 'https://jahanrazh.vercel.app';
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
