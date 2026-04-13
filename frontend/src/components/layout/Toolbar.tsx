import { useState } from 'react';
import { Menu, MenuItem, Divider } from '@mui/material';
import { Settings, Bell, UserCircle, Share2, GitBranch, GanttChart } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectSelector from './ProjectSelector';
import ShareBranchModal from '../modals/ShareBranchModal';
import useStore from '../../store';
import { useLocation, useNavigate } from 'react-router-dom';

import { AppBar, Toolbar as MuiToolbar, Box, Button, IconButton, Typography, Badge, Chip } from '@mui/material';

const Toolbar = () => {
  const { createShareLink, currentProjectId, isReadOnly, selectedNodeId } = useStore();
  const [shareBranchOpen, setShareBranchOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  const isBranchView = location.pathname.startsWith('/app/branch/') || location.pathname.startsWith('/branch/');
  const isSharedView = location.pathname.startsWith('/app/shared/') || location.pathname.startsWith('/shared/');
  const isProjectView = location.pathname === '/app' || isBranchView || isSharedView;

  return (
    <>
      <Box 
        component="header"
        className="flex items-center justify-between w-full h-16 shrink-0 px-4 sm:px-6 z-50 backdrop-blur-md border-b"
        sx={{ 
          background: 'rgba(17, 19, 24, 0.8)', 
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-6">
          <motion.div
            whileHover="hover"
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <motion.div
                variants={{
                    hover: { scale: 1.1, rotate: 5 }
                }}
                className="bg-primary/10 p-2 rounded-lg"
            >
                <GanttChart className="text-primary" size={22} />
            </motion.div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
                SnapLM
            </span>
          </motion.div>

          {isProjectView && <ProjectSelector />}

          {isReadOnly && (
            <Chip 
              label={isBranchView ? 'Viewing shared branch (read-only)' : 'Viewing shared workspace (read-only)'} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(251, 191, 36, 0.1)', 
                color: '#fbbf24', 
                border: '1px solid rgba(251, 191, 36, 0.2)',
                fontWeight: 500
              }} 
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          {isProjectView && currentProjectId && !isReadOnly && (
            <>
              <Button 
                variant="contained" 
                startIcon={<Share2 size={18} />}
                onClick={() => createShareLink()}
                sx={{ 
                  bgcolor: '#7c3aed', 
                  '&:hover': { bgcolor: '#6d28d9' }, 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 'none'
                }}
              >
                Share Brain
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<GitBranch size={18} />}
                onClick={() => setShareBranchOpen(true)}
                disabled={!selectedNodeId}
                title={!selectedNodeId ? 'Select a node on the canvas' : 'Share this branch from the selected node'}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)' },
                  '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                Share Branch
              </Button>
            </>
          )}

          <Button 
            variant="text"
            startIcon={<UserCircle size={18} />}
            onClick={() => navigate('/app/profile')}
            sx={{ 
              color: 'white', 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              borderRadius: 2,
              ml: 1
            }}
          >
            Profile
          </Button>

          <IconButton
            onClick={() => navigate('/app/settings')}
            className="group hover:bg-white/5 transition-colors" sx={{ color: 'rgba(255,255,255,0.7)', borderRadius: 2 }}>
            <Settings size={20} className="group-hover:text-white transition-colors" />
          </IconButton>

          <IconButton onClick={(e) => setNotificationAnchor(e.currentTarget)} className="group hover:bg-white/5 transition-colors" sx={{ color: 'rgba(255,255,255,0.7)', borderRadius: 2 }}>
            <Badge color="error" variant="dot" sx={{ '& .MuiBadge-badge': { top: 3, right: 3 } }}>
              <Bell size={20} className="group-hover:text-white transition-colors" />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
            PaperProps={{
              sx: {
                bgcolor: 'rgba(15, 23, 42, 0.95)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                minWidth: 280,
                mt: 1.5,
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <div className="px-4 py-2 font-bold border-b border-white/10 mb-2">Notifications</div>
            <MenuItem onClick={() => setNotificationAnchor(null)} sx={{ fontSize: '0.875rem' }}>Your model finished training</MenuItem>
            <MenuItem onClick={() => setNotificationAnchor(null)} sx={{ fontSize: '0.875rem' }}>John shared a branch</MenuItem>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <MenuItem onClick={() => setNotificationAnchor(null)} sx={{ fontSize: '0.875rem', color: '#a78bfa' }}>View all notifications</MenuItem>
          </Menu>
        </div>
      </Box>
      <ShareBranchModal open={shareBranchOpen} onClose={() => setShareBranchOpen(false)} />
    </>
  );
};

export default Toolbar;

