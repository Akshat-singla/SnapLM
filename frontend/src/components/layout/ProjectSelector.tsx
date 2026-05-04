import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Plus, ChevronDown } from 'lucide-react';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';

const ProjectSelector = () => {
  const { 
    projects, 
    currentProjectId, 
    fetchProjects, 
    setCurrentProject, 
    setCreateProjectModalOpen,
    loading 
  } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentProject = projects.find(p => p.project_id === currentProjectId);
  const activeProjects = projects.filter((project) => !project.is_archived);
  const archivedCount = projects.length - activeProjects.length;

  return (
    <div ref={containerRef} className="relative">
      <button 
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark/50 hover:bg-surface-dark border border-surface-border rounded-lg text-sm transition-colors"
      >
        <FolderOpen size={16} className="text-primary" />
        <span className="text-white font-medium max-w-[150px] truncate">
          {currentProject ? currentProject.name : 'Select Project'}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Dropdown */}
      <div className={`absolute top-full left-0 mt-1 w-64 bg-surface-dark border border-surface-border rounded-lg shadow-xl transition-all z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="p-2 border-b border-surface-border">
          <button
            onClick={() => {
              setCreateProjectModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create New Project
          </button>
        </div>
        
        <div className="max-h-64 overflow-y-auto p-2">
          {loading.projects ? (
            <div className="text-center text-slate-400 text-sm py-4">Loading...</div>
          ) : activeProjects.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-4">
              No active projects. Create one to get started!
            </div>
          ) : (
            activeProjects.map(project => (
              <button
                key={project.project_id}
                onClick={() => {
                  navigate('/');
                  void setCurrentProject(project.project_id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  project.project_id === currentProjectId 
                    ? 'bg-primary/20 text-white' 
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen size={14} />
                  <span className="truncate">{project.name}</span>
                </div>
                <span className="text-xs text-slate-500">{project.node_count} nodes</span>
              </button>
            ))
          )}

          {archivedCount > 0 ? (
            <div className="mt-2 px-3 py-2 text-xs text-slate-500 border-t border-surface-border">
              {archivedCount} archived project{archivedCount > 1 ? 's' : ''} in Sidebar Archive
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
