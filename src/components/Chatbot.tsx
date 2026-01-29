import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Energia Solar',
    question: 'Como funciona a energia solar fotovoltaica?',
    answer: 'Os painéis solares fotovoltaicos captam a luz solar e convertem-na diretamente em energia elétrica através de células fotovoltaicas. Esta energia pode ser usada imediatamente no seu imóvel ou armazenada em baterias. O excedente pode ser injetado na rede elétrica, gerando créditos na sua fatura.',
    keywords: ['solar', 'funciona', 'fotovoltaica', 'painéis', 'como funciona'],
  },
  {
    category: 'Poupança',
    question: 'Quanto posso poupar com energia solar?',
    answer: 'A poupança típica varia entre 50% a 70% na fatura de eletricidade. Depende do seu consumo, orientação do telhado, potência instalada e padrão de utilização. Use o nosso simulador no site para uma estimativa personalizada baseada no seu consumo real.',
    keywords: ['poupar', 'poupança', 'economizar', 'quanto', 'custo', 'valor'],
  },
  {
    category: 'Instalação',
    question: 'Quanto tempo demora a instalação?',
    answer: 'Para instalações residenciais, o processo físico demora tipicamente 1 a 3 dias. Para projetos comerciais maiores, pode levar 1 a 2 semanas. Isto não inclui o tempo de aprovação e licenciamento, que tratamos por si e pode adicionar 2-4 semanas.',
    keywords: ['tempo', 'demora', 'prazo', 'instalação', 'dias'],
  },
  {
    category: 'Custos',
    question: 'Quanto custa um sistema solar?',
    answer: 'O investimento varia conforme a potência necessária:\n\n• Residencial (3-5 kWp): €4.000 - €8.000\n• Residencial maior (6-10 kWp): €8.000 - €14.000\n• Comercial: orçamento personalizado\n\nInclui painéis, inversores, estruturas, instalação e licenciamento. Temos soluções de financiamento disponíveis.',
    keywords: ['custo', 'custa', 'preço', 'investimento', 'valor', 'quanto custa'],
  },
  {
    category: 'Financiamento',
    question: 'Há opções de financiamento?',
    answer: 'Sim! Trabalhamos com diversas instituições bancárias que oferecem:\n\n• Crédito pessoal com taxas preferenciais\n• Prazos até 120 meses\n• Prestações acessíveis\n• Aprovação rápida\n\nA prestação mensal normalmente é inferior à poupança na fatura, resultando em benefício imediato.',
    keywords: ['financiamento', 'crédito', 'pagamento', 'prestações', 'banco'],
  },
  {
    category: 'Licenciamento',
    question: 'Preciso de licenças ou autorizações?',
    answer: 'Sim, mas não se preocupe! Tratamos de toda a burocracia:\n\n✓ Registo na DGEG\n✓ Comunicação à Câmara Municipal\n✓ Coordenação com operadora de rede\n✓ Certificação da instalação\n\nVocê não precisa de fazer nada, acompanhamos todo o processo.',
    keywords: ['licença', 'autorização', 'legal', 'documentação', 'câmara', 'dgeg'],
  },
  {
    category: 'Manutenção',
    question: 'Que manutenção é necessária?',
    answer: 'Os painéis solares requerem manutenção mínima:\n\n• Limpeza anual (a chuva limpa naturalmente)\n• Inspeção visual periódica\n• Verificação do inversor\n\nOferecemos contratos de manutenção preventiva com monitorização remota do sistema e intervenção sempre que necessário.',
    keywords: ['manutenção', 'limpeza', 'limpar', 'cuidar', 'manter'],
  },
  {
    category: 'Garantias',
    question: 'Que garantias oferecem?',
    answer: 'Garantias completas:\n\n• Painéis: 25 anos de produção (80% eficiência)\n• Inversor: 5-10 anos (extensível)\n• Instalação: 5 anos\n• Estruturas: 10 anos\n\nTodos os equipamentos são de marcas premium certificadas.',
    keywords: ['garantia', 'garantias', 'cobertura'],
  },
  {
    category: 'Baterias',
    question: 'Vale a pena ter baterias?',
    answer: 'As baterias são recomendadas se:\n\n✓ Consome principalmente à noite\n✓ Quer autonomia em cortes de energia\n✓ Procura máxima independência energética\n✓ Tem tarifa bi-horária ou tri-horária\n\nAumentam o investimento inicial mas maximizam a poupança e autonomia.',
    keywords: ['bateria', 'baterias', 'armazenamento', 'autonomia'],
  },
  {
    category: 'Retorno',
    question: 'Em quanto tempo recupero o investimento?',
    answer: 'O retorno típico do investimento (ROI) é de 6 a 10 anos, dependendo de:\n\n• Consumo energético\n• Potência instalada\n• Tarifa atual\n• Autoconsumo vs venda à rede\n\nCom vida útil de +25 anos, terá 15-20 anos de energia praticamente gratuita!',
    keywords: ['retorno', 'roi', 'recuperar', 'investimento', 'amortização'],
  },
  {
    category: 'Serviços',
    question: 'Que serviços oferecem?',
    answer: 'Serviços completos:\n\n🔆 Painéis Solares Fotovoltaicos\n📊 Consultoria Energética\n🔋 Sistemas de Armazenamento\n💡 Otimização de Tarifas\n🔧 Manutenção e Monitorização\n🏢 Soluções Comerciais\n\nDa análise inicial à manutenção, acompanhamos todo o processo.',
    keywords: ['serviços', 'oferecem', 'fazem', 'trabalho'],
  },
  {
    category: 'Telhado',
    question: 'O meu telhado é adequado?',
    answer: 'Avaliamos:\n\n• Orientação (ideal: Sul, Sudeste, Sudoeste)\n• Inclinação (ideal: 30-35°)\n• Sombreamento\n• Estado estrutural\n• Área disponível\n\nFazemos visita técnica gratuita para avaliar. Mesmo condições não ideais podem ser viáveis!',
    keywords: ['telhado', 'telha', 'adequado', 'orientação', 'serve'],
  },
  {
    category: 'Tarifas',
    question: 'Podem ajudar com otimização de tarifas?',
    answer: 'Sim! Analisamos:\n\n• Seu perfil de consumo\n• Horários de maior uso\n• Potência contratada ideal\n• Melhores operadoras e tarifas\n\nMuitas vezes conseguimos poupança imediata só com mudança de tarifa/operadora, antes mesmo de instalar solar!',
    keywords: ['tarifa', 'tarifas', 'otimização', 'operadora', 'mudar'],
  },
  {
    category: 'Produção',
    question: 'Quanta energia vou produzir?',
    answer: 'Em Portugal, cada kWp instalado produz cerca de 1.400-1.600 kWh/ano. Por exemplo:\n\n• 3 kWp → ~4.500 kWh/ano\n• 5 kWp → ~7.500 kWh/ano\n• 10 kWp → ~15.000 kWh/ano\n\nVaria com localização, orientação e sombreamento. Fazemos simulação precisa para o seu caso.',
    keywords: ['produção', 'produzir', 'energia', 'kwh', 'gerar'],
  },
  {
    category: 'Inverno',
    question: 'Funciona no inverno e dias nublados?',
    answer: 'Sim! Os painéis funcionam com luz solar, não calor. Mesmo em dias nublados produzem energia (20-40% da capacidade). No inverno, dias claros e frios podem até ser mais eficientes que dias muito quentes. A produção anual compensa as variações sazonais.',
    keywords: ['inverno', 'nublado', 'chuva', 'frio', 'funciona'],
  },
  {
    category: 'Excedente',
    question: 'O que acontece ao excedente de energia?',
    answer: 'Tem 3 opções:\n\n1. Autoconsumo (com baterias)\n2. Injeção na rede com compensação (créditos na fatura)\n3. Venda à rede (UPAC - produtor)\n\nA melhor opção depende do seu perfil. Aconselhamos a solução ideal no seu caso.',
    keywords: ['excedente', 'sobra', 'vender', 'injetar', 'rede'],
  },
  {
    category: 'Propriedade',
    question: 'Preciso ser proprietário do imóvel?',
    answer: 'Idealmente sim, mas:\n\n• Arrendatários podem instalar com autorização do proprietário\n• Em condomínios, pode instalar no seu espaço privativo\n• Partes comuns requerem aprovação da assembleia\n\nConsultamos o melhor caminho para a sua situação.',
    keywords: ['proprietário', 'arrendatário', 'condomínio', 'aluguer', 'renda'],
  },
  {
    category: 'Painéis',
    question: 'Que tipo de painéis utilizam?',
    answer: 'Trabalhamos com marcas premium tier 1:\n\n• Monocristalinos (maior eficiência)\n• Eficiência: 20-22%\n• Garantia: 25 anos\n• Certificações europeias\n• Resistentes a granizo e condições extremas\n\nMarcas: JA Solar, Jinko, Trina, LONGi, entre outras.',
    keywords: ['painéis', 'painel', 'tipo', 'marca', 'qualidade'],
  },
  {
    category: 'Monitorização',
    question: 'Posso monitorizar a produção?',
    answer: 'Sim! Todos os sistemas incluem:\n\n📱 App móvel em tempo real\n💻 Portal web\n📊 Histórico de produção\n⚡ Consumo vs produção\n🔔 Alertas de anomalias\n\nAcompanhe tudo do seu smartphone, em qualquer lugar!',
    keywords: ['monitorizar', 'monitorização', 'app', 'acompanhar', 'ver'],
  },
  {
    category: 'Simulador',
    question: 'Como usar o simulador?',
    answer: 'Fácil e rápido:\n\n1. Clique em "Simular Poupança" no site\n2. Insira dados da sua fatura\n3. Receba análise completa:\n   • Potência recomendada\n   • Investimento estimado\n   • Poupança anual\n   • Retorno do investimento\n\nSem compromisso, 100% gratuito!',
    keywords: ['simulador', 'simular', 'calcular', 'estimar'],
  },
  {
    category: 'Contacto',
    question: 'Como vos posso contactar?',
    answer: 'Várias formas de contacto:\n\n📱 WhatsApp: [número]\n📧 Email: contacto@mpgrupo.pt\n📞 Telefone: [número]\n📝 Formulário no site\n\nRespondemos rapidamente! Horário: 2ª-6ª 9h-18h',
    keywords: ['contacto', 'contato', 'falar', 'telefone', 'email', 'whatsapp', 'contactar'],
  },
];

const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Olá! Sou o assistente virtual da MPGrupo. Como posso ajudar com as suas questões sobre energia renovável? Tenho informações sobre instalação, custos, financiamento e muito mais!',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const quickReplies = [
  'Quanto custa?',
  'Quanto posso poupar?',
  'Quanto tempo demora?',
  'Como vos contacto?',
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    let bestMatch: FAQ | null = null;
    let highestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      for (const keyword of faq.keywords) {
        if (lowerQuestion.includes(keyword)) {
          score += keyword.length;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && highestScore > 0) {
      return bestMatch.answer;
    }

    const categories = [...new Set(faqs.map(f => f.category))];
    const categoriesList = categories.map(c => `• ${c}`).join('\n');

    return `Desculpe, não encontrei uma resposta específica para essa pergunta.

Tenho informações sobre:

${categoriesList}

Pode perguntar sobre qualquer um destes tópicos ou contactar-nos diretamente:

📱 WhatsApp/Tel: [número]
📧 Email: contacto@mpgrupo.pt
📝 Formulário no site`;
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const answer = findBestAnswer(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gold text-primary-foreground rounded-full shadow-2xl hover:bg-gold-light transition-all flex items-center justify-center group"
          >
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-background border-2 border-gold rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-chocolate-dark to-chocolate-medium p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">MPGrupo</h3>
                  <p className="font-body text-xs text-cream-muted">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl font-body text-sm whitespace-pre-line ${
                      message.sender === 'user'
                        ? 'bg-gold text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-chocolate-medium rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="font-body text-xs text-cream-muted mb-2">Respostas rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSendMessage(reply)}
                      className="px-3 py-1.5 bg-background border border-gold/30 rounded-full font-body text-xs text-foreground hover:bg-gold/10 transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 bg-muted border border-border rounded-full font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="w-10 h-10 bg-gold text-primary-foreground rounded-full flex items-center justify-center hover:bg-gold-light transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
