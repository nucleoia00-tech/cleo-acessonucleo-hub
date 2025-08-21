import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';

const Index = () => {
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

  // Loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </a>
              <a 
                href="/cadastro" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gradient-to-r from-primary via-accent to-secondary text-white hover:shadow-glow px-4 py-2 transition-all duration-300"
              >
                Cadastrar
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Bem-vindo ao Núcleo IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A plataforma inteligente para gerenciamento de credenciais e automação. 
              Acesse ferramentas avançadas com segurança e eficiência.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a 
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gradient-to-r from-primary via-accent to-secondary text-white hover:shadow-glow px-8 py-3 transition-all duration-300"
              >
                Começar Agora
              </a>
              <a 
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent hover:text-accent-foreground px-8 py-3 transition-colors"
              >
                Já Tenho Conta
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated users - redirect based on profile
  if (profile) {
    // Admin redirect
    if (user.email === 'castroweverton001@gmail.com' || profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    // Member redirects based on status
    if (profile.role === 'assinante') {
      if (profile.status === 'ativo') {
        return <Navigate to="/acesso-adspower" replace />;
      }
      if (profile.status === 'pendente') {
        return <Navigate to="/aguardando" replace />;
      }
      if (profile.status === 'suspenso' || profile.status === 'rejeitado') {
        return <Navigate to="/bloqueado" replace />;
      }
    }
  }

  // Fallback - redirect to login
  return <Navigate to="/login" replace />;
};

export default Index;
