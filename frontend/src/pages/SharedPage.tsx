import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import CanvasWrapper from '../components/layout/Canvas';
import ChatPanel from '../components/chat/ChatPanel';
import useStore from '../store';

/**
 * Shared workspace page — loads a read-only shared workspace by share ID.
 */
const SharedPage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { loadSharedWorkspace } = useStore();

  useEffect(() => {
    if (shareId) {
      loadSharedWorkspace(shareId);
    }
  }, [shareId, loadSharedWorkspace]);

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

export default SharedPage;
