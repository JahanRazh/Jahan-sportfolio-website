import {
  collection,
  getDocs,
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
    await updateDoc(docRef, cleanData);
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
 * Subscribe to ALL certificates (admin panel — includes unpublished)
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
    await updateDoc(docRef, cleanData);
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

// ══════════════════════════════════════════════════════════════════════════
// SKILLS MANAGEMENT (Technical & Professional)
// ══════════════════════════════════════════════════════════════════════════

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

  await updateDoc(docRef, cleanData);
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

// ══════════════════════════════════════════════════════════════════════════
// ABOUT ME & CV PROFILE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════

const PROFILE_COLLECTION = 'profile';
const PROFILE_DOC_ID = 'main';

export const INITIAL_PROFILE = {
  title: 'My introduction',
  bio: `I am a Software Engineering undergraduate student at SLIIT University. Passionate about coding, software development, and continuously learning new technologies and methodologies in the field. Skilled in programming languages such as Java, Python, and C++. Experienced in web development, mobile app development, and database management. Actively involved in university projects and extracurricular activities related to technology. Aspiring to build a successful career in software engineering and contribute to innovative and impactful projects in the tech industry.`,
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
        if (parsed && parsed.profileImageUrl) {
          return { ...INITIAL_PROFILE, ...parsed };
        }
      }
    } catch (e) {
      // ignore JSON parse or storage errors
    }
  }
  return INITIAL_PROFILE;
}

/**
 * Fetch profile and CV data
 */
export async function getProfileData() {
  if (!isFirebaseConfigured || !db) {
    return getCachedProfile();
  }

  try {
    const docSnap = await getDocs(query(collection(db, PROFILE_COLLECTION)));
    if (docSnap.empty) {
      return getCachedProfile();
    }
    const mainDoc = docSnap.docs.find((d) => d.id === PROFILE_DOC_ID);
    if (!mainDoc) return getCachedProfile();
    const data = { ...INITIAL_PROFILE, ...mainDoc.data() };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jahan_profile_cache', JSON.stringify(data));
      } catch (e) {}
    }
    return data;
  } catch (error) {
    console.warn('Profile fetch fallback:', error.message);
    return getCachedProfile();
  }
}

/**
 * Realtime subscription to profile and CV data with instant local cache
 */
export function subscribeToProfile(callback) {
  // 1. Instantly deliver cached/Cloudinary data to eliminate initial flash
  const initial = getCachedProfile();
  callback(initial);

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const docRef = doc(db, PROFILE_COLLECTION, PROFILE_DOC_ID);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(INITIAL_PROFILE);
          return;
        }
        const data = { ...INITIAL_PROFILE, ...docSnap.data() };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('jahan_profile_cache', JSON.stringify(data));
          } catch (e) {}
        }
        callback(data);
      },
      (error) => {
        console.warn('Profile subscription error:', error);
      }
    );
  } catch (err) {
    console.error('Failed to set up profile listener:', err);
    return () => {};
  }
}

/**
 * Save / Update Profile & CV data
 */
export async function updateProfile(profileData) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, PROFILE_COLLECTION, PROFILE_DOC_ID);

  const cleanData = {
    title: profileData.title || INITIAL_PROFILE.title,
    bio: profileData.bio || INITIAL_PROFILE.bio,
    profileImageUrl: profileData.profileImageUrl || INITIAL_PROFILE.profileImageUrl,
    cvUrl: profileData.cvUrl || INITIAL_PROFILE.cvUrl,
    cvFileName: profileData.cvFileName || INITIAL_PROFILE.cvFileName,
    cvUpdatedAt: profileData.cvUrl ? serverTimestamp() : null,
    skillStacks: Array.isArray(profileData.skillStacks)
      ? profileData.skillStacks
      : INITIAL_PROFILE.skillStacks,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, cleanData, { merge: true });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('jahan_profile_cache', JSON.stringify({ ...INITIAL_PROFILE, ...cleanData }));
    } catch (e) {}
  }

  return cleanData;
}

// ══════════════════════════════════════════════════════════════════════════
// VISITOR & TRAFFIC ANALYTICS
// ══════════════════════════════════════════════════════════════════════════

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

