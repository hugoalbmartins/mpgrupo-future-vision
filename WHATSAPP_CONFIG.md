# 📱 Configuração do WhatsApp - MPGrupo

## 🔧 Como Atualizar o Número do WhatsApp

### Ficheiro a Modificar
`src/lib/whatsappUtils.ts`

### Localização da Variável
Linha final do ficheiro:

```typescript
export const MPGRUPO_WHATSAPP = '351912345678'; // ⚠️ ATUALIZAR
```

### Como Atualizar

1. Abrir o ficheiro `src/lib/whatsappUtils.ts`

2. Localizar a constante `MPGRUPO_WHATSAPP`

3. Substituir pelo número real no formato internacional (sem espaços, sem +):

```typescript
// ❌ ERRADO
export const MPGRUPO_WHATSAPP = '+351 912 345 678';
export const MPGRUPO_WHATSAPP = '351 912 345 678';

// ✅ CORRETO
export const MPGRUPO_WHATSAPP = '351912345678';
```

4. Guardar o ficheiro

5. Rebuild do projeto:
```bash
npm run build
```

---

## 📋 Formato do Número

### Regras
- ✅ Código do país (351 para Portugal)
- ✅ Número sem espaços
- ✅ Sem símbolos (+, -, parênteses)
- ✅ Apenas dígitos

### Exemplos

| País | Formato Correto |
|------|----------------|
| Portugal | `351912345678` |
| Brasil | `5511987654321` |
| Espanha | `34612345678` |

---

## 🧪 Como Testar

### 1. Testar Localmente

1. Abrir o simulador
2. Fazer uma simulação
3. Nos resultados, clicar em "Contactar via WhatsApp"
4. Verificar se:
   - WhatsApp abre corretamente
   - Número está correto
   - Mensagem está pré-preenchida
   - Dados da simulação estão incluídos

### 2. Testar em Produção

Após deploy, repetir os mesmos passos.

### 3. Testar Mensagem

A mensagem deve conter:
- ✅ Operadora atual
- ✅ Potência contratada
- ✅ Valor potência diária
- ✅ Custo atual
- ✅ Melhor opção
- ✅ Poupança estimada
- ✅ Projeção anual

---

## 📱 Configuração do WhatsApp Business (Recomendado)

### Por que usar WhatsApp Business?

- ✅ Perfil profissional
- ✅ Catálogo de produtos/serviços
- ✅ Mensagens automáticas
- ✅ Etiquetas para organização
- ✅ Respostas rápidas
- ✅ Estatísticas

### Como Configurar

1. **Baixar WhatsApp Business**
   - Android: Google Play Store
   - iOS: App Store

2. **Criar Perfil Empresarial**
   - Nome: MPGrupo
   - Categoria: Serviços Energéticos
   - Descrição: Soluções energéticas e poupança
   - Site: www.mpgrupo.pt
   - Email: contacto@mpgrupo.pt

3. **Configurar Mensagem de Ausência**
   ```
   Obrigado pela mensagem!
   Estamos temporariamente ausentes.
   Horário de atendimento: Segunda a Sexta, 9h-18h
   Responderemos em breve!
   ```

4. **Configurar Mensagem de Saudação**
   ```
   Olá! 👋
   Bem-vindo à MPGrupo!
   Como podemos ajudar hoje?
   ```

5. **Criar Respostas Rápidas**
   - `/simulador` → Link para simulador
   - `/horario` → Horário de atendimento
   - `/contactos` → Outros contactos
   - `/servicos` → Lista de serviços

---

## 🤖 Automação Avançada (Opcional)

### WhatsApp Business API

Para volume maior de mensagens, considere:

1. **Twilio WhatsApp API**
   - Webhooks para automação
   - Integração com CRM
   - Templates de mensagens aprovados

2. **Meta WhatsApp Business Platform**
   - Oficial do Facebook/Meta
   - Mais features
   - Requer aprovação

### Chatbot WhatsApp

Integração futura possível:
- OpenAI API para respostas inteligentes
- Zapier para automações
- Make.com para workflows

---

## 📊 Analytics

### Métricas a Monitorizar

1. **Volume**
   - Mensagens recebidas/dia
   - Horários de pico
   - Taxa de resposta

2. **Conversão**
   - Leads → Clientes
   - Tempo médio de resposta
   - Taxa de fechamento

3. **Qualidade**
   - Satisfação do cliente
   - Tempo de resolução
   - Problemas recorrentes

### Ferramentas Recomendadas

- WhatsApp Business (estatísticas básicas)
- Google Sheets (tracking manual)
- CRM integrado (Pipedrive, HubSpot)

---

## 🔐 Segurança e Privacidade

### Boas Práticas

1. **Nunca Partilhar**
   - Senhas
   - Dados bancários
   - Informações confidenciais

2. **Sempre Confirmar**
   - Identidade do cliente
   - Dados de contacto
   - Autorizações necessárias

3. **RGPD/GDPR**
   - Informar sobre uso de dados
   - Obter consentimento
   - Permitir exclusão de dados

### Exemplo de Disclaimer

```
Ao contactar-nos via WhatsApp, concorda com:
- Armazenamento do seu número de telefone
- Comunicações relacionadas com o seu pedido
- Política de Privacidade: mpgrupo.pt/privacidade

Pode solicitar exclusão dos seus dados a qualquer momento.
```

---

## 🚨 Troubleshooting

### Problema: Link não abre WhatsApp

**Solução:**
- Verificar formato do número
- Testar em diferentes browsers
- Verificar se WhatsApp está instalado

### Problema: Mensagem não pré-preenchida

**Solução:**
- Verificar encoding da mensagem
- Limitar tamanho da mensagem
- Testar em mobile e desktop

### Problema: Número errado

**Solução:**
1. Verificar `MPGRUPO_WHATSAPP` em `whatsappUtils.ts`
2. Fazer rebuild: `npm run build`
3. Limpar cache do browser
4. Testar novamente

---

## 📞 Contactos de Suporte

**Suporte Técnico:**
- Email: tech@mpgrupo.pt

**WhatsApp (após configuração):**
- Número: [A CONFIGURAR]

---

## ✅ Checklist de Configuração

Antes de ir para produção:

- [ ] Número WhatsApp atualizado em `whatsappUtils.ts`
- [ ] Build realizado com sucesso
- [ ] Testado em ambiente de staging
- [ ] WhatsApp Business configurado
- [ ] Perfil empresarial completo
- [ ] Mensagens automáticas configuradas
- [ ] Equipa treinada para atendimento
- [ ] Horários de atendimento definidos
- [ ] Respostas rápidas criadas
- [ ] Analytics configurado
- [ ] RGPD compliance verificado

---

*Última atualização: 29/01/2026*
