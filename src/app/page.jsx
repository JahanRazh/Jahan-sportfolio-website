import Navbar from '../components/Navbar';
import HomeSections from '../components/HomeSections';
import Footer from '../components/Footer';
import VisitorTracker from '../components/VisitorTracker';
import { getProfileData, getSectionVisibility } from '../lib/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [profile, visibility] = await Promise.all([
    getProfileData(),
    getSectionVisibility(),
  ]);

  return (
    <main className="min-h-screen relative flex flex-col">
      <VisitorTracker />
      <Navbar initialVisibility={visibility} />
      <HomeSections initialProfile={profile} initialVisibility={visibility} />
      <Footer />
    </main>
  );
}
