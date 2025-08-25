import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { Settings, Users, Eye, EyeOff, Check, X, Clock, UserMinus } from 'lucide-react';

export default function PainelAdmin() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Credenciais AdsPower state
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal state for member management
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [observacao, setObservacao] = useState('');
  const [emailQuery, setEmailQuery] = useState('');

  // Fetch credenciais AdsPower
  const { data: credenciais, refetch: refetchCredenciais } = useQuery({
    queryKey: ['credenciais-adspower'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credenciais_adspower')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch assinantes
  const { data: assinantes, refetch: refetchAssinantes } = useQuery({
    queryKey: ['assinantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinantes')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Set initial values when credenciais loads
  useState(() => {
    if (credenciais) {
      setEmailLogin(credenciais.email_login || '');
      setSenhaAtual(credenciais.senha_atual || '');
    }
  });

  // Mutation to update credenciais
  const updateCredenciaisMutation = useMutation({
    mutationFn: async ({ email_login, senha_atual }: { email_login: string; senha_atual: string }) => {
      const { error } = await supabase
        .from('credenciais_adspower')
        .update({
          email_login,
          senha_atual,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', credenciais?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Credenciais atualizadas",
        description: "As credenciais do AdsPower foram atualizadas com sucesso.",
      });
      refetchCredenciais();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation to update member status
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, status, observacao }: { id: string; status: string; observacao?: string }) => {
      const updates: any = { status };
      if (observacao !== undefined) {
        updates.observacao_admin = observacao;
      }
      
      const { error } = await supabase
        .from('assinantes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do assinante foi atualizado com sucesso.",
      });
      refetchAssinantes();
      setSelectedMember(null);
      setObservacao('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveCredenciais = () => {
    updateCredenciaisMutation.mutate({
      email_login: emailLogin,
      senha_atual: senhaAtual
    });
  };

  const handleUpdateMemberStatus = (member: any, status: string) => {
    setSelectedMember(member);
    setObservacao(member.observacao_admin || '');
    
    if (status === 'ativo') {
      updateMemberMutation.mutate({ id: member.id, status });
    } else {
      // For reject/suspend, we'll show a modal or inline form for observacao
      updateMemberMutation.mutate({ 
        id: member.id, 
        status, 
        observacao: observacao || `Status alterado para ${status}` 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: { variant: 'secondary' as const, icon: Clock },
      ativo: { variant: 'default' as const, icon: Check },
      suspenso: { variant: 'destructive' as const, icon: UserMinus },
      rejeitado: { variant: 'destructive' as const, icon: X }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pendente;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Painel do Administrador</span>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel do Administrador</h1>
          <p className="text-muted-foreground">Gerencie credenciais e assinantes do Núcleo IA</p>
          
          {/* Active Members Counter */}
          <div className="mt-4">
            <Card className="bg-card border-border inline-block">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membros Ativos</p>
                    <p className="text-2xl font-bold text-primary">
                      {assinantes?.filter(member => member.status === 'ativo').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="credenciais" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credenciais" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Acesso AdsPower
            </TabsTrigger>
            <TabsTrigger value="assinantes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gestão de Assinantes
            </TabsTrigger>
          </TabsList>

          {/* Credenciais AdsPower Tab */}
          <TabsContent value="credenciais">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Acesso AdsPower</CardTitle>
                <CardDescription>
                  Use esta seção para alterar o e-mail e a senha da conta Membro. 
                  A alteração é refletida imediatamente para os assinantes ativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">E-mail de Login</Label>
                  <Input
                    id="email-login"
                    type="email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    placeholder="conta.membro@dominio.com"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="senha-atual"
                      type={showPassword ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Senha123!"
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

                {credenciais?.ultima_atualizacao && (
                  <p className="text-sm text-muted-foreground">
                    Última atualização: {new Date(credenciais.ultima_atualizacao).toLocaleString('pt-BR')}
                  </p>
                )}

                <Button 
                  variant="gradient" 
                  onClick={handleSaveCredenciais}
                  disabled={updateCredenciaisMutation.isPending}
                >
                  {updateCredenciaisMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assinantes Tab */}
          <TabsContent value="assinantes">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Gestão de Assinantes</CardTitle>
                <CardDescription>
                  Gerencie os usuários cadastrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3">
                  <Label htmlFor="busca-email" className="whitespace-nowrap">Buscar por e-mail</Label>
                  <Input
                    id="busca-email"
                    value={emailQuery}
                    onChange={(e) => setEmailQuery(e.target.value)}
                    placeholder="ex: usuario@dominio.com"
                    className="max-w-md bg-background border-border"
                  />
                </div>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assinantes
                        ?.filter((member) =>
                          (member.email || '').toLowerCase().includes(emailQuery.trim().toLowerCase())
                        )
                        .map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.nome}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.ultimo_login 
                              ? new Date(member.ultimo_login).toLocaleString('pt-BR')
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(member.criado_em).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {member.status === 'pendente' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleUpdateMemberStatus(member, 'ativo')}
                                  disabled={updateMemberMutation.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Aprovar
                                </Button>
                              )}
                               {member.status === 'ativo' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUpdateMemberStatus(member, 'suspenso')}
                                  disabled={updateMemberMutation.isPending}
                                >
                                  <UserMinus className="w-3 h-3 mr-1" />
                                  Suspender
                                </Button>
                              )}
                              {member.status === 'suspenso' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleUpdateMemberStatus(member, 'ativo')}
                                  disabled={updateMemberMutation.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Reativar
                                </Button>
                              )}
                              {member.status !== 'rejeitado' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUpdateMemberStatus(member, 'rejeitado')}
                                  disabled={updateMemberMutation.isPending}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Rejeitar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}