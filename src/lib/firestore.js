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
