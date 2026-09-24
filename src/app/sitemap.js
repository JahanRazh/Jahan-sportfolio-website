export default function sitemap() {
  const baseUrl = 'https://jahanrazh.github.io/Jahan-sportfolio-website';
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
