import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import CanvasWrapper from '../../components/layout/Canvas';
import ChatPanel from '../../components/chat/ChatPanel';
import useStore from '../../store';

/**
 * Shared branch page — loads a read-only shared branch by share ID.
 */
const BranchPage = () => {
  const { branchShareId } = useParams<{ branchShareId: string }>();
  const { loadSharedBranch } = useStore();

  useEffect(() => {
    if (branchShareId) {
      void loadSharedBranch(branchShareId);
    }
  }, [branchShareId, loadSharedBranch]);

  return (
    <>
      <Sidebar />
      <main className="flex-1 relative bg-background-dark overflow-hidden">
        <CanvasWrapper />
        <ChatPanel />
      </main>
    </>
  );
};

export default BranchPage;
