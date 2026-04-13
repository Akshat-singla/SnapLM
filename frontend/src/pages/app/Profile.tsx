import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CreditCard, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { authApi } from '../../services/api/client';
import useStore from '../../store';

// ✨ Animation
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ProfilePage = () => {
  const navigate = useNavigate();

  const user = useStore(state => state.user);
  const projects = useStore(state => state.projects);
  const checkAuth = useStore(state => state.checkAuth);
  const logout = useStore(state => state.logout);

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // 2FA Setup State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupUri, setSetupUri] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useStore(state => state.addToast);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || '');
      setIs2faEnabled(user.is_2fa_enabled || false);
      setLoading(false);
    } else {
      checkAuth().then(() => {
        const currentUser = useStore.getState().user;
        if (currentUser) {
          setEditUsername(currentUser.username || '');
          setEditEmail(currentUser.email || '');
          setIs2faEnabled(currentUser.is_2fa_enabled || false);
        }
        setLoading(false);
      });
    }
  }, [user, checkAuth]);

  // 💾 Fake save (Replace with actual update call if endpoint added)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    addToast({ type: 'info', message: 'Profile editing coming soon' });
    setSaving(false);
  };

  const openProject = (id: string) => {
    navigate('/app');
  };

  const handleSetup2FA = async () => {
    try {
      const data = await authApi.setup2FA();
      setSetupUri(data.uri);
      setSetupSecret(data.secret);
      setSetupModalOpen(true);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to initiate 2FA' });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await authApi.disable2FA();
      addToast({ type: 'success', message: '2FA Disabled Successfully' });
      setIs2faEnabled(false);
      checkAuth();
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to disable 2FA' });
    }
  };

  const handleVerifySetup2FA = async () => {
    try {
      await authApi.enable2FA(verifyCode);
      addToast({ type: 'success', message: '2FA Enabled Successfully' });
      setIs2faEnabled(true);
      setSetupModalOpen(false);
      checkAuth();
    } catch (err) {
      addToast({ type: 'error', message: 'Invalid 2FA code' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleClearData = () => {
    localStorage.clear();
    sessionStorage.clear();
    logout();
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-6 py-10 md:px-12">
      {/* Back */}
      <button
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <ArrowLeft size={18} />
        Back to canvas
      </button>

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8 mt-2">
        <h1 className="font-display text-4xl font-bold tracking-tight">Account</h1>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 w-full">
        {/* LEFT COLUMN */}
        <div className="space-y-8">

          {/* Profile Overview Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 5 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Avatar sx={{ width: 90, height: 90, margin: '0 auto', mb: 3, bgcolor: 'var(--color-primary)', color: 'white', fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'Inter' }}>
                {user?.username?.[0] || 'U'}
              </Avatar>

              <h2 className="font-display text-2xl font-bold mb-1">{user?.username || 'User'}</h2>
              <p className="font-body text-text-secondary text-sm mb-4">
                {user?.email || 'Loading...'}
              </p>

              <Chip 
                label="Pro Plan" 
                size="small" 
                sx={{ 
                  mt: 2, 
                  bgcolor: 'rgba(16, 185, 129, 0.15)', 
                  color: 'var(--color-node-ai)', 
                  fontWeight: 'bold',
                  fontFamily: 'Inter'
                }} 
              />
            </Paper>
          </motion.div>

          {/* Subscription Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 5 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                 <CreditCard size={22} className="text-primary" />
                 <h2 className="font-display text-xl font-bold">Subscription</h2>
              </div>

              <div className="space-y-4 text-sm text-slate-400 mb-8 font-body">
                <div className="flex justify-between items-center">
                  <span>Plan</span>
                  <span className="text-white font-medium">Pro</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Billing Cycle</span>
                  <span className="text-white font-medium">Monthly</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Next Invoice</span>
                  <span className="text-white font-medium">Nov 23, 2026</span>
                </div>
              </div>

              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.05)' },
                  textTransform: 'none',
                  fontWeight: 600,
                  fontFamily: 'Inter',
                  py: 1
                }}
              >
                Manage Subscription
              </Button>
            </Paper>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">

          {/* Form Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 className="font-display text-2xl font-bold mb-2">
                Profile Details
              </h2>
              <p className="font-body text-text-secondary text-sm mb-8">
                Update your personal information associated with your account.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                <TextField
                  fullWidth
                  label="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  variant="outlined"
                  sx={{ 
                    fontFamily: 'Inter',
                    '& .MuiOutlinedInput-root': { color: 'white', fontFamily: 'Inter', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' } }, 
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  variant="outlined"
                  sx={{ 
                    fontFamily: 'Inter',
                    '& .MuiOutlinedInput-root': { color: 'white', fontFamily: 'Inter', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' } }, 
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' }
                  }}
                />

                <Box display="flex" justifyContent="flex-start" pt={2}>
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    variant="contained"
                    sx={{ 
                      bgcolor: 'var(--color-primary)', 
                      '&:hover': { bgcolor: 'var(--color-primary-hover)' }, 
                      textTransform: 'none', 
                      px: 5, 
                      py: 1.5,
                      fontWeight: 'bold',
                      fontFamily: 'Inter',
                      borderRadius: 2,
                      boxShadow: '0 4px 14px 0 rgba(var(--color-primary-rgb), 0.39)',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </form>
            </Paper>
          </motion.div>

          {/* Security Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 className="font-display text-2xl font-bold mb-2">
                Security & Authentication
              </h2>
              <p className="font-body text-text-secondary text-sm mb-8">
                Protect your account with Passkeys and Two-Factor Authentication.
              </p>

              <div className="space-y-6">
                {/* 2FA Section */}
                <div className="border border-white/10 rounded-xl p-5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Authenticator App (2FA)</h3>
                    <p className="text-sm text-text-secondary">Secure your account with a TOTP authenticator.</p>
                  </div>
                  {is2faEnabled ? (
                    <div className="flex items-center gap-2">
                       <Chip label="Enabled" color="success" size="small" />
                       <Button 
                         variant="text" 
                         onClick={handleDisable2FA}
                         sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 'bold', fontSize: '0.8rem', '&:hover': { color: '#ef4444' } }}
                       >
                         Disable
                       </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="contained" 
                      onClick={handleSetup2FA}
                      sx={{ bgcolor: 'var(--color-primary)', textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>

                {/* Passkeys Section */}
                <div className="border border-white/10 rounded-xl p-5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Passkeys</h3>
                    <p className="text-sm text-text-secondary">Sign in seamlessly with your device biometric or hardware key.</p>
                  </div>
                  <Button 
                    variant="outlined" 
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: 'bold' }}
                  >
                    Manage Passkeys
                  </Button>
                </div>
              </div>
            </Paper>
          </motion.div>

          {/* Projects Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 className="font-display text-2xl font-bold mb-2">
                Your Projects
              </h2>
              <p className="font-body text-text-secondary text-sm mb-8">
                Manage and access your registered SnapLM architectures.
              </p>

              <div className="space-y-4">
                {projects?.length ? projects.map((p: any) => (
                  <Box
                    key={p.id || p.project_id}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 4,
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    <div>
                      <h3 className="font-display font-bold text-lg mb-1 leading-tight">
                        {p.name}
                      </h3>
                      <p className="font-body text-sm text-text-secondary">
                        {p.node_count ?? 0} nodes • Created {new Date(p.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <Button 
                      onClick={() => openProject(p.id || p.project_id)}
                      variant="contained"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.08)', 
                        color: 'white', 
                        boxShadow: 'none',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', boxShadow: 'none' },
                        textTransform: 'none',
                        fontWeight: 600,
                        fontFamily: 'Inter',
                        px: 3,
                        py: 1,
                        borderRadius: 2
                      }}
                    >
                      Enter Workspace
                    </Button>
                  </Box>
                )) : (
                   <p className="text-slate-400">No projects found. Create one in the canvas area!</p>
                )}
              </div>
            </Paper>
          </motion.div>

          {/* Danger Zone Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 4, md: 6 }, 
                borderRadius: 4, 
                bgcolor: 'var(--color-surface-elevated)', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 className="font-display text-2xl font-bold mb-2 text-red-500">
                Danger Zone
              </h2>
              <p className="font-body text-text-secondary text-sm mb-6">
                Manage your session and local data. Clearing cache acts as a hard reset for local states.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outlined" 
                  color="inherit"
                  onClick={handleLogout}
                  startIcon={<LogOut size={18} />}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none', fontWeight: 'bold' }}
                >
                  Logout
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={handleClearData}
                  startIcon={<Trash2 size={18} />}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Clear Cache & Data
                </Button>
              </div>
            </Paper>
          </motion.div>

        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Dialog 
        open={setupModalOpen} 
        onClose={() => setSetupModalOpen(false)}
        PaperProps={{
          style: { backgroundColor: 'var(--color-surface-elevated)', color: 'white', minWidth: '400px' }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Inter', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Set Up Authenticator App</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <p className="text-sm text-slate-300 mb-4">
            Scan the QR code below using Google Authenticator, Authy, or any other TOTP app.
          </p>
          <div className="flex justify-center bg-white p-4 rounded-xl w-max mx-auto mb-4">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupUri)}`} 
              alt="2FA QR Code" 
              className="w-[150px] h-[150px]"
            />
          </div>
          <p className="text-xs text-center text-slate-400 mb-4 font-mono break-all">{setupSecret}</p>
          
          <TextField
            fullWidth
            label="Enter 6-digit code"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            variant="outlined"
            size="small"
            autoComplete="off"
            sx={{ 
                fontFamily: 'Inter',
                '& .MuiOutlinedInput-root': { color: 'white', fontFamily: 'Inter', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' } }, 
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter' },
                '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setSetupModalOpen(false)} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleVerifySetup2FA} variant="contained" sx={{ bgcolor: 'var(--color-primary)' }}>Verify</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const ProfilePageRoute = () => {
  return (
    <main className="flex-1 flex flex-col relative bg-background-dark overflow-y-auto text-white">
      <ProfilePage />
    </main>
  );
};

export default ProfilePageRoute;
