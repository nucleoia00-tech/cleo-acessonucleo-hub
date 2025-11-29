# Webhook Lastlink - Integração Automática

Este edge function processa webhooks da Lastlink para ativar assinantes automaticamente.

## URL do Webhook

Configure o seguinte endpoint na Lastlink:

```
https://pciwvlciwitsimsofslw.supabase.co/functions/v1/webhook-lastlink
```

## Eventos Suportados

- **Compra Completa** (`purchase_completed`): Ativa novos assinantes ou reativa assinantes suspensos
- **Pagamento de Renovação Efetuado** (`renewal_payment_completed`): Renova e estende a data de expiração

## Formato do Payload Esperado

A Lastlink deve enviar um JSON no seguinte formato:

```json
{
  "event": "purchase_completed",
  "customer": {
    "name": "Nome do Cliente",
    "email": "cliente@email.com"
  },
  "subscription": {
    "plan": "mensal"
  }
}
```

### Planos Aceitos

- `mensal`: 30 dias de acesso (R$ 55,00)
- `trimestral`: 90 dias de acesso (R$ 109,00)
- `semestral`: 180 dias de acesso (R$ 198,00)

## Como Funciona

### Compra Completa (purchase_completed)

1. Webhook recebe dados do cliente (email, nome, plano)
2. Sistema verifica se o email já está cadastrado:
   - **Se existe**: Atualiza status para 'ativo', define o plano e data de expiração
   - **Se não existe**: Cria novo usuário com senha temporária aleatória, ativa automaticamente
3. Cliente pode fazer login com o email cadastrado e a senha que criou no primeiro acesso
4. Log da ação é registrado no sistema

### Renovação (renewal_payment_completed)

1. Webhook recebe dados da renovação
2. Sistema busca o assinante pelo email
3. Se a data de expiração atual ainda é válida, estende a partir dela
4. Se expirou, inicia nova contagem a partir da data atual
5. Atualiza status para 'ativo' e plano conforme contratado
6. Log da renovação é registrado

## Configuração na Lastlink

1. Acesse o painel da Lastlink
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://pciwvlciwitsimsofslw.supabase.co/functions/v1/webhook-lastlink`
4. Selecione os eventos:
   - ✅ Compra Completa
   - ✅ Pagamento de Renovação Efetuado
5. Salve as configurações

## Logs e Debugging

Todos os eventos são logados e podem ser visualizados em:
- [Logs da Edge Function](https://supabase.com/dashboard/project/pciwvlciwitsimsofslw/functions/webhook-lastlink/logs)
- [Logs do Sistema](https://supabase.com/dashboard/project/pciwvlciwitsimsofslw/editor) (tabela `logs`)

## Segurança

⚠️ **Importante**: Este endpoint é público por necessidade (para receber webhooks externos). 

Para aumentar a segurança, você pode:
1. Configurar validação de assinatura HMAC (se a Lastlink suportar)
2. Validar IPs de origem da Lastlink
3. Adicionar um secret token no header que você compartilha apenas com a Lastlink

## Testando o Webhook

Você pode testar manualmente enviando um POST para o endpoint:

```bash
curl -X POST https://pciwvlciwitsimsofslw.supabase.co/functions/v1/webhook-lastlink \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_completed",
    "customer": {
      "name": "Cliente Teste",
      "email": "teste@email.com"
    },
    "subscription": {
      "plan": "mensal"
    }
  }'
```
