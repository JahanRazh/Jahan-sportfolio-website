import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Projects from '../components/Projects';
import Skills from '../components/Skills';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen relative flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Hero />
        <About />
        <Services />
        <Projects />
        <Skills />
        <Contact />
      </div>
      <Footer />
    </main>
  );
}
