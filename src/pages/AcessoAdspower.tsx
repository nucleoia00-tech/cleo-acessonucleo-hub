import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/Logo';
import { Copy, ExternalLink, Key } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AcessoAdspower() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showCredentials, setShowCredentials] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string | null>(null);

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

  // Verifica se as credenciais foram atualizadas pelo admin
  useEffect(() => {
    if (credenciais?.ultima_atualizacao && lastGeneratedTime) {
      const credentialsUpdated = new Date(credenciais.ultima_atualizacao);
      const lastGenerated = new Date(lastGeneratedTime);
      
      // Se as credenciais foram atualizadas após a última geração do usuário
      if (credentialsUpdated > lastGenerated) {
        setShowCredentials(false);
        toast({
          title: "Credenciais atualizadas",
          description: "O administrador atualizou as credenciais. Clique em 'Gerar Senha' novamente.",
          variant: "default"
        });
      }
    }
  }, [credenciais?.ultima_atualizacao, lastGeneratedTime, toast]);

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

  const handleGeneratePassword = async () => {
    setIsGenerating(true);
    
    // Simula o processo de geração da senha com delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const currentTime = new Date().toISOString();
    setLastGeneratedTime(currentTime);
    setIsGenerating(false);
    setShowCredentials(true);
    
    toast({
      title: "Credenciais geradas",
      description: "Suas credenciais exclusivas foram geradas com sucesso!",
    });
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
              Acesso Dicloack
            </h1>
            <p className="text-muted-foreground">
              Use os dados abaixo para entrar na conta Membro do Dicloack
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
                  {/* Generate Password Button State */}
                  {!showCredentials && !isGenerating && (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border border-primary/30">
                          <Key className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Gere suas credenciais exclusivas
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Clique no botão abaixo para gerar suas credenciais de acesso personalizadas
                      </p>
                      <Button 
                        onClick={handleGeneratePassword}
                        className="bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-primary-foreground px-8 py-3"
                        size="lg"
                      >
                        <Key className="w-5 h-5 mr-2" />
                        Gerar Senha
                      </Button>
                    </div>
                  )}

                  {/* Generating Animation State */}
                  {isGenerating && (
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <div className="flex justify-center mb-4">
                          <div className="p-4 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 animate-pulse">
                            <Key className="w-6 h-6 text-primary animate-spin" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground animate-pulse">
                          Gerando suas credenciais exclusivas...
                        </p>
                      </div>
                      
                      {/* Email Skeleton */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-lg" />
                      </div>

                      {/* Password Skeleton */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-lg" />
                      </div>
                    </div>
                  )}

                  {/* Credentials Display State */}
                  {showCredentials && (
                    <>
                      {/* Success Animation */}
                      <div className="text-center py-4 animate-fade-in">
                        <div className="flex justify-center mb-2">
                          <div className="p-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                            <Key className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <p className="text-sm text-green-600 font-medium mb-4">
                          ✓ Credenciais geradas com sucesso!
                        </p>
                      </div>

                      {/* Email Login */}
                      <div className="space-y-3 animate-fade-in">
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
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Senha:</label>
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
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                          <code className="text-sm font-mono text-foreground">
                            {credenciais?.senha_atual || 'Carregando...'}
                          </code>
                        </div>
                      </div>

                      {/* Last Update Info */}
                      {credenciais?.ultima_atualizacao && (
                        <div className="pt-4 border-t border-border animate-fade-in">
                          <p className="text-sm text-muted-foreground text-center">
                            Última atualização: {new Date(credenciais.ultima_atualizacao).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg p-4 border border-primary/20 animate-fade-in">
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}