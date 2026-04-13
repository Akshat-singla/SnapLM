import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Toolbar from '../components/layout/Toolbar';
import ProjectModal from '../components/modals/ProjectModal';
import useStore from '../store';

/**
 * Root layout wrapping every route.
 * Renders the Toolbar, the ProjectModal (global), toast container,
 * and an <Outlet /> for route-specific content.
 */
const RootLayout = () => {
  const { fetchProjects, toasts } = useStore();
  const location = useLocation();
  const currentPage = location.pathname;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background-dark text-white font-display relative">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Outlet />
      </div>
      <ProjectModal />

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-sm ${toast.type === 'success'
                ? 'bg-toast-success text-white'
                : toast.type === 'error'
                  ? 'bg-toast-error text-white'
                  : 'bg-toast-info text-white'
              }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RootLayout;
