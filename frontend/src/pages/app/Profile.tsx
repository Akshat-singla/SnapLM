import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  USER_ID_STORAGE_KEY,
  userApi,
  type UserProfile,
} from '../../services/api/client';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { addToast, setCurrentProject, fetchProjects } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const userId = localStorage.getItem(USER_ID_STORAGE_KEY);

  const load = useCallback(async () => {
    if (!localStorage.getItem(USER_ID_STORAGE_KEY)) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const p = await userApi.getProfile();
      setProfile(p);
      setEditUsername(p.username);
      setEditEmail(p.email);
    } catch {
      setProfile(null);
      addToast({ type: 'error', message: 'Could not load profile. Register or sign in again.' });
      localStorage.removeItem(USER_ID_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load, userId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim()) return;
    setSaving(true);
    try {
      const p = await userApi.register(regUsername.trim(), regEmail.trim());
      localStorage.setItem(USER_ID_STORAGE_KEY, p.user_id);
      setProfile(p);
      setEditUsername(p.username);
      setEditEmail(p.email);
      setRegUsername('');
      setRegEmail('');
      addToast({ type: 'success', message: 'Profile created' });
      await fetchProjects();
    } catch {
      addToast({ type: 'error', message: 'Registration failed (username or email may be taken)' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim() || !editEmail.trim()) return;
    setSaving(true);
    try {
      const p = await userApi.updateProfile({
        username: editUsername.trim(),
        email: editEmail.trim(),
      });
      setProfile(p);
      addToast({ type: 'success', message: 'Profile updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const openProject = async (projectId: string) => {
    navigate('/app');
    await setCurrentProject(projectId);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-auto bg-background-dark text-white p-8 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 w-fit"
      >
        <ArrowLeft size={18} />
        Back to canvas
      </button>

      <h1 className="text-3xl font-bold mb-2">Profile</h1>
      <p className="text-slate-400 mb-8">Manage your account and browse projects you own.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={20} />
          Loading…
        </div>
      ) : !profile ? (
        <div className="rounded-xl border border-surface-border bg-surface-dark/40 p-6">
          <h2 className="text-lg font-semibold mb-4">Create your profile</h2>
          <p className="text-slate-400 text-sm mb-4">
            Register once on this device. We store your user id in the browser and send it as{' '}
            <code className="text-xs bg-black/30 px-1 rounded">X-User-Id</code> on API requests so
            projects are associated with you.
          </p>
          <form onSubmit={handleRegister} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Username</label>
              <input
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full rounded-lg bg-background-dark border border-surface-border px-3 py-2 text-sm"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-lg bg-background-dark border border-surface-border px-3 py-2 text-sm"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create profile'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-surface-border bg-surface-dark/40 p-6">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Username</label>
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-lg bg-background-dark border border-surface-border px-3 py-2 text-sm"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg bg-background-dark border border-surface-border px-3 py-2 text-sm"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-dark/40 p-6">
            <h2 className="text-lg font-semibold mb-4">Your projects</h2>
            {profile.projects.length === 0 ? (
              <p className="text-slate-400 text-sm">No projects yet. Create one from the toolbar.</p>
            ) : (
              <ul className="divide-y divide-surface-border rounded-lg border border-surface-border overflow-hidden">
                {profile.projects.map((p) => (
                  <li
                    key={p.project_id}
                    className="flex items-center justify-between gap-4 px-4 py-3 bg-background-dark/50"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.node_count} nodes · {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openProject(p.project_id)}
                      className="shrink-0 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePageRoute = () => {
  return (
    <main className="flex-1 relative bg-background-dark overflow-hidden">
      <ProfilePage />
    </main>
  );
};

export default ProfilePageRoute;