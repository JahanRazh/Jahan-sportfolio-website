import './globals.css';
import { ThemeProvider } from '../components/ThemeToggle';
import { ToastProvider } from '../components/Toast';

const SITE_URL = 'https://jahanrazh.vercel.app';
const PROFILE_IMAGE = 'https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ramesh Jahan Jayalath | Jahan Jayalath | IT Professional & Software Developer',
  description:
    'Official portfolio of Ramesh Jahan Jayalath (also known as Jahan Jayalath, Jahan Ramesh, or Jahan Razh). Software engineer and IT professional specializing in full-stack web and mobile application development.',
  keywords: [
    'Ramesh Jahan Jayalath',
    'Jahan Jayalath',
    'Jahan',
    'Jahan Ramesh',
    'Jahan Razh',
    'Jahan Jayalath portfolio',
    'Ramesh Jahan Jayalath portfolio',
    'Jahan Razh portfolio',
    'Jahan software engineer',
    'Jahan IT professional',
    'Software Engineer SLIIT',
    'Full Stack Developer Sri Lanka',
    'Web Developer',
    'React',
    'Next.js',
    'Flutter',
    'Java',
    'Python',
  ],
  authors: [{ name: 'Ramesh Jahan Jayalath', url: SITE_URL }],
  creator: 'Ramesh Jahan Jayalath',
  publisher: 'Ramesh Jahan Jayalath',
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Ramesh Jahan Jayalath | Jahan Jayalath | IT Professional & Software Developer',
    description:
      'Official portfolio of Ramesh Jahan Jayalath (also known as Jahan Jayalath, Jahan Ramesh, or Jahan Razh). Software engineer and IT professional specializing in full-stack web and mobile application development.',
    url: SITE_URL,
    siteName: 'Ramesh Jahan Jayalath Portfolio',
    images: [
      {
        url: PROFILE_IMAGE,
        width: 800,
        height: 800,
        alt: 'Ramesh Jahan Jayalath - IT professional and software developer',
      },
    ],
    locale: 'en_US',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ramesh Jahan Jayalath | Jahan Jayalath | IT Professional & Software Developer',
    description:
      'Official portfolio of Ramesh Jahan Jayalath (also known as Jahan Jayalath, Jahan Ramesh, or Jahan Razh). Software engineer and IT professional.',
    images: [PROFILE_IMAGE],
    creator: '@jahan3165',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: PROFILE_IMAGE,
    apple: PROFILE_IMAGE,
  },
};

export const viewport = {
  themeColor: '#0a0e17',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}#person`,
      name: 'Ramesh Jahan Jayalath',
      alternateName: [
        'Jahan Jayalath',
        'Jahan Ramesh',
        'Jahan Razh',
        'Jahan',
      ],
      url: SITE_URL,
      image: PROFILE_IMAGE,
      jobTitle: 'Software Engineer & IT Professional',
      description:
        'Software Engineer undergraduate student at SLIIT University and IT professional skilled in full stack web development, mobile applications, and scalable software solutions.',
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'Sri Lanka Institute of Information Technology',
        alternateName: 'SLIIT',
        url: 'https://www.sliit.lk',
      },
      sameAs: [
        'https://github.com/JahanRazh',
        'https://www.linkedin.com/in/jahanrazh',
        'https://fb.com/rjahan.razh',
        'https://www.instagram.com/_jahan_razh_',
        'https://youtube.com/channel/UC_4OKBZ0RYHTDxKYHwFFojw',
        'https://stackoverflow.com/users/jahan-ramesh',
        'https://www.hackerrank.com/jahanrazh',
        'https://discord.gg/jahanramesh',
      ],
      knowsAbout: [
        'Software Engineering',
        'Full Stack Web Development',
        'React',
        'Next.js',
        'Node.js',
        'Java',
        'Python',
        'C++',
        'Mobile App Development',
        'Database Management',
        'Cloud Computing',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'Ramesh Jahan Jayalath Portfolio',
      alternateName: [
        'Jahan Jayalath Portfolio',
        'Ramesh Jahan Jayalath',
        'Jahan Razh Portfolio',
        'Jahan Ramesh Portfolio',
      ],
      description:
        'Official portfolio of Ramesh Jahan Jayalath (Jahan Jayalath / Jahan Razh) - Software Engineer and IT Professional.',
      publisher: {
        '@id': `${SITE_URL}#person`,
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'ProfilePage',
      '@id': `${SITE_URL}#webpage`,
      url: SITE_URL,
      name: 'Ramesh Jahan Jayalath | Jahan Jayalath | IT Professional & Software Developer',
      isPartOf: {
        '@id': `${SITE_URL}#website`,
      },
      about: {
        '@id': `${SITE_URL}#person`,
      },
      mainEntity: {
        '@id': `${SITE_URL}#person`,
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-[#6e57e0] selection:text-white" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
