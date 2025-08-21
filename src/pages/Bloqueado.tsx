import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XCircle, Mail } from 'lucide-react';

export default function Bloqueado() {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
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

  const isRejected = profile?.status === 'rejeitado';
  const isSuspended = profile?.status === 'suspenso';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso Bloqueado</CardTitle>
            <CardDescription>
              {isRejected ? 'Sua solicitação foi rejeitada' : 'Sua conta foi suspensa'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {isRejected 
                ? 'Infelizmente, sua solicitação de acesso ao Núcleo IA não foi aprovada.'
                : 'Sua conta foi temporariamente suspensa. Contate o suporte para mais informações.'
              }
            </p>
            
            {profile?.observacao_admin && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Observação do Administrador</span>
                </div>
                <p className="text-sm text-left text-muted-foreground">
                  {profile.observacao_admin}
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="w-4 h-4" />
                <span>Precisa de ajuda?</span>
              </div>
              <p className="text-sm text-left text-muted-foreground">
                Entre em contato conosco através do email{' '}
                <span className="text-primary font-medium">suporte@nucleoia.com.br</span>
                {' '}para esclarecimentos.
              </p>
            </div>

            <Button variant="outline" onClick={signOut} className="w-full">
              Fazer Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}