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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/Logo';
import { Settings, Users, Eye, EyeOff, Check, X, Clock, UserMinus, Calendar, RotateCcw, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { planOptions, getPlanInfo, calculateExpirationDate, getPlanBadgeVariant } from '@/utils/planUtils';

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
  const [dataExpiracao, setDataExpiracao] = useState('');
  const [showExpirationModal, setShowExpirationModal] = useState(false);

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
    mutationFn: async ({ id, status, observacao, memberData }: { id: string; status: string; observacao?: string; memberData?: any }) => {
      const updates: any = { status };
      if (observacao !== undefined) {
        updates.observacao_admin = observacao;
      }
      
      const { error } = await supabase
        .from('assinantes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;

      // Enviar notificação por email se o status for 'ativo' (aprovado)
      if (status === 'ativo' && memberData) {
        try {
          const { error: emailError } = await supabase.functions.invoke('enviar-notificacao-aprovacao', {
            body: {
              email: memberData.email,
              nome: memberData.nome
            }
          });
          
          if (emailError) {
            console.error('Erro ao enviar notificação por email:', emailError);
            // Não vamos falhar a operação se o email não for enviado
          }
        } catch (emailError) {
          console.error('Erro ao enviar notificação por email:', emailError);
        }
      }
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

  // Mutation to update member plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, plano, autoCalculateExpiration = false }: { id: string; plano: string | null; autoCalculateExpiration?: boolean }) => {
      const updates: any = { plano };
      
      // Auto calculate expiration if requested
      if (autoCalculateExpiration && plano) {
        const expirationDate = calculateExpirationDate(plano);
        if (expirationDate) {
          updates.data_expiracao = expirationDate.toISOString();
        }
      }
      
      const { error } = await supabase
        .from('assinantes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Plano atualizado",
        description: "O plano do assinante foi atualizado com sucesso.",
      });
      refetchAssinantes();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation to update expiration date
  const updateExpirationMutation = useMutation({
    mutationFn: async ({ id, data_expiracao }: { id: string; data_expiracao: string | null }) => {
      const { error } = await supabase
        .from('assinantes')
        .update({ data_expiracao })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Data de expiração atualizada",
        description: "A data de expiração foi atualizada com sucesso.",
      });
      refetchAssinantes();
      setShowExpirationModal(false);
      setSelectedMember(null);
      setDataExpiracao('');
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
      updateMemberMutation.mutate({ id: member.id, status, memberData: member });
    } else {
      // For reject/suspend, we'll show a modal or inline form for observacao
      updateMemberMutation.mutate({ 
        id: member.id, 
        status, 
        observacao: observacao || `Status alterado para ${status}`,
        memberData: member
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

  const handleExpirationModal = (member: any) => {
    setSelectedMember(member);
    const currentExpiration = member.data_expiracao 
      ? new Date(member.data_expiracao).toISOString().slice(0, 16)
      : '';
    setDataExpiracao(currentExpiration);
    setShowExpirationModal(true);
  };

  const handleSaveExpiration = () => {
    if (!selectedMember) return;
    
    updateExpirationMutation.mutate({
      id: selectedMember.id,
      data_expiracao: dataExpiracao || null
    });
  };

  const handleApplyPlan = (member: any, planType: string) => {
    updatePlanMutation.mutate({
      id: member.id,
      plano: planType,
      autoCalculateExpiration: true
    });
  };

  const handlePlanChange = (member: any, planType: string | null) => {
    updatePlanMutation.mutate({
      id: member.id,
      plano: planType
    });
  };

  const getPlanBadge = (plano: string | null) => {
    if (!plano) {
      return <Badge variant="outline" className="text-muted-foreground">Não definido</Badge>;
    }
    
    const planInfo = getPlanInfo(plano);
    if (!planInfo) {
      return <Badge variant="outline">{plano}</Badge>;
    }
    
    return (
      <Badge variant={getPlanBadgeVariant(plano)} className="flex items-center gap-1">
        <CreditCard className="w-3 h-3" />
        {planInfo.label}
      </Badge>
    );
  };

  const handleExtendAccess = (member: any, months: number) => {
    const currentDate = member.data_expiracao 
      ? new Date(member.data_expiracao)
      : new Date();
    
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + months);
    
    updateExpirationMutation.mutate({
      id: member.id,
      data_expiracao: newDate.toISOString()
    });
  };

  const isExpired = (dataExpiracao: string | null) => {
    if (!dataExpiracao) return false;
    return new Date(dataExpiracao) < new Date();
  };

  const getExpirationStatus = (dataExpiracao: string | null, status: string) => {
    if (!dataExpiracao && status === 'ativo') {
      return <Badge variant="secondary">Sem expiração</Badge>;
    }
    
    if (!dataExpiracao) return null;
    
    const expired = isExpired(dataExpiracao);
    const date = new Date(dataExpiracao).toLocaleDateString('pt-BR');
    
    return (
      <Badge variant={expired ? "destructive" : "default"}>
        {expired ? `Expirou em ${date}` : `Expira em ${date}`}
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
                        <TableHead>Plano</TableHead>
                        <TableHead>Expiração</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPlanBadge(member.plano)}
                              {member.status === 'ativo' && (
                                <Select
                                  value={member.plano || ''}
                                  onValueChange={(value) => handlePlanChange(member, value || null)}
                                  disabled={updatePlanMutation.isPending}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue placeholder="Definir plano" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Nenhum</SelectItem>
                                    {planOptions.map(plan => (
                                      <SelectItem key={plan.value} value={plan.value}>
                                        {plan.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getExpirationStatus(member.data_expiracao, member.status)}
                          </TableCell>
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
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Status Management Buttons */}
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
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Reativar
                                </Button>
                              )}
                              {(member.status === 'pendente' || member.status === 'suspenso') && (
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
                              
                              {/* Plan Management Buttons */}
                              {member.plano && member.status === 'ativo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApplyPlan(member, member.plano)}
                                  disabled={updatePlanMutation.isPending}
                                  className="text-xs"
                                >
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Aplicar {getPlanInfo(member.plano)?.label}
                                </Button>
                              )}
                              
                              {/* Expiration Management Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExpirationModal(member)}
                                disabled={updateExpirationMutation.isPending}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Data
                              </Button>
                              
                              {/* Quick extend buttons */}
                              {member.status === 'ativo' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleExtendAccess(member, 1)}
                                    disabled={updateExpirationMutation.isPending}
                                    className="text-xs px-2"
                                  >
                                    +1M
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleExtendAccess(member, 3)}
                                    disabled={updateExpirationMutation.isPending}
                                    className="text-xs px-2"
                                  >
                                    +3M
                                  </Button>
                                </>
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

      {/* Expiration Management Modal */}
      <Dialog open={showExpirationModal} onOpenChange={setShowExpirationModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Gerenciar Data de Expiração</DialogTitle>
            <DialogDescription>
              {selectedMember && `Configurar expiração para ${selectedMember.nome}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-expiracao">Data e Hora de Expiração</Label>
              <Input
                id="data-expiracao"
                type="datetime-local"
                value={dataExpiracao}
                onChange={(e) => setDataExpiracao(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            
            {/* Quick actions for plan-based extensions */}
            {selectedMember?.plano && (
              <div className="space-y-2">
                <Label>Ações Rápidas baseadas no plano atual: {getPlanInfo(selectedMember.plano)?.label}</Label>
                <div className="flex gap-2 flex-wrap">
                  {planOptions.map(plan => (
                    <Button
                      key={plan.value}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newDate = calculateExpirationDate(plan.value, selectedMember.data_expiracao ? new Date(selectedMember.data_expiracao) : undefined);
                        if (newDate) {
                          setDataExpiracao(newDate.toISOString().slice(0, 16));
                        }
                      }}
                    >
                      Estender {plan.label} (+{plan.months}M)
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpirationModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveExpiration}
              disabled={updateExpirationMutation.isPending}
            >
              {updateExpirationMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}