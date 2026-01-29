import { SimulacaoInput, ResultadoComparacao } from '@/types/energy';

interface WhatsAppMessageData {
  simulacao: SimulacaoInput;
  melhorResultado?: ResultadoComparacao;
  custoAtual: number;
}

export const generateWhatsAppMessage = (data: WhatsAppMessageData): string => {
  const { simulacao, melhorResultado, custoAtual } = data;

  let message = `Olá! Gostaria de saber mais sobre poupança energética.\n\n`;
  message += `📊 *Dados da Simulação:*\n`;
  message += `• Operadora Atual: ${simulacao.operadora_atual}\n`;
  message += `• Potência: ${simulacao.potencia} kVA\n`;
  message += `• Valor Potência Diária: €${simulacao.valor_potencia_diaria_atual.toFixed(4)}\n`;
  message += `• Ciclo: ${simulacao.ciclo_horario}\n`;
  message += `• Dias: ${simulacao.dias_fatura}\n`;
  message += `• Custo Atual: €${custoAtual.toFixed(2)}\n\n`;

  if (melhorResultado && melhorResultado.poupanca > 0) {
    const poupancaAnual = (melhorResultado.poupanca / simulacao.dias_fatura) * 365;
    message += `💰 *Melhor Opção:*\n`;
    message += `• Operadora: ${melhorResultado.operadora.nome}\n`;
    message += `• Poupança: €${melhorResultado.poupanca.toFixed(2)} (${simulacao.dias_fatura} dias)\n`;
    message += `• Projeção Anual: €${poupancaAnual.toFixed(2)}\n\n`;
  }

  message += `Gostaria de obter mais informações sobre como mudar de operadora e começar a poupar!`;

  return encodeURIComponent(message);
};

export const openWhatsApp = (phoneNumber: string, message: string): void => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${message}`;
  window.open(url, '_blank');
};

export const MPGRUPO_WHATSAPP = '351912345678';
