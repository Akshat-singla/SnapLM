import Sidebar from '../../components/layout/Sidebar';
import CanvasWrapper from '../../components/layout/Canvas';
import ChatPanel from '../../components/chat/ChatPanel';
import BranchModal from '../../components/modals/BranchModal';
import MergeModal from '../../components/modals/MergeModal';
import useStore from '../../store';

/**
 * Home / Canvas page — the main workspace view.
 * Shows the sidebar + canvas + chat panel + modals.
 */
const AppPage = () => {
  const { currentProjectId } = useStore();

  return (
    <>
      <Sidebar />
      <main className="flex-1 relative bg-background-dark overflow-hidden">
        {currentProjectId ? (
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
    </>
  );
};

export default AppPage;
