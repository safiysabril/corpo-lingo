import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, data } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Sparkles className="w-8 h-8 animate-pulse text-primary" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // Only redirect when we positively know the user is not authenticated (data === null).
  // Do not redirect on network errors or rate-limit responses — that would appear as a logout.
  if (!isLoading && !isError && !data) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
