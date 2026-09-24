export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/dashboard', '/admin/login'],
      },
    ],
    sitemap: 'https://jahanrazh.github.io/Jahan-sportfolio-website/sitemap.xml',
  };
}
