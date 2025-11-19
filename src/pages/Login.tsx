import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      const { loginSchema } = await import('@/lib/validations');
      loginSchema.parse({ 
        email: email.trim().toLowerCase(), 
        senha 
      });
    } catch (error: any) {
      if (error.errors && error.errors[0]) {
        toast({ title: "Erro de validação", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Erro", description: "Erro na validação dos dados", variant: "destructive" });
      }
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(email.trim().toLowerCase(), senha);
    setIsSubmitting(false);

    if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('email not confirmed')) {
      setPendingConfirm(true);
      toast({
        title: 'E-mail não confirmado',
        description: 'Confirme seu e-mail para continuar. Você pode reenviar abaixo.',
      });
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: 'Informe seu e-mail',
        description: 'Preencha o e-mail para reenviar a confirmação.',
        variant: 'destructive',
      });
      return;
    }
    setResending(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    setResending(false);

    if (error) {
      toast({
        title: 'Falha ao reenviar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Confirmação enviada',
        description: 'Verifique sua caixa de entrada e a pasta de spam.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Não tem conta?</span>
            <Button variant="outline" asChild>
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
            <CardDescription>
              Faça login para acessar o Núcleo IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingConfirm && (
              <Alert className="mb-4">
                <AlertTitle>E-mail não confirmado</AlertTitle>
                <AlertDescription>
                  Confirme seu e-mail para entrar. Não recebeu?
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResend}
                    disabled={resending}
                    className="px-2"
                  >
                    {resending ? 'Reenviando...' : 'Reenviar confirmação'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="bg-background border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link 
                  to="/esqueci-senha" 
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="gradient"
                disabled={isSubmitting || !email || !senha}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}