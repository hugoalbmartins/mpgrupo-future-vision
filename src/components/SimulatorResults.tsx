import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulacaoInput, Operadora, ConfiguracaoDesconto, ResultadoComparacao } from '@/types/energy';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingDown, AlertCircle, ArrowLeft, Download, MessageCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSimulationPDF } from '@/lib/pdfGenerator';
import { generateWhatsAppMessage, generateWhatsAppAdesaoMessage, openWhatsApp, MPGRUPO_WHATSAPP } from '@/lib/whatsappUtils';

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
  const [custoAtualEletricidade, setCustoAtualEletricidade] = useState(0);
  const [custoAtualGas, setCustoAtualGas] = useState(0);
  const [selectedOperadoraId, setSelectedOperadoraId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

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
      const descontosMap: Record<string, ConfiguracaoDesconto[]> = {};
      (descontosRes.data || []).forEach((d) => {
        if (!descontosMap[d.operadora_id]) {
          descontosMap[d.operadora_id] = [];
        }
        descontosMap[d.operadora_id].push(d);
      });

      let operadorasFiltradas = operadoras;

      if (simulacao.tipo_simulacao === 'eletricidade') {
        operadorasFiltradas = operadoras.filter((op) =>
          op.tipos_energia?.includes('eletricidade') &&
          op.ciclos_disponiveis?.includes(simulacao.ciclo_horario)
        );
      } else if (simulacao.tipo_simulacao === 'gas') {
        operadorasFiltradas = operadoras.filter((op) =>
          op.tipos_energia?.includes('gas')
        );
      } else if (simulacao.tipo_simulacao === 'dual') {
        operadorasFiltradas = operadoras.filter((op) =>
          op.tipos_energia?.includes('eletricidade') &&
          op.tipos_energia?.includes('gas') &&
          op.ciclos_disponiveis?.includes(simulacao.ciclo_horario)
        );
      }

      const custoAtualEletricidade = simulacao.tipo_simulacao !== 'gas' ? calcularCustoAtualEletricidade() : 0;
      const custoAtualGas = simulacao.tipo_simulacao !== 'eletricidade' ? calcularCustoAtualGas() : 0;
      const custoAtualTotal = custoAtualEletricidade + custoAtualGas;

      setCustoAtualEletricidade(custoAtualEletricidade);
      setCustoAtualGas(custoAtualGas);
      setCustoAtual(custoAtualTotal);

      const resultadosCalculados: ResultadoComparacao[] = [];

      for (const operadora of operadorasFiltradas) {
        if (operadora.nome.toLowerCase().trim() === simulacao.operadora_atual.toLowerCase().trim()) continue;

        const descontos = descontosMap[operadora.id] || [];
        const resultado = calcularCustoOperadora(operadora, descontos, custoAtualTotal, custoAtualEletricidade, custoAtualGas);
        if (resultado) {
          resultadosCalculados.push(resultado);
        }
      }

      resultadosCalculados.sort((a, b) => b.poupanca - a.poupanca);
      setResultados(resultadosCalculados.slice(0, 3));
    } catch (error) {
      toast.error('Erro ao calcular resultados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCustoAtualEletricidade = (): number => {
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

  const calcularCustoAtualGas = (): number => {
    const custoDiario = (simulacao.gas_valor_diario_atual || 0) * simulacao.dias_fatura;
    const custoEnergia = (simulacao.gas_kwh || 0) * (simulacao.gas_preco_kwh || 0);
    return custoDiario + custoEnergia;
  };

  const toNum = (val: unknown): number => Number(val) || 0;

  const calcularDescontoPct = (desconto: ConfiguracaoDesconto, tipoPotencia: boolean): number => {
    if (simulacao.debito_direto && simulacao.fatura_eletronica) {
      return toNum(tipoPotencia ? desconto.desconto_dd_fe_potencia : desconto.desconto_dd_fe_energia);
    } else if (simulacao.debito_direto) {
      return toNum(tipoPotencia ? desconto.desconto_dd_potencia : desconto.desconto_dd_energia);
    } else if (simulacao.fatura_eletronica) {
      return toNum(tipoPotencia ? desconto.desconto_fe_potencia : desconto.desconto_fe_energia);
    }
    return toNum(tipoPotencia ? desconto.desconto_base_potencia : desconto.desconto_base_energia);
  };

  const calcularCustoOperadora = (
    operadora: Operadora,
    descontos: ConfiguracaoDesconto[],
    custoAtualFatura: number,
    custoAtualEletricidade: number,
    custoAtualGas: number
  ): ResultadoComparacao | null => {
    const descontoEletricidade = descontos.find(d => d.tipo_energia === 'eletricidade');
    const descontoGas = descontos.find(d => d.tipo_energia === 'gas');

    let subtotalEletricidade = 0;
    let valorPotenciaDiaria = 0;
    let custoPotencia = 0;
    let custoEnergia = 0;
    const custosEnergia: ResultadoComparacao['custos_energia'] = {};
    const valoresKwh: ResultadoComparacao['valores_kwh'] = {};
    let poupancaPotencialDDFE: number | undefined;

    if (simulacao.tipo_simulacao === 'eletricidade' || simulacao.tipo_simulacao === 'dual') {
      const tarifasCiclo = operadora.tarifas?.[simulacao.ciclo_horario];
      if (!tarifasCiclo) return null;

      const potenciasObj = tarifasCiclo.valor_diario_potencias as Record<string, number>;
      valorPotenciaDiaria = potenciasObj[simulacao.potencia.toString()] || 0;

      let vKwhSimples = 0, vKwhVazio = 0, vKwhForaVazio = 0, vKwhPonta = 0, vKwhCheias = 0;

      if (simulacao.ciclo_horario === 'simples' && 'valor_kwh' in tarifasCiclo) {
        vKwhSimples = tarifasCiclo.valor_kwh;
      } else if (simulacao.ciclo_horario === 'bi-horario' && 'valor_kwh_vazio' in tarifasCiclo) {
        vKwhVazio = tarifasCiclo.valor_kwh_vazio;
        vKwhForaVazio = tarifasCiclo.valor_kwh_fora_vazio;
      } else if (simulacao.ciclo_horario === 'tri-horario' && 'valor_kwh_ponta' in tarifasCiclo) {
        vKwhVazio = tarifasCiclo.valor_kwh_vazio;
        vKwhPonta = tarifasCiclo.valor_kwh_ponta;
        vKwhCheias = tarifasCiclo.valor_kwh_cheias;
      }

      const rawPotenciaDiaria = valorPotenciaDiaria;

      if (descontoEletricidade) {
        const pctPot = calcularDescontoPct(descontoEletricidade, true);
        const pctEne = calcularDescontoPct(descontoEletricidade, false);
        const fPot = 1 - pctPot / 100;
        const fEne = 1 - pctEne / 100;

        valorPotenciaDiaria *= fPot;
        vKwhSimples *= fEne;
        vKwhVazio *= fEne;
        vKwhForaVazio *= fEne;
        vKwhPonta *= fEne;
        vKwhCheias *= fEne;
      }

      custoPotencia = valorPotenciaDiaria * simulacao.dias_fatura;

      if (simulacao.ciclo_horario === 'simples') {
        custoEnergia = (simulacao.kwh_simples || 0) * vKwhSimples;
        custosEnergia.simples = custoEnergia;
        valoresKwh.simples = vKwhSimples;
      } else if (simulacao.ciclo_horario === 'bi-horario') {
        custosEnergia.vazio = (simulacao.kwh_vazio || 0) * vKwhVazio;
        custosEnergia.fora_vazio = (simulacao.kwh_fora_vazio || 0) * vKwhForaVazio;
        custoEnergia = (custosEnergia.vazio || 0) + (custosEnergia.fora_vazio || 0);
        valoresKwh.vazio = vKwhVazio;
        valoresKwh.fora_vazio = vKwhForaVazio;
      } else if (simulacao.ciclo_horario === 'tri-horario') {
        custosEnergia.vazio = (simulacao.kwh_vazio || 0) * vKwhVazio;
        custosEnergia.ponta = (simulacao.kwh_ponta || 0) * vKwhPonta;
        custosEnergia.cheias = (simulacao.kwh_cheias || 0) * vKwhCheias;
        custoEnergia = (custosEnergia.vazio || 0) + (custosEnergia.ponta || 0) + (custosEnergia.cheias || 0);
        valoresKwh.vazio = vKwhVazio;
        valoresKwh.ponta = vKwhPonta;
        valoresKwh.cheias = vKwhCheias;
      }

      subtotalEletricidade = custoPotencia + custoEnergia;

      if (descontoEletricidade && (!simulacao.debito_direto || !simulacao.fatura_eletronica)) {
        const pctDDFEPot = toNum(descontoEletricidade.desconto_dd_fe_potencia);
        const pctDDFEEne = toNum(descontoEletricidade.desconto_dd_fe_energia);

        const potDDFE = rawPotenciaDiaria * (1 - pctDDFEPot / 100) * simulacao.dias_fatura;
        let eneDDFE = 0;

        if (simulacao.ciclo_horario === 'simples' && 'valor_kwh' in tarifasCiclo) {
          eneDDFE = (simulacao.kwh_simples || 0) * tarifasCiclo.valor_kwh * (1 - pctDDFEEne / 100);
        } else if (simulacao.ciclo_horario === 'bi-horario' && 'valor_kwh_vazio' in tarifasCiclo) {
          eneDDFE =
            (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio * (1 - pctDDFEEne / 100) +
            (simulacao.kwh_fora_vazio || 0) * tarifasCiclo.valor_kwh_fora_vazio * (1 - pctDDFEEne / 100);
        } else if (simulacao.ciclo_horario === 'tri-horario' && 'valor_kwh_ponta' in tarifasCiclo) {
          eneDDFE =
            (simulacao.kwh_vazio || 0) * tarifasCiclo.valor_kwh_vazio * (1 - pctDDFEEne / 100) +
            (simulacao.kwh_ponta || 0) * tarifasCiclo.valor_kwh_ponta * (1 - pctDDFEEne / 100) +
            (simulacao.kwh_cheias || 0) * tarifasCiclo.valor_kwh_cheias * (1 - pctDDFEEne / 100);
        }

        const subtotalDDFE = potDDFE + eneDDFE;
        poupancaPotencialDDFE = subtotalEletricidade - subtotalDDFE;
      }
    }

    let subtotalGas = 0;
    let gasValorDiario = 0;
    let gasCustoTotalDiario = 0;
    let gasCustoEnergia = 0;
    let gasPrecoKwh = 0;

    if (simulacao.tipo_simulacao === 'gas' || simulacao.tipo_simulacao === 'dual') {
      const tarifasGas = operadora.tarifas?.gas;
      if (!tarifasGas) return null;

      const escalaoKey = simulacao.gas_escalao?.toString() || '1';
      const escalaoData = tarifasGas.escaloes?.[escalaoKey];
      gasValorDiario = escalaoData?.valor_diario || 0;
      gasPrecoKwh = escalaoData?.valor_kwh || 0;

      if (descontoGas) {
        const pctDiario = calcularDescontoPct(descontoGas, true);
        const pctEne = calcularDescontoPct(descontoGas, false);
        gasValorDiario *= (1 - pctDiario / 100);
        gasPrecoKwh *= (1 - pctEne / 100);
      }

      gasCustoTotalDiario = gasValorDiario * simulacao.dias_fatura;
      gasCustoEnergia = (simulacao.gas_kwh || 0) * gasPrecoKwh;
      subtotalGas = gasCustoTotalDiario + gasCustoEnergia;
    }

    const subtotal = subtotalEletricidade + subtotalGas;
    const poupanca = custoAtualFatura - subtotal;

    let totalDescontoMensal = 0;
    let maxDuracaoMeses = 0;
    let requerDDTemp = false;
    let requerFETemp = false;
    const descricoes: string[] = [];

    [descontoEletricidade, descontoGas].forEach((d) => {
      if (d && toNum(d.desconto_mensal_temporario) > 0 && d.duracao_meses_desconto > 0) {
        totalDescontoMensal += toNum(d.desconto_mensal_temporario);
        maxDuracaoMeses = Math.max(maxDuracaoMeses, d.duracao_meses_desconto);
        if (d.descricao_desconto_temporario) descricoes.push(d.descricao_desconto_temporario);
        if (d.desconto_temp_requer_dd) requerDDTemp = true;
        if (d.desconto_temp_requer_fe) requerFETemp = true;
      }
    });

    let descontoTemporario: ResultadoComparacao['desconto_temporario'];
    if (totalDescontoMensal > 0 && maxDuracaoMeses > 0) {
      const disponivel = (!requerDDTemp || simulacao.debito_direto) && (!requerFETemp || simulacao.fatura_eletronica);

      const custoMensalBase = (subtotal / simulacao.dias_fatura) * 30;
      const custoMensalComDesconto = custoMensalBase - totalDescontoMensal;
      const poupancaPeriodoDesconto = totalDescontoMensal * maxDuracaoMeses;

      descontoTemporario = {
        valor_mensal: totalDescontoMensal,
        duracao_meses: maxDuracaoMeses,
        descricao: descricoes.length > 0 ? descricoes.join(' + ') : null,
        poupanca_periodo_desconto: poupancaPeriodoDesconto,
        custo_mensal_com_desconto: custoMensalComDesconto,
        custo_mensal_apos_desconto: custoMensalBase,
        requer_dd: requerDDTemp,
        requer_fe: requerFETemp,
        disponivel: disponivel,
      };
    }

    return {
      operadora,
      valor_potencia_diaria: valorPotenciaDiaria,
      custo_total_potencia: custoPotencia,
      custos_energia: custosEnergia,
      valores_kwh: valoresKwh,
      custo_total_energia: custoEnergia,
      subtotal,
      poupanca,
      poupanca_potencial_dd_fe: poupancaPotencialDDFE,
      desconto_temporario: descontoTemporario,
      subtotal_eletricidade: simulacao.tipo_simulacao === 'dual' ? subtotalEletricidade : undefined,
      subtotal_gas: simulacao.tipo_simulacao === 'dual' ? subtotalGas : undefined,
      gas_valor_diario: simulacao.tipo_simulacao !== 'eletricidade' ? gasValorDiario : undefined,
      gas_custo_total_diario: simulacao.tipo_simulacao !== 'eletricidade' ? gasCustoTotalDiario : undefined,
      gas_custo_energia: simulacao.tipo_simulacao !== 'eletricidade' ? gasCustoEnergia : undefined,
      gas_preco_kwh: simulacao.tipo_simulacao !== 'eletricidade' ? gasPrecoKwh : undefined,
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

  const colStyle = (r: ResultadoComparacao, pos: 'first' | 'mid' | 'last'): React.CSSProperties => {
    const isBest = r === melhorResultado && r.poupanca > 0;
    if (!isBest) return {};
    const s: React.CSSProperties = {
      borderLeft: '2.5px solid rgb(34, 197, 94)',
      borderRight: '2.5px solid rgb(34, 197, 94)',
    };
    if (pos === 'first') s.borderTop = '2.5px solid rgb(34, 197, 94)';
    if (pos === 'last') s.borderBottom = '2.5px solid rgb(34, 197, 94)';
    return s;
  };

  const getDiscountTypeText = (): string => {
    if (simulacao.debito_direto && simulacao.fatura_eletronica) {
      return 'Descontos Base + Débito Direto + Fatura Eletrónica';
    } else if (simulacao.debito_direto) {
      return 'Descontos Base + Débito Direto';
    } else if (simulacao.fatura_eletronica) {
      return 'Descontos Base + Fatura Eletrónica';
    }
    return 'Descontos Base';
  };

  const handleExportPDF = (filteredResultados?: ResultadoComparacao[]) => {
    try {
      generateSimulationPDF({
        simulacao,
        custoAtual,
        resultados: filteredResultados || resultados,
        dataGeracao: new Date(),
      });
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const handleExportClick = () => {
    if (resultados.length <= 1) {
      handleExportPDF();
      return;
    }
    setShowExportDialog(true);
  };

  const handleExportAll = () => {
    setShowExportDialog(false);
    handleExportPDF();
  };

  const handleExportSelected = (operadoraId: string) => {
    setShowExportDialog(false);
    const filtered = resultados.filter((r) => r.operadora.id === operadoraId);
    handleExportPDF(filtered);
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
    const selectedResultado = resultados.find((r) => r.operadora.id === selectedOperadoraId);
    if (!selectedResultado) return;
    const message = generateWhatsAppAdesaoMessage({
      simulacao,
      selectedResultado,
      custoAtual,
    });
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
          <div className="p-4 bg-blue-500/10 border-2 border-blue-500/50 rounded-lg">
            <p className="font-body text-sm text-foreground">
              <strong>Simulação com:</strong> {getDiscountTypeText()}
            </p>
          </div>

          {melhorResultado && melhorResultado.poupanca > 0 && (
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

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full border-collapse text-sm min-w-[500px]">
              <thead>
                <tr className="bg-muted">
                  <th className="p-3 text-left font-body font-medium text-foreground border border-border">
                    Descrição
                  </th>
                  <th className="p-3 text-center font-body font-medium text-foreground border border-border">
                    Operadora Atual<br/>
                    <span className="text-xs font-normal text-cream-muted">{simulacao.operadora_atual}</span>
                  </th>
                  {resultados.map((r) => (
                    <th
                      key={r.operadora.id}
                      className="p-3 text-center font-body font-medium text-foreground border border-border"
                      style={colStyle(r, 'first')}
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
                  ))}
                </tr>
              </thead>
              <tbody>
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
                      className="p-3 text-center font-body text-foreground border border-border"
                      style={colStyle(r, 'mid')}
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
                      className="p-3 text-center font-body font-medium text-foreground border border-border"
                      style={colStyle(r, 'mid')}
                    >
                      {formatCurrency(r.custo_total_potencia, 2)}
                    </td>
                  ))}
                </tr>

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
                      {resultados.map((r) => (
                        <td
                          key={r.operadora.id}
                          className="p-3 text-center font-body text-foreground border border-border"
                          style={colStyle(r, 'mid')}
                        >
                          {formatCurrency(r.valores_kwh.simples || 0, 6)}
                        </td>
                      ))}
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
                          className="p-3 text-center font-body font-medium text-foreground border border-border"
                          style={colStyle(r, 'mid')}
                        >
                          {formatCurrency(r.custos_energia.simples || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {simulacao.ciclo_horario === 'bi-horario' && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        ENERGIA - CICLO BI-HORÁRIO
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Vazio</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.valores_kwh.vazio || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Vazio ({formatNumber(simulacao.kwh_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.custos_energia.vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Fora Vazio</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_fora_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.valores_kwh.fora_vazio || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Fora Vazio ({formatNumber(simulacao.kwh_fora_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_fora_vazio || 0) * (simulacao.preco_fora_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.custos_energia.fora_vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {simulacao.ciclo_horario === 'tri-horario' && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        ENERGIA - CICLO TRI-HORÁRIO
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Vazio</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_vazio || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.valores_kwh.vazio || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Vazio ({formatNumber(simulacao.kwh_vazio || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_vazio || 0) * (simulacao.preco_vazio || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.custos_energia.vazio || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Ponta</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_ponta || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.valores_kwh.ponta || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Ponta ({formatNumber(simulacao.kwh_ponta || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_ponta || 0) * (simulacao.preco_ponta || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.custos_energia.ponta || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Cheias</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.preco_cheias || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.valores_kwh.cheias || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Cheias ({formatNumber(simulacao.kwh_cheias || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.kwh_cheias || 0) * (simulacao.preco_cheias || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.custos_energia.cheias || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {(simulacao.tipo_simulacao === 'gas' || simulacao.tipo_simulacao === 'dual') && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={2 + resultados.length} className="p-2 font-body font-semibold text-foreground border border-border">
                        GÁS NATURAL (Escalão {simulacao.gas_escalao})
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor Diário</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.gas_valor_diario_atual || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.gas_valor_diario || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Termo Fixo ({simulacao.dias_fatura} dias)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.gas_valor_diario_atual || 0) * simulacao.dias_fatura, 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.gas_custo_total_diario || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">Valor kWh Gás</td>
                      <td className="p-3 text-center font-body text-foreground border border-border">
                        {formatCurrency(simulacao.gas_preco_kwh || 0, 6)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.gas_preco_kwh || 0, 6)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-body text-cream-muted border border-border">
                        Total Energia Gás ({formatNumber(simulacao.gas_kwh || 0, 2)} kWh)
                      </td>
                      <td className="p-3 text-center font-body font-medium text-foreground border border-border">
                        {formatCurrency((simulacao.gas_kwh || 0) * (simulacao.gas_preco_kwh || 0), 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-medium text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.gas_custo_energia || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {simulacao.tipo_simulacao === 'dual' && (
                  <>
                    <tr className="bg-blue-500/5">
                      <td className="p-3 font-body font-semibold text-foreground border border-border">SUBTOTAL ELETRICIDADE</td>
                      <td className="p-3 text-center font-body font-semibold text-foreground border border-border">
                        {formatCurrency(custoAtualEletricidade, 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-semibold text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.subtotal_eletricidade || 0, 2)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-orange-500/5">
                      <td className="p-3 font-body font-semibold text-foreground border border-border">SUBTOTAL GÁS</td>
                      <td className="p-3 text-center font-body font-semibold text-foreground border border-border">
                        {formatCurrency(custoAtualGas, 2)}
                      </td>
                      {resultados.map((r) => (
                        <td key={r.operadora.id} className="p-3 text-center font-body font-semibold text-foreground border border-border" style={colStyle(r, 'mid')}>
                          {formatCurrency(r.subtotal_gas || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                <tr className="bg-muted/50">
                  <td className="p-3 font-body font-bold text-foreground border border-border">TOTAL FATURA</td>
                  <td className="p-3 text-center font-body font-bold text-lg text-foreground border border-border">
                    {formatCurrency(custoAtual, 2)}
                  </td>
                  {resultados.map((r) => (
                    <td key={r.operadora.id} className="p-3 text-center font-body font-bold text-lg text-foreground border border-border" style={colStyle(r, 'mid')}>
                      {formatCurrency(r.subtotal, 2)}
                    </td>
                  ))}
                </tr>
                {(() => {
                  const hasSelectRow = resultados.some((r) => r.poupanca > 0);
                  return (
                    <>
                      <tr className="bg-gold/5">
                        <td className="p-3 font-body font-bold text-foreground border border-border">POUPANÇA</td>
                        <td className="p-3 text-center font-body text-foreground border border-border">-</td>
                        {resultados.map((r) => {
                          const colorClass = r.poupanca > 0
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-600';
                          return (
                            <td
                              key={r.operadora.id}
                              className={`p-3 text-center font-body font-bold text-lg border border-border ${colorClass}`}
                              style={colStyle(r, hasSelectRow ? 'mid' : 'last')}
                            >
                              {formatCurrency(r.poupanca, 2)}
                            </td>
                          );
                        })}
                      </tr>
                      {hasSelectRow && (
                        <tr className="bg-green-500/5">
                          <td className="p-3 font-body font-medium text-foreground border border-border">SELECIONAR</td>
                          <td className="p-3 text-center font-body text-cream-muted border border-border text-xs">Operadora atual</td>
                          {resultados.map((r) => {
                            const hasSavings = r.poupanca > 0;
                            const isSelected = selectedOperadoraId === r.operadora.id;
                            return (
                              <td key={r.operadora.id} className="p-3 text-center border border-border" style={colStyle(r, 'last')}>
                                {hasSavings ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOperadoraId(isSelected ? null : r.operadora.id)}
                                    className={`mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all ${
                                      isSelected
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-muted border border-border text-cream-muted hover:border-green-500 hover:text-green-600'
                                    }`}
                                  >
                                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                    {isSelected ? 'Selecionada' : 'Selecionar'}
                                  </button>
                                ) : (
                                  <span className="font-body text-xs text-cream-muted">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </>
                  );
                })()}
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

          {resultados.some((r) => r.desconto_temporario) && (
            <div className="space-y-4">
              {resultados
                .filter((r) => r.desconto_temporario)
                .map((r) => {
                  const dt = r.desconto_temporario!;
                  const requisitos: string[] = [];
                  if (!dt.disponivel) {
                    if (dt.requer_dd && !simulacao.debito_direto) requisitos.push('Débito Direto');
                    if (dt.requer_fe && !simulacao.fatura_eletronica) requisitos.push('Fatura Eletrónica');
                  }
                  return (
                    <div key={r.operadora.id} className="p-6 bg-amber-500/10 border-2 border-amber-500/50 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-body font-bold text-foreground text-lg mb-1">
                            {r.operadora.nome} - Campanha Adicional
                          </h4>
                          {dt.descricao && (
                            <p className="font-body text-sm text-amber-600 dark:text-amber-400 mb-2">
                              {dt.descricao}
                            </p>
                          )}
                          {!dt.disponivel && requisitos.length > 0 && (
                            <p className="font-body text-sm text-blue-500 font-medium">
                              Requer adesão a {requisitos.join(' e ')}
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

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Nova Simulação
            </button>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                type="button"
                onClick={handleExportClick}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gold text-gold rounded-lg font-body font-medium hover:bg-gold hover:text-primary-foreground transition-all"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleAdesaoWhatsApp}
                  disabled={!selectedOperadoraId}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-body font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <MessageCircle className="w-5 h-5" />
                  Quero aderir!
                </button>
                {!selectedOperadoraId && temPoupanca && (
                  <span className="font-body text-xs text-cream-muted">
                    Selecione uma operadora na tabela
                  </span>
                )}
              </div>
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

      {showExportDialog && (
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center mb-2">
                Exportar Relatório PDF
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {selectedOperadoraId ? (
                <>
                  <p className="font-body text-sm text-cream-muted text-center">
                    Pretende exportar todas as operadoras ou apenas a selecionada?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleExportAll}
                      className="w-full px-6 py-3 border-2 border-gold text-gold rounded-lg font-body font-medium hover:bg-gold hover:text-primary-foreground transition-all"
                    >
                      Todas as operadoras ({resultados.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSelected(selectedOperadoraId)}
                      className="w-full px-6 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Apenas {resultados.find((r) => r.operadora.id === selectedOperadoraId)?.operadora.nome}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body text-sm text-cream-muted text-center">
                    Selecione as operadoras a incluir no relatório:
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleExportAll}
                      className="w-full px-6 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Todas as operadoras ({resultados.length})
                    </button>
                    {resultados.map((r) => (
                      <button
                        key={r.operadora.id}
                        type="button"
                        onClick={() => handleExportSelected(r.operadora.id)}
                        className="w-full px-6 py-3 border border-border rounded-lg font-body text-foreground hover:border-gold hover:text-gold transition-all flex items-center justify-between"
                      >
                        <span>{r.operadora.nome}</span>
                        <span className={`text-sm font-medium ${r.poupanca > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {r.poupanca > 0 ? '+' : ''}{formatCurrency(r.poupanca)}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowExportDialog(false)}
                className="w-full px-6 py-2 text-cream-muted font-body text-sm hover:text-foreground transition-all"
              >
                Cancelar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default SimulatorResults;
