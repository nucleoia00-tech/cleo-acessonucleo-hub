import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'assinante';
  requiredStatus?: 'ativo' | 'pendente';
}

export function ProtectedRoute({ children, requiredRole, requiredStatus }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('assinantes')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Loading states
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // No profile found
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to="/acesso-negado" replace />;
  }

  // Check if subscription is expired and suspend automatically
  const isExpired = profile.data_expiracao && new Date(profile.data_expiracao) < new Date();
  if (isExpired && profile.status === 'ativo') {
    // Trigger status update to suspended for expired active subscriptions
    supabase
      .from('assinantes')
      .update({ status: 'suspenso' })
      .eq('user_id', user.id)
      .then(() => {
        // Refresh the page to reflect the new status
        window.location.reload();
      });
  }

  // Check status requirement
  if (requiredStatus && profile.status !== requiredStatus) {
    if (profile.status === 'pendente') {
      return <Navigate to="/aguardando" replace />;
    }
    if (profile.status === 'suspenso' || profile.status === 'rejeitado') {
      return <Navigate to="/bloqueado" replace />;
    }
    return <Navigate to="/acesso-negado" replace />;
  }

  // Admin access - always allowed regardless of status
  if (profile.role === 'admin') {
    return <>{children}</>;
  }

  // For assinante role, check if active or if expired
  if (profile.role === 'assinante') {
    // If expired, treat as suspended
    if (isExpired || profile.status !== 'ativo') {
      if (profile.status === 'pendente') {
        return <Navigate to="/aguardando" replace />;
      }
      if (profile.status === 'suspenso' || profile.status === 'rejeitado' || isExpired) {
        return <Navigate to="/bloqueado" replace />;
      }
    }
  }

  return <>{children}</>;
}