import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const emailResponse = await resend.emails.send({
      from: "Sistema <onboarding@resend.dev>",
      to: [email],
      subject: "✅ Seu acesso foi aprovado!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; text-align: center;">🎉 Parabéns, ${nome}!</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Seu acesso foi aprovado!</h2>
            <p style="color: #666; line-height: 1.6;">
              Ficamos felizes em informar que sua solicitação de acesso foi aprovada com sucesso. 
              Agora você pode acessar todas as funcionalidades disponíveis em nossa plataforma.
            </p>
          </div>

          <div style="background: #e1f5fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0288d1;">
            <h3 style="color: #0288d1; margin-top: 0;">Próximos passos:</h3>
            <ul style="color: #333; line-height: 1.6;">
              <li>Faça login em sua conta</li>
              <li>Acesse o painel principal</li>
              <li>Explore todas as funcionalidades disponíveis</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://sua-aplicacao.com'}/login" 
               style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Acessar Plataforma
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            Se você tiver alguma dúvida, entre em contato conosco.<br>
            Esta é uma mensagem automática, não responda este email.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Erro ao enviar email:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('Email enviado com sucesso:', emailResponse);

    // Registrar log da ação
    await supabaseClient
      .from('logs')
      .insert({
        usuario_email: email,
        acao: `Notificação de aprovação enviada para ${nome}`,
        timestamp: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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