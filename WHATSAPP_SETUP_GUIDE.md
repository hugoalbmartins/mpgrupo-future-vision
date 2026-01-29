# Guia de Configuração WhatsApp Business com IA

Este documento explica como configurar a integração WhatsApp Business com respostas automáticas alimentadas por IA.

## 📋 Pré-requisitos

1. **Conta Meta Business** (Facebook Business)
2. **WhatsApp Business API** (não é o app WhatsApp Business normal)
3. **Número de telefone** dedicado para o bot
4. **Chave API OpenAI** para respostas com IA

## 🔧 Passos de Configuração

### 1. Configurar WhatsApp Business API

1. Aceda a [Meta for Developers](https://developers.facebook.com/)
2. Crie uma app ou use uma existente
3. Adicione o produto "WhatsApp"
4. Configure o número de telefone

### 2. Obter Credenciais Necessárias

Precisará de 3 valores:

#### A. WhatsApp Token
- Aceda à sua app Meta > WhatsApp > API Setup
- Copie o "Temporary access token" (ou crie um permanente)
- **Nome da variável:** `WHATSAPP_TOKEN`

#### B. Phone Number ID
- Na mesma página, encontre "Phone number ID"
- **Nome da variável:** `WHATSAPP_PHONE_NUMBER_ID`

#### C. Verify Token
- Token personalizado para verificação do webhook
- Pode ser qualquer string (ex: "mpgrupo_verify_2024")
- **Nome da variável:** `WHATSAPP_VERIFY_TOKEN`
- **Valor padrão no código:** `mpgrupo_verify_token_2024`

### 3. Obter Chave OpenAI

1. Aceda a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crie uma nova API key
3. **Nome da variável:** `OPENAI_API_KEY`
4. **Importante:** Esta chave tem custos associados ao uso

### 4. Configurar Variáveis no Supabase

No dashboard do Supabase:

1. Vá a **Project Settings** > **Edge Functions**
2. Adicione as seguintes secrets:

```
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_VERIFY_TOKEN=mpgrupo_verify_token_2024
OPENAI_API_KEY=sk-...sua_chave_aqui
```

**Nota:** As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` já estão automaticamente disponíveis.

### 5. Configurar Webhook no Meta

1. Na sua app Meta > WhatsApp > Configuration
2. Em **Webhook**, clique "Edit"
3. Configure:

**Callback URL:**
```
https://[seu-projeto].supabase.co/functions/v1/whatsapp-webhook
```

**Verify Token:**
```
mpgrupo_verify_token_2024
```
(ou o token personalizado que definiu)

4. Clique em "Verify and Save"

5. **Subscribe to webhook fields:**
   - ✅ messages

### 6. Testar a Integração

1. Envie uma mensagem para o número WhatsApp configurado
2. A edge function receberá a mensagem
3. A IA processará e responderá automaticamente
4. A conversa é guardada na base de dados

## 📊 Onde Estão as Conversas?

### Base de Dados Supabase

Todas as conversas são armazenadas na tabela **`whatsapp_conversations`**:

#### Estrutura da Tabela

```sql
whatsapp_conversations
├── id (uuid) - ID único da mensagem
├── phone_number (text) - Número do utilizador
├── message_text (text) - Conteúdo da mensagem
├── sender (text) - 'user' ou 'bot'
├── created_at (timestamptz) - Data/hora
└── metadata (jsonb) - Dados adicionais
```

#### Ver Conversas no Supabase

1. Aceda ao Supabase Dashboard
2. Vá a **Table Editor**
3. Selecione a tabela `whatsapp_conversations`
4. Verá todas as mensagens recebidas e enviadas

#### Consultar Conversas por SQL

```sql
-- Ver todas as conversas de um número
SELECT *
FROM whatsapp_conversations
WHERE phone_number = '+351912345678'
ORDER BY created_at DESC;

-- Ver conversas recentes (últimas 24h)
SELECT *
FROM whatsapp_conversations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Contar mensagens por utilizador
SELECT phone_number, COUNT(*) as total_messages
FROM whatsapp_conversations
GROUP BY phone_number
ORDER BY total_messages DESC;

-- Ver apenas mensagens de utilizadores (não bot)
SELECT *
FROM whatsapp_conversations
WHERE sender = 'user'
ORDER BY created_at DESC;
```

## 🤖 Como Funciona a IA

### Contexto da Empresa

A edge function `whatsapp-webhook` está configurada com contexto específico da MP Grupo:

- Serviços oferecidos
- Informações sobre energia solar
- Processos de instalação
- Políticas de financiamento
- FAQs comuns

### Histórico de Conversa

- Sistema mantém as últimas **10 mensagens** de cada utilizador
- Permite respostas contextuais
- IA "lembra" o que foi discutido

### Modelo Utilizado

- **GPT-4o-mini** (rápido e económico)
- Temperatura: 0.7 (criativo mas consistente)
- Max tokens: 300 (respostas concisas para WhatsApp)

## 💰 Custos

### OpenAI API
- GPT-4o-mini: ~$0.15 por milhão de tokens input
- ~$0.60 por milhão de tokens output
- Média: €0.001-0.002 por conversa

### WhatsApp Business API
- Primeiras 1.000 conversas/mês: **GRÁTIS**
- Depois: ~€0.01-0.05 por conversa (varia por país)

## 🔍 Monitorização e Logs

### Ver Logs da Edge Function

```bash
# No Supabase Dashboard
Project > Edge Functions > whatsapp-webhook > Logs
```

Ou via CLI:
```bash
supabase functions logs whatsapp-webhook
```

### Logs Importantes

A função regista:
- ✅ Mensagens recebidas
- ✅ Respostas enviadas
- ❌ Erros da OpenAI API
- ❌ Falhas de envio WhatsApp

## ⚠️ Troubleshooting

### Bot Não Responde

1. **Verificar webhook:**
   - URL correta no Meta?
   - Verify token corresponde?

2. **Verificar secrets:**
   - Todas as variáveis configuradas no Supabase?
   - Tokens válidos?

3. **Ver logs:**
   - Aceder a logs da edge function
   - Procurar erros

### Erro "OpenAI API key não configurada"

- Adicionar `OPENAI_API_KEY` nas secrets do Supabase
- Verificar se a chave é válida
- **Fallback:** Sem chave, bot envia mensagem genérica

### Mensagens Não São Guardadas

- Verificar tabela `whatsapp_conversations` existe
- Verificar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- Ver logs para erros de base de dados

## 🔐 Segurança

### Boas Práticas

✅ **NUNCA** partilhe os tokens publicamente
✅ Use tokens permanentes (não temporários) em produção
✅ Monitorize uso da API para detetar abusos
✅ Configure rate limiting se necessário
✅ RLS na tabela protege dados (apenas service role)

### Row Level Security (RLS)

A tabela `whatsapp_conversations` tem RLS ativado:
- Sem políticas públicas
- Apenas edge functions (service role) podem aceder
- Protege privacidade dos clientes

## 📝 Manutenção

### Atualizar Contexto da IA

Editar arquivo:
```
supabase/functions/whatsapp-webhook/index.ts
```

Procurar por `COMPANY_CONTEXT` e atualizar informações.

Depois:
```bash
# Deploy via Supabase Dashboard ou CLI
supabase functions deploy whatsapp-webhook
```

### Limpar Conversas Antigas

```sql
-- Apagar conversas com mais de 90 dias
DELETE FROM whatsapp_conversations
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 📞 Suporte

Para questões técnicas:
- Dashboard Supabase > Support
- [Documentação WhatsApp Business](https://developers.facebook.com/docs/whatsapp)
- [Documentação OpenAI](https://platform.openai.com/docs)

---

**Data de Criação:** 2026-01-29
**Versão:** 1.0
**Última Atualização:** 2026-01-29
