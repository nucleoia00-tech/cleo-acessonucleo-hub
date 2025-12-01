import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LastlinkWebhookPayload {
  Event: string;
  Data: {
    Buyer: {
      Email: string;
      Name?: string; // Nome é opcional
    };
    Offer: {
      Name: string;
    };
    Purchase?: {
      Recurrency?: number;
    };
  };
}

// Mapeamento de ofertas Lastlink para planos
const OFFER_TO_PLAN = {
  'OFERTA MENSAL': { days: 30, name: 'Mensal' },
  'OFERTA TRIMESTRAL': { days: 90, name: 'Trimestral' },
  'OFERTA SEMESTRAL': { days: 180, name: 'Semestral' },
  'OFERTA PADRÃO': { days: 30, name: 'Mensal' }, // Oferta padrão = plano mensal
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

    const { Event, Data } = payload;

    if (!Data?.Buyer?.Email || !Data?.Offer?.Name) {
      console.error('Payload inválido:', payload);
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando no payload' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const customerEmail = Data.Buyer.Email;
    const customerName = Data.Buyer.Name || customerEmail.split('@')[0]; // Usar email como fallback
    const offerName = Data.Offer.Name.toUpperCase();

    // Mapear oferta para plano
    const planInfo = OFFER_TO_PLAN[offerName as keyof typeof OFFER_TO_PLAN];

    if (!planInfo) {
      console.error('Oferta não reconhecida:', Data.Offer.Name);
      return new Response(
        JSON.stringify({ error: `Oferta não reconhecida: ${Data.Offer.Name}` }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { days: planDays, name: planName } = planInfo;
    // Detectar renovação: evento Recurrent_Payment OU Recurrency > 1 (segunda cobrança em diante)
    const isRenewal = Event === 'Recurrent_Payment' || (Data.Purchase?.Recurrency && Data.Purchase.Recurrency > 1);

    // Calcular data de expiração
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + planDays);

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === customerEmail);

    if (!isRenewal) {
      // Nova compra ou primeira compra
      if (userExists) {
        // Usuário existe, apenas atualizar status e data de expiração
        console.log('Ativando usuário existente:', customerEmail);
        
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
          _usuario_email: customerEmail,
          _acao: `Assinatura ativada via Lastlink - Plano: ${planName}`
        });

        console.log('Usuário ativado com sucesso:', customerEmail);
      } else {
        // Criar novo usuário
        console.log('Criando novo usuário:', customerEmail);
        
        // Gerar senha temporária aleatória
        const tempPassword = crypto.randomUUID();
        
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            nome: customerName
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
          _usuario_email: customerEmail,
          _acao: `Novo usuário criado e ativado via Lastlink - Plano: ${planName}`
        });

        console.log('Novo usuário criado e ativado:', customerEmail);
      }
    } else {
      // Renovação de assinatura existente
      if (!userExists) {
        console.error('Usuário não encontrado para renovação:', customerEmail);
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado para renovação' }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Renovando assinatura do usuário:', customerEmail);

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
        _usuario_email: customerEmail,
        _acao: `Assinatura renovada via Lastlink - Plano: ${planName} - Nova expiração: ${novaDataExpiracao.toISOString()}`
      });

      console.log('Assinatura renovada com sucesso:', customerEmail);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook processado com sucesso para ${customerEmail}` 
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
