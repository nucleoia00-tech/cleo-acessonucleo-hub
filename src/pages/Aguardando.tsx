
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Mail } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Aguardando() {
  const { signOut, user } = useAuth();

  // Listener em tempo real para detectar quando o status mudar para "ativo"
  useEffect(() => {
    if (!user?.id) return;

    console.log('Iniciando listener de atualização de status para usuário:', user.id);

    const channel = supabase
      .channel('status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assinantes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Atualização detectada:', payload);
          const newStatus = payload.new?.status;
          
          if (newStatus === 'ativo') {
            console.log('Status mudou para ativo! Recarregando página...');
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo listener de status');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    console.log('Botão sair clicado - iniciando logout');
    try {
      await signOut();
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro durante logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary via-accent to-secondary rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Aguardando Aprovação</CardTitle>
            <CardDescription>
              Seu cadastro está em análise
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Recebemos seu cadastro e nossa equipe está analisando suas informações. 
              Você será notificado por email assim que o processo for concluído.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="w-4 h-4" />
                <span>O que acontece agora?</span>
              </div>
              <ul className="text-sm text-left space-y-1 text-muted-foreground">
                <li>• Nossa equipe verificará suas informações</li>
                <li>• Você receberá um email com o resultado</li>
                <li>• O processo pode levar até 24 horas</li>
              </ul>
            </div>

            <Button variant="outline" onClick={handleSignOut} className="w-full">
              Fazer Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
