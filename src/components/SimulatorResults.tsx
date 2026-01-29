import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulacaoInput, Operadora, ConfiguracaoDesconto, ResultadoComparacao } from '@/types/energy';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingDown, AlertCircle, ArrowLeft, Download, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateSimulationPDF } from '@/lib/pdfGenerator';
import { generateWhatsAppMessage, openWhatsApp, MPGRUPO_WHATSAPP } from '@/lib/whatsappUtils';

interface SimulatorResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulacao: SimulacaoInput;
  onReset: () => void;
}

const SimulatorResults = ({ open, onOpenChange, simulacao, onReset }: SimulatorResultsProps) => {
  const [loading, setLoading] = useState(true);
  const [resultados, setResultados] = useState<ResultadoComparacao[]>([]);
  const [custoAtual, setCustoAtual] = useState(0);

  useEffect(() => {
    if (open) {
      calcularResultados();
    }
  }, [open, simulacao]);

  const calcularResultados = async () => {
    try {
      setLoading(true);

      const [operadorasRes, descontosRes] = await Promise.all([
        supabase.from('operadoras').select('*').eq('ativa', true),
        supabase.from('configuracoes_descontos').select('*')
      ]);

      if (operadorasRes.error) throw operadorasRes.error;
      if (descontosRes.error) throw descontosRes.error;

      const operadoras = operadorasRes.data || [];
      const descontosMap: Record<string, ConfiguracaoDesconto> = {};
      (descontosRes.data || []).forEach((d) => {
        descontosMap[d.operadora_id] = d;
      });

      const operadorasComCiclo = operadoras.filter((op) =>
        op.ciclos_disponiveis?.includes(simulacao.ciclo_horario)
      );

      const custoAtual = calcularCustoAtual();
      setCustoAtual(custoAtual);

      const resultadosCalculados: ResultadoComparacao[] = [];

      for (const operadora of operadorasComCiclo) {
        if (operadora.nome === simulacao.operadora_atual) continue;

        const desconto = descontosMap[operadora.id];
        const resultado = calcularCustoOperadora(operadora, desconto);
        if (resultado) {
          resultadosCalculados.push(resultado);
        }
      }

      resultadosCalculados.sort((a, b) => b.poupanca - a.poupanca);
      setResultados(resultadosCalculados);
    } catch (error) {
      toast.error('Erro ao calcular resultados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCustoAtual = (): number => {
    const custoPotencia = simulacao.valor_potencia_diaria_atual * simulacao.dias_fatura;

    let custoEnergia = 0;

    if (simulacao.ciclo_horario === 'simples') {
      custoEnergia = (simulacao.kwh_simples || 0) * (simulacao.preco_simples || 0);
    } else if (simulacao.ciclo_horario === 'bi-horario') {
      custoEnergia =
        (simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0) +
        (simulacao.kwh_fora_vazio || 0) * (simulacao.preco_fora_vazio || 0);
    } else if (simulacao.ciclo_horario === 'tri-horario') {
      custoEnergia =
        (simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0) +
        (simulacao.kwh_ponta || 0) * (simulacao.preco_ponta || 0) +
        (simulacao.kwh_cheias || 0) * (simulacao.preco_cheias || 0);
    }

    return custoPotencia + custoEnergia;
  };

  const calcularCustoOperadora = (
    operadora: Operadora,
    desconto?: ConfiguracaoDesconto
  ): ResultadoComparacao | null => {
    const tarifasCiclo = operadora.tarifas?.[simulacao.ciclo_horario];
    if (!tarifasCiclo) return null;

    const potenciasObj = tarifasCiclo.valor_diario_potencias as Record<string, number>;
    const valorPotenciaDiaria = potenciasObj[simulacao.potencia.toString()] || 0;

    let custoPotencia = valorPotenciaDiaria * simulacao.dias_fatura;

    let custoEnergia = 0;
    const custosEnergia: ResultadoComparacao['custos_energia'] = {};

    if (simulacao.ciclo_horario === 'simples' && 'valor_kwh' in tarifasCiclo) {
      custoEnergia = (simulacao.kwh_simples || 0) * tarifasCiclo.valor_kwh;
      custosEnergia.simples = custoEnergia;
    } else if (simulacao.ciclo_horario === 'bi-horario' && 'valor_kwh_vazio' in tarifasCiclo) {
      const custoVazio = (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio;
      const custoForaVazio = (simulacao.kwh_fora_vazio || 0) * tarifasCiclo.valor_kwh_fora_vazio;
      custoEnergia = custoVazio + custoForaVazio;
      custosEnergia.vazio = custoVazio;
      custosEnergia.fora_vazio = custoForaVazio;
    } else if (simulacao.ciclo_horario === 'tri-horario' && 'valor_kwh_ponta' in tarifasCiclo) {
      const custoVazio = (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio;
      const custoPonta = (simulacao.kwh_ponta || 0) * tarifasCiclo.valor_kwh_ponta;
      const custoCheias = (simulacao.kwh_cheias || 0) * tarifasCiclo.valor_kwh_cheias;
      custoEnergia = custoVazio + custoPonta + custoCheias;
      custosEnergia.vazio = custoVazio;
      custosEnergia.ponta = custoPonta;
      custosEnergia.cheias = custoCheias;
    }

    if (desconto && (simulacao.debito_direto || simulacao.fatura_eletronica)) {
      let descontoPotencia = 0;
      let descontoEnergia = 0;

      if (simulacao.debito_direto) {
        descontoPotencia += desconto.desconto_dd_potencia;
        descontoEnergia += desconto.desconto_dd_energia;
      }

      if (simulacao.fatura_eletronica) {
        descontoPotencia += desconto.desconto_fe_potencia;
        descontoEnergia += desconto.desconto_fe_energia;
      }

      custoPotencia = custoPotencia * (1 - descontoPotencia / 100);
      custoEnergia = custoEnergia * (1 - descontoEnergia / 100);
    }

    const subtotal = custoPotencia + custoEnergia;
    const poupanca = custoAtual - subtotal;

    let poupancaPotencialDDFE: number | undefined;
    if (desconto && (!simulacao.debito_direto || !simulacao.fatura_eletronica)) {
      const descontoPotenciaTotal = desconto.desconto_dd_potencia + desconto.desconto_fe_potencia;
      const descontoEnergiaTotal = desconto.desconto_dd_energia + desconto.desconto_fe_energia;

      const custoPotenciaComDesconto = (valorPotenciaDiaria * simulacao.dias_fatura) * (1 - descontoPotenciaTotal / 100);
      let custoEnergiaBase = 0;

      if (simulacao.ciclo_horario === 'simples' && 'valor_kwh' in tarifasCiclo) {
        custoEnergiaBase = (simulacao.kwh_simples || 0) * tarifasCiclo.valor_kwh;
      } else if (simulacao.ciclo_horario === 'bi-horario' && 'valor_kwh_vazio' in tarifasCiclo) {
        custoEnergiaBase =
          (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio +
          (simulacao.kwh_fora_vazio || 0) * tarifasCiclo.valor_kwh_fora_vazio;
      } else if (simulacao.ciclo_horario === 'tri-horario' && 'valor_kwh_ponta' in tarifasCiclo) {
        custoEnergiaBase =
          (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio +
          (simulacao.kwh_ponta || 0) * tarifasCiclo.valor_kwh_ponta +
          (simulacao.kwh_cheias || 0) * tarifasCiclo.valor_kwh_cheias;
      }

      const custoEnergiaComDesconto = custoEnergiaBase * (1 - descontoEnergiaTotal / 100);
      const subtotalComDesconto = custoPotenciaComDesconto + custoEnergiaComDesconto;
      poupancaPotencialDDFE = subtotal - subtotalComDesconto;
    }

    return {
      operadora,
      valor_potencia_diaria: valorPotenciaDiaria,
      custo_total_potencia: custoPotencia,
      custos_energia: custosEnergia,
      custo_total_energia: custoEnergia,
      subtotal,
      poupanca,
      poupanca_potencial_dd_fe: poupancaPotencialDDFE,
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleExportPDF = () => {
    try {
      generateSimulationPDF({
        simulacao,
        custoAtual,
        resultados,
        dataGeracao: new Date(),
      });
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const handleWhatsAppContact = () => {
    const message = generateWhatsAppMessage({
      simulacao,
      melhorResultado: resultados[0],
      custoAtual,
    });
    openWhatsApp(MPGRUPO_WHATSAPP, message);
  };

  const handleAdesaoWhatsApp = () => {
    const message = encodeURIComponent('Gostei da simulação que fiz e pretendo avançar com adesão!');
    openWhatsApp(MPGRUPO_WHATSAPP, message);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
            <p className="font-body text-cream-muted">A calcular a sua poupança...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const melhorResultado = resultados[0];

  const handleNoResultsWhatsApp = () => {
    const message = encodeURIComponent('Olá, Não consegui simulação no site, podem ajudar-me?!');
    openWhatsApp(MPGRUPO_WHATSAPP, message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-center mb-2">
            Resultados da <span className="gold-text">Simulação</span>
          </DialogTitle>
        </DialogHeader>

        {resultados.length === 0 ? (
          <div className="space-y-6 pt-4">
            <div className="p-8 bg-muted/50 rounded-lg border border-border text-center">
              <AlertCircle className="w-16 h-16 text-gold mx-auto mb-4" />
              <h3 className="font-display text-2xl text-foreground mb-3">
                Sem Operadoras Disponíveis
              </h3>
              <p className="font-body text-cream-muted mb-6">
                De momento não temos operadoras configuradas com o ciclo horário {' '}
                <strong>
                  {simulacao.ciclo_horario === 'simples' && 'Simples'}
                  {simulacao.ciclo_horario === 'bi-horario' && 'Bi-horário'}
                  {simulacao.ciclo_horario === 'tri-horario' && 'Tri-horário'}
                </strong>.
                <br />
                Mas não se preocupe, os nossos comerciais podem ajudá-lo!
              </p>
              <button
                type="button"
                onClick={handleNoResultsWhatsApp}
                className="flex items-center gap-2 mx-auto px-8 py-4 bg-green-500 text-white rounded-lg font-body font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-6 h-6" />
                Contactar via WhatsApp
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Nova Simulação
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-6 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-6 pt-4">
          {melhorResultado && melhorResultado.poupanca > 0 && (
            <>
              <div className="p-6 bg-gold/10 border-2 border-gold rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingDown className="w-8 h-8 text-gold" />
                  <div>
                    <h3 className="font-display text-2xl text-foreground">
                      Maior Poupança: {formatCurrency(melhorResultado.poupanca)}
                    </h3>
                    <p className="font-body text-sm text-cream-muted">
                      Com {melhorResultado.operadora.nome}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-green-500/10 border-2 border-green-500 rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-xl text-foreground mb-2">
                      Quer começar a poupar?
                    </h4>
                    <p className="font-body text-sm text-cream-muted">
                      Fale connosco no WhatsApp e ajudamos com toda a mudança!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-body font-medium hover:bg-green-600 transition-all whitespace-nowrap"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contactar via WhatsApp
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-4 text-left font-body font-medium text-foreground border border-border">
                    Operadora
                  </th>
                  <th className="p-4 text-right font-body font-medium text-foreground border border-border">
                    Operadora Atual
                  </th>
                  {resultados.map((r) => (
                    <th
                      key={r.operadora.id}
                      className={`p-4 text-center font-body font-medium text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/20' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {r.operadora.logotipo_url && (
                          <img
                            src={r.operadora.logotipo_url}
                            alt={r.operadora.nome}
                            className="w-24 h-12 object-contain bg-white rounded p-1"
                          />
                        )}
                        <span className="text-sm">{r.operadora.nome}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 font-body text-cream-muted border border-border">
                    Valor Potência Diária
                  </td>
                  <td className="p-4 text-right font-body text-foreground border border-border">
                    -
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-4 text-center font-body text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/10' : ''
                      }`}
                    >
                      {formatCurrency(r.valor_potencia_diaria)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-body text-cream-muted border border-border">
                    Custo Total Potência
                  </td>
                  <td className="p-4 text-right font-body text-foreground border border-border">
                    -
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-4 text-center font-body text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/10' : ''
                      }`}
                    >
                      {formatCurrency(r.custo_total_potencia)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-body text-cream-muted border border-border">
                    Custo Total Energia
                  </td>
                  <td className="p-4 text-right font-body text-foreground border border-border">
                    {formatCurrency(custoAtual)}
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-4 text-center font-body text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/10' : ''
                      }`}
                    >
                      {formatCurrency(r.custo_total_energia)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/50">
                  <td className="p-4 font-body font-medium text-foreground border border-border">
                    Subtotal
                  </td>
                  <td className="p-4 text-right font-body font-medium text-foreground border border-border">
                    {formatCurrency(custoAtual)}
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-4 text-center font-body font-medium text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/20' : ''
                      }`}
                    >
                      {formatCurrency(r.subtotal)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gold/5">
                  <td className="p-4 font-body font-bold text-foreground border border-border">
                    Poupança
                  </td>
                  <td className="p-4 text-right font-body text-foreground border border-border">
                    -
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-4 text-center font-body font-bold border border-border ${
                        r === melhorResultado ? 'bg-gold/30 text-gold' : r.poupanca > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {r.poupanca > 0 ? '+' : ''}{formatCurrency(r.poupanca)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {resultados.some((r) => r.poupanca_potencial_dd_fe && r.poupanca_potencial_dd_fe > 0) && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-body font-medium text-foreground">
                  Poupança Adicional com DD + FE
                </p>
                {resultados
                  .filter((r) => r.poupanca_potencial_dd_fe && r.poupanca_potencial_dd_fe > 0)
                  .map((r) => (
                    <p key={r.operadora.id} className="font-body text-sm text-cream-muted">
                      <strong>{r.operadora.nome}:</strong> Poderia poupar mais{' '}
                      <strong className="text-blue-500">{formatCurrency(r.poupanca_potencial_dd_fe!)}</strong>{' '}
                      se aderisse a Débito Direto e Fatura Eletrónica
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Nova Simulação
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gold text-gold rounded-lg font-body font-medium hover:bg-gold hover:text-primary-foreground transition-all"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleAdesaoWhatsApp}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-body font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Quero aderir!
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-6 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimulatorResults;
