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
}

const faqs: FAQ[] = [
  {
    question: 'Como funciona a mudança de operadora?',
    answer: 'A mudança é simples e gratuita! Tratamos de todo o processo por si. Basta fornecer os seus dados e nós contactamos a nova operadora, que trata da rescisão com a atual. O processo demora cerca de 15 dias úteis e não há interrupção no fornecimento.',
    keywords: ['mudança', 'mudar', 'trocar', 'operadora', 'processo', 'como'],
  },
  {
    question: 'Quanto tempo demora a mudança?',
    answer: 'O processo de mudança demora tipicamente 15 dias úteis. Durante este período, o fornecimento de energia nunca é interrompido.',
    keywords: ['tempo', 'demora', 'prazo', 'quanto', 'dias'],
  },
  {
    question: 'Há custos para mudar?',
    answer: 'Não! A mudança de operadora é totalmente gratuita. Não há custos de adesão, ativação ou rescisão. Apenas começa a pagar a nova tarifa após a mudança estar concluída.',
    keywords: ['custo', 'preço', 'pagar', 'grátis', 'gratuito', 'dinheiro'],
  },
  {
    question: 'O fornecimento é interrompido?',
    answer: 'Não. O fornecimento de eletricidade nunca é interrompido durante a mudança. A transição é feita de forma transparente pela rede de distribuição.',
    keywords: ['interrupção', 'corte', 'fornecimento', 'luz', 'energia'],
  },
  {
    question: 'Como funciona o simulador?',
    answer: 'O nosso simulador compara as tarifas das principais operadoras do mercado com base nos seus dados de consumo. Basta inserir informações da sua fatura atual e receberá uma análise completa de poupança.',
    keywords: ['simulador', 'simulação', 'calcular', 'comparar'],
  },
  {
    question: 'Posso voltar à operadora anterior?',
    answer: 'Sim! Pode mudar de operadora sempre que desejar, sem custos ou penalizações. No mercado livre, tem total liberdade de escolha.',
    keywords: ['voltar', 'anterior', 'reverter', 'cancelar'],
  },
  {
    question: 'O que é potência contratada?',
    answer: 'A potência contratada (em kVA) é a quantidade máxima de energia que pode usar simultaneamente. Encontra este valor na sua fatura. Se for muito baixa, os disjuntores disparam. Se for muito alta, está a pagar mais do que precisa.',
    keywords: ['potência', 'kva', 'contratada', 'disjuntor'],
  },
  {
    question: 'O que são ciclos horários?',
    answer: 'Os ciclos horários definem quando a energia é mais cara ou mais barata:\n\n• Simples: preço único 24h\n• Bi-horário: preço vazio (mais barato) e fora-vazio\n• Tri-horário: vazio, ponta (mais caro) e cheias\n\nA escolha certa pode gerar grande poupança!',
    keywords: ['ciclo', 'horário', 'vazio', 'ponta', 'cheias', 'bi-horário', 'tri-horário'],
  },
  {
    question: 'Como vos posso contactar?',
    answer: 'Pode contactar-nos através de:\n\n📱 WhatsApp: +351 912 345 678\n📧 Email: contacto@mpgrupo.pt\n📞 Telefone: +351 912 345 678\n\nOu preencha o formulário de contacto no site!',
    keywords: ['contacto', 'contato', 'telefone', 'email', 'whatsapp', 'falar'],
  },
];

const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Olá! Sou o assistente virtual da MPGrupo. Como posso ajudar?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const quickReplies = [
  'Como mudar de operadora?',
  'Quanto custa?',
  'Quanto tempo demora?',
  'Ver simulador',
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

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    for (const faq of faqs) {
      if (faq.keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return faq.answer;
      }
    }

    return 'Desculpe, não encontrei uma resposta para essa pergunta. Pode contactar-nos diretamente:\n\n📱 WhatsApp: +351 912 345 678\n📧 contacto@mpgrupo.pt\n\nOu preencha o formulário de contacto no site!';
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

    if (messageText.toLowerCase().includes('simulador')) {
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Ótimo! Pode aceder ao simulador clicando no botão "Simular Poupança" no topo do site ou na secção de serviços. É rápido e gratuito!',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
      return;
    }

    setTimeout(() => {
      const answer = findAnswer(messageText);
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
