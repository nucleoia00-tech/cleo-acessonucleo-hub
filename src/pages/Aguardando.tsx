
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Aguardando() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

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
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Cadastro Realizado!</CardTitle>
            <CardDescription>
              Retorne à página de login para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Seu cadastro foi concluído com sucesso! Se você já realizou a compra na Lastlink, 
              faça login para ter acesso imediato ao Núcleo IA.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Mail className="w-4 h-4" />
                <span>Como acessar?</span>
              </div>
              <ul className="text-sm text-left space-y-1 text-muted-foreground">
                <li>• Clique no botão abaixo para ir ao login</li>
                <li>• Use o email cadastrado na Lastlink</li>
                <li>• Sua conta será aprovada automaticamente</li>
              </ul>
            </div>

            <Button 
              variant="gradient" 
              onClick={() => {
                console.log('Navegando para login...');
                navigate('/login', { replace: true });
              }} 
              className="w-full"
              type="button"
            >
              Ir para Login
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="w-full"
              type="button"
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
