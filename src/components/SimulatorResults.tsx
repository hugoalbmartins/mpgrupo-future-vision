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

      const interval = setInterval(() => {
        calcularResultados();
      }, 60000);

      return () => clearInterval(interval);
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
        if (operadora.nome.toLowerCase().trim() === simulacao.operadora_atual.toLowerCase().trim()) continue;

        const desconto = descontosMap[operadora.id];
        const resultado = calcularCustoOperadora(operadora, desconto, custoAtual);
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
    desconto: ConfiguracaoDesconto | undefined,
    custoAtualFatura: number
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

    if (desconto) {
      let descontoPotencia = desconto.desconto_base_potencia || 0;
      let descontoEnergia = desconto.desconto_base_energia || 0;

      if (simulacao.debito_direto && simulacao.fatura_eletronica) {
        descontoPotencia += desconto.desconto_dd_fe_potencia || 0;
        descontoEnergia += desconto.desconto_dd_fe_energia || 0;
      } else {
        if (simulacao.debito_direto) {
          descontoPotencia += desconto.desconto_dd_potencia || 0;
          descontoEnergia += desconto.desconto_dd_energia || 0;
        }

        if (simulacao.fatura_eletronica) {
          descontoPotencia += desconto.desconto_fe_potencia || 0;
          descontoEnergia += desconto.desconto_fe_energia || 0;
        }
      }

      custoPotencia = custoPotencia * (1 - descontoPotencia / 100);
      custoEnergia = custoEnergia * (1 - descontoEnergia / 100);
    }

    const subtotal = custoPotencia + custoEnergia;
    const poupanca = custoAtualFatura - subtotal;

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

    let descontoTemporario: ResultadoComparacao['desconto_temporario'];
    if (desconto && desconto.desconto_mensal_temporario > 0 && desconto.duracao_meses_desconto > 0) {
      const requerDD = desconto.desconto_temp_requer_dd || false;
      const requerFE = desconto.desconto_temp_requer_fe || false;

      const clienteTemDD = simulacao.debito_direto;
      const clienteTemFE = simulacao.fatura_eletronica;

      const disponivel = (!requerDD || clienteTemDD) && (!requerFE || clienteTemFE);

      const custoMensalBase = (subtotal / simulacao.dias_fatura) * 30;
      const custoMensalComDesconto = custoMensalBase - desconto.desconto_mensal_temporario;
      const poupancaPeriodoDesconto = desconto.desconto_mensal_temporario * desconto.duracao_meses_desconto;

      descontoTemporario = {
        valor_mensal: desconto.desconto_mensal_temporario,
        duracao_meses: desconto.duracao_meses_desconto,
        descricao: desconto.descricao_desconto_temporario,
        poupanca_periodo_desconto: poupancaPeriodoDesconto,
        custo_mensal_com_desconto: custoMensalComDesconto,
        custo_mensal_apos_desconto: custoMensalBase,
        requer_dd: requerDD,
        requer_fe: requerFE,
        disponivel: disponivel,
      };
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
      desconto_temporario: descontoTemporario,
    };
  };

  const formatCurrency = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 6) => {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getCellStyle = (resultado: ResultadoComparacao, melhorResultado: ResultadoComparacao | undefined) => {
    const isBestWithSavings = resultado === melhorResultado && resultado.poupanca > 0;
    return isBestWithSavings ? { boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)' } : undefined;
  };

  const getCellClassName = (resultado: ResultadoComparacao, melhorResultado: ResultadoComparacao | undefined, baseClass: string = '') => {
    const isBestWithSavings = resultado === melhorResultado && resultado.poupanca > 0;
    const isBest = resultado === melhorResultado;

    if (isBestWithSavings) {
      return `${baseClass} border-green-500 border-2`;
    } else if (isBest) {
      return `${baseClass} border-border`;
    }
    return `${baseClass} border-border`;
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

  const temPoupanca = resultados.some((r) => r.poupanca > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={temPoupanca ? {
          boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)',
          border: '2px solid rgba(34, 197, 94, 0.5)'
        } : undefined}
      >
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

          <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm text-foreground">
                <strong>Nota importante:</strong> Esta simulação não considera descontos de tarifa social.
                Caso tenha direito a tarifa social, esse desconto é aplicado na mesma percentagem por qualquer operadora,
                pelo que deve desconsiderar esse valor na comparação.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-3 text-left font-body font-medium text-foreground border border-border">
                    Descrição
                  </th>
                  <th className="p-3 text-center font-body font-medium text-foreground border border-border">
                    Operadora Atual<br/>
                    <span className="text-xs font-normal text-cream-muted">{simulacao.operadora_atual}</span>
                  </th>
                  {resultados.map((r) => {
                    const isBestWithSavings = r === melhorResultado && r.poupanca > 0;
                    return (
                      <th
                        key={r.operadora.id}
                        className={`p-3 text-center font-body font-medium text-foreground border-2 ${
                          isBestWithSavings
                            ? 'border-green-500'
                            : r === melhorResultado
                            ? 'border-border'
                            : 'border-border'
                        }`}
                        style={isBestWithSavings ? {
                          boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                        } : undefined}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {r.operadora.logotipo_url && (
                            <img
                              src={r.operadora.logotipo_url}
                              alt={r.operadora.nome}
                              className="w-20 h-10 object-contain bg-white rounded p-1"
                            />
                          )}
                          <span className="text-xs">{r.operadora.nome}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Potência */}
                <tr className="bg-muted/30">
                  <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                    POTÊNCIA ({simulacao.potencia} kVA)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-body text-cream-muted border border-border">
                    Valor Potência Diária
                  </td>
                  <td className="p-3 text-center font-body text-foreground border border-border">
                    {formatCurrency(simulacao.valor_potencia_diaria_atual, 6)}
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={getCellClassName(r, melhorResultado, 'p-3 text-center font-body text-foreground border')}
                      style={getCellStyle(r, melhorResultado)}
                    >
                      {formatCurrency(r.valor_potencia_diaria, 6)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-body text-cream-muted border border-border">
                    Total Potência ({simulacao.dias_fatura} dias)
                  </td>
                  <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                    {formatCurrency(simulacao.valor_potencia_diaria_atual * simulacao.dias_fatura, 2)}
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={getCellClassName(r, melhorResultado, 'p-3 text-center font-body font-medium text-foreground border')}
                      style={getCellStyle(r, melhorResultado)}
                    >
                      {formatCurrency(r.custo_total_potencia, 2)}
                    </td>
                  ))}
                </tr>

                {/* Energia - Ciclo Simples */}
                {simulacao.ciclo_horario === 'simples' && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        ENERGIA - CICLO SIMPLES
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_simples || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['simples'];
                        const valorKwh = tarifasCiclo && 'valor_kwh' in tarifasCiclo ? tarifasCiclo.valor_kwh : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia ({formatNumber(simulacao.kwh_simples || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_simples || 0) * (simulacao.preco_simples || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.simples || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Energia - Bi-horário */}
                {simulacao.ciclo_horario === 'bi-horario' && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        ENERGIA - CICLO BI-HORÁRIO
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh Vazio
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['bi-horario'];
                        const valorKwh = tarifasCiclo && 'valor_kwh_vazio' in tarifasCiclo ? tarifasCiclo.valor_kwh_vazio : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Vazio ({formatNumber(simulacao.kwh_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh Fora Vazio
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_fora_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['bi-horario'];
                        const valorKwh = tarifasCiclo && 'valor_kwh_fora_vazio' in tarifasCiclo ? tarifasCiclo.valor_kwh_fora_vazio : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Fora Vazio ({formatNumber(simulacao.kwh_fora_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_fora_vazio || 0) * (simulacao.preco_fora_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.fora_vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Energia - Tri-horário */}
                {simulacao.ciclo_horario === 'tri-horario' && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        ENERGIA - CICLO TRI-HORÁRIO
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh Vazio
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['tri-horario'];
                        const valorKwh = tarifasCiclo && 'valor_kwh_vazio' in tarifasCiclo ? tarifasCiclo.valor_kwh_vazio : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Vazio ({formatNumber(simulacao.kwh_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh Ponta
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_ponta || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['tri-horario'];
                        const valorKwh = tarifasCiclo && 'valor_kwh_ponta' in tarifasCiclo ? tarifasCiclo.valor_kwh_ponta : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Ponta ({formatNumber(simulacao.kwh_ponta || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_ponta || 0) * (simulacao.preco_ponta || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.ponta || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Valor kWh Cheias
                      </td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_cheias || 0, 6)}
                      </td>
                      {resultados.map((r) => {
                        const tarifasCiclo = r.operadora.tarifas?.['tri-horario'];
                        const valorKwh = tarifasCiclo && 'valor_kwh_cheias' in tarifasCiclo ? tarifasCiclo.valor_kwh_cheias : 0;
                        return (
                          <td
                            key={r.operadora.id}
                            className={`p-3 text-center font-body text-foreground border border-border ${
                              r === melhorResultado ? 'bg-gold/10' : ''
                            }`}
                          >
                            {formatCurrency(valorKwh, 6)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Cheias ({formatNumber(simulacao.kwh_cheias || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_cheias || 0) * (simulacao.preco_cheias || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className={`p-3 text-center font-body font-medium text-foreground border border-border ${
                            r === melhorResultado ? 'bg-gold/10' : ''
                          }`}
                        >
                          {formatCurrency(r.custos_energia.cheias || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Totais */}
                <tr className="bg-muted/50">
                  <td className="p-3 font-body font-bold text-foreground border border-border">
                    TOTAL FATURA
                  </td>
                  <td className="p-3 text-center font-body font-bold text-lg text-foreground border border-border">
                    {formatCurrency(custoAtual, 2)}
                  </td>
                  {resultados.map((r) => (
                    <td
                      key={r.operadora.id}
                      className={`p-3 text-center font-body font-bold text-lg text-foreground border border-border ${
                        r === melhorResultado ? 'bg-gold/20' : ''
                      }`}
                    >
                      {formatCurrency(r.subtotal, 2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gold/5">
                  <td className="p-3 font-body font-bold text-foreground border border-border">
                    POUPANÇA
                  </td>
                  <td className="p-3 text-center font-body text-foreground border border-border">
                    -
                  </td>
                  {resultados.map((r) => {
                    const isBestWithSavings = r === melhorResultado && r.poupanca > 0;
                    const isBest = r === melhorResultado;

                    let className = 'p-3 text-center font-body font-bold text-lg ';
                    if (isBestWithSavings) {
                      className += 'border-2 border-green-500 text-green-700 dark:text-green-400';
                    } else if (isBest) {
                      className += 'border text-gold border-border';
                    } else if (r.poupanca > 0) {
                      className += 'border text-green-600 border-border';
                    } else {
                      className += 'border text-red-600 border-border';
                    }

                    return (
                      <td
                        key={r.operadora.id}
                        className={className}
                        style={isBestWithSavings ? {
                          boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
                        } : undefined}
                      >
                        {formatCurrency(r.poupanca, 2)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {resultados.some((r) => {
            if (!r.poupanca_potencial_dd_fe || r.poupanca_potencial_dd_fe <= 0) return false;
            const poupancaTotalComDDFE = custoAtual - (r.subtotal - r.poupanca_potencial_dd_fe);
            return poupancaTotalComDDFE > 0;
          }) && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-body font-medium text-foreground">
                  Poupança Adicional com Débito Direto e Fatura Eletrónica
                </p>
                {resultados
                  .filter((r) => {
                    if (!r.poupanca_potencial_dd_fe || r.poupanca_potencial_dd_fe <= 0) return false;
                    const poupancaTotalComDDFE = custoAtual - (r.subtotal - r.poupanca_potencial_dd_fe);
                    return poupancaTotalComDDFE > 0;
                  })
                  .map((r) => {
                    const poupancaTotalComDDFE = custoAtual - (r.subtotal - r.poupanca_potencial_dd_fe!);
                    return (
                      <p key={r.operadora.id} className="font-body text-sm text-cream-muted">
                        <strong>{r.operadora.nome}:</strong> Caso aderisse com Débito Direto e Fatura Eletrónica, a poupança total em relação à fatura atual seria de{' '}
                        <strong className="text-blue-500">{formatCurrency(poupancaTotalComDDFE, 2)}</strong>
                      </p>
                    );
                  })}
              </div>
            </div>
          )}

          {resultados.some((r) => r.desconto_temporario && r.desconto_temporario.disponivel) && (
            <div className="space-y-4">
              {resultados
                .filter((r) => r.desconto_temporario && r.desconto_temporario.disponivel)
                .map((r) => {
                  const dt = r.desconto_temporario!;
                  return (
                    <div key={r.operadora.id} className="p-6 bg-amber-500/10 border-2 border-amber-500/50 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-body font-bold text-foreground text-lg mb-1">
                            {r.operadora.nome} - Desconto Promocional Temporário
                          </h4>
                          {dt.descricao && (
                            <p className="font-body text-sm text-amber-600 dark:text-amber-400 mb-2">
                              {dt.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-background rounded-lg border border-amber-500/30">
                          <p className="font-body text-xs text-cream-muted mb-1">Desconto Mensal</p>
                          <p className="font-body font-bold text-foreground text-xl">
                            {formatCurrency(dt.valor_mensal)}
                          </p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-amber-500/30">
                          <p className="font-body text-xs text-cream-muted mb-1">Durante</p>
                          <p className="font-body font-bold text-foreground text-xl">
                            {dt.duracao_meses} {dt.duracao_meses === 1 ? 'mês' : 'meses'}
                          </p>
                        </div>
                        <div className="p-4 bg-amber-500/20 rounded-lg border border-amber-500/50">
                          <p className="font-body text-xs text-amber-700 dark:text-amber-400 mb-1">Poupança Total no Período</p>
                          <p className="font-body font-bold text-amber-700 dark:text-amber-400 text-xl">
                            {formatCurrency(dt.poupanca_periodo_desconto)}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-background rounded-lg border border-border space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm text-cream-muted">
                            Custo Mensal durante os primeiros {dt.duracao_meses} {dt.duracao_meses === 1 ? 'mês' : 'meses'}:
                          </span>
                          <span className="font-body font-bold text-green-600 text-lg">
                            {formatCurrency(dt.custo_mensal_com_desconto)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm text-cream-muted">
                            Custo Mensal após o período promocional:
                          </span>
                          <span className="font-body font-bold text-foreground text-lg">
                            {formatCurrency(dt.custo_mensal_apos_desconto)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {resultados.some((r) => {
            if (!r.desconto_temporario || r.desconto_temporario.disponivel) return false;
            const custoMensalAtual = (custoAtual / simulacao.dias_fatura) * 30;
            const custoMensalSimulado = (r.subtotal / simulacao.dias_fatura) * 30;
            const custoComDesconto = custoMensalSimulado - r.desconto_temporario.valor_mensal;
            const poupancaMensalTotal = custoMensalAtual - custoComDesconto;
            return poupancaMensalTotal > 0;
          }) && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-body font-medium text-foreground">
                  Descontos Promocionais Adicionais Disponíveis
                </p>
                {resultados
                  .filter((r) => {
                    if (!r.desconto_temporario || r.desconto_temporario.disponivel) return false;
                    const custoMensalAtual = (custoAtual / simulacao.dias_fatura) * 30;
                    const custoMensalSimulado = (r.subtotal / simulacao.dias_fatura) * 30;
                    const custoComDesconto = custoMensalSimulado - r.desconto_temporario.valor_mensal;
                    const poupancaMensalTotal = custoMensalAtual - custoComDesconto;
                    return poupancaMensalTotal > 0;
                  })
                  .map((r) => {
                    const dt = r.desconto_temporario!;
                    const requisitos: string[] = [];
                    if (dt.requer_dd && !simulacao.debito_direto) requisitos.push('Débito Direto');
                    if (dt.requer_fe && !simulacao.fatura_eletronica) requisitos.push('Fatura Eletrónica');

                    const custoMensalAtual = (custoAtual / simulacao.dias_fatura) * 30;
                    const custoMensalSimulado = (r.subtotal / simulacao.dias_fatura) * 30;
                    const custoComDesconto = custoMensalSimulado - dt.valor_mensal;
                    const poupancaMensalTotal = custoMensalAtual - custoComDesconto;
                    const poupancaTotalPeriodo = poupancaMensalTotal * dt.duracao_meses;

                    return (
                      <p key={r.operadora.id} className="font-body text-sm text-cream-muted">
                        <strong>{r.operadora.nome}:</strong> Caso aderisse com {requisitos.join(' e ')}, a poupança total em relação à fatura atual seria de{' '}
                        <strong className="text-blue-500">{formatCurrency(poupancaTotalPeriodo, 2)}</strong>{' '}
                        durante os primeiros {dt.duracao_meses} {dt.duracao_meses === 1 ? 'mês' : 'meses'}
                        {dt.descricao && ` (${dt.descricao})`}
                      </p>
                    );
                  })}
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
