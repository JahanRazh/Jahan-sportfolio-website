import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  increment,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { INITIAL_PROJECTS } from './initialProjects';

const PROJECTS_COLLECTION = 'projects';

/**
 * Fetch all published projects for the public portfolio
 */
export async function getPublishedProjects() {
  if (!isFirebaseConfigured || !db) {
    return INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('published', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // If Firestore is empty, return default projects so site is beautiful right away
      return INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    const projects = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return projects.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Firestore fetch notice (using fallback):', error.message);
    return INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

/**
 * Subscribe to published projects in real-time for the public portfolio site
 */
export function subscribeToPublishedProjects(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }

  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('published', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
          return;
        }
        const projects = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        projects.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(projects);
      },
      (error) => {
        console.warn('Published projects realtime error:', error);
        callback(INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    );
  } catch (err) {
    console.error('Failed to set up published projects listener:', err);
    callback(INITIAL_PROJECTS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }
}

/**
 * Subscribe to all projects in real-time for the admin dashboard
 */
export function subscribeToAllProjects(callback, onError) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_PROJECTS);
    return () => {};
  }

  try {
    const q = query(collection(db, PROJECTS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_PROJECTS);
          return;
        }
        const projects = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        projects.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(projects);
      },
      (error) => {
        console.warn('Realtime subscription error:', error);
        if (onError) onError(error);
        callback(INITIAL_PROJECTS);
      }
    );
  } catch (err) {
    console.error('Failed to set up realtime listener:', err);
    callback(INITIAL_PROJECTS);
    return () => {};
  }
}

/**
 * Create a new project document
 */
export async function createProject(projectData) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    name: projectData.name || '',
    category: projectData.category || 'Web Application',
    shortDescription: projectData.shortDescription || '',
    description: projectData.description || '',
    technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
    imageUrl: projectData.imageUrl || '',
    imagePath: projectData.imagePath || '',
    imageAlt: projectData.imageAlt || projectData.name || 'Project image',
    githubUrl: projectData.githubUrl || '',
    liveUrl: projectData.liveUrl || '',
    featured: Boolean(projectData.featured),
    published: projectData.published !== undefined ? Boolean(projectData.published) : true,
    order: Number(projectData.order) || 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore Permission Denied: Please update and publish your Firestore Security Rules in Firebase Console to allow writes.'
      );
    }
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id, projectData) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PROJECTS_COLLECTION, id);

  const cleanData = {
    ...projectData,
    order: Number(projectData.order) || 1,
    featured: Boolean(projectData.featured),
    published: Boolean(projectData.published),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  try {
    await setDoc(docRef, cleanData, { merge: true });
    return { id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore Permission Denied: Please update and publish your Firestore Security Rules in Firebase Console to allow writes.'
      );
    }
    throw error;
  }
}

/**
 * Delete a project document
 */
export async function deleteProject(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore Permission Denied: Please update and publish your Firestore Security Rules in Firebase Console to allow writes.'
      );
    }
    throw error;
  }
}

/**
 * Seed initial projects into Firestore if empty
 */
export async function seedInitialProjects() {
  if (!db) throw new Error('Firestore is not initialized.');
  
  try {
    for (const project of INITIAL_PROJECTS) {
      const docRef = doc(db, PROJECTS_COLLECTION, project.id);
      const dataToSave = {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      delete dataToSave.id;
      await setDoc(docRef, dataToSave, { merge: true });
    }
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore Permission Denied: Please update and publish your Firestore Security Rules in Firebase Console to allow writes.'
      );
    }
    throw error;
  }
}

// ============================================================
// CERTIFICATES
// ============================================================

const CERTIFICATES_COLLECTION = 'certificates';

/**
 * Fetch all published certificates for the public portfolio
 */
export async function getPublishedCertificates() {
  if (!isFirebaseConfigured || !db) return [];

  try {
    const q = query(
      collection(db, CERTIFICATES_COLLECTION),
      where('published', '==', true)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const certs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    return certs.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Certificates fetch error:', error.message);
    return [];
  }
}

/**
 * Subscribe to published certificates in real-time (for the public site)
 */
export function subscribeToPublishedCertificates(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, CERTIFICATES_COLLECTION),
      where('published', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const certs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        certs.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(certs);
      },
      (error) => {
        console.warn('Certificates realtime error:', error);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

/**
 * Subscribe to ALL certificates (admin panel â€” includes unpublished)
 */
export function subscribeToAllCertificates(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, CERTIFICATES_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const certs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        certs.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(certs);
      },
      (error) => {
        console.warn('Admin certificates realtime error:', error);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

/**
 * Create a new certificate document
 */
export async function createCertificate(data) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    title: data.title || '',
    issuer: data.issuer || '',
    issuedDate: data.issuedDate || '',
    expiryDate: data.expiryDate || '',
    credentialId: data.credentialId || '',
    credentialUrl: data.credentialUrl || '',
    description: data.description || '',
    category: data.category || 'General',
    fileUrl: data.fileUrl || '',
    filePath: data.filePath || '',
    fileType: data.fileType || 'image',
    thumbnailUrl: data.thumbnailUrl || '',
    isBadge: Boolean(data.isBadge),
    featured: Boolean(data.featured),
    published: data.published !== undefined ? Boolean(data.published) : true,
    order: Number(data.order) || 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, CERTIFICATES_COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Update your Firestore Security Rules to allow writes.');
    }
    throw error;
  }
}

/**
 * Create multiple certificates in a batch
 */
export async function createCertificatesBatch(certificatesList) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!Array.isArray(certificatesList) || certificatesList.length === 0) return [];

  const createdCerts = [];
  for (const cert of certificatesList) {
    const res = await createCertificate(cert);
    createdCerts.push(res);
  }
  return createdCerts;
}

/**
 * Update an existing certificate
 */
export async function updateCertificate(id, data) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, CERTIFICATES_COLLECTION, id);

  const cleanData = {
    ...data,
    order: Number(data.order) || 1,
    featured: Boolean(data.featured),
    published: Boolean(data.published),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  try {
    await setDoc(docRef, cleanData, { merge: true });
    return { id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Update your Firestore Security Rules to allow writes.');
    }
    throw error;
  }
}

/**
 * Delete a certificate document
 */
export async function deleteCertificate(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, CERTIFICATES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Update your Firestore Security Rules to allow writes.');
    }
    throw error;
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SKILLS MANAGEMENT (Technical & Professional)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const SKILLS_COLLECTION = 'skills';

export const INITIAL_TECHNICAL_SKILLS = [
  { name: 'HTML', percent: 80, type: 'technical', order: 1 },
  { name: 'Figma', percent: 90, type: 'technical', order: 2 },
  { name: 'JavaScript', percent: 70, type: 'technical', order: 3 },
  { name: 'CSS', percent: 90, type: 'technical', order: 4 },
  { name: 'PHP', percent: 70, type: 'technical', order: 5 },
  { name: 'Java', percent: 75, type: 'technical', order: 6 },
  { name: 'React', percent: 80, type: 'technical', order: 7 },
  { name: 'Nodejs', percent: 75, type: 'technical', order: 8 },
];

export const INITIAL_PROFESSIONAL_SKILLS = [
  { name: 'Team Work', percent: 90, type: 'professional', order: 1 },
  { name: 'Creativity', percent: 85, type: 'professional', order: 2 },
  { name: 'Project Management', percent: 80, type: 'professional', order: 3 },
  { name: 'Communication', percent: 83, type: 'professional', order: 4 },
];

export const ALL_INITIAL_SKILLS = [
  ...INITIAL_TECHNICAL_SKILLS,
  ...INITIAL_PROFESSIONAL_SKILLS,
];

/**
 * Fetch published skills for the public website
 */
export async function getPublishedSkills() {
  if (!isFirebaseConfigured || !db) {
    return {
      technical: INITIAL_TECHNICAL_SKILLS,
      professional: INITIAL_PROFESSIONAL_SKILLS,
    };
  }

  try {
    const q = query(collection(db, SKILLS_COLLECTION));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        technical: INITIAL_TECHNICAL_SKILLS,
        professional: INITIAL_PROFESSIONAL_SKILLS,
      };
    }

    const allSkills = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.published !== false);

    const technical = allSkills
      .filter((s) => s.type === 'technical')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const professional = allSkills
      .filter((s) => s.type === 'professional')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return { technical, professional };
  } catch (error) {
    console.warn('Skills fetch fallback notice:', error.message);
    return {
      technical: INITIAL_TECHNICAL_SKILLS,
      professional: INITIAL_PROFESSIONAL_SKILLS,
    };
  }
}

/**
 * Realtime subscription to all skills for the admin panel and public site
 */
export function subscribeToAllSkills(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(ALL_INITIAL_SKILLS);
    return () => {};
  }

  try {
    const q = query(collection(db, SKILLS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(ALL_INITIAL_SKILLS);
          return;
        }
        const skills = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        skills.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(skills);
      },
      (error) => {
        console.warn('Skills subscription error:', error);
        callback(ALL_INITIAL_SKILLS);
      }
    );
  } catch (err) {
    console.error('Failed to set up skills listener:', err);
    callback(ALL_INITIAL_SKILLS);
    return () => {};
  }
}

/**
 * Create a new skill
 */
export async function createSkill(skillData) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    name: skillData.name || '',
    percent: Math.min(100, Math.max(1, Number(skillData.percent) || 50)),
    type: skillData.type === 'professional' ? 'professional' : 'technical',
    order: Number(skillData.order) || 1,
    published: skillData.published !== undefined ? Boolean(skillData.published) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, SKILLS_COLLECTION), cleanData);
  return { id: docRef.id, ...cleanData };
}

/**
 * Update an existing skill
 */
export async function updateSkill(id, skillData) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SKILLS_COLLECTION, id);

  const cleanData = {
    ...skillData,
    percent: Math.min(100, Math.max(1, Number(skillData.percent) || 50)),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  await setDoc(docRef, cleanData, { merge: true });
  return { id, ...cleanData };
}

/**
 * Delete a skill
 */
export async function deleteSkill(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SKILLS_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
}

/**
 * Seed initial skills into Firestore if empty
 */
export async function seedInitialSkills() {
  if (!db) throw new Error('Firestore is not initialized.');

  for (const skill of ALL_INITIAL_SKILLS) {
    await addDoc(collection(db, SKILLS_COLLECTION), {
      ...skill,
      published: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABOUT ME & CV PROFILE MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const PROFILE_COLLECTION = 'profile';
const PROFILE_DOC_ID = 'main';

export const INITIAL_PROFILE = {
  // Hero / Profile section
  heroBadge: 'Software Engineer',
  heroTitles: ['Jahan', 'Full Stack Developer', 'Designer', 'Youtuber'],
  heroIntro: 'I am a Software Engineering undergraduate student at SLIIT University. Passionate about coding, software development, and continuously learning new technologies and methodologies in the field. Skilled in programming languages such as Java, Python, and C++. Experienced in web development, mobile app development, and database management.',

  // About Me section
  aboutBadge: 'SLIIT Software Engineering Undergraduate',
  title: 'About Ramesh Jahan Jayalath',
  bio: `Hello! I am Ramesh Jahan Jayalath (professionally known as Jahan Jayalath, Jahan Ramesh, or Jahan Razh). I am a Software Engineering undergraduate student at SLIIT University and a dedicated IT professional.

Passionate about coding, software development, and modern technologies, I specialize in full-stack web development, mobile application engineering, and scalable database management. Skilled in Java, Python, C++, JavaScript, React, and Next.js, I continuously build innovative, reliable, and impactful software solutions.`,
  profileImageUrl: 'https://res.cloudinary.com/dplnxifrx/image/upload/v1790421293/portfolio-profile/u07nkpxlnoijrgezkyur.jpg',
  cvUrl: '/assets/cv/Jahan_Jayalath-CV.pdf',
  cvFileName: 'Jahan_Jayalath_CV.pdf',
  cvUpdatedAt: null,
  skillStacks: [
    {
      title: 'Frontend',
      skills: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'React', 'Next.js'],
    },
    {
      title: 'Backend',
      skills: ['PHP', 'JAVA', 'Python', 'C++', 'NodeJS', 'ExpressJS'],
    },
    {
      title: 'Database',
      skills: ['MySQL', 'SQLite', 'MongoDB'],
    },
  ],

  // Direct Contact / "Find Me" section
  contactPhone: '+94 76-722 14 36',
  contactEmail: 'jahanrazh@gmail.com',
  contactWhatsapp: '+94 76 722 1436',
  findMeTitle: "Let's start a project together",
  findMeText: 'I am always open to discussing new projects, creative ideas, or opportunities to be part of your vision. Feel free to reach out anytime!',
};

/**
 * Retrieve cached profile from localStorage if available, avoiding any flash of old local image
 */
export function getCachedProfile() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('jahan_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_PROFILE,
            ...parsed,
            heroTitles: Array.isArray(parsed.heroTitles) && parsed.heroTitles.length > 0 ? parsed.heroTitles : INITIAL_PROFILE.heroTitles,
            aboutBadge: parsed.aboutBadge || INITIAL_PROFILE.aboutBadge,
            skillStacks: Array.isArray(parsed.skillStacks) && parsed.skillStacks.length > 0 ? parsed.skillStacks : INITIAL_PROFILE.skillStacks,
            contactPhone: parsed.contactPhone !== undefined ? parsed.contactPhone : INITIAL_PROFILE.contactPhone,
            contactEmail: parsed.contactEmail !== undefined ? parsed.contactEmail : INITIAL_PROFILE.contactEmail,
            contactWhatsapp: parsed.contactWhatsapp !== undefined ? parsed.contactWhatsapp : INITIAL_PROFILE.contactWhatsapp,
            findMeTitle: parsed.findMeTitle !== undefined ? parsed.findMeTitle : INITIAL_PROFILE.findMeTitle,
            findMeText: parsed.findMeText !== undefined ? parsed.findMeText : INITIAL_PROFILE.findMeText,
          };
        }
      }
    } catch (e) {
      // ignore JSON parse or storage errors
    }
  }
  return INITIAL_PROFILE;
}

/**
 * Save profile to localStorage and dispatch custom/storage event for instant reactivity across components & tabs
 */
export function saveProfileCache(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const serializable = {
      heroBadge: data.heroBadge !== undefined ? data.heroBadge : INITIAL_PROFILE.heroBadge,
      heroTitles: Array.isArray(data.heroTitles) && data.heroTitles.length > 0 ? data.heroTitles : INITIAL_PROFILE.heroTitles,
      heroIntro: data.heroIntro !== undefined ? data.heroIntro : INITIAL_PROFILE.heroIntro,
      aboutBadge: data.aboutBadge !== undefined ? data.aboutBadge : INITIAL_PROFILE.aboutBadge,
      title: data.title !== undefined ? data.title : INITIAL_PROFILE.title,
      bio: data.bio !== undefined ? data.bio : INITIAL_PROFILE.bio,
      profileImageUrl: data.profileImageUrl || INITIAL_PROFILE.profileImageUrl,
      cvUrl: data.cvUrl || INITIAL_PROFILE.cvUrl,
      cvFileName: data.cvFileName || INITIAL_PROFILE.cvFileName,
      skillStacks: Array.isArray(data.skillStacks) && data.skillStacks.length > 0 ? data.skillStacks : INITIAL_PROFILE.skillStacks,
      contactPhone: data.contactPhone !== undefined ? data.contactPhone : INITIAL_PROFILE.contactPhone,
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : INITIAL_PROFILE.contactEmail,
      contactWhatsapp: data.contactWhatsapp !== undefined ? data.contactWhatsapp : INITIAL_PROFILE.contactWhatsapp,
      findMeTitle: data.findMeTitle !== undefined ? data.findMeTitle : INITIAL_PROFILE.findMeTitle,
      findMeText: data.findMeText !== undefined ? data.findMeText : INITIAL_PROFILE.findMeText,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('jahan_profile_cache', JSON.stringify(serializable));
    window.dispatchEvent(new CustomEvent('jahan_profile_updated', { detail: serializable }));
  } catch (e) {
    console.warn('saveProfileCache warning:', e);
  }
}

/**
 * Fetch profile and CV data directly
 */
export async function getProfileData() {
  if (!isFirebaseConfigured || !db) {
    return getCachedProfile();
  }

  try {
    const docRef = doc(db, PROFILE_COLLECTION, PROFILE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return getCachedProfile();
    }
    const rawData = docSnap.data();
    // Sanitize timestamps for Next.js Server Components
    const sanitizedData = { ...rawData };
    if (sanitizedData.updatedAt && typeof sanitizedData.updatedAt.toDate === 'function') {
      sanitizedData.updatedAt = sanitizedData.updatedAt.toDate().toISOString();
    }
    if (sanitizedData.cvUpdatedAt && typeof sanitizedData.cvUpdatedAt.toDate === 'function') {
      sanitizedData.cvUpdatedAt = sanitizedData.cvUpdatedAt.toDate().toISOString();
    }
    if (sanitizedData.createdAt && typeof sanitizedData.createdAt.toDate === 'function') {
      sanitizedData.createdAt = sanitizedData.createdAt.toDate().toISOString();
    }
    const data = { ...INITIAL_PROFILE, ...sanitizedData };
    saveProfileCache(data);
    return data;
  } catch (error) {
    console.warn('Profile fetch fallback:', error.message);
    return getCachedProfile();
  }
}

/**
 * Realtime subscription to profile and CV data with instant local cache & cross-tab sync
 */
export function subscribeToProfile(callback) {
  // 1. Instantly deliver cached/Cloudinary data to eliminate initial flash
  const initial = getCachedProfile();
  callback(initial);

  if (typeof window === 'undefined') {
    return () => {};
  }

  // 2. Cross-tab instant synchronization
  const handleStorageChange = (e) => {
    if (e.key === 'jahan_profile_cache' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback({ ...INITIAL_PROFILE, ...parsed });
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // 3. Same-tab component synchronization
  const handleCustomUpdate = (e) => {
    if (e.detail) {
      callback({ ...INITIAL_PROFILE, ...e.detail });
    }
  };
  window.addEventListener('jahan_profile_updated', handleCustomUpdate);

  if (!isFirebaseConfigured || !db) {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_profile_updated', handleCustomUpdate);
    };
  }

  try {
    const docRef = doc(db, PROFILE_COLLECTION, PROFILE_DOC_ID);

    // 4. Immediate direct getDoc to guarantee freshest state without relying solely on listener initialization
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        const fresh = { ...INITIAL_PROFILE, ...snap.data() };
        saveProfileCache(fresh);
        callback(fresh);
      }
    }).catch((err) => {
      console.warn('Direct profile getDoc notice:', err);
    });

    // 5. Active realtime snapshot listener
    const unsubSnapshot = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(INITIAL_PROFILE);
          return;
        }
        const data = { ...INITIAL_PROFILE, ...docSnap.data() };
        saveProfileCache(data);
        callback(data);
      },
      (error) => {
        console.warn('Profile subscription error:', error);
      }
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_profile_updated', handleCustomUpdate);
      if (unsubSnapshot) unsubSnapshot();
    };
  } catch (err) {
    console.error('Failed to set up profile listener:', err);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_profile_updated', handleCustomUpdate);
    };
  }
}

/**
 * Save / Update Profile & CV data
 */
export async function updateProfile(profileData) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PROFILE_COLLECTION, PROFILE_DOC_ID);

  const cleanData = {};
  if (profileData.heroBadge !== undefined) {
    cleanData.heroBadge = String(profileData.heroBadge || '').trim() || INITIAL_PROFILE.heroBadge;
  }
  if (profileData.heroTitles !== undefined) {
    cleanData.heroTitles = Array.isArray(profileData.heroTitles) && profileData.heroTitles.length > 0
      ? profileData.heroTitles
      : INITIAL_PROFILE.heroTitles;
  }
  if (profileData.heroIntro !== undefined) {
    cleanData.heroIntro = String(profileData.heroIntro || '').trim() || INITIAL_PROFILE.heroIntro;
  }
  if (profileData.aboutBadge !== undefined) {
    cleanData.aboutBadge = String(profileData.aboutBadge || '').trim() || INITIAL_PROFILE.aboutBadge;
  }
  if (profileData.title !== undefined) {
    cleanData.title = String(profileData.title || '').trim() || INITIAL_PROFILE.title;
  }
  if (profileData.bio !== undefined) {
    cleanData.bio = String(profileData.bio || '').trim() || INITIAL_PROFILE.bio;
  }
  if (profileData.profileImageUrl !== undefined) {
    cleanData.profileImageUrl = profileData.profileImageUrl || INITIAL_PROFILE.profileImageUrl;
  }
  if (profileData.cvUrl !== undefined) {
    cleanData.cvUrl = profileData.cvUrl || INITIAL_PROFILE.cvUrl;
    cleanData.cvUpdatedAt = serverTimestamp();
  }
  if (profileData.cvFileName !== undefined) {
    cleanData.cvFileName = profileData.cvFileName || INITIAL_PROFILE.cvFileName;
  }
  if (profileData.skillStacks !== undefined) {
    cleanData.skillStacks = Array.isArray(profileData.skillStacks) && profileData.skillStacks.length > 0
      ? profileData.skillStacks
      : INITIAL_PROFILE.skillStacks;
  }
  if (profileData.contactPhone !== undefined) {
    cleanData.contactPhone = String(profileData.contactPhone || '').trim() || INITIAL_PROFILE.contactPhone;
  }
  if (profileData.contactEmail !== undefined) {
    cleanData.contactEmail = String(profileData.contactEmail || '').trim() || INITIAL_PROFILE.contactEmail;
  }
  if (profileData.contactWhatsapp !== undefined) {
    cleanData.contactWhatsapp = String(profileData.contactWhatsapp || '').trim() || INITIAL_PROFILE.contactWhatsapp;
  }
  if (profileData.findMeTitle !== undefined) {
    cleanData.findMeTitle = String(profileData.findMeTitle || '').trim() || INITIAL_PROFILE.findMeTitle;
  }
  if (profileData.findMeText !== undefined) {
    cleanData.findMeText = String(profileData.findMeText || '').trim() || INITIAL_PROFILE.findMeText;
  }
  cleanData.updatedAt = serverTimestamp();

  try {
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error(
        'Firestore Permission Denied: Please check Firestore Security Rules in Firebase Console to allow profile writes.'
      );
    }
    throw error;
  }

  // Merge with existing cache and save
  const currentCached = getCachedProfile();
  const mergedResult = {
    ...currentCached,
    ...profileData,
    heroBadge: cleanData.heroBadge !== undefined ? cleanData.heroBadge : currentCached.heroBadge,
    heroTitles: cleanData.heroTitles !== undefined ? cleanData.heroTitles : currentCached.heroTitles,
    heroIntro: cleanData.heroIntro !== undefined ? cleanData.heroIntro : currentCached.heroIntro,
    aboutBadge: cleanData.aboutBadge !== undefined ? cleanData.aboutBadge : currentCached.aboutBadge,
    title: cleanData.title !== undefined ? cleanData.title : currentCached.title,
    bio: cleanData.bio !== undefined ? cleanData.bio : currentCached.bio,
    profileImageUrl: cleanData.profileImageUrl !== undefined ? cleanData.profileImageUrl : currentCached.profileImageUrl,
    cvUrl: cleanData.cvUrl !== undefined ? cleanData.cvUrl : currentCached.cvUrl,
    cvFileName: cleanData.cvFileName !== undefined ? cleanData.cvFileName : currentCached.cvFileName,
    skillStacks: cleanData.skillStacks !== undefined ? cleanData.skillStacks : currentCached.skillStacks,
    contactPhone: cleanData.contactPhone !== undefined ? cleanData.contactPhone : currentCached.contactPhone,
    contactEmail: cleanData.contactEmail !== undefined ? cleanData.contactEmail : currentCached.contactEmail,
    contactWhatsapp: cleanData.contactWhatsapp !== undefined ? cleanData.contactWhatsapp : currentCached.contactWhatsapp,
    findMeTitle: cleanData.findMeTitle !== undefined ? cleanData.findMeTitle : currentCached.findMeTitle,
    findMeText: cleanData.findMeText !== undefined ? cleanData.findMeText : currentCached.findMeText,
  };

  saveProfileCache(mergedResult);
  return mergedResult;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VISITOR & TRAFFIC ANALYTICS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const ANALYTICS_COLLECTION = 'analytics';
const VISITORS_DOC_ID = 'visitors';
const VISITOR_LOGS_COLLECTION = 'logs';

export const INITIAL_VISITOR_STATS = {
  totalViews: 0,
  uniqueVisitors: 0,
  totalSessions: 0,
  lastVisitedAt: null,
  dailyViews: {},
};

/**
 * Record a portfolio visit with unique visitor & session detection
 */
export async function recordPortfolioVisit() {
  if (typeof window === 'undefined') return;
  if (!isFirebaseConfigured || !db) return;

  // Don't track admin pages
  const pathname = window.location.pathname || '';
  if (pathname.startsWith('/admin')) return;

  // Throttle rapidly repeated reloads (e.g. fast refreshes within 2 seconds)
  const now = Date.now();
  const lastTracked = Number(sessionStorage.getItem('jahan_last_visit_time') || 0);
  if (now - lastTracked < 2000) return;
  try {
    sessionStorage.setItem('jahan_last_visit_time', String(now));
  } catch (e) {}

  // 1. Unique visitor identification (stored permanently in localStorage)
  let isUnique = false;
  let visitorId = null;
  try {
    visitorId = localStorage.getItem('jahan_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('jahan_visitor_id', visitorId);
      isUnique = true;
    }
  } catch (e) {
    visitorId = 'anon_' + Date.now();
  }

  // 2. Session identification (stored per browser tab/session in sessionStorage)
  let isNewSession = false;
  try {
    const sessionActive = sessionStorage.getItem('jahan_session_visited');
    if (!sessionActive) {
      sessionStorage.setItem('jahan_session_visited', '1');
      isNewSession = true;
    }
  } catch (e) {
    isNewSession = true;
  }

  // 3. Client details
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  let deviceType = 'Desktop';
  if (/mobile|android|iphone/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  let browser = 'Other';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let referrer = 'Direct';
  try {
    if (document.referrer) {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== window.location.hostname) {
        referrer = refHost;
      }
    }
  } catch (e) {}

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const docRef = doc(db, ANALYTICS_COLLECTION, VISITORS_DOC_ID);
    
    const updatePayload = {
      totalViews: increment(1),
      lastVisitedAt: serverTimestamp(),
      [`dailyViews.${todayStr}`]: increment(1),
    };

    if (isUnique) {
      updatePayload.uniqueVisitors = increment(1);
    }
    if (isNewSession) {
      updatePayload.totalSessions = increment(1);
    }

    await setDoc(docRef, updatePayload, { merge: true });

    // Store a light visit log for recent visits overview in Admin Dashboard
    const logsRef = collection(db, ANALYTICS_COLLECTION, VISITORS_DOC_ID, VISITOR_LOGS_COLLECTION);
    await addDoc(logsRef, {
      visitorId,
      isUnique,
      isNewSession,
      device: deviceType,
      browser,
      referrer,
      path: pathname || '/',
      language: (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en',
      visitedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Visitor tracking error:', err?.message || err);
  }
}

/**
 * Realtime subscription to overall visitor counters
 */
export function subscribeToVisitorStats(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_VISITOR_STATS);
    return () => {};
  }

  try {
    const docRef = doc(db, ANALYTICS_COLLECTION, VISITORS_DOC_ID);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(INITIAL_VISITOR_STATS);
          return;
        }
        const data = docSnap.data();
        const dailyViews = typeof data.dailyViews === 'object' && data.dailyViews ? { ...data.dailyViews } : {};
        Object.keys(data).forEach((key) => {
          if (key.startsWith('dailyViews.')) {
            const date = key.replace('dailyViews.', '');
            dailyViews[date] = Number(data[key]) || 0;
          }
        });

        callback({
          totalViews: Number(data.totalViews) || 0,
          uniqueVisitors: Number(data.uniqueVisitors) || 0,
          totalSessions: Number(data.totalSessions) || 0,
          lastVisitedAt: data.lastVisitedAt || null,
          dailyViews,
        });
      },
      (err) => {
        console.warn('Visitor stats subscription error:', err?.message || err);
        callback(INITIAL_VISITOR_STATS);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to visitor stats:', err);
    callback(INITIAL_VISITOR_STATS);
    return () => {};
  }
}

/**
 * Realtime subscription to recent visitor logs (up to maxCount)
 */
export function subscribeToRecentVisitors(callback, maxCount = 15) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const logsRef = collection(db, ANALYTICS_COLLECTION, VISITORS_DOC_ID, VISITOR_LOGS_COLLECTION);
    const q = query(logsRef, orderBy('visitedAt', 'desc'), limit(maxCount));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(logs);
      },
      (err) => {
        console.warn('Visitor logs subscription error:', err?.message || err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to visitor logs:', err);
    callback([]);
    return () => {};
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SOCIAL LINKS MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const SOCIAL_LINKS_COLLECTION = 'socialLinks';

export const INITIAL_SOCIAL_LINKS = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://fb.com/rjahan.razh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/facebook.svg',
    platform: 'facebook',
    showInHero: true,
    showInFooter: false,
    order: 1,
    published: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/JahanRazh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/github.svg',
    platform: 'github',
    showInHero: true,
    showInFooter: true,
    order: 2,
    published: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com/_jahan_razh_',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg',
    platform: 'instagram',
    showInHero: true,
    showInFooter: true,
    order: 3,
    published: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/channel/UC_4OKBZ0RYHTDxKYHwFFojw',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/youtube.svg',
    platform: 'youtube',
    showInHero: true,
    showInFooter: true,
    order: 4,
    published: true,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    url: 'https://twitter.com/jahan3165',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/twitter.svg',
    platform: 'twitter',
    showInHero: true,
    showInFooter: false,
    order: 5,
    published: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/jahanrazh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg',
    platform: 'linkedin',
    showInHero: true,
    showInFooter: true,
    order: 6,
    published: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.gg/jahanramesh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/discord.svg',
    platform: 'discord',
    showInHero: true,
    showInFooter: false,
    order: 7,
    published: true,
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com/users/jahan-ramesh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/stack-overflow.svg',
    platform: 'stackoverflow',
    showInHero: true,
    showInFooter: false,
    order: 8,
    published: true,
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    url: 'https://www.hackerrank.com/jahanrazh',
    icon: 'https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/hackerrank.svg',
    platform: 'hackerrank',
    showInHero: true,
    showInFooter: false,
    order: 9,
    published: true,
  },
];

/**
 * Realtime subscription to all social links (admin + public)
 */
export function subscribeToSocialLinks(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_SOCIAL_LINKS);
    return () => {};
  }

  try {
    const q = query(collection(db, SOCIAL_LINKS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_SOCIAL_LINKS);
          return;
        }
        const links = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        links.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(links);
      },
      (error) => {
        console.warn('Social links subscription error:', error);
        callback(INITIAL_SOCIAL_LINKS);
      }
    );
  } catch (err) {
    console.error('Failed to set up social links listener:', err);
    callback(INITIAL_SOCIAL_LINKS);
    return () => {};
  }
}

/**
 * Create a new social link
 */
export async function createSocialLink(data) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    name: data.name || '',
    url: data.url || '',
    icon: data.icon || '',
    platform: data.platform || 'other',
    showInHero: Boolean(data.showInHero),
    showInFooter: Boolean(data.showInFooter),
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, SOCIAL_LINKS_COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Please update your Firestore Security Rules.');
    }
    throw error;
  }
}

/**
 * Bulk create multiple social links at once using a batch write
 */
export async function bulkCreateSocialLinks(linksArray) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!Array.isArray(linksArray) || linksArray.length === 0) return [];

  const batch = writeBatch(db);
  const colRef = collection(db, SOCIAL_LINKS_COLLECTION);
  const created = [];

  for (const item of linksArray) {
    const docRef = doc(colRef);
    const cleanData = {
      name: item.name || '',
      url: item.url || '',
      icon: item.icon || '',
      platform: item.platform || 'other',
      showInHero: Boolean(item.showInHero),
      showInFooter: Boolean(item.showInFooter),
      order: Number(item.order) || 1,
      published: item.published !== undefined ? Boolean(item.published) : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(docRef, cleanData);
    created.push({ id: docRef.id, ...cleanData });
  }

  try {
    await batch.commit();
    return created;
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Please update your Firestore Security Rules.');
    }
    throw error;
  }
}

/**
 * Update an existing social link
 */
export async function updateSocialLink(id, data) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SOCIAL_LINKS_COLLECTION, id);

  const cleanData = {
    ...data,
    order: Number(data.order) || 1,
    published: Boolean(data.published),
    showInHero: Boolean(data.showInHero),
    showInFooter: Boolean(data.showInFooter),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  try {
    await setDoc(docRef, cleanData, { merge: true });
    return { id, ...cleanData };
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Please update your Firestore Security Rules.');
    }
    throw error;
  }
}

/**
 * Delete a social link
 */
export async function deleteSocialLink(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SOCIAL_LINKS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Please update your Firestore Security Rules.');
    }
    throw error;
  }
}

/**
 * Seed initial social links into Firestore if empty
 */
export async function seedInitialSocialLinks() {
  if (!db) throw new Error('Firestore is not initialized.');

  try {
    for (const link of INITIAL_SOCIAL_LINKS) {
      const docRef = doc(db, SOCIAL_LINKS_COLLECTION, link.id);
      const dataToSave = { ...link, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      delete dataToSave.id;
      await setDoc(docRef, dataToSave, { merge: true });
    }
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Firestore Permission Denied: Please update your Firestore Security Rules.');
    }
    throw error;
  }
}

// ─── EXPERIENCES & EDUCATION COLLECTIONS ───────────────────────────────────

export const EXPERIENCES_COLLECTION = 'experiences';
export const EDUCATION_COLLECTION = 'education';

export const INITIAL_EXPERIENCES = [
  {
    id: 'exp-1',
    title: 'Full Stack Software Developer',
    company: 'Freelance & Independent Projects',
    location: 'Remote / Sri Lanka',
    employmentType: 'Freelance',
    startDate: '2023-01',
    endDate: 'Present',
    isCurrent: true,
    description: 'Designed and deployed responsive web and mobile applications using Next.js, React, Node.js, and Firebase. Implemented RESTful APIs, modern UI/UX design systems, and robust database architectures.',
    technologies: ['React', 'Next.js', 'Node.js', 'Firebase', 'Tailwind CSS', 'MongoDB'],
    order: 1,
    published: true,
  },
  {
    id: 'exp-2',
    title: 'Software Engineering Trainee / Projects Developer',
    company: 'Academic & Industry Collaborative Projects',
    location: 'Colombo, Sri Lanka',
    employmentType: 'Contract',
    startDate: '2023-06',
    endDate: '2024-05',
    isCurrent: false,
    description: 'Collaborated on end-to-end development of enterprise cloud applications, microservices, and AI-integrated workflow tools. Contributed to database optimization and unit testing.',
    technologies: ['Java', 'Python', 'MySQL', 'Cloud Architecture', 'ExpressJS', 'Git'],
    order: 2,
    published: true,
  },
];

export const INITIAL_EDUCATION = [
  {
    id: 'edu-1',
    degree: 'BSc (Hons) in Information Technology Specializing in Software Engineering',
    institution: 'Sri Lanka Institute of Information Technology (SLIIT)',
    location: 'Malabe, Sri Lanka',
    startDate: '2022',
    endDate: '2026',
    isCurrent: true,
    grade: 'Undergraduate',
    description: 'Specializing in advanced software architecture, data structures & algorithms, cloud computing, AI systems, and mobile development. Active participant in coding challenges and IT societies.',
    activities: ['Software Engineering Student', 'Hackathons & AI Workgroups', 'IEEE Student Member'],
    order: 1,
    published: true,
  },
  {
    id: 'edu-2',
    degree: 'G.C.E. Advanced Level (Physical Science / Mathematics Stream)',
    institution: 'High School',
    location: 'Sri Lanka',
    startDate: '2019',
    endDate: '2021',
    isCurrent: false,
    grade: 'Completed',
    description: 'Focus in Combined Mathematics, Physics, and Chemistry, laying a solid quantitative foundation for engineering and computing.',
    activities: ['Science Society', 'IT & Computer Club'],
    order: 2,
    published: true,
  },
];

// ── Experience CRUD ────────────────────────────────────────────────────────

export async function getPublishedExperiences() {
  if (!isFirebaseConfigured || !db) {
    return INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  try {
    const q = query(
      collection(db, EXPERIENCES_COLLECTION),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Experiences fetch fallback:', error.message);
    return INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export function subscribeToPublishedExperiences(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }

  try {
    const q = query(
      collection(db, EXPERIENCES_COLLECTION),
      where('published', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Realtime experiences error:', error);
        callback(INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    );
  } catch {
    callback(INITIAL_EXPERIENCES.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }
}

export function subscribeToAllExperiences(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_EXPERIENCES);
    return () => {};
  }

  try {
    const q = query(collection(db, EXPERIENCES_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_EXPERIENCES);
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Admin experiences error:', error);
        callback(INITIAL_EXPERIENCES);
      }
    );
  } catch {
    callback(INITIAL_EXPERIENCES);
    return () => {};
  }
}

export async function createExperience(data) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    title: String(data.title || '').trim(),
    company: String(data.company || '').trim(),
    location: String(data.location || '').trim(),
    employmentType: data.employmentType || 'Full-time',
    startDate: data.startDate || '',
    endDate: data.endDate || 'Present',
    isCurrent: Boolean(data.isCurrent),
    description: data.description || '',
    technologies: Array.isArray(data.technologies) ? data.technologies : [],
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, EXPERIENCES_COLLECTION), cleanData);
  return { id: docRef.id, ...cleanData };
}

export async function updateExperience(id, data) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, EXPERIENCES_COLLECTION, id);

  const cleanData = {
    ...data,
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    isCurrent: Boolean(data.isCurrent),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  await setDoc(docRef, cleanData, { merge: true });
  return { id, ...cleanData };
}

export async function deleteExperience(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, EXPERIENCES_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
}

export async function seedInitialExperiences() {
  if (!db) throw new Error('Firestore is not initialized.');

  for (const exp of INITIAL_EXPERIENCES) {
    const docRef = doc(db, EXPERIENCES_COLLECTION, exp.id);
    const dataToSave = { ...exp, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    delete dataToSave.id;
    await setDoc(docRef, dataToSave, { merge: true });
  }
}

// ── Education CRUD ─────────────────────────────────────────────────────────

export async function getPublishedEducation() {
  if (!isFirebaseConfigured || !db) {
    return INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  try {
    const q = query(
      collection(db, EDUCATION_COLLECTION),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Education fetch fallback:', error.message);
    return INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export function subscribeToPublishedEducation(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }

  try {
    const q = query(
      collection(db, EDUCATION_COLLECTION),
      where('published', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Realtime education error:', error);
        callback(INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    );
  } catch {
    callback(INITIAL_EDUCATION.filter((e) => e.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }
}

export function subscribeToAllEducation(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_EDUCATION);
    return () => {};
  }

  try {
    const q = query(collection(db, EDUCATION_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_EDUCATION);
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Admin education error:', error);
        callback(INITIAL_EDUCATION);
      }
    );
  } catch {
    callback(INITIAL_EDUCATION);
    return () => {};
  }
}

export async function createEducation(data) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    degree: String(data.degree || '').trim(),
    institution: String(data.institution || '').trim(),
    location: String(data.location || '').trim(),
    startDate: data.startDate || '',
    endDate: data.endDate || 'Present',
    isCurrent: Boolean(data.isCurrent),
    grade: data.grade || '',
    description: data.description || '',
    activities: Array.isArray(data.activities) ? data.activities : [],
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, EDUCATION_COLLECTION), cleanData);
  return { id: docRef.id, ...cleanData };
}

export async function updateEducation(id, data) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, EDUCATION_COLLECTION, id);

  const cleanData = {
    ...data,
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    isCurrent: Boolean(data.isCurrent),
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  await setDoc(docRef, cleanData, { merge: true });
  return { id, ...cleanData };
}

export async function deleteEducation(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, EDUCATION_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
}

export async function seedInitialEducation() {
  if (!db) throw new Error('Firestore is not initialized.');

  for (const edu of INITIAL_EDUCATION) {
    const docRef = doc(db, EDUCATION_COLLECTION, edu.id);
    const dataToSave = { ...edu, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    delete dataToSave.id;
    await setDoc(docRef, dataToSave, { merge: true });
  }
}

// ─── PUBLICATIONS & RESEARCH COLLECTION ────────────────────────────────────

export const PUBLICATIONS_COLLECTION = 'publications';

export const INITIAL_PUBLICATIONS = [
  {
    id: 'pub-1',
    title: 'Optimizing Cloud Microservices and Multi-Model AI Pipelines for Real-Time Developer Workflows',
    authors: 'Ramesh Jahan Jayalath, et al.',
    venue: 'IEEE International Conference on Advances in ICT & Computing (ICAIC)',
    year: '2024',
    type: 'Conference Paper',
    doi: 'https://doi.org/10.1109/EXAMPLE.2024.10001',
    paperUrl: 'https://arxiv.org',
    abstract: 'This research investigates low-latency cloud infrastructure design combining containerized microservices with dynamic multi-tier generative AI model cascades, demonstrating reduced inference latency and improved fault tolerance in automated developer workflows.',
    keywords: ['Cloud Computing', 'Generative AI', 'Microservices', 'System Architecture', 'Latency Optimization'],
    order: 1,
    published: true,
  },
  {
    id: 'pub-2',
    title: 'Adaptive Resource Allocation and Security in Multi-Cloud Environments: A Comparative Study',
    authors: 'Ramesh Jahan Jayalath',
    venue: 'SLIIT Faculty of Computing Research Symposium (FCRS)',
    year: '2023',
    type: 'Research Report',
    doi: '',
    paperUrl: '',
    abstract: 'An analytical review and benchmark of modern container orchestrators and automated scaling policies across hybrid multi-cloud infrastructure, examining cost-effectiveness, zero-trust network policies, and throughput bottlenecks.',
    keywords: ['Cloud Security', 'DevOps', 'Zero Trust', 'Kubernetes', 'Scalability'],
    order: 2,
    published: true,
  },
];

export async function getPublishedPublications() {
  if (!isFirebaseConfigured || !db) {
    return INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  try {
    const q = query(
      collection(db, PUBLICATIONS_COLLECTION),
      where('published', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.warn('Publications fetch fallback:', error.message);
    return INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export function subscribeToPublishedPublications(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }

  try {
    const q = query(
      collection(db, PUBLICATIONS_COLLECTION),
      where('published', '==', true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Realtime publications error:', error);
        callback(INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    );
  } catch {
    callback(INITIAL_PUBLICATIONS.filter((p) => p.published).sort((a, b) => (a.order || 0) - (b.order || 0)));
    return () => {};
  }
}

export function subscribeToAllPublications(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_PUBLICATIONS);
    return () => {};
  }

  try {
    const q = query(collection(db, PUBLICATIONS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_PUBLICATIONS);
          return;
        }
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (error) => {
        console.warn('Admin publications error:', error);
        callback(INITIAL_PUBLICATIONS);
      }
    );
  } catch {
    callback(INITIAL_PUBLICATIONS);
    return () => {};
  }
}

export async function createPublication(data) {
  if (!db) throw new Error('Firestore is not initialized.');

  const cleanData = {
    title: String(data.title || '').trim(),
    authors: String(data.authors || '').trim(),
    venue: String(data.venue || '').trim(),
    year: String(data.year || '').trim(),
    type: data.type || 'Conference Paper',
    doi: String(data.doi || '').trim(),
    paperUrl: String(data.paperUrl || '').trim(),
    abstract: String(data.abstract || '').trim(),
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PUBLICATIONS_COLLECTION), cleanData);
  return { id: docRef.id, ...cleanData };
}

export async function updatePublication(id, data) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);

  const cleanData = {
    ...data,
    order: Number(data.order) || 1,
    published: data.published !== undefined ? Boolean(data.published) : true,
    updatedAt: serverTimestamp(),
  };
  delete cleanData.id;

  await setDoc(docRef, cleanData, { merge: true });
  return { id, ...cleanData };
}

export async function deletePublication(id) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PUBLICATIONS_COLLECTION, id);
  await deleteDoc(docRef);
  return id;
}

export async function seedInitialPublications() {
  if (!db) throw new Error('Firestore is not initialized.');

  for (const pub of INITIAL_PUBLICATIONS) {
    const docRef = doc(db, PUBLICATIONS_COLLECTION, pub.id);
    const dataToSave = { ...pub, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    delete dataToSave.id;
    await setDoc(docRef, dataToSave, { merge: true });
  }
}

// ─── SECTION VISIBILITY & ORDER MANAGEMENT ──────────────────────────────────

export const SECTION_VISIBILITY_COLLECTION = 'settings';
export const SECTION_VISIBILITY_DOC_ID = 'section_visibility';

export const DEFAULT_SECTION_ORDER = [
  'hero',
  'about',
  'services',
  'projects',
  'skills',
  'experience',
  'publications',
  'certificates',
  'contact',
];

export const DEFAULT_SECTION_VISIBILITY = {
  hero: true,
  about: true,
  services: true,
  projects: true,
  skills: true,
  experience: true,
  publications: true,
  certificates: true,
  contact: true,
};

export function normalizeSectionSettings(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_SECTION_VISIBILITY,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    };
  }

  const visibility = {};
  for (const key of DEFAULT_SECTION_ORDER) {
    if (raw.visibility && typeof raw.visibility === 'object' && raw.visibility[key] !== undefined) {
      visibility[key] = Boolean(raw.visibility[key]);
    } else if (raw[key] !== undefined && typeof raw[key] === 'boolean') {
      visibility[key] = Boolean(raw[key]);
    } else {
      visibility[key] = true;
    }
  }

  let order = [];
  const rawOrder = Array.isArray(raw.sectionOrder)
    ? raw.sectionOrder
    : Array.isArray(raw.order)
    ? raw.order
    : [];

  for (const k of rawOrder) {
    if (DEFAULT_SECTION_ORDER.includes(k) && !order.includes(k)) {
      order.push(k);
    }
  }
  for (const k of DEFAULT_SECTION_ORDER) {
    if (!order.includes(k)) {
      order.push(k);
    }
  }

  return {
    ...visibility,
    sectionOrder: order,
  };
}

const SECTION_VISIBILITY_CACHE_KEY = 'jahan_section_visibility_cache';

export function getCachedSectionVisibility() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(SECTION_VISIBILITY_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return normalizeSectionSettings(parsed);
        }
      }
    } catch {}
  }
  return normalizeSectionSettings(null);
}

export function saveCachedSectionVisibility(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const normalized = normalizeSectionSettings(data);
    localStorage.setItem(SECTION_VISIBILITY_CACHE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('jahan_visibility_updated', { detail: normalized }));
  } catch {}
}

export async function getSectionVisibility() {
  if (!isFirebaseConfigured || !db) {
    return getCachedSectionVisibility();
  }

  try {
    const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return getCachedSectionVisibility();
    }
    const data = normalizeSectionSettings(snap.data());
    saveCachedSectionVisibility(data);
    return data;
  } catch (error) {
    console.warn('Section visibility fetch fallback:', error.message);
    return getCachedSectionVisibility();
  }
}

export function subscribeToSectionVisibility(callback) {
  const initial = getCachedSectionVisibility();
  callback(initial);

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorageChange = (e) => {
    if (e.key === SECTION_VISIBILITY_CACHE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(normalizeSectionSettings(parsed));
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  const handleCustomUpdate = (e) => {
    if (e.detail) {
      callback(normalizeSectionSettings(e.detail));
    }
  };
  window.addEventListener('jahan_visibility_updated', handleCustomUpdate);

  if (!isFirebaseConfigured || !db) {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_visibility_updated', handleCustomUpdate);
    };
  }

  try {
    const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);

    getDoc(docRef).then((snap) => {
      if (snap && snap.exists()) {
        const data = normalizeSectionSettings(snap.data());
        saveCachedSectionVisibility(data);
        callback(data);
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = normalizeSectionSettings(snapshot.data());
          saveCachedSectionVisibility(data);
          callback(data);
        }
      },
      (error) => {
        console.warn('Section visibility snapshot error:', error.message);
      }
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_visibility_updated', handleCustomUpdate);
      unsubscribe();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_visibility_updated', handleCustomUpdate);
    };
  }
}

export async function updateSectionVisibility(sectionId, isVisible) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);

  const current = getCachedSectionVisibility();
  const updated = normalizeSectionSettings({
    ...current,
    [sectionId]: Boolean(isVisible),
  });

  saveCachedSectionVisibility(updated);
  await setDoc(docRef, { [sectionId]: Boolean(isVisible), updatedAt: serverTimestamp() }, { merge: true });
  return updated;
}

export async function updateSectionOrder(newOrderArray) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);

  const current = getCachedSectionVisibility();
  const updated = normalizeSectionSettings({
    ...current,
    sectionOrder: newOrderArray,
  });

  saveCachedSectionVisibility(updated);
  await setDoc(docRef, { sectionOrder: updated.sectionOrder, updatedAt: serverTimestamp() }, { merge: true });
  return updated;
}

export async function updateAllSectionsVisibility(visibilityObject) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);

  const current = getCachedSectionVisibility();
  const updated = normalizeSectionSettings({
    ...current,
    ...visibilityObject,
  });

  saveCachedSectionVisibility(updated);
  const toSave = { ...updated, updatedAt: serverTimestamp() };
  await setDoc(docRef, toSave, { merge: true });
  return updated;
}

export async function resetSectionSettings() {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, SECTION_VISIBILITY_COLLECTION, SECTION_VISIBILITY_DOC_ID);

  const resetData = {
    ...DEFAULT_SECTION_VISIBILITY,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  };

  saveCachedSectionVisibility(resetData);
  await setDoc(docRef, { ...resetData, updatedAt: serverTimestamp() }, { merge: true });
  return resetData;
}

// ─── PORTFOLIO THEME MANAGEMENT ──────────────────────────────────────────────

export const PORTFOLIO_THEME_COLLECTION = 'settings';
export const PORTFOLIO_THEME_DOC_ID = 'portfolio_theme';

export const CURATED_THEMES = [
  {
    id: 'cyber_cyan',
    name: 'Cyber Cyan & Electric Indigo',
    category: 'Cyberpunk & Tech',
    primaryColor: '#12f7ff',
    secondaryColor: '#6e57e0',
    accentColor: '#00c9ff',
    description: 'The iconic high-tech cyberpunk palette with electric cyan glows and deep purple accents.',
    gradient: 'from-[#12f7ff] to-[#6e57e0]',
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix & Teal Mint',
    category: 'Hacker & Innovation',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    accentColor: '#34d399',
    description: 'Terminal-inspired clean green matrix with shimmering cyan teal highlights.',
    gradient: 'from-[#10b981] to-[#06b6d4]',
  },
  {
    id: 'neon_purple',
    name: 'Neon Violet & Synth Pink',
    category: 'Creative AI & Synthwave',
    primaryColor: '#c084fc',
    secondaryColor: '#ec4899',
    accentColor: '#a855f7',
    description: 'Vibrant neon purple with electric magenta highlights, giving a creative generative AI feel.',
    gradient: 'from-[#c084fc] to-[#ec4899]',
  },
  {
    id: 'amber_sunset',
    name: 'Amber Solar & Crimson Fire',
    category: 'Warm & High Energy',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    accentColor: '#f97316',
    description: 'Blazing sunset radiance with warm amber golds and intense crimson glows.',
    gradient: 'from-[#f59e0b] to-[#ef4444]',
  },
  {
    id: 'sapphire_ocean',
    name: 'Sapphire Ocean & Sky Blue',
    category: 'Corporate & Deep Sea',
    primaryColor: '#38bdf8',
    secondaryColor: '#3b82f6',
    accentColor: '#60a5fa',
    description: 'Polished enterprise tech blue with deep sapphire depths and crystal sky azure.',
    gradient: 'from-[#38bdf8] to-[#3b82f6]',
  },
  {
    id: 'rose_luxury',
    name: 'Rose Quartz & Velvet Crimson',
    category: 'Vibrant & Modern Luxury',
    primaryColor: '#fb7185',
    secondaryColor: '#f43f5e',
    accentColor: '#fda4af',
    description: 'Refined modern rose with elegant crimson glow and luxurious modern accents.',
    gradient: 'from-[#fb7185] to-[#f43f5e]',
  },
  {
    id: 'monochrome_titanium',
    name: 'Titanium Slate & Silver Mist',
    category: 'Minimalist & Apple Pro',
    primaryColor: '#e2e8f0',
    secondaryColor: '#64748b',
    accentColor: '#94a3b8',
    description: 'Sleek monochromatic titanium with clean silver gradients and stealth dark finishes.',
    gradient: 'from-[#e2e8f0] to-[#64748b]',
  },
  {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula & Deep Space',
    category: 'Futuristic & Sci-Fi',
    primaryColor: '#818cf8',
    secondaryColor: '#d946ef',
    accentColor: '#06b6d4',
    description: 'Multidimensional space nebula blending starlight indigo, magenta, and cyan hyperdrive.',
    gradient: 'from-[#818cf8] via-[#d946ef] to-[#06b6d4]',
  },
];

export const DEFAULT_PORTFOLIO_THEME = {
  themeId: 'cyber_cyan',
  themeName: 'Cyber Cyan & Electric Indigo',
  primaryColor: '#12f7ff',
  secondaryColor: '#6e57e0',
  accentColor: '#00c9ff',
  customEnabled: false,
};

const PORTFOLIO_THEME_CACHE_KEY = 'jahan_portfolio_theme_cache';

export function normalizePortfolioTheme(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PORTFOLIO_THEME };
  }
  return {
    themeId: raw.themeId || DEFAULT_PORTFOLIO_THEME.themeId,
    themeName: raw.themeName || DEFAULT_PORTFOLIO_THEME.themeName,
    primaryColor: raw.primaryColor || DEFAULT_PORTFOLIO_THEME.primaryColor,
    secondaryColor: raw.secondaryColor || DEFAULT_PORTFOLIO_THEME.secondaryColor,
    accentColor: raw.accentColor || DEFAULT_PORTFOLIO_THEME.accentColor,
    customEnabled: Boolean(raw.customEnabled),
  };
}

export function getCachedPortfolioTheme() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(PORTFOLIO_THEME_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          return normalizePortfolioTheme(parsed);
        }
      }
    } catch {}
  }
  return { ...DEFAULT_PORTFOLIO_THEME };
}

export function saveCachedPortfolioTheme(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const normalized = normalizePortfolioTheme(data);
    localStorage.setItem(PORTFOLIO_THEME_CACHE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('jahan_theme_updated', { detail: normalized }));
    applyThemeToDom(normalized);
  } catch {}
}

export function applyThemeToDom(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const primary = theme.primaryColor || '#12f7ff';
  const secondary = theme.secondaryColor || '#6e57e0';
  const accent = theme.accentColor || '#00c9ff';
  const themeId = theme.themeId || 'cyber_cyan';

  // Set CSS variables (used by inline styles / var() references)
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-secondary', secondary);
  root.style.setProperty('--theme-accent', accent);
  root.style.setProperty('--first-color', secondary);
  root.style.setProperty('--second-color', accent);
  root.style.setProperty('--neon-cyan', primary);
  root.style.setProperty('--theme-glow', `${primary}55`);
  root.setAttribute('data-portfolio-theme', themeId);

  // Inject a dynamic <style> element to override hardcoded Tailwind arbitrary colors
  // For the default cyber_cyan theme, inject nothing (preserving original design exactly)
  const styleId = 'portfolio-theme-override';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  if (themeId === 'cyber_cyan') {
    // Default theme: remove all overrides so the site looks exactly as designed
    styleEl.textContent = '';
    return;
  }

  // Helper to parse hex to rgb string "r, g, b"
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  const p = primary;       // replaces #12f7ff (neon cyan)
  const s = secondary;     // replaces #6e57e0 (purple/indigo)
  const a = accent;        // replaces #00c9ff (sky)
  const pRgb = hexToRgb(primary);
  const sRgb = hexToRgb(secondary);
  const aRgb = hexToRgb(accent);

  // These rules override the compiled Tailwind arbitrary-value classes.
  // We use [data-portfolio-theme] scoping so they only apply when a custom theme is active.
  // The !important ensures they win over the compiled Tailwind class specificity.
  styleEl.textContent = `
    /* ── Color overrides for custom portfolio theme: ${themeId} ── */

    /* TEXT colors */
    [data-portfolio-theme] .text-\\[\\#6e57e0\\],
    [data-portfolio-theme] .dark\\:text-\\[\\#6e57e0\\] { color: ${s} !important; }
    [data-portfolio-theme] .text-\\[\\#12f7ff\\],
    [data-portfolio-theme] .dark\\:text-\\[\\#12f7ff\\] { color: ${p} !important; }
    [data-portfolio-theme] .text-\\[\\#1e9fab\\] { color: ${p} !important; }
    [data-portfolio-theme] .text-\\[\\#00c9ff\\],
    [data-portfolio-theme] .dark\\:text-\\[\\#00c9ff\\] { color: ${a} !important; }

    /* BACKGROUND colors */
    [data-portfolio-theme] .bg-\\[\\#6e57e0\\],
    [data-portfolio-theme] .dark\\:bg-\\[\\#6e57e0\\] { background-color: ${s} !important; }
    [data-portfolio-theme] .bg-\\[\\#12f7ff\\],
    [data-portfolio-theme] .dark\\:bg-\\[\\#12f7ff\\] { background-color: ${p} !important; }
    [data-portfolio-theme] .bg-\\[\\#00c9ff\\],
    [data-portfolio-theme] .dark\\:bg-\\[\\#00c9ff\\] { background-color: ${a} !important; }

    /* HOVER backgrounds */
    [data-portfolio-theme] .hover\\:bg-\\[\\#6e57e0\\]:hover { background-color: ${s} !important; }
    [data-portfolio-theme] .hover\\:bg-\\[\\#12f7ff\\]:hover { background-color: ${p} !important; }
    [data-portfolio-theme] .hover\\:bg-\\[\\#00c9ff\\]:hover,
    [data-portfolio-theme] .dark\\:hover\\:bg-\\[\\#00c9ff\\]:hover { background-color: ${a} !important; }
    [data-portfolio-theme] .hover\\:bg-\\[\\#285bd4\\]:hover { background-color: ${s} !important; filter: brightness(1.15); }

    /* HOVER text */
    [data-portfolio-theme] .hover\\:text-\\[\\#6e57e0\\]:hover,
    [data-portfolio-theme] .dark\\:hover\\:text-\\[\\#12f7ff\\]:hover { color: ${p} !important; }

    /* BORDER colors */
    [data-portfolio-theme] .border-\\[\\#6e57e0\\],
    [data-portfolio-theme] .dark\\:border-\\[\\#6e57e0\\] { border-color: ${s} !important; }
    [data-portfolio-theme] .border-\\[\\#12f7ff\\],
    [data-portfolio-theme] .dark\\:border-\\[\\#12f7ff\\] { border-color: ${p} !important; }
    [data-portfolio-theme] .hover\\:border-\\[\\#12f7ff\\]:hover,
    [data-portfolio-theme] .dark\\:hover\\:border-\\[\\#12f7ff\\]:hover { border-color: ${p} !important; }

    /* OPACITY-based bg helpers (Tailwind uses / syntax, escape manually) */
    [data-portfolio-theme] .bg-\\[\\#6e57e0\\]\\/10 { background-color: rgba(${sRgb}, 0.1) !important; }
    [data-portfolio-theme] .bg-\\[\\#6e57e0\\]\\/20 { background-color: rgba(${sRgb}, 0.2) !important; }
    [data-portfolio-theme] .dark\\:bg-\\[\\#6e57e0\\]\\/20 { background-color: rgba(${sRgb}, 0.2) !important; }
    [data-portfolio-theme] .dark\\:bg-\\[\\#6e57e0\\]\\/30 { background-color: rgba(${sRgb}, 0.3) !important; }
    [data-portfolio-theme] .bg-\\[\\#12f7ff\\]\\/10 { background-color: rgba(${pRgb}, 0.1) !important; }
    [data-portfolio-theme] .dark\\:bg-\\[\\#12f7ff\\]\\/10 { background-color: rgba(${pRgb}, 0.1) !important; }
    [data-portfolio-theme] .dark\\:bg-\\[\\#12f7ff\\]\\/15 { background-color: rgba(${pRgb}, 0.15) !important; }

    /* OPACITY-based border helpers */
    [data-portfolio-theme] .border-\\[\\#6e57e0\\]\\/20 { border-color: rgba(${sRgb}, 0.2) !important; }
    [data-portfolio-theme] .dark\\:border-\\[\\#6e57e0\\]\\/30 { border-color: rgba(${sRgb}, 0.3) !important; }
    [data-portfolio-theme] .hover\\:border-\\[\\#6e57e0\\]\\/50:hover,
    [data-portfolio-theme] .dark\\:hover\\:border-\\[\\#12f7ff\\]\\/40:hover { border-color: rgba(${pRgb}, 0.4) !important; }

    /* GRADIENT backgrounds */
    [data-portfolio-theme] .from-\\[\\#6e57e0\\] { --tw-gradient-from: ${s} !important; }
    [data-portfolio-theme] .via-\\[\\#00c9ff\\] { --tw-gradient-via: ${a} !important; }
    [data-portfolio-theme] .to-\\[\\#12f7ff\\],
    [data-portfolio-theme] .dark\\:to-\\[\\#12f7ff\\] { --tw-gradient-to: ${p} !important; }
    [data-portfolio-theme] .to-\\[\\#00c9ff\\] { --tw-gradient-to: ${a} !important; }

    /* SCROLLBAR */
    [data-portfolio-theme] ::-webkit-scrollbar-thumb { background: ${s} !important; }
    [data-portfolio-theme] ::-webkit-scrollbar-thumb:hover { background: ${p} !important; }

    /* SHADOW glow overrides (inline styles won't need !important, but CSS can't override inline) */
    [data-portfolio-theme] .shadow-\\[0_0_10px_rgba\\(18\\,247\\,255\\,0\\.4\\)\\] {
      box-shadow: 0 0 10px rgba(${pRgb}, 0.4) !important;
    }
    [data-portfolio-theme] .hover\\:shadow-\\[0_0_20px_rgba\\(0\\,201\\,255\\,0\\.4\\)\\]:hover {
      box-shadow: 0 0 20px rgba(${aRgb}, 0.4) !important;
    }

    /* SVG stroke (for circular progress in Skills.jsx) */
    [data-portfolio-theme] .text-\\[\\#12f7ff\\] { color: ${p} !important; }

    /* GROUP-HOVER backgrounds (Services icon, About skills hover) */
    [data-portfolio-theme] .group-hover\\:bg-\\[\\#6e57e0\\]:hover,
    [data-portfolio-theme] .group:hover .group-hover\\:bg-\\[\\#6e57e0\\] { background-color: ${s} !important; }
    [data-portfolio-theme] .group-hover\\:bg-\\[\\#12f7ff\\]:hover,
    [data-portfolio-theme] .group:hover .group-hover\\:bg-\\[\\#12f7ff\\] { background-color: ${p} !important; }
    [data-portfolio-theme] .dark\\:group-hover\\:bg-\\[\\#12f7ff\\]:hover,
    [data-portfolio-theme] .group:hover .dark\\:group-hover\\:bg-\\[\\#12f7ff\\] { background-color: ${p} !important; }

    /* GROUP-HOVER text */
    [data-portfolio-theme] .group:hover .group-hover\\:text-\\[\\#6e57e0\\] { color: ${s} !important; }
    [data-portfolio-theme] .group:hover .dark\\:group-hover\\:text-\\[\\#12f7ff\\] { color: ${p} !important; }

    /* FOCUS border (Contact inputs) */
    [data-portfolio-theme] .focus\\:border-\\[\\#6e57e0\\]:focus { border-color: ${s} !important; }
    [data-portfolio-theme] .dark\\:focus\\:border-\\[\\#12f7ff\\]:focus { border-color: ${p} !important; }

    /* Contact gradient card (from-[#00c9ff] to-[#6e57e0]) */
    [data-portfolio-theme] .from-\\[\\#00c9ff\\] { --tw-gradient-from: ${a} !important; }

    /* Projects filter active tab */
    [data-portfolio-theme] .bg-\\[\\#6e57e0\\].text-white { background-color: ${s} !important; }
  `;
}

export async function getPortfolioTheme() {
  if (!isFirebaseConfigured || !db) {
    return getCachedPortfolioTheme();
  }

  try {
    const docRef = doc(db, PORTFOLIO_THEME_COLLECTION, PORTFOLIO_THEME_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return getCachedPortfolioTheme();
    }
    const data = normalizePortfolioTheme(snap.data());
    saveCachedPortfolioTheme(data);
    return data;
  } catch (error) {
    console.warn('Portfolio theme fetch fallback:', error.message);
    return getCachedPortfolioTheme();
  }
}

export function subscribeToPortfolioTheme(callback) {
  const initial = getCachedPortfolioTheme();
  applyThemeToDom(initial);
  callback(initial);

  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorageChange = (e) => {
    if (e.key === PORTFOLIO_THEME_CACHE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const normalized = normalizePortfolioTheme(parsed);
        applyThemeToDom(normalized);
        callback(normalized);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  const handleCustomUpdate = (e) => {
    if (e.detail) {
      const normalized = normalizePortfolioTheme(e.detail);
      applyThemeToDom(normalized);
      callback(normalized);
    }
  };
  window.addEventListener('jahan_theme_updated', handleCustomUpdate);

  if (!isFirebaseConfigured || !db) {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_theme_updated', handleCustomUpdate);
    };
  }

  try {
    const docRef = doc(db, PORTFOLIO_THEME_COLLECTION, PORTFOLIO_THEME_DOC_ID);

    getDoc(docRef).then((snap) => {
      if (snap && snap.exists()) {
        const data = normalizePortfolioTheme(snap.data());
        saveCachedPortfolioTheme(data);
        applyThemeToDom(data);
        callback(data);
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = normalizePortfolioTheme(snapshot.data());
          saveCachedPortfolioTheme(data);
          applyThemeToDom(data);
          callback(data);
        }
      },
      (error) => {
        console.warn('Portfolio theme snapshot error:', error.message);
      }
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_theme_updated', handleCustomUpdate);
      unsubscribe();
    };
  } catch {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jahan_theme_updated', handleCustomUpdate);
    };
  }
}

export async function updatePortfolioTheme(themeData) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PORTFOLIO_THEME_COLLECTION, PORTFOLIO_THEME_DOC_ID);

  const normalized = normalizePortfolioTheme(themeData);
  saveCachedPortfolioTheme(normalized);

  await setDoc(docRef, { ...normalized, updatedAt: serverTimestamp() }, { merge: true });
  return normalized;
}

export async function resetPortfolioTheme() {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PORTFOLIO_THEME_COLLECTION, PORTFOLIO_THEME_DOC_ID);

  const resetData = { ...DEFAULT_PORTFOLIO_THEME };
  saveCachedPortfolioTheme(resetData);

  await setDoc(docRef, { ...resetData, updatedAt: serverTimestamp() }, { merge: true });
  return resetData;
}





