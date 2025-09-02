import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";




const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  email: string;
  nome: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, nome }: NotificationRequest = await req.json();

    console.log('Enviando notificação de aprovação para:', { email, nome });

    const apiKey = Deno.env.get('REENVIAR_CHAVE_API');
    if (!apiKey) {
      throw new Error('Secret REENVIAR_CHAVE_API não configurado. Defina-o nas Secrets das Edge Functions.');
    }

    const payload = {
      from: Deno.env.get('RESEND_FROM') || 'Equipe <onboarding@resend.dev>',
      to: [email],
      subject: "Acesso aprovado 🎉",
      html: `<p>Olá ${nome}, seu acesso foi aprovado. Bem-vindo(a) à plataforma!</p>`
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erro ao enviar email via Resend:', resendData);
      throw new Error(resendData?.message || 'Falha ao enviar email via Resend');
    }

    console.log('Email enviado com sucesso via Resend:', resendData);

    // Registrar log da ação
    await supabaseClient
      .from('logs')
      .insert({
        usuario_email: email,
        acao: `Notificação de aprovação enviada para ${nome}`,
        timestamp: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: true, data: resendData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Erro na função enviar-notificacao-aprovacao:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);