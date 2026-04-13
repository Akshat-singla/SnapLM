import { useState } from 'react';
import { X, GitBranch } from 'lucide-react';
import { canvasApi } from '../../services/api/client';
import useStore from '../../store';

type ShareBranchModalProps = {
  open: boolean;
  onClose: () => void;
};

const ShareBranchModal = ({ open, onClose }: ShareBranchModalProps) => {
  const { selectedNodeId, currentProjectId, addToast } = useStore();
  const [sharedWith, setSharedWith] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId || !selectedNodeId || !sharedWith.trim()) return;
    setSubmitting(true);
    setLastLink(null);
    try {
      const res = await canvasApi.shareBranch({
        project_id: currentProjectId,
        root_node_id: selectedNodeId,
        shared_with_user: sharedWith.trim(),
      });
      const link = `${window.location.origin}/app/branch/${res.share_id}`;
      setLastLink(link);
      try {
        await navigator.clipboard.writeText(link);
        addToast({ type: 'success', message: 'Branch share link copied to clipboard' });
      } catch {
        addToast({ type: 'info', message: `Share link: ${link}` });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to share branch' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSharedWith('');
    setLastLink(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-dark shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <GitBranch size={18} className="text-primary" />
            Share branch
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            Shares the selected node and all descendants (parent/child and merge links within this
            subtree). Messages and positions are included.
          </p>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Share with (user id or label)</label>
            <input
              value={sharedWith}
              onChange={(e) => setSharedWith(e.target.value)}
              placeholder="e.g. colleague-id or U2"
              className="w-full rounded-lg bg-background-dark border border-surface-border px-3 py-2 text-sm"
            />
          </div>
          {lastLink && (
            <div className="rounded-lg bg-black/30 border border-surface-border px-3 py-2 text-xs text-slate-300 break-all">
              {lastLink}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm border border-surface-border hover:bg-white/5"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !sharedWith.trim() || !selectedNodeId || !currentProjectId}
              className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Sharing…' : 'Create share link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareBranchModal;
