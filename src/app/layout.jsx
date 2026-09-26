import './globals.css';
import { ThemeProvider } from '../components/ThemeToggle';
import { ToastProvider } from '../components/Toast';

export const metadata = {
  metadataBase: new URL('https://jahanrazh.github.io'),
  title: 'Jahan Ramesh | Software Engineer Portfolio',
  description:
    'Software Engineer undergraduate student at SLIIT University. Full Stack Web Developer (MERN Stack), Flutter Mobile App Developer, and UI/UX Designer.',
  keywords: [
    'Jahan Ramesh',
    'Software Engineer',
    'Full Stack Developer',
    'MERN Stack',
    'Flutter Developer',
    'React',
    'Next.js',
    'Portfolio',
    'SLIIT',
  ],
  authors: [{ name: 'Jahan Ramesh' }],
  creator: 'Jahan Ramesh',
  openGraph: {
    title: 'Jahan Ramesh | Software Engineer Portfolio',
    description:
      'Explore projects, skills, and experience in Full Stack Web & Mobile Application Development.',
    url: 'https://jahanrazh.github.io/Jahan-sportfolio-website/',
    siteName: "Jahan's Portfolio",
    images: [
      {
        url: 'https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg',
        width: 800,
        height: 800,
        alt: 'Jahan Ramesh',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jahan Ramesh | Software Engineer Portfolio',
    description:
      'Software Engineer undergraduate student at SLIIT University. Passionate about coding and modern digital solutions.',
    images: ['https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg'],
    creator: '@jahan3165',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: 'https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg',
    apple: 'https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg',
  },
};

export const viewport = {
  themeColor: '#0a0e17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased min-h-screen selection:bg-[#6e57e0] selection:text-white">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
