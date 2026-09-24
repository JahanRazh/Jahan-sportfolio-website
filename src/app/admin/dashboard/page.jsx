'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Plus, 
  Globe, 
  LogOut, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  DatabaseBackup
} from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import DashboardStats from '../../../components/admin/DashboardStats';
import ProjectTable from '../../../components/admin/ProjectTable';
import ProjectFormModal from '../../../components/admin/ProjectFormModal';
import DeleteConfirmModal from '../../../components/admin/DeleteConfirmModal';
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
  seedInitialProjects 
} from '../../../lib/firestore';
import { deleteProjectImage } from '../../../lib/storage';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('projects'); // 'dashboard' or 'projects'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Auth Protection
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

  // 2. Real-time Projects Listener
  useEffect(() => {
    if (!currentUser) return;

    setLoadingProjects(true);
    const unsubscribe = subscribeToAllProjects((data) => {
      setProjects(data);
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      addToast('Logged out successfully', 'info');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Failed to log out', 'error');
    }
  };

  // Open Add Project Modal
  const handleOpenAddModal = () => {
    setSelectedProjectForEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Project Modal
  const handleOpenEditModal = (project) => {
    setSelectedProjectForEdit(project);
    setIsFormModalOpen(true);
  };

  // Save Project (Create or Update)
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
      console.error('Save project error:', error);
      addToast(error.message || 'Error saving project', 'error');
      throw error;
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Delete Firestore Document
      await deleteProject(projectToDelete.id);

      // 2. Delete Storage Image if custom uploaded
      if (projectToDelete.imagePath) {
        await deleteProjectImage(projectToDelete.imagePath);
      }

      addToast('Project deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Delete project error:', error);
      addToast(error.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Toggle Publish status
  const handleTogglePublish = async (project) => {
    try {
      const nextStatus = !project.published;
      await updateProject(project.id, { published: nextStatus });
      addToast(
        `Project ${nextStatus ? 'published live' : 'moved to drafts'}`,
        'success'
      );
    } catch (error) {
      console.error('Status toggle error:', error);
      addToast('Failed to update project status', 'error');
    }
  };

  // Seed Initial 6 Projects into Firestore
  const handleSeedData = async () => {
    try {
      await seedInitialProjects();
      addToast('Original 6 projects seeded into Firestore!', 'success');
    } catch (error) {
      console.error('Seed error:', error);
      addToast('Error seeding projects: ' + error.message, 'error');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        onSeedData={handleSeedData}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        userEmail={currentUser?.email}
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
              {activeTab === 'dashboard' ? 'Dashboard Overview' : 'Project Management CMS'}
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

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 sm:p-10 space-y-8 flex-1">
          {/* Top Statistics Cards */}
          <DashboardStats projects={projects} />

          {/* Action Callout for Seed Data if empty */}
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

          {/* Project Management Table */}
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
        </main>
      </div>

      {/* Add / Edit Project Modal */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProject}
        initialProject={selectedProjectForEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
