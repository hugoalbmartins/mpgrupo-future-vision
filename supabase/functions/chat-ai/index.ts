import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COMPANY_CONTEXT = `
Você é um assistente virtual da MP Grupo, uma empresa especializada em soluções de energia renovável em Portugal.

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

COMO RESPONDER:
- Seja prestativo, claro e profissional
- Responda em português de Portugal
- Se não souber algo específico, ofereça contacto direto com a equipa
- Incentive o uso do simulador de energia no website
- Para orçamentos detalhados, sugira contacto através do formulário ou WhatsApp
- Telefone: +351 XXX XXX XXX (sugira que preencham o formulário para contacto)
- Email: info@mpgrupo.pt (sugira que preencham o formulário)

TÓPICOS COMUNS:
- Quanto custa um sistema solar? → Depende do consumo e tipo de instalação. Use o simulador no site para estimativa inicial.
- Quanto tempo demora a instalação? → Geralmente 1-3 dias para residencial após aprovação.
- Há financiamento disponível? → Sim, temos parcerias com instituições financeiras.
- Que poupanças posso ter? → Típico 50-70% na fatura de eletricidade.
- Preciso de licenças? → Tratamos de toda a documentação e licenciamento.
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key não configurada",
          fallbackMessage: "Desculpe, o sistema de IA está temporariamente indisponível. Por favor, contacte-nos através do formulário ou WhatsApp."
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const messages = [
      {
        role: "system",
        content: COMPANY_CONTEXT,
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erro ao comunicar com IA",
          fallbackMessage: "Desculpe, estou com dificuldades técnicas. Por favor, contacte-nos diretamente através do formulário ou WhatsApp."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        response: aiResponse,
        conversationId: crypto.randomUUID(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-ai function:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        fallbackMessage: "Ocorreu um erro inesperado. Por favor, tente novamente ou contacte-nos diretamente."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
