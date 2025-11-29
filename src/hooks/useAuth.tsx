
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Update ultimo_login
          setTimeout(() => {
            supabase
              .from('assinantes')
              .update({ ultimo_login: new Date().toISOString() })
              .eq('user_id', session.user.id)
              .then(() => {
                supabase.functions.invoke('registrar-log', {
                  body: { 
                    usuario_email: session.user.email, 
                    acao: 'Login realizado' 
                  }
                });
              });
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          console.log('Usuário deslogado com sucesso');
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
        variant: "destructive"
      });
      return { error };
    }
    
    // Verificar se o usuário tem status pendente e aprovar automaticamente
    if (data?.user) {
      const { data: assinante, error: assinanteError } = await supabase
        .from('assinantes')
        .select('status, email')
        .eq('user_id', data.user.id)
        .single();
      
      if (!assinanteError && assinante && assinante.status === 'pendente') {
        // Aprovar automaticamente
        const { error: updateError } = await supabase
          .from('assinantes')
          .update({ status: 'ativo' })
          .eq('user_id', data.user.id);
        
        if (!updateError) {
          toast({
            title: "✅ Conta aprovada!",
            description: "Sua conta foi aprovada automaticamente. Bem-vindo ao Núcleo IA!",
          });
        }
      }
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome
        }
      }
    });
    
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message === 'User already registered' 
          ? 'Este email já está cadastrado' 
          : error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Cadastro enviado",
        description: "Aguarde aprovação do administrador.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('Iniciando processo de logout...');
    try {
      // Limpar estados antes do logout
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Logout realizado com sucesso');
        // Forçar recarga da página para limpar todo o estado
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      // Forçar recarga mesmo em caso de erro
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
