'use client';

import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Projects from './Projects';
import Skills from './Skills';
import ExperienceEducation from './ExperienceEducation';
import ResearchPublications from './ResearchPublications';
import Certificates from './Certificates';
import Contact from './Contact';
import {
  subscribeToSectionVisibility,
  getCachedSectionVisibility,
  DEFAULT_SECTION_VISIBILITY,
} from '../lib/firestore';

export default function HomeSections({ initialProfile, initialVisibility }) {
  const [visibility, setVisibility] = useState(
    initialVisibility || getCachedSectionVisibility() || DEFAULT_SECTION_VISIBILITY
  );

  useEffect(() => {
    const unsub = subscribeToSectionVisibility((data) => {
      if (data) setVisibility(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex-1">
      {visibility.hero !== false && <Hero initialProfile={initialProfile} />}
      {visibility.about !== false && <About initialProfile={initialProfile} />}
      {visibility.services !== false && <Services />}
      {visibility.projects !== false && <Projects />}
      {visibility.skills !== false && <Skills />}
      {visibility.experience !== false && <ExperienceEducation />}
      {visibility.publications !== false && <ResearchPublications />}
      {visibility.certificates !== false && <Certificates />}
      {visibility.contact !== false && <Contact initialProfile={initialProfile} />}
    </div>
  );
}
