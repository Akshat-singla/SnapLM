import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Chip,
  Paper
} from '@mui/material';

// 🧪 MOCK DATA
const mockProfile = {
  username: 'Aryan Sharma',
  email: 'aryan@snapp.ai',
  projects: [
    {
      project_id: '1',
      name: 'Neural Text Engine',
      node_count: 24,
      created_at: '2026-01-12',
    },
    {
      project_id: '2',
      name: 'Vision Transformer Lab',
      node_count: 18,
      created_at: '2026-02-05',
    },
    {
      project_id: '3',
      name: 'Audio Diffusion Model',
      node_count: 31,
      created_at: '2026-03-20',
    },
  ],
};

// ✨ Animation
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ProfilePage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<typeof mockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // 🌀 Fake load
  useEffect(() => {
    setTimeout(() => {
      setProfile(mockProfile);
      setEditUsername(mockProfile.username);
      setEditEmail(mockProfile.email);
      setLoading(false);
    }, 400);
  }, []);

  // 💾 Fake save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      setProfile((prev) =>
        prev
          ? {
            ...prev,
            username: editUsername,
            email: editEmail,
          }
          : prev
      );
      setSaving(false);
    }, 800);
  };

  const openProject = (id: string) => {
    navigate('/app');
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
                {profile?.username?.[0]}
              </Avatar>

              <h2 className="font-display text-2xl font-bold mb-1">{profile?.username}</h2>
              <p className="font-body text-text-secondary text-sm mb-4">
                {profile?.email}
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
                {profile?.projects.map((p) => (
                  <Box
                    key={p.project_id}
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
                        {p.node_count} nodes • Created {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button 
                      onClick={() => openProject(p.project_id)}
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
                ))}
              </div>
            </Paper>
          </motion.div>

        </div>
      </div>
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
