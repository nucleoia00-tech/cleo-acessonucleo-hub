import { useState, useEffect } from 'react';
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
import { Settings, Users, Eye, EyeOff, Check, X, Clock, UserMinus, Calendar, RotateCcw, Copy, BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Plus, Edit, Trash2, Receipt } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
  const [orderByExpiration, setOrderByExpiration] = useState(false);

  // Monthly expenses state
  const [gastosOperacionais, setGastosOperacionais] = useState<Array<{
    id: string;
    nome: string;
    valor: number;
    ativo: boolean;
  }>>([]);
  const [showGastosModal, setShowGastosModal] = useState(false);
  const [novoGasto, setNovoGasto] = useState({ nome: '', valor: '' });
  const [editandoGasto, setEditandoGasto] = useState<string | null>(null);

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

  // Initialize monthly expenses from localStorage
  useEffect(() => {
    const savedGastos = localStorage.getItem('gastosOperacionais');
    if (savedGastos) {
      setGastosOperacionais(JSON.parse(savedGastos));
    } else {
      // Set initial predefined expenses
      const gastosIniciais = [
        { id: '1', nome: 'LEONARDO IA', valor: 160.00, ativo: true },
        { id: '2', nome: 'MIDJOURNEY', valor: 350.00, ativo: true },
        { id: '3', nome: 'FREEPIK', valor: 197.00, ativo: true },
        { id: '4', nome: 'HEY GEN', valor: 320.00, ativo: true },
        { id: '5', nome: 'CHAT GPT4', valor: 119.00, ativo: true },
        { id: '6', nome: 'HAILUO', valor: 700.00, ativo: true },
        { id: '7', nome: 'GAMMA IA', valor: 80.00, ativo: true }
      ];
      setGastosOperacionais(gastosIniciais);
      localStorage.setItem('gastosOperacionais', JSON.stringify(gastosIniciais));
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (gastosOperacionais.length > 0) {
      localStorage.setItem('gastosOperacionais', JSON.stringify(gastosOperacionais));
    }
  }, [gastosOperacionais]);

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

  // Mutation to update plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, plano }: { id: string; plano: string }) => {
      const { error } = await supabase
        .from('assinantes')
        .update({ plano })
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

  const handleUpdatePlan = (memberId: string, newPlan: string) => {
    updatePlanMutation.mutate({
      id: memberId,
      plano: newPlan
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

  // Filter expired members
  const assinantesExpirados = assinantes?.filter(member => 
    member.status === 'ativo' && isExpired(member.data_expiracao)
  ) || [];

  // Filter active members (not expired)
  const assinantesAtivos = assinantes?.filter(member => 
    member.status === 'ativo' && !isExpired(member.data_expiracao)
  ) || [];

  // Copy individual email function
  const copyIndividualEmail = async (email: string, nome: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: "Email copiado!",
        description: `Email de ${nome} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o email.",
        variant: "destructive"
      });
    }
  };

  const getPlanBadge = (plano: string | null) => {
    switch (plano) {
      case 'mensal':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Mensal</Badge>;
      case 'trimestral':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Trimestral</Badge>;
      case 'semestral':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Semestral</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  // Analytics calculations
  const PLANOS = {
    mensal: { valor: 55.00, periodo: 1, cor: 'hsl(215, 70%, 65%)' },
    trimestral: { valor: 109.00, periodo: 3, cor: 'hsl(35, 85%, 60%)' },
    semestral: { valor: 198.00, periodo: 6, cor: 'hsl(145, 60%, 55%)' }
  };

  // Monthly expenses management functions
  const handleAddGasto = () => {
    if (!novoGasto.nome.trim() || !novoGasto.valor || parseFloat(novoGasto.valor) <= 0) {
      toast({
        title: "Erro",
        description: "Preencha o nome e um valor válido.",
        variant: "destructive"
      });
      return;
    }

    const newGasto = {
      id: Date.now().toString(),
      nome: novoGasto.nome.trim(),
      valor: parseFloat(novoGasto.valor),
      ativo: true
    };

    setGastosOperacionais([...gastosOperacionais, newGasto]);
    setNovoGasto({ nome: '', valor: '' });
    
    toast({
      title: "Gasto adicionado",
      description: `${newGasto.nome} foi adicionado aos gastos operacionais.`,
    });
  };

  const handleRemoveGasto = (id: string) => {
    const gasto = gastosOperacionais.find(g => g.id === id);
    setGastosOperacionais(gastosOperacionais.filter(g => g.id !== id));
    
    toast({
      title: "Gasto removido",
      description: `${gasto?.nome} foi removido dos gastos operacionais.`,
    });
  };

  const handleEditGasto = (id: string, nome: string, valor: number) => {
    setGastosOperacionais(gastosOperacionais.map(g => 
      g.id === id ? { ...g, nome, valor } : g
    ));
    setEditandoGasto(null);
    
    toast({
      title: "Gasto atualizado",
      description: "O gasto foi atualizado com sucesso.",
    });
  };

  const getAnalyticsData = () => {
    if (!assinantes) return null;

    const assinantesAtivos = assinantes.filter(member => 
      member.status === 'ativo' && !isExpired(member.data_expiracao)
    );

    // Plan distribution
    const planCounts = {
      mensal: assinantesAtivos.filter(m => m.plano === 'mensal').length,
      trimestral: assinantesAtivos.filter(m => m.plano === 'trimestral').length,
      semestral: assinantesAtivos.filter(m => m.plano === 'semestral').length,
      naoDefinido: assinantesAtivos.filter(m => !m.plano || m.plano === null).length
    };

    // Revenue calculations
    const faturamentoMensal = planCounts.mensal * PLANOS.mensal.valor;
    const faturamentoTrimestral = planCounts.trimestral * PLANOS.trimestral.valor;
    const faturamentoSemestral = planCounts.semestral * PLANOS.semestral.valor;
    const faturamentoTotal = faturamentoMensal + faturamentoTrimestral + faturamentoSemestral;

    // MRR calculation (Monthly Recurring Revenue)
    const mrr = faturamentoMensal + (faturamentoTrimestral / 3) + (faturamentoSemestral / 6);
    const arr = mrr * 12; // Annual Recurring Revenue
    const arpu = assinantesAtivos.length > 0 ? faturamentoTotal / assinantesAtivos.length : 0;

    // Monthly expenses calculations
    const gastosMensaisTotais = gastosOperacionais
      .filter(g => g.ativo)
      .reduce((total, gasto) => total + gasto.valor, 0);
    
    const faturamentoLiquido = faturamentoTotal - gastosMensaisTotais;
    const margemLiquida = faturamentoTotal > 0 ? (faturamentoLiquido / faturamentoTotal) * 100 : 0;

    // Chart data
    const pieChartData = [
      { name: 'Mensal', value: planCounts.mensal, fill: PLANOS.mensal.cor, price: PLANOS.mensal.valor },
      { name: 'Trimestral', value: planCounts.trimestral, fill: PLANOS.trimestral.cor, price: PLANOS.trimestral.valor },
      { name: 'Semestral', value: planCounts.semestral, fill: PLANOS.semestral.cor, price: PLANOS.semestral.valor },
      { name: 'Não definido', value: planCounts.naoDefinido, fill: 'hsl(210, 10%, 60%)', price: 0 }
    ].filter(item => item.value > 0);

    const barChartData = [
      { name: 'Mensal', value: faturamentoMensal, fill: PLANOS.mensal.cor },
      { name: 'Trimestral', value: faturamentoTrimestral, fill: PLANOS.trimestral.cor },
      { name: 'Semestral', value: faturamentoSemestral, fill: PLANOS.semestral.cor }
    ];

    return {
      totalAtivos: assinantesAtivos.length,
      totalPendentes: assinantes.filter(m => m.status === 'pendente').length,
      totalExpirados: assinantes.filter(m => m.status === 'ativo' && isExpired(m.data_expiracao)).length,
      totalSuspensos: assinantes.filter(m => m.status === 'suspenso').length,
      planCounts,
      faturamentoTotal,
      faturamentoMensal,
      faturamentoTrimestral,
      faturamentoSemestral,
      mrr,
      arr,
      arpu,
      gastosMensaisTotais,
      faturamentoLiquido,
      margemLiquida,
      pieChartData,
      barChartData
    };
  };

  const analyticsData = getAnalyticsData();

  // Sort members by expiration date
  const sortedAssinantes = assinantes
    ?.filter((member) =>
      (member.email || '').toLowerCase().includes(emailQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (!orderByExpiration) return 0;
      
      // Members without expiration go to end
      if (!a.data_expiracao && !b.data_expiracao) return 0;
      if (!a.data_expiracao) return 1;
      if (!b.data_expiracao) return -1;
      
      // Sort by expiration date (closest first)
      return new Date(a.data_expiracao).getTime() - new Date(b.data_expiracao).getTime();
    }) || [];

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
                      {assinantes?.filter(member => member.status === 'ativo' && !isExpired(member.data_expiracao)).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="credenciais" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credenciais" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Acesso Dicloack
            </TabsTrigger>
            <TabsTrigger value="assinantes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gestão de Assinantes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Credenciais AdsPower Tab */}
          <TabsContent value="credenciais">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Acesso Dicloack</CardTitle>
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
            {/* Expired Members Alert */}
            {assinantesExpirados.length > 0 && (
              <Card className="mb-6 bg-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Clock className="w-5 h-5" />
                    Assinaturas Expiradas ({assinantesExpirados.length})
                  </CardTitle>
                  <CardDescription>
                    Membros ativos com assinaturas vencidas que precisam de atenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {assinantesExpirados.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                        <div className="flex flex-col">
                          <span className="font-medium">{member.nome}</span>
                          <span className="text-sm text-muted-foreground">{member.email}</span>
                          <span className="text-xs text-destructive">
                            Expirou em {new Date(member.data_expiracao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExpirationModal(member)}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Renovar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateMemberStatus(member, 'suspenso')}
                          >
                            Suspender
                          </Button>
                        </div>
                      </div>
                    ))}
                    {assinantesExpirados.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        E mais {assinantesExpirados.length - 5} membro(s) expirado(s)...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Gestão de Assinantes</CardTitle>
                <CardDescription>
                  Gerencie os usuários cadastrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="busca-email" className="whitespace-nowrap">Buscar por e-mail</Label>
                    <Input
                      id="busca-email"
                      value={emailQuery}
                      onChange={(e) => setEmailQuery(e.target.value)}
                      placeholder="ex: usuario@dominio.com"
                      className="max-w-md bg-background border-border"
                    />
                  </div>
                  <Button
                    variant={orderByExpiration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrderByExpiration(!orderByExpiration)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {orderByExpiration ? 'Ordenação ativa' : 'Ordenar por expiração'}
                  </Button>
                </div>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAssinantes.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.nome}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{member.email}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-60 hover:opacity-100"
                                onClick={() => copyIndividualEmail(member.email, member.nome)}
                                title={`Copiar email de ${member.nome}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell>
                            {getExpirationStatus(member.data_expiracao, member.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPlanBadge(member.plano)}
                              <Select 
                                value={member.plano || ''} 
                                onValueChange={(value) => handleUpdatePlan(member.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mensal">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      Mensal
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="trimestral">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                      Trimestral
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="semestral">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Semestral
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
                              
                              {/* Expiration Management Buttons */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExpirationModal(member)}
                                disabled={updateExpirationMutation.isPending}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Data
                              </Button>
                              
                              {member.status === 'ativo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExtendAccess(member, 1)}
                                  disabled={updateExpirationMutation.isPending}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  +1 mês
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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {analyticsData && (
              <div className="space-y-6">
                {/* Metrics Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Membros Ativos</p>
                          <p className="text-2xl font-bold text-primary">{analyticsData.totalAtivos}</p>
                        </div>
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Faturamento Bruto</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {analyticsData.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Gastos Mensais</p>
                          <p className="text-2xl font-bold text-red-600">
                            R$ {analyticsData.gastosMensaisTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Receipt className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Faturamento Líquido</p>
                          <p className={`text-2xl font-bold ${analyticsData.faturamentoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {analyticsData.faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {analyticsData.faturamentoLiquido >= 0 ? (
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        ) : (
                          <TrendingDown className="w-8 h-8 text-red-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Expenses Management */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="w-5 h-5" />
                          Gastos Operacionais Mensais
                        </CardTitle>
                        <CardDescription>
                          Gerencie os gastos fixos da operação
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowGastosModal(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Gerenciar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {gastosOperacionais.filter(g => g.ativo).map((gasto) => (
                        <div key={gasto.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{gasto.nome}</p>
                            <p className="text-red-600 font-semibold">
                              R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total dos Gastos:</span>
                        <span className="text-xl font-bold text-red-600">
                          R$ {analyticsData.gastosMensaisTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold">Margem Líquida:</span>
                        <span className={`text-lg font-bold ${analyticsData.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analyticsData.margemLiquida.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan Distribution Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Distribuição de Planos
                      </CardTitle>
                      <CardDescription>
                        Quantidade de assinantes por tipo de plano
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          mensal: { label: "Mensal", color: "hsl(215, 70%, 65%)" },
                          trimestral: { label: "Trimestral", color: "hsl(35, 85%, 60%)" },
                          semestral: { label: "Semestral", color: "hsl(145, 60%, 55%)" }
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPieChart data={analyticsData.pieChartData}>
                              {analyticsData.pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </RechartsPieChart>
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload[0]) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium">{data.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {data.value} assinante{data.value !== 1 ? 's' : ''}
                                      </p>
                                      {data.price > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                          R$ {data.price.toFixed(2)} cada
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <ChartLegend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Revenue by Plan Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Faturamento por Plano
                      </CardTitle>
                      <CardDescription>
                        Receita gerada por cada tipo de plano
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          value: { label: "Faturamento", color: "hsl(var(--primary))" }
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.barChartData}>
                            <XAxis dataKey="name" />
                            <YAxis 
                              tickFormatter={(value) => 
                                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                              }
                            />
                            <ChartTooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload[0]) {
                                  return (
                                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium">{label}</p>
                                      <p className="text-sm text-muted-foreground">
                                        R$ {payload[0].value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" fill="var(--color-value)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Details Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plano Mensal</CardTitle>
                      <CardDescription>R$ 55,00 por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Assinantes:</span>
                          <span className="font-medium">{analyticsData.planCounts.mensal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Faturamento:</span>
                          <span className="font-medium text-blue-600">
                            R$ {analyticsData.faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plano Trimestral</CardTitle>
                      <CardDescription>R$ 109,00 por trimestre</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Assinantes:</span>
                          <span className="font-medium">{analyticsData.planCounts.trimestral}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Faturamento:</span>
                          <span className="font-medium text-orange-600">
                            R$ {analyticsData.faturamentoTrimestral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Plano Semestral</CardTitle>
                      <CardDescription>R$ 198,00 por semestre</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Assinantes:</span>
                          <span className="font-medium">{analyticsData.planCounts.semestral}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Faturamento:</span>
                          <span className="font-medium text-green-600">
                            R$ {analyticsData.faturamentoSemestral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Operational Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Status dos Membros
                      </CardTitle>
                      <CardDescription>
                        Distribuição por status atual
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Ativo</Badge>
                        </div>
                        <span className="font-medium">{analyticsData.totalAtivos}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Pendente</Badge>
                        </div>
                        <span className="font-medium">{analyticsData.totalPendentes}</span>
                      </div>
                      
                      {analyticsData.totalExpirados > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Expirado</Badge>
                          </div>
                          <span className="font-medium">{analyticsData.totalExpirados}</span>
                        </div>
                      )}
                      
                      {analyticsData.totalSuspensos > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Suspenso</Badge>
                          </div>
                          <span className="font-medium">{analyticsData.totalSuspensos}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Projeções Financeiras
                      </CardTitle>
                      <CardDescription>
                        Estimativas baseadas na base atual
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Receita Mensal (MRR):</span>
                        <span className="font-medium">
                          R$ {analyticsData.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Receita Anual (ARR):</span>
                        <span className="font-medium">
                          R$ {analyticsData.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Receita Média por Usuário:</span>
                        <span className="font-medium">
                          R$ {analyticsData.arpu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Taxa de Conversão:</span>
                        <span className="font-medium">
                          {((analyticsData.totalAtivos / (analyticsData.totalAtivos + analyticsData.totalPendentes)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analyticsData.totalExpirados > 0 && (
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Atenção Necessária
                      </CardTitle>
                      <CardDescription>
                        Membros que necessitam de atenção imediata
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Membros com assinatura expirada:</span>
                          <Badge variant="destructive">{analyticsData.totalExpirados}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recomenda-se revisar e atualizar as datas de expiração ou suspender o acesso.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Expiration Date Modal */}
      <Dialog open={showExpirationModal} onOpenChange={setShowExpirationModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Data de Expiração</DialogTitle>
            <DialogDescription>
              Defina ou altere a data de expiração do acesso para {selectedMember?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data-expiracao">Data de Expiração</Label>
              <Input
                id="data-expiracao"
                type="datetime-local"
                value={dataExpiracao}
                onChange={(e) => setDataExpiracao(e.target.value)}
                className="bg-background border-border"
              />
              <p className="text-sm text-muted-foreground">
                Deixe em branco para acesso sem data limite
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Ações Rápidas</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 1);
                    setDataExpiracao(date.toISOString().slice(0, 16));
                  }}
                >
                  +1 mês
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 3);
                    setDataExpiracao(date.toISOString().slice(0, 16));
                  }}
                >
                  +3 meses
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const date = new Date();
                    date.setFullYear(date.getFullYear() + 1);
                    setDataExpiracao(date.toISOString().slice(0, 16));
                  }}
                >
                  +1 ano
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDataExpiracao('')}
                >
                  Remover limite
                </Button>
              </div>
            </div>
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

      {/* Monthly Expenses Management Modal */}
      <Dialog open={showGastosModal} onOpenChange={setShowGastosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Gastos Mensais</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova os gastos operacionais mensais
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add new expense form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="novo-gasto-nome">Nome do Gasto</Label>
                <Input
                  id="novo-gasto-nome"
                  placeholder="Ex: Leonardo IA"
                  value={novoGasto.nome}
                  onChange={(e) => setNovoGasto({...novoGasto, nome: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="novo-gasto-valor">Valor (R$)</Label>
                <Input
                  id="novo-gasto-valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={novoGasto.valor}
                  onChange={(e) => setNovoGasto({...novoGasto, valor: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddGasto} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Expenses list */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {gastosOperacionais.map((gasto) => (
                <div key={gasto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editandoGasto === gasto.id ? (
                    <div className="flex-1 grid grid-cols-2 gap-2 mr-2">
                      <Input
                        defaultValue={gasto.nome}
                        onBlur={(e) => handleEditGasto(gasto.id, e.target.value, gasto.valor)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditGasto(gasto.id, e.currentTarget.value, gasto.valor);
                          }
                        }}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={gasto.valor}
                        onBlur={(e) => handleEditGasto(gasto.id, gasto.nome, parseFloat(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditGasto(gasto.id, gasto.nome, parseFloat(e.currentTarget.value));
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="font-medium">{gasto.nome}</p>
                      <p className="text-sm text-red-600 font-semibold">
                        R$ {gasto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditandoGasto(editandoGasto === gasto.id ? null : gasto.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveGasto(gasto.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total dos Gastos:</span>
                <span className="text-lg font-bold text-red-600">
                  R$ {gastosOperacionais
                    .filter(g => g.ativo)
                    .reduce((total, gasto) => total + gasto.valor, 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  }
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGastosModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}