import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COMPANY_CONTEXT = `
Você é um assistente virtual da MP Grupo via WhatsApp, uma empresa especializada em soluções de energia renovável em Portugal.

INFORMAÇÕES DA EMPRESA:
- Nome: MP Grupo
- Especialização: Energia Solar Fotovoltaica e soluções de eficiência energética
- Serviços principais:
  1. Instalação de painéis solares fotovoltaicos residenciais e comerciais
  2. Consultoria energética personalizada
  3. Manutenção e monitorização de sistemas solares
  4. Otimização de tarifas de energia
  5. Soluções de armazenamento de energia (baterias)

FILOSOFIA:
- Compromisso com sustentabilidade e energia limpa
- Soluções personalizadas para cada cliente
- Transparência em orçamentos e prazos
- Acompanhamento pós-instalação

COMO RESPONDER NO WHATSAPP:
- Seja prestativo, claro e profissional mas conciso (mensagens curtas)
- Responda em português de Portugal
- Use emojis apropriados para WhatsApp (não exagere)
- Se não souber algo específico, ofereça contacto com a equipa
- Incentive visita ao website: www.mpgrupo.pt
- Para orçamentos detalhados, colete informações básicas:
  * Tipo de imóvel (residencial/comercial)
  * Localização aproximada
  * Consumo médio mensal (€ ou kWh)
  * Interesse em armazenamento (baterias)

TÓPICOS COMUNS:
- Quanto custa? → Depende do consumo e instalação. Visite nosso simulador online.
- Instalação → Geralmente 1-3 dias para residencial
- Financiamento → Sim, temos parcerias bancárias
- Poupanças → Típico 50-70% na fatura
- Licenças → Tratamos de toda documentação

IMPORTANTE: Mantenha respostas concisas para WhatsApp (2-4 linhas quando possível).
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "mpgrupo_verify_token_2024";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully!");
      return new Response(challenge, {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));

    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return new Response(JSON.stringify({ status: "no_message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const senderPhone = message.from;
    const messageText = message.text?.body;
    const messageType = message.type;

    if (messageType !== "text") {
      console.log(`Unsupported message type: ${messageType}`);
      return new Response(JSON.stringify({ status: "unsupported_type" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", senderPhone)
      .order("created_at", { ascending: false })
      .limit(10);

    const conversationHistory = conversation
      ? conversation.reverse().map((msg: { message_text: string; sender: string }) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.message_text,
        }))
      : [];

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      const fallbackMessage =
        "Olá! Obrigado pela sua mensagem. A nossa equipa irá responder em breve. 📱";
      await sendWhatsAppMessage(senderPhone, fallbackMessage);
      await saveMessage(supabase, senderPhone, messageText, "user");
      await saveMessage(supabase, senderPhone, fallbackMessage, "bot");

      return new Response(JSON.stringify({ status: "fallback_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: COMPANY_CONTEXT },
      ...conversationHistory,
      { role: "user", content: messageText },
    ];

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error("OpenAI API error");
    }

    const aiData = await aiResponse.json();
    const botReply = aiData.choices[0].message.content;

    await sendWhatsAppMessage(senderPhone, botReply);

    await saveMessage(supabase, senderPhone, messageText, "user");
    await saveMessage(supabase, senderPhone, botReply, "bot");

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        status: "error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendWhatsAppMessage(to: string, message: string) {
  const whatsappToken = Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!whatsappToken || !phoneNumberId) {
    console.error("WhatsApp credentials not configured");
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Failed to send WhatsApp message:", errorData);
  }
}

async function saveMessage(
  supabase: any,
  phoneNumber: string,
  messageText: string,
  sender: "user" | "bot"
) {
  const { error } = await supabase.from("whatsapp_conversations").insert({
    phone_number: phoneNumber,
    message_text: messageText,
    sender: sender,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving message:", error);
  }
}
