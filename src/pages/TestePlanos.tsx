import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default function TestePlanos() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Teste do Sistema de Planos</h1>
            <p className="text-muted-foreground">
              Demonstração das funcionalidades implementadas sem modificar o banco de dados
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Teste 1: Cadastro com Seleção de Plano */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Cadastro com Planos
                </CardTitle>
                <CardDescription>
                  Sistema de cadastro agora inclui seleção obrigatória de plano
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Seleção de plano obrigatória
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Informações detalhadas de cada plano
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Visualização em tempo real
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/cadastro">
                    Testar Cadastro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Teste 2: Painel Admin */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  Painel Administrativo
                </CardTitle>
                <CardDescription>
                  Gestão completa de planos e membros atualizada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    Nova coluna "Plano" na tabela
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    Seleção de plano para membros
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    Cálculo automático de expiração
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    Botões de ação rápida
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/admin">
                    Acessar Painel
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Teste 3: Funcionalidades Implementadas */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Novas Funcionalidades
                </CardTitle>
                <CardDescription>
                  Lista completa das funcionalidades implementadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    Tipos de plano: Mensal/Trimestral/Semestral
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    Cálculo automático de datas
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    Badges visuais para planos
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    Gestão manual de planos existentes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes dos Planos */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Planos Disponíveis</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-card border-border">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Mensal
                  </CardTitle>
                  <CardDescription>Plano de 1 mês</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">R$ 97</div>
                  <div className="text-sm text-muted-foreground">por mês</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-accent/50">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Trimestral
                  </CardTitle>
                  <CardDescription>Plano de 3 meses</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">R$ 267</div>
                  <div className="text-sm text-muted-foreground">R$ 89/mês</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-secondary/50">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-secondary" />
                    Semestral
                  </CardTitle>
                  <CardDescription>Plano de 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">R$ 497</div>
                  <div className="text-sm text-muted-foreground">R$ 82,83/mês</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status da Implementação */}
          <div className="mt-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Status da Implementação</CardTitle>
                <CardDescription>
                  Todas as funcionalidades foram implementadas sem modificar o banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-3 text-primary">✅ Implementado</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Seleção de plano no cadastro</li>
                      <li>• Coluna de plano no painel admin</li>
                      <li>• Badges visuais para cada tipo de plano</li>
                      <li>• Cálculo automático de expiração por plano</li>
                      <li>• Gestão manual de planos existentes</li>
                      <li>• Botão "Aplicar Plano" com cálculo automático</li>
                      <li>• Compatibilidade com usuários sem plano definido</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-muted-foreground">📋 Para Produção</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Aprovação da migração do banco (enum + função)</li>
                      <li>• Atualização da função handle_new_user()</li>
                      <li>• Testes em ambiente de produção</li>
                      <li>• Definição de planos para usuários existentes</li>
                      <li>• Remoção da página de teste</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}