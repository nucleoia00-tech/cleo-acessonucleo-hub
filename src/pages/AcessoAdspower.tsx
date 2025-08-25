import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';

export default function AcessoAdspower() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch credenciais AdsPower
  const { data: credenciais, isLoading, error } = useQuery({
    queryKey: ['credenciais-adspower'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credenciais_adspower')
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao buscar credenciais AdsPower:', error);
        throw error;
      }
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleCopyPassword = async () => {
    if (credenciais?.senha_atual) {
      try {
        await navigator.clipboard.writeText(credenciais.senha_atual);
        toast({
          title: "Senha copiada",
          description: "A senha foi copiada para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar a senha.",
          variant: "destructive"
        });
      }
    }
  };

  const handleCopyEmail = async () => {
    if (credenciais?.email_login) {
      try {
        await navigator.clipboard.writeText(credenciais.email_login);
        toast({
          title: "E-mail copiado",
          description: "O e-mail foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o e-mail.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Área do Assinante</span>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Acesso AdsPower
            </h1>
            <p className="text-muted-foreground">
              Use os dados abaixo para entrar na conta Membro do AdsPower
            </p>
          </div>

          <Card className="bg-card border-border shadow-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Credenciais de Acesso
              </CardTitle>
              <CardDescription>
                Credenciais atualizadas automaticamente pela administração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando credenciais...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">Erro ao carregar credenciais</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique se você tem permissão para acessar esta área.
                  </p>
                </div>
              )}

              {/* Success State */}
              {!isLoading && !error && credenciais && (
                <>
                  {/* Email Login */}
                  <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">E-mail de login:</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="text-primary hover:text-primary/80"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <code className="text-sm font-mono text-foreground">
                    {credenciais?.email_login || 'Carregando...'}
                  </code>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Senha:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Mostrar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPassword}
                      className="text-primary hover:text-primary/80"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <code className="text-sm font-mono text-foreground">
                    {showPassword 
                      ? (credenciais?.senha_atual || 'Carregando...') 
                      : '•'.repeat(credenciais?.senha_atual?.length || 8)
                    }
                  </code>
                </div>
              </div>

              {/* Last Update Info */}
              {credenciais?.ultima_atualizacao && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Última atualização: {new Date(credenciais.ultima_atualizacao).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Como usar:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Copie o e-mail e a senha acima</li>
                  <li>2. Acesse a plataforma AdsPower</li>
                  <li>3. Faça login com as credenciais fornecidas</li>
                  <li>4. As credenciais são atualizadas automaticamente</li>
                </ol>
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}