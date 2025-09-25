import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Clock } from 'lucide-react';

export default function Cadastro() {
  const { user, signUp, loading } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [plano, setPlano] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha || !confirmarSenha || !plano) return;
    
    if (senha !== confirmarSenha) {
      // O useAuth já vai mostrar o erro via toast
      return;
    }

    setIsSubmitting(true);
    await signUp(email, senha, nome, plano);
    setIsSubmitting(false);
  };

  const getPlanInfo = (planType: string) => {
    const plans = {
      mensal: { duration: '1 mês', price: 'R$ 97/mês' },
      trimestral: { duration: '3 meses', price: 'R$ 267 (R$ 89/mês)' },
      semestral: { duration: '6 meses', price: 'R$ 497 (R$ 82,83/mês)' }
    };
    return plans[planType as keyof typeof plans] || { duration: '', price: '' };
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
            <span className="text-muted-foreground">Já tem conta?</span>
            <Button variant="outline" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription>
              Preencha os dados para solicitar acesso ao Núcleo IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="bg-background border-border"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme sua senha"
                    required
                    className={`bg-background border-border pr-10 ${
                      confirmarSenha && senha !== confirmarSenha 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {confirmarSenha && senha !== confirmarSenha && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Selecionar Plano</Label>
                <Select onValueChange={setPlano} required>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Escolha seu plano de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">Mensal</div>
                          <div className="text-sm text-muted-foreground">R$ 97/mês</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="trimestral">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-accent" />
                        <div>
                          <div className="font-medium">Trimestral</div>
                          <div className="text-sm text-muted-foreground">R$ 267 (R$ 89/mês)</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="semestral">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="font-medium">Semestral</div>
                          <div className="text-sm text-muted-foreground">R$ 497 (R$ 82,83/mês)</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {plano && (
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <p className="text-sm font-medium text-primary">
                      Plano {plano.charAt(0).toUpperCase() + plano.slice(1)} selecionado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {getPlanInfo(plano).duration} • {getPlanInfo(plano).price}
                    </p>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="gradient"
                disabled={isSubmitting || !nome || !email || !senha || !confirmarSenha || senha !== confirmarSenha || !plano}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Enviando...
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Ao se cadastrar, você concorda com nossos{' '}
                <Link to="/termos" className="text-primary hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}