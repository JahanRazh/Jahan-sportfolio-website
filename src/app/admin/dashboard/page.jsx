'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Plus, 
  Globe, 
  LogOut, 
  Loader2, 
  DatabaseBackup,
  Award,
} from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import DashboardStats from '../../../components/admin/DashboardStats';
import ProjectTable from '../../../components/admin/ProjectTable';
import ProjectFormModal from '../../../components/admin/ProjectFormModal';
import DeleteConfirmModal from '../../../components/admin/DeleteConfirmModal';
import CertificateTable from '../../../components/admin/CertificateTable';
import CertificateFormModal from '../../../components/admin/CertificateFormModal';
import SkillsManager from '../../../components/admin/SkillsManager';
import AboutCvManager from '../../../components/admin/AboutCvManager';
import ThemeToggle from '../../../components/ThemeToggle';
import { useToast } from '../../../components/Toast';
import { 
  subscribeToAuthState, 
  logoutUser 
} from '../../../lib/auth';
import { 
  subscribeToAllProjects, 
  createProject, 
  updateProject, 
  deleteProject, 
  seedInitialProjects,
  subscribeToAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  subscribeToAllSkills,
  subscribeToProfile,
} from '../../../lib/firestore';
import { deleteProjectImage, extractCloudinaryPublicId } from '../../../lib/storage';
import { deleteCertificateFile } from '../../../lib/certificateStorage';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('projects');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Projects ─────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Certificates ──────────────────────────────────────────────
  const [certificates, setCertificates] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [isCertFormOpen, setIsCertFormOpen] = useState(false);
  const [selectedCertForEdit, setSelectedCertForEdit] = useState(null);
  const [isCertDeleteOpen, setIsCertDeleteOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);
  const [isDeletingCert, setIsDeletingCert] = useState(false);

  // ── Skills ────────────────────────────────────────────────────
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // ── Profile & CV ──────────────────────────────────────────────
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (!user) {
        router.replace('/admin/login');
      } else {
        setCurrentUser(user);
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Realtime projects ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoadingProjects(true);
    const unsubscribe = subscribeToAllProjects((data) => {
      setProjects(data);
      setLoadingProjects(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Realtime certificates ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoadingCerts(true);
    const unsubscribe = subscribeToAllCertificates((data) => {
      setCertificates(data);
      setLoadingCerts(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Realtime skills ───────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoadingSkills(true);
    const unsubscribe = subscribeToAllSkills((data) => {
      setSkills(data);
      setLoadingSkills(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Realtime profile & CV ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoadingProfile(true);
    const unsubscribe = subscribeToProfile((data) => {
      setProfileData(data);
      setLoadingProfile(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // ── Project handlers ──────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logoutUser();
      addToast('Logged out successfully', 'info');
      router.push('/admin/login');
    } catch (error) {
      addToast('Failed to log out', 'error');
    }
  };

  const handleOpenAddModal = () => {
    setSelectedProjectForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setSelectedProjectForEdit(project);
    setIsFormModalOpen(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (selectedProjectForEdit && selectedProjectForEdit.id) {
        await updateProject(selectedProjectForEdit.id, projectData);
        addToast('Project updated successfully!', 'success');
      } else {
        await createProject(projectData);
        addToast('Project created successfully!', 'success');
      }
      setIsFormModalOpen(false);
    } catch (error) {
      addToast(error.message || 'Error saving project', 'error');
      throw error;
    }
  };

  const handleOpenDeleteModal = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      const publicId = projectToDelete.imagePath || extractCloudinaryPublicId(projectToDelete.imageUrl);
      if (publicId) {
        await deleteProjectImage(publicId);
      }
      addToast('Project and image deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      addToast(error.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (project) => {
    try {
      const nextStatus = !project.published;
      await updateProject(project.id, { published: nextStatus });
      addToast(`Project ${nextStatus ? 'published live' : 'moved to drafts'}`, 'success');
    } catch (error) {
      addToast('Failed to update project status', 'error');
    }
  };

  const handleSeedData = async () => {
    try {
      await seedInitialProjects();
      addToast('Original 6 projects seeded into Firestore!', 'success');
    } catch (error) {
      addToast('Error seeding projects: ' + error.message, 'error');
    }
  };

  // ── Certificate handlers ──────────────────────────────────────
  const handleOpenAddCert = () => {
    setSelectedCertForEdit(null);
    setIsCertFormOpen(true);
  };

  const handleOpenEditCert = (cert) => {
    setSelectedCertForEdit(cert);
    setIsCertFormOpen(true);
  };

  const handleSaveCert = async (certData) => {
    try {
      if (selectedCertForEdit && selectedCertForEdit.id) {
        await updateCertificate(selectedCertForEdit.id, certData);
        addToast('Certificate updated successfully!', 'success');
      } else {
        await createCertificate(certData);
        addToast('Certificate added successfully!', 'success');
      }
      setIsCertFormOpen(false);
    } catch (error) {
      addToast(error.message || 'Error saving certificate', 'error');
      throw error;
    }
  };

  const handleDeleteCert = (cert) => {
    setCertToDelete(cert);
    setIsCertDeleteOpen(true);
  };

  const handleConfirmDeleteCert = async () => {
    if (!certToDelete) return;
    setIsDeletingCert(true);
    try {
      await deleteCertificate(certToDelete.id);
      // Automatically delete the file from Cloudinary (both image and PDF)
      const publicId = certToDelete.filePath || extractCloudinaryPublicId(certToDelete.fileUrl);
      if (publicId) {
        await deleteCertificateFile(publicId, 'image');
      }
      addToast('Certificate and Cloudinary file deleted', 'success');
      setIsCertDeleteOpen(false);
      setCertToDelete(null);
    } catch (error) {
      addToast(error.message || 'Failed to delete certificate', 'error');
    } finally {
      setIsDeletingCert(false);
    }
  };

  const handleToggleCertPublish = async (cert) => {
    try {
      const nextStatus = !cert.published;
      await updateCertificate(cert.id, { published: nextStatus });
      addToast(`Certificate ${nextStatus ? 'published live' : 'moved to drafts'}`, 'success');
    } catch (error) {
      addToast('Failed to update certificate status', 'error');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isCertTab = activeTab === 'certificates';

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={isCertTab ? handleOpenAddCert : handleOpenAddModal}
        onSeedData={handleSeedData}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        userEmail={currentUser?.email}
        profileImageUrl={profileData?.profileImageUrl}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 bg-slate-900/80 border-b border-slate-800 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white capitalize">
              {activeTab === 'dashboard'
                ? 'Dashboard Overview'
                : activeTab === 'certificates'
                ? 'Certificates Management'
                : activeTab === 'skills'
                ? 'Technical & Professional Skills'
                : activeTab === 'about'
                ? 'Profile Picture, About Me & CV'
                : 'Project Management CMS'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Live Site</span>
            </a>

            {(activeTab === 'projects' || activeTab === 'certificates') && (
              <button
                onClick={isCertTab ? handleOpenAddCert : handleOpenAddModal}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition ${
                  isCertTab
                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-600/30 text-slate-950'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {isCertTab ? (
                  <>
                    <Award className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Certificate</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Project</span>
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 sm:p-10 space-y-8 flex-1">
          {/* Top Statistics Cards (shown on dashboard & projects tabs) */}
          {(activeTab === 'dashboard' || activeTab === 'projects') && (
            <DashboardStats projects={projects} />
          )}

          {/* ── DASHBOARD OVERVIEW TAB ──────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Quick Jump Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('projects')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left transition group"
                >
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Projects</p>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-200">{projects.length} Total</h3>
                  <p className="text-xs text-slate-400 mt-2">Manage live portfolio projects & tags</p>
                </button>

                <button
                  onClick={() => setActiveTab('certificates')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition group"
                >
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Certificates</p>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-200">{certificates.length} Total</h3>
                  <p className="text-xs text-slate-400 mt-2">Manage credentials, PDFs & pictures</p>
                </button>

                <button
                  onClick={() => setActiveTab('skills')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
                >
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Skills</p>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-200">{skills.length} Total</h3>
                  <p className="text-xs text-slate-400 mt-2">Technical & Professional proficiency</p>
                </button>

                <button
                  onClick={() => setActiveTab('about')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Profile & CV</p>
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-950">
                      <img
                        src={profileData?.profileImageUrl || '/assets/images/me.jpg'}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-200">Profile & CV</h3>
                  <p className="text-xs text-slate-400 mt-1">Update profile photo, CV & bio</p>
                </button>
              </div>

              {/* Recent projects preview */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">Recent Projects</h2>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    View all projects →
                  </button>
                </div>
                <ProjectTable
                  projects={projects.slice(0, 4)}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                  onTogglePublish={handleTogglePublish}
                  onAddNew={handleOpenAddModal}
                />
              </section>
            </div>
          )}

          {/* ── PROJECTS TAB ────────────────────────────────────────── */}
          {activeTab === 'projects' && (
            <>
              {/* Seed callout */}
              {projects.length === 0 && !loadingProjects && (
                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <DatabaseBackup className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold text-white">Firestore database is empty</h4>
                      <p className="text-xs text-slate-300">
                        Seed your 6 original portfolio projects into Firestore with one click.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSeedData}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition whitespace-nowrap"
                  >
                    Seed 6 Projects Now
                  </button>
                </div>
              )}

              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Projects Directory</h2>
                    <p className="text-xs text-slate-400">
                      Manage, edit, publish, or rearrange projects on your live portfolio.
                    </p>
                  </div>
                </div>

                {loadingProjects ? (
                  <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                    <p className="text-sm font-medium">Syncing with Firestore...</p>
                  </div>
                ) : (
                  <ProjectTable
                    projects={projects}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                    onTogglePublish={handleTogglePublish}
                    onAddNew={handleOpenAddModal}
                  />
                )}
              </section>
            </>
          )}

          {/* ── CERTIFICATES TAB ──────────────────────────────────────── */}
          {activeTab === 'certificates' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Certificates Directory</h2>
                    <p className="text-xs text-slate-400">
                      Manage certificates, credentials, and course completions shown on your portfolio.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  {certificates.length} total
                </span>
              </div>

              {loadingCerts ? (
                <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                  <p className="text-sm font-medium">Loading certificates...</p>
                </div>
              ) : (
                <CertificateTable
                  certificates={certificates}
                  onEdit={handleOpenEditCert}
                  onDelete={handleDeleteCert}
                  onTogglePublish={handleToggleCertPublish}
                  onAddNew={handleOpenAddCert}
                />
              )}
            </section>
          )}

          {/* ── SKILLS TAB ────────────────────────────────────────────── */}
          {activeTab === 'skills' && (
            <SkillsManager skills={skills} loading={loadingSkills} />
          )}

          {/* ── ABOUT ME & CV TAB ─────────────────────────────────────── */}
          {activeTab === 'about' && (
            <AboutCvManager profileData={profileData} />
          )}
        </main>
      </div>

      {/* Project Modals */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProject}
        initialProject={selectedProjectForEdit}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name}
        isDeleting={isDeleting}
      />

      {/* Certificate Modals */}
      <CertificateFormModal
        isOpen={isCertFormOpen}
        onClose={() => setIsCertFormOpen(false)}
        onSave={handleSaveCert}
        initialCertificate={selectedCertForEdit}
      />
      <DeleteConfirmModal
        isOpen={isCertDeleteOpen}
        onClose={() => setIsCertDeleteOpen(false)}
        onConfirm={handleConfirmDeleteCert}
        projectName={certToDelete?.title}
        isDeleting={isDeletingCert}
      />
    </div>
  );
}
