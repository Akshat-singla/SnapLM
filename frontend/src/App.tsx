import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Toolbar from './components/layout/Toolbar';
import CanvasWrapper from './components/layout/Canvas';
import ChatPanel from './components/chat/ChatPanel';
import BranchModal from './components/modals/BranchModal';
import MergeModal from './components/modals/MergeModal';
import ProjectModal from './components/modals/ProjectModal';
import ProfilePage from './components/profile/ProfilePage';
import useStore from './store';
import { registerSpaNavigation } from './utils/spaNavigation';

function useAppPath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((p: string) => {
    window.history.pushState({}, '', p);
    setPath(p);
  }, []);
  return [path, navigate] as const;
}

function App() {
  const [path, navigate] = useAppPath();
  const { fetchProjects, currentProjectId, loadSharedWorkspace, loadSharedBranch, toasts } =
    useStore();

  const branchShareId = useMemo(() => {
    const m = path.match(/^\/branch\/([^/]+)$/);
    return m?.[1] ?? null;
  }, [path]);

  const isProfile = path === '/profile';

  useEffect(() => {
    registerSpaNavigation(navigate);
    return () => registerSpaNavigation(null);
  }, [navigate]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const m = path.match(/^\/shared\/([^/]+)$/);
    if (!m?.[1]) return;
    loadSharedWorkspace(m[1]);
  }, [path, loadSharedWorkspace]);

  useEffect(() => {
    if (!branchShareId) return;
    void loadSharedBranch(branchShareId);
  }, [branchShareId, loadSharedBranch]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background-dark text-white font-display relative">
      <Toolbar appPath={path} onNavigate={navigate} />
      <div className="flex flex-1 overflow-hidden relative">
        {!isProfile && <Sidebar />}
        <main className="flex-1 relative bg-background-dark overflow-hidden">
          {isProfile ? (
            <ProfilePage />
          ) : currentProjectId ? (
            <>
              <CanvasWrapper />
              <ChatPanel />
              <BranchModal />
              <MergeModal />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Project Selected</h2>
              <p className="text-slate-400 mb-6">
                Select a project from the dropdown above, or create a new one to get started.
              </p>
            </div>
          )}
        </main>
      </div>
      <ProjectModal />

      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-sm ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;


