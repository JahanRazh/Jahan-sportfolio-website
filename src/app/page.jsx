import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Projects from '../components/Projects';
import Skills from '../components/Skills';
import ExperienceEducation from '../components/ExperienceEducation';
import Certificates from '../components/Certificates';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import VisitorTracker from '../components/VisitorTracker';
import { getProfileData } from '../lib/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const profile = await getProfileData();

  return (
    <main className="min-h-screen relative flex flex-col">
      <VisitorTracker />
      <Navbar />
      <div className="flex-1">
        <Hero initialProfile={profile} />
        <About initialProfile={profile} />
        <Services />
        <Projects />
        <Skills />
        <ExperienceEducation />
        <Certificates />
        <Contact initialProfile={profile} />
      </div>
      <Footer />
    </main>
  );
}
