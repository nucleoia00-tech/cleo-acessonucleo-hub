import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LastlinkWebhookPayload {
  event: 'purchase_completed' | 'renewal_payment_completed';
  customer: {
    name: string;
    email: string;
  };
  subscription: {
    plan: 'mensal' | 'trimestral' | 'semestral';
  };
}

// Mapeamento de dias por plano
const PLAN_DAYS = {
  'mensal': 30,
  'trimestral': 90,
  'semestral': 180,
};

// Mapeamento de valores por plano
const PLAN_VALUES = {
  'mensal': 'Mensal',
  'trimestral': 'Trimestral',
  'semestral': 'Semestral',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Cliente com permissões de admin para criar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const payload: LastlinkWebhookPayload = await req.json();
    
    console.log('Webhook recebido da Lastlink:', payload);

    const { event, customer, subscription } = payload;

    if (!customer?.email || !customer?.name || !subscription?.plan) {
      console.error('Payload inválido:', payload);
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando no payload' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Normalizar plano para lowercase
    const planKey = subscription.plan.toLowerCase() as keyof typeof PLAN_DAYS;
    const planDays = PLAN_DAYS[planKey];
    const planName = PLAN_VALUES[planKey];

    if (!planDays) {
      console.error('Plano inválido:', subscription.plan);
      return new Response(
        JSON.stringify({ error: 'Plano inválido' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calcular data de expiração
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + planDays);

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === customer.email);

    if (event === 'purchase_completed') {
      if (userExists) {
        // Usuário existe, apenas atualizar status e data de expiração
        console.log('Ativando usuário existente:', customer.email);
        
        const { error: updateError } = await supabaseAdmin
          .from('assinantes')
          .update({
            status: 'ativo',
            plano: planName,
            data_expiracao: dataExpiracao.toISOString(),
          })
          .eq('user_id', userExists.id);

        if (updateError) {
          console.error('Erro ao atualizar assinante:', updateError);
          throw updateError;
        }

        // Registrar log
        await supabaseAdmin.rpc('registrar_log', {
          _usuario_email: customer.email,
          _acao: `Assinatura ativada via Lastlink - Plano: ${planName}`
        });

        console.log('Usuário ativado com sucesso:', customer.email);
      } else {
        // Criar novo usuário
        console.log('Criando novo usuário:', customer.email);
        
        // Gerar senha temporária aleatória
        const tempPassword = crypto.randomUUID();
        
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: customer.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            nome: customer.name
          }
        });

        if (createUserError) {
          console.error('Erro ao criar usuário:', createUserError);
          throw createUserError;
        }

        // Atualizar registro de assinante criado pelo trigger
        const { error: updateError } = await supabaseAdmin
          .from('assinantes')
          .update({
            status: 'ativo',
            plano: planName,
            data_expiracao: dataExpiracao.toISOString(),
          })
          .eq('user_id', newUser.user.id);

        if (updateError) {
          console.error('Erro ao atualizar assinante:', updateError);
          throw updateError;
        }

        // Registrar log
        await supabaseAdmin.rpc('registrar_log', {
          _usuario_email: customer.email,
          _acao: `Novo usuário criado e ativado via Lastlink - Plano: ${planName}`
        });

        console.log('Novo usuário criado e ativado:', customer.email);
      }
    } else if (event === 'renewal_payment_completed') {
      // Renovação de assinatura existente
      if (!userExists) {
        console.error('Usuário não encontrado para renovação:', customer.email);
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado para renovação' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Renovando assinatura do usuário:', customer.email);

      // Buscar data de expiração atual
      const { data: currentSubscriber } = await supabaseAdmin
        .from('assinantes')
        .select('data_expiracao, status')
        .eq('user_id', userExists.id)
        .single();

      let novaDataExpiracao = new Date();

      // Se já tem data de expiração e ainda está válida, estender a partir dela
      if (currentSubscriber?.data_expiracao) {
        const currentExpiration = new Date(currentSubscriber.data_expiracao);
        if (currentExpiration > new Date()) {
          novaDataExpiracao = currentExpiration;
        }
      }

      // Adicionar dias do plano
      novaDataExpiracao.setDate(novaDataExpiracao.getDate() + planDays);

      const { error: renewError } = await supabaseAdmin
        .from('assinantes')
        .update({
          status: 'ativo',
          plano: planName,
          data_expiracao: novaDataExpiracao.toISOString(),
        })
        .eq('user_id', userExists.id);

      if (renewError) {
        console.error('Erro ao renovar assinatura:', renewError);
        throw renewError;
      }

      // Registrar log
      await supabaseAdmin.rpc('registrar_log', {
        _usuario_email: customer.email,
        _acao: `Assinatura renovada via Lastlink - Plano: ${planName} - Nova expiração: ${novaDataExpiracao.toISOString()}`
      });

      console.log('Assinatura renovada com sucesso:', customer.email);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook processado com sucesso para ${customer.email}` 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
