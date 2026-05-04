import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading, checkAuth } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login', { state: { from: location.pathname + location.search } });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
