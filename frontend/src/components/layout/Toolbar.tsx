import { useState } from 'react';
import { Settings, Bell, UserCircle, Share2, GitBranch } from 'lucide-react';
import ProjectSelector from './ProjectSelector';
import ShareBranchModal from '../modals/ShareBranchModal';
import useStore from '../../store';

type ToolbarProps = {
  appPath: string;
  onNavigate: (path: string) => void;
};

const Toolbar = ({ appPath, onNavigate }: ToolbarProps) => {
  const { createShareLink, currentProjectId, isReadOnly, selectedNodeId } = useStore();
  const [shareBranchOpen, setShareBranchOpen] = useState(false);
  const isBranchView = appPath.startsWith('/branch/');

  return (
    <>
      <header className="z-50 flex items-center justify-between border-b border-surface-border bg-background-dark/90 backdrop-blur-md px-6 py-3 h-16 shrink-0">
      <div className="flex items-center gap-6 text-white">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center justify-center">
            {/* Logo Placeholder */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight">SnapLM</h2>
        </div>

        {/* Project Selector */}
        <ProjectSelector />

        {isReadOnly && (
          <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            {isBranchView ? 'Viewing shared branch (read-only)' : 'Viewing shared workspace (read-only)'}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {!isReadOnly && (
          <button
            onClick={() => createShareLink()}
            disabled={!currentProjectId}
            className="flex items-center gap-2 cursor-pointer overflow-hidden rounded-lg h-9 px-4 bg-primary hover:bg-blue-600 transition-colors text-white text-sm font-bold leading-normal tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={18} />
            <span className="truncate">Share Brain</span>
          </button>
        )}
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setShareBranchOpen(true)}
            disabled={!currentProjectId || !selectedNodeId}
            title={!selectedNodeId ? 'Select a node on the canvas' : 'Share this branch from the selected node'}
            className="flex items-center gap-2 cursor-pointer overflow-hidden rounded-lg h-9 px-4 bg-surface-border hover:bg-gray-700 transition-colors text-white text-sm font-bold leading-normal tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitBranch size={18} />
            <span className="truncate">Share Branch</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate('/profile')}
          className="flex items-center gap-2 cursor-pointer overflow-hidden rounded-lg h-9 px-4 bg-surface-border hover:bg-gray-700 transition-colors text-white text-sm font-bold leading-normal tracking-wide"
        >
          <UserCircle size={18} />
          <span className="truncate">Profile</span>
        </button>
<button className="flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-surface-border hover:bg-gray-700 transition-colors text-white">
          <Settings size={20} />
        </button>
        <button className="flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-surface-border hover:bg-gray-700 transition-colors text-white relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#111318]"></span>
        </button>
      </div>
      </header>
      <ShareBranchModal open={shareBranchOpen} onClose={() => setShareBranchOpen(false)} />
    </>
  );
};

export default Toolbar;

