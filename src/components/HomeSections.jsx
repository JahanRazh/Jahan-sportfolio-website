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
  DEFAULT_SECTION_ORDER,
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

  const sectionComponents = {
    hero: <Hero initialProfile={initialProfile} />,
    about: <About initialProfile={initialProfile} />,
    services: <Services />,
    projects: <Projects />,
    skills: <Skills />,
    experience: <ExperienceEducation />,
    publications: <ResearchPublications />,
    certificates: <Certificates />,
    contact: <Contact initialProfile={initialProfile} />,
  };

  const order = visibility.sectionOrder || DEFAULT_SECTION_ORDER;

  return (
    <div className="flex-1">
      {order.map((sectionKey) => {
        if (visibility[sectionKey] === false) return null;
        const component = sectionComponents[sectionKey];
        if (!component) return null;
        return (
          <React.Fragment key={sectionKey}>
            {component}
          </React.Fragment>
        );
      })}
    </div>
  );
}
