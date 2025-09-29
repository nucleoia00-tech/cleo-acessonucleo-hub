import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, EyeOff, Trash2, Plus, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Dados mockados para preview
const contasMockadas = [
  {
    id: '1',
    nomeConta: 'AdsPower Principal',
    email_login: 'usuario@adspower.com',
    senha_atual: 'senha123456',
    visivel: true,
    ordem: 1,
    descricao: 'Conta principal de acesso',
    ultima_atualizacao: '2025-01-26T10:30:00',
  },
  {
    id: '2',
    nomeConta: 'Adspower - CHAT GPT5',
    email_login: 'chatgpt@adspower.com',
    senha_atual: 'gpt5senha789',
    visivel: true,
    ordem: 2,
    descricao: 'Conta 02: Adspower - CHAT GPT5',
    ultima_atualizacao: '2025-01-25T14:20:00',
  },
  {
    id: '3',
    nomeConta: 'Dicloack - IA\'s de Suporte',
    email_login: 'suporte@dicloack.com',
    senha_atual: 'dicloack2025',
    visivel: true,
    ordem: 3,
    descricao: 'Conta 03: Dicloack - IA\'s de Suporte',
    ultima_atualizacao: '2025-01-24T09:15:00',
  },
];

export default function PreviewContasSuporte() {
  const { toast } = useToast();
  const [visualizacaoAtual, setVisualizacaoAtual] = useState<'admin' | 'membro'>('admin');
  const [contasGeradas, setContasGeradas] = useState<Record<string, boolean>>({});
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});
  const [gerandoSenha, setGerandoSenha] = useState<string | null>(null);

  const handleCopy = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto);
    toast({
      title: `${tipo} copiado!`,
      description: `${tipo} copiado para a área de transferência.`,
    });
  };

  const toggleSenhaVisivel = (id: string) => {
    setSenhasVisiveis(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGerarSenha = async (contaId: string) => {
    setGerandoSenha(contaId);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setContasGeradas(prev => ({ ...prev, [contaId]: true }));
    setGerandoSenha(null);
    toast({
      title: 'Senha gerada!',
      description: 'As credenciais estão disponíveis abaixo.',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Preview: Sistema de Múltiplas Contas</h1>
            <p className="text-muted-foreground mt-2">
              Visualização de como ficará o sistema antes da implementação
            </p>
          </div>
          <Tabs value={visualizacaoAtual} onValueChange={(v) => setVisualizacaoAtual(v as any)}>
            <TabsList>
              <TabsTrigger value="admin">Visão Admin</TabsTrigger>
              <TabsTrigger value="membro">Visão Membro</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Visão Admin */}
        {visualizacaoAtual === 'admin' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Gestão de Contas de Suporte</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Nova Conta
              </Button>
            </div>

            <div className="grid gap-4">
              {contasMockadas.map((conta, index) => (
                <Card key={conta.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{conta.nomeConta}</CardTitle>
                          <Badge variant={conta.visivel ? "default" : "secondary"}>
                            {conta.visivel ? 'Visível' : 'Oculto'}
                          </Badge>
                        </div>
                        <CardDescription>{conta.descricao}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" disabled={index === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={index === contasMockadas.length - 1}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <div className="flex gap-2">
                          <Input value={conta.nomeConta} readOnly />
                          <Button variant="outline" size="icon">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Última Atualização</Label>
                        <Input 
                          value={new Date(conta.ultima_atualizacao).toLocaleString('pt-BR')} 
                          readOnly 
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>E-mail de Login</Label>
                        <div className="flex gap-2">
                          <Input value={conta.email_login} readOnly />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(conta.email_login, 'E-mail')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Senha Atual</Label>
                        <div className="flex gap-2">
                          <Input 
                            type={senhasVisiveis[conta.id] ? 'text' : 'password'}
                            value={conta.senha_atual} 
                            readOnly 
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => toggleSenhaVisivel(conta.id)}
                          >
                            {senhasVisiveis[conta.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(conta.senha_atual, 'Senha')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`visivel-${conta.id}`}>Visível para membros</Label>
                        <Switch id={`visivel-${conta.id}`} checked={conta.visivel} />
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Conta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Visão Membro */}
        {visualizacaoAtual === 'membro' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Contas de Suporte</h2>
              <p className="text-muted-foreground">
                Use as credenciais abaixo para acessar as ferramentas disponíveis
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contasMockadas.filter(c => c.visivel).map((conta) => (
                <Card key={conta.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardTitle className="text-xl">{conta.nomeConta}</CardTitle>
                    <CardDescription>{conta.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {!contasGeradas[conta.id] ? (
                      <div className="py-8 text-center">
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => handleGerarSenha(conta.id)}
                          disabled={gerandoSenha === conta.id}
                        >
                          {gerandoSenha === conta.id ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                              Gerando...
                            </>
                          ) : (
                            'Gerar Senha'
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                          Clique para gerar e visualizar as credenciais
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">E-mail de Login</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={conta.email_login} 
                              readOnly 
                              className="font-mono text-sm"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleCopy(conta.email_login, 'E-mail')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Senha</Label>
                          <div className="flex gap-2">
                            <Input 
                              type={senhasVisiveis[conta.id] ? 'text' : 'password'}
                              value={conta.senha_atual} 
                              readOnly 
                              className="font-mono text-sm"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => toggleSenhaVisivel(conta.id)}
                            >
                              {senhasVisiveis[conta.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleCopy(conta.senha_atual, 'Senha')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Última atualização: {new Date(conta.ultima_atualizacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Como usar as credenciais</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Clique em "Gerar Senha" no card da conta desejada</li>
                  <li>Aguarde o processamento (aproximadamente 2-3 segundos)</li>
                  <li>As credenciais serão exibidas automaticamente</li>
                  <li>Use os botões de copiar para facilitar o uso</li>
                  <li>As credenciais podem ser atualizadas pelo administrador a qualquer momento</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
