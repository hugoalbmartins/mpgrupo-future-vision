import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulacaoInput, Operadora, ConfiguracaoDesconto, ResultadoComparacao } from '@/types/energy';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingDown, AlertCircle, ArrowLeft, Download, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setExpandedCards(new Set());
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
        if (!descontosMap[d.operadora_id]) descontosMap[d.operadora_id] = [];
        descontosMap[d.operadora_id].push(d);
      });

      let operadorasFiltradas = operadoras;

      if (simulacao.tipo_simulacao === 'eletricidade') {
        operadorasFiltradas = operadoras.filter((op) =>
          op.tipos_energia?.includes('eletricidade') &&
          op.ciclos_disponiveis?.includes(simulacao.ciclo_horario)
        );
      } else if (simulacao.tipo_simulacao === 'gas') {
        operadorasFiltradas = operadoras.filter((op) => op.tipos_energia?.includes('gas'));
      } else if (simulacao.tipo_simulacao === 'dual') {
        operadorasFiltradas = operadoras.filter((op) =>
          op.tipos_energia?.includes('eletricidade') &&
          op.tipos_energia?.includes('gas') &&
          op.ciclos_disponiveis?.includes(simulacao.ciclo_horario)
        );
      }

      const custoElet = simulacao.tipo_simulacao !== 'gas' ? calcularCustoAtualEletricidade() : 0;
      const custoGas = simulacao.tipo_simulacao !== 'eletricidade' ? calcularCustoAtualGas() : 0;
      const custoTotal = custoElet + custoGas;

      setCustoAtualEletricidade(custoElet);
      setCustoAtualGas(custoGas);
      setCustoAtual(custoTotal);

      const resultadosCalculados: ResultadoComparacao[] = [];

      for (const operadora of operadorasFiltradas) {
        if (operadora.nome.toLowerCase().trim() === simulacao.operadora_atual.toLowerCase().trim()) continue;
        const descontos = descontosMap[operadora.id] || [];
        const resultado = calcularCustoOperadora(operadora, descontos, custoTotal, custoElet, custoGas);
        if (resultado) resultadosCalculados.push(resultado);
      }

      resultadosCalculados.sort((a, b) => {
        const poupancaEfetivaA = (a.poupanca / simulacao.dias_fatura) * 30 + (a.desconto_temporario?.valor_mensal || 0);
        const poupancaEfetivaB = (b.poupanca / simulacao.dias_fatura) * 30 + (b.desconto_temporario?.valor_mensal || 0);
        return poupancaEfetivaB - poupancaEfetivaA;
      });
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
    let valorPotenciaDiariaRaw = 0;
    let descontoPctPotencia = 0;
    let descontoPctEnergia = 0;
    let custoPotencia = 0;
    let custoEnergia = 0;
    const custosEnergia: ResultadoComparacao['custos_energia'] = {};
    const valoresKwh: ResultadoComparacao['valores_kwh'] = {};
    const valoresKwhRaw: ResultadoComparacao['valores_kwh_raw'] = {};
    let poupancaPotencialDDFE: number | undefined;

    if (simulacao.tipo_simulacao === 'eletricidade' || simulacao.tipo_simulacao === 'dual') {
      const tarifasCiclo = operadora.tarifas?.[simulacao.ciclo_horario];
      if (!tarifasCiclo) return null;

      const potenciasObj = tarifasCiclo.valor_diario_potencias as Record<string, number>;
      valorPotenciaDiaria = potenciasObj[simulacao.potencia.toString()] || 0;
      valorPotenciaDiariaRaw = valorPotenciaDiaria;

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

      valoresKwhRaw.simples = vKwhSimples || undefined;
      valoresKwhRaw.vazio = vKwhVazio || undefined;
      valoresKwhRaw.fora_vazio = vKwhForaVazio || undefined;
      valoresKwhRaw.ponta = vKwhPonta || undefined;
      valoresKwhRaw.cheias = vKwhCheias || undefined;

      if (descontoEletricidade) {
        descontoPctPotencia = calcularDescontoPct(descontoEletricidade, true);
        descontoPctEnergia = calcularDescontoPct(descontoEletricidade, false);
        const fPot = 1 - descontoPctPotencia / 100;
        const fEne = 1 - descontoPctEnergia / 100;
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
        const potDDFE = valorPotenciaDiariaRaw * (1 - pctDDFEPot / 100) * simulacao.dias_fatura;
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
        poupancaPotencialDDFE = subtotalEletricidade - (potDDFE + eneDDFE);
      }
    }

    let subtotalGas = 0;
    let gasValorDiario = 0;
    let gasValorDiarioRaw = 0;
    let gasCustoTotalDiario = 0;
    let gasCustoEnergia = 0;
    let gasPrecoKwh = 0;
    let gasPrecoKwhRaw = 0;
    let descontoPctGasDiario = 0;
    let descontoPctGasEnergia = 0;

    if (simulacao.tipo_simulacao === 'gas' || simulacao.tipo_simulacao === 'dual') {
      const tarifasGas = operadora.tarifas?.gas;
      if (!tarifasGas) return null;
      const escalaoKey = simulacao.gas_escalao?.toString() || '1';
      const escalaoData = tarifasGas.escaloes?.[escalaoKey];
      gasValorDiario = escalaoData?.valor_diario || 0;
      gasPrecoKwh = escalaoData?.valor_kwh || 0;
      gasValorDiarioRaw = gasValorDiario;
      gasPrecoKwhRaw = gasPrecoKwh;
      if (descontoGas) {
        descontoPctGasDiario = calcularDescontoPct(descontoGas, true);
        descontoPctGasEnergia = calcularDescontoPct(descontoGas, false);
        gasValorDiario *= (1 - descontoPctGasDiario / 100);
        gasPrecoKwh *= (1 - descontoPctGasEnergia / 100);
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

    const descontosAplicaveis = simulacao.tipo_simulacao === 'eletricidade'
      ? [descontoEletricidade]
      : simulacao.tipo_simulacao === 'gas'
      ? [descontoGas]
      : [descontoEletricidade, descontoGas];

    descontosAplicaveis.forEach((d) => {
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
      descontoTemporario = {
        valor_mensal: totalDescontoMensal,
        duracao_meses: maxDuracaoMeses,
        descricao: descricoes.length > 0 ? descricoes.join(' + ') : null,
        poupanca_periodo_desconto: totalDescontoMensal * maxDuracaoMeses,
        custo_mensal_com_desconto: custoMensalBase - totalDescontoMensal,
        custo_mensal_apos_desconto: custoMensalBase,
        requer_dd: requerDDTemp,
        requer_fe: requerFETemp,
        disponivel,
      };
    }

    return {
      operadora,
      valor_potencia_diaria: valorPotenciaDiaria,
      valor_potencia_diaria_raw: valorPotenciaDiariaRaw,
      desconto_pct_potencia: descontoPctPotencia,
      desconto_pct_energia: descontoPctEnergia,
      custo_total_potencia: custoPotencia,
      custos_energia: custosEnergia,
      valores_kwh: valoresKwh,
      valores_kwh_raw: valoresKwhRaw,
      custo_total_energia: custoEnergia,
      subtotal,
      poupanca,
      poupanca_potencial_dd_fe: poupancaPotencialDDFE,
      desconto_temporario: descontoTemporario,
      subtotal_eletricidade: simulacao.tipo_simulacao === 'dual' ? subtotalEletricidade : undefined,
      subtotal_gas: simulacao.tipo_simulacao === 'dual' ? subtotalGas : undefined,
      gas_valor_diario: simulacao.tipo_simulacao !== 'eletricidade' ? gasValorDiario : undefined,
      gas_valor_diario_raw: simulacao.tipo_simulacao !== 'eletricidade' ? gasValorDiarioRaw : undefined,
      gas_custo_total_diario: simulacao.tipo_simulacao !== 'eletricidade' ? gasCustoTotalDiario : undefined,
      gas_custo_energia: simulacao.tipo_simulacao !== 'eletricidade' ? gasCustoEnergia : undefined,
      gas_preco_kwh: simulacao.tipo_simulacao !== 'eletricidade' ? gasPrecoKwh : undefined,
      gas_preco_kwh_raw: simulacao.tipo_simulacao !== 'eletricidade' ? gasPrecoKwhRaw : undefined,
      desconto_pct_gas_diario: simulacao.tipo_simulacao !== 'eletricidade' ? descontoPctGasDiario : undefined,
      desconto_pct_gas_energia: simulacao.tipo_simulacao !== 'eletricidade' ? descontoPctGasEnergia : undefined,
    };
  };

  const fmtEur = (value: number, decimals = 2) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const fmtNum = (value: number, decimals = 6) =>
    new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportPDF = (filtered?: ResultadoComparacao[]) => {
    try {
      generateSimulationPDF({
        simulacao,
        custoAtual,
        resultados: filtered || resultados,
        dataGeracao: new Date(),
      });
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const handleExportSingle = (resultado: ResultadoComparacao) => {
    handleExportPDF([resultado]);
  };

  const handleExportAll = () => {
    setShowExportDialog(false);
    handleExportPDF();
  };

  const handleExportSelected = (operadoraId: string) => {
    setShowExportDialog(false);
    handleExportPDF(resultados.filter((r) => r.operadora.id === operadoraId));
  };

  const handleAdesaoWhatsApp = (resultado: ResultadoComparacao) => {
    const message = generateWhatsAppAdesaoMessage({ simulacao, selectedResultado: resultado, custoAtual });
    openWhatsApp(MPGRUPO_WHATSAPP, message);
  };

  const handleNoResultsWhatsApp = () => {
    const message = encodeURIComponent('Olá, Não consegui simulação no site, podem ajudar-me?!');
    openWhatsApp(MPGRUPO_WHATSAPP, message);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
            <p className="font-body text-cream-muted">A calcular a sua poupança...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const melhorResultado = resultados[0];
  const temPoupanca = resultados.some((r) => r.poupanca > 0);
  const custoAtualMensal = (custoAtual / simulacao.dias_fatura) * 30;

  const cicloLabel = {
    'simples': 'Simples',
    'bi-horario': 'Bi-Horário',
    'tri-horario': 'Tri-Horário',
  }[simulacao.ciclo_horario];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg w-full max-h-[92vh] overflow-y-auto p-0"
        style={temPoupanca ? {
          boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.4), 0 20px 60px rgba(0,0,0,0.3)',
          border: '1.5px solid rgba(34, 197, 94, 0.4)'
        } : undefined}
      >
        <div className="sticky top-0 z-10 bg-background border-b border-border px-5 pt-5 pb-4">
          <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
            Simulador de Energia
          </h2>
          <p className="font-body text-sm text-cream-muted mt-0.5">
            Compare operadoras e descubra quanto pode poupar
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <TrendingDown className="w-4 h-4 text-gold" />
              <span className="font-body font-semibold text-foreground text-sm">Custo Atual</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {simulacao.tipo_simulacao !== 'gas' && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-cream-muted">Eletricidade</span>
                  <span className="font-body text-sm text-foreground">{fmtEur(custoAtualEletricidade)}</span>
                </div>
              )}
              {(simulacao.tipo_simulacao === 'gas' || simulacao.tipo_simulacao === 'dual') && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-cream-muted">Gás</span>
                  <span className="font-body text-sm text-foreground">{fmtEur(custoAtualGas)}</span>
                </div>
              )}
              <div className="pt-1 border-t border-border flex justify-between items-center">
                <span className="font-body text-xs text-cream-muted">Total Mensal</span>
                <span className="font-body font-bold text-xl text-foreground">{fmtEur(custoAtualMensal)}</span>
              </div>
            </div>
          </div>

          {melhorResultado && melhorResultado.poupanca > 0 && !simulacao.debito_direto && !simulacao.fatura_eletronica && melhorResultado.poupanca_potencial_dd_fe && melhorResultado.poupanca_potencial_dd_fe > 0 && (() => {
            const poupancaTotalDDFE = custoAtual - (melhorResultado.subtotal - melhorResultado.poupanca_potencial_dd_fe!);
            const poupancaMensalDDFE = (poupancaTotalDDFE / simulacao.dias_fatura) * 30;
            const poupancaAtual = (melhorResultado.poupanca / simulacao.dias_fatura) * 30;
            const diferenca = poupancaMensalDDFE - poupancaAtual;
            if (diferenca <= 0) return null;
            return (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-foreground">
                  <strong>Poupança Adicional Disponível!</strong> Pode obter descontos adicionais aderindo a Débito Direto
                  e Fatura Eletrónica. Com ambos, pouparia mais <strong className="text-blue-500">{fmtEur(diferenca)}/mês.</strong>
                </p>
              </div>
            );
          })()}

          {resultados.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <AlertCircle className="w-14 h-14 text-gold mx-auto" />
              <h3 className="font-display text-xl text-foreground">Sem Operadoras Disponíveis</h3>
              <p className="font-body text-sm text-cream-muted">
                De momento não temos operadoras configuradas. Os nossos comerciais podem ajudá-lo!
              </p>
              <button
                type="button"
                onClick={handleNoResultsWhatsApp}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-green-500 text-white rounded-xl font-body font-medium hover:bg-green-600 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Contactar via WhatsApp
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-foreground">
                  Melhores Opções para Si
                </h3>
                <span className="text-xs font-body bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {resultados.map((resultado, index) => {
                  const isBest = index === 0 && resultado.poupanca > 0;
                  const isExpanded = expandedCards.has(resultado.operadora.id);
                  const dt = resultado.desconto_temporario;
                  const custoMensal = (resultado.subtotal / simulacao.dias_fatura) * 30;
                  const poupancaMensal = (resultado.poupanca / simulacao.dias_fatura) * 30;
                  const poupancaAnual = poupancaMensal * 12;
                  const poupancaCampanha = dt ? poupancaMensal + dt.valor_mensal : poupancaMensal;
                  const poupancaSemCampanha = poupancaMensal;

                  const potUnitRaw = resultado.valor_potencia_diaria_raw;
                  const potUnitDesc = resultado.valor_potencia_diaria;
                  const potTotalRaw = potUnitRaw * simulacao.dias_fatura;
                  const potTotalDesc = resultado.custo_total_potencia;
                  const potDescontoPct = resultado.desconto_pct_potencia;
                  const eneDescontoPct = resultado.desconto_pct_energia;

                  const custoAtualEletDisplay = simulacao.tipo_simulacao === 'dual'
                    ? custoAtual - custoAtualGas
                    : custoAtual;

                  return (
                    <div
                      key={resultado.operadora.id}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        isBest
                          ? 'border-green-500/50 shadow-md shadow-green-500/10'
                          : 'border-border'
                      }`}
                    >
                      <div className="px-4 py-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {resultado.operadora.logotipo_url ? (
                              <img
                                src={resultado.operadora.logotipo_url}
                                alt={resultado.operadora.nome}
                                className="w-12 h-8 object-contain bg-white rounded p-0.5 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-cream-muted">
                                  {resultado.operadora.nome.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-body font-semibold text-foreground text-sm">
                                  {resultado.operadora.nome}
                                </span>
                                {isBest && (
                                  <span className="text-xs font-body font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                                    Melhor Opção
                                  </span>
                                )}
                              </div>
                              {dt ? (
                                <div className="space-y-0.5">
                                  <div className="font-body text-xs text-green-600 dark:text-green-400 font-semibold">
                                    c/ Campanha ({dt.duracao_meses} meses): {fmtEur(dt.custo_mensal_com_desconto)}/mês
                                  </div>
                                  <div className="font-body text-xs text-cream-muted">
                                    Após campanha: {fmtEur(custoMensal)}/mês
                                  </div>
                                </div>
                              ) : (
                                <span className="font-body text-xs text-cream-muted">
                                  Novo custo: {fmtEur(custoMensal)}/mês
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {dt && (
                        <div className="mx-3 mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">🎁</span>
                            <span className="font-body font-bold text-amber-700 dark:text-amber-400 text-xs">
                              Campanha Especial
                            </span>
                          </div>
                          {dt.descricao ? (
                            <p className="font-body text-xs text-foreground mb-1">{dt.descricao}</p>
                          ) : null}
                          <p className="font-body text-xs text-foreground">
                            Durante <strong>{dt.duracao_meses} meses</strong>, o custo mensal será de{' '}
                            <strong>{fmtEur(dt.custo_mensal_com_desconto)}</strong> (desconto adicional de{' '}
                            <strong>{fmtEur(dt.valor_mensal)}/mês</strong>)
                          </p>
                        </div>
                      )}

                      <div className="px-4 py-3 space-y-1">
                        {dt ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="font-body text-xs text-cream-muted">Poupança c/ Campanha</span>
                            </div>
                            <div className="font-body font-bold text-2xl text-green-600 dark:text-green-400">
                              {fmtEur(poupancaCampanha)}<span className="text-base font-normal">/mês</span>
                            </div>
                            <div className="font-body text-xs text-cream-muted">
                              Sem campanha: {fmtEur(poupancaSemCampanha)}/mês
                            </div>
                          </>
                        ) : resultado.poupanca > 0 ? (
                          <>
                            <div className="font-body font-bold text-2xl text-green-600 dark:text-green-400">
                              {fmtEur(poupancaMensal)}<span className="text-base font-normal">/mês</span>
                            </div>
                            <div className="font-body text-xs text-cream-muted">
                              Poupança anual: {fmtEur(poupancaAnual)}
                            </div>
                          </>
                        ) : (
                          <div className="font-body text-sm text-red-500 font-medium">
                            Sem poupança face ao atual
                          </div>
                        )}
                      </div>

                      <div className="px-4 pb-3">
                        <button
                          type="button"
                          onClick={() => toggleCard(resultado.operadora.id)}
                          className="flex items-center gap-1 font-body text-xs text-cream-muted hover:text-foreground transition-colors"
                        >
                          {isExpanded ? (
                            <>Ocultar Detalhes <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Ver Detalhes <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 py-3 space-y-3">
                          {simulacao.tipo_simulacao !== 'gas' && (
                            <div>
                              <p className="font-body font-semibold text-sm text-foreground mb-2">
                                Detalhamento Eletricidade
                              </p>
                              <div className="rounded-lg border border-border overflow-hidden text-xs">
                                <div className="grid grid-cols-5 bg-muted/50 border-b border-border">
                                  <div className="col-span-2 px-2 py-1.5 font-body font-semibold text-foreground">Componente</div>
                                  <div className="px-1 py-1.5 font-body font-semibold text-foreground text-center">Preço Unit.</div>
                                  <div className="px-1 py-1.5 font-body font-semibold text-foreground text-center">Total</div>
                                  <div className="px-1 py-1.5 font-body font-semibold text-green-600 dark:text-green-400 text-center">Total c/ Desc.</div>
                                </div>

                                <div className="grid grid-cols-5 border-b border-border">
                                  <div className="col-span-2 px-2 py-2">
                                    <div className="font-body font-semibold text-foreground">Potência</div>
                                    <div className="font-body text-cream-muted text-[10px]">(€/kW/dia)</div>
                                    {potDescontoPct > 0 && (
                                      <div className="font-body text-[10px] text-cream-muted">Desc.: {potDescontoPct.toFixed(0)}%</div>
                                    )}
                                  </div>
                                  <div className="px-1 py-2 text-center font-body text-foreground">
                                    {fmtNum(potUnitRaw, 6)}
                                  </div>
                                  <div className="px-1 py-2 text-center font-body text-foreground">
                                    {fmtEur(potTotalRaw)}
                                  </div>
                                  <div className="px-1 py-2 text-center font-body font-semibold text-green-600 dark:text-green-400">
                                    {fmtEur(potTotalDesc)}
                                  </div>
                                </div>

                                {simulacao.ciclo_horario === 'simples' && (
                                  <div className="grid grid-cols-5 border-b border-border">
                                    <div className="col-span-2 px-2 py-2">
                                      <div className="font-body font-semibold text-foreground">Energia</div>
                                      <div className="font-body text-cream-muted text-[10px]">(€/kWh)</div>
                                      {eneDescontoPct > 0 && (
                                        <div className="font-body text-[10px] text-cream-muted">Desc.: {eneDescontoPct.toFixed(0)}%</div>
                                      )}
                                    </div>
                                    <div className="px-1 py-2 text-center font-body text-foreground">
                                      {fmtNum(resultado.valores_kwh_raw.simples || 0, 6)}
                                    </div>
                                    <div className="px-1 py-2 text-center font-body text-foreground">
                                      {fmtEur((simulacao.kwh_simples || 0) * (resultado.valores_kwh_raw.simples || 0))}
                                    </div>
                                    <div className="px-1 py-2 text-center font-body font-semibold text-green-600 dark:text-green-400">
                                      {fmtEur(resultado.custos_energia.simples || 0)}
                                    </div>
                                  </div>
                                )}

                                {simulacao.ciclo_horario === 'bi-horario' && (
                                  <>
                                    {[
                                      { label: 'Vazio', precoRaw: resultado.valores_kwh_raw.vazio || 0, precoDesc: resultado.valores_kwh.vazio || 0, kwh: simulacao.kwh_vazio || 0, total: resultado.custos_energia.vazio || 0 },
                                      { label: 'Fora Vazio', precoRaw: resultado.valores_kwh_raw.fora_vazio || 0, precoDesc: resultado.valores_kwh.fora_vazio || 0, kwh: simulacao.kwh_fora_vazio || 0, total: resultado.custos_energia.fora_vazio || 0 },
                                    ].map((row) => (
                                      <div key={row.label} className="grid grid-cols-5 border-b border-border">
                                        <div className="col-span-2 px-2 py-2">
                                          <div className="font-body font-semibold text-foreground">E. {row.label}</div>
                                          <div className="font-body text-cream-muted text-[10px]">(€/kWh)</div>
                                          {eneDescontoPct > 0 && <div className="font-body text-[10px] text-cream-muted">Desc.: {eneDescontoPct.toFixed(0)}%</div>}
                                        </div>
                                        <div className="px-1 py-2 text-center font-body text-foreground">{fmtNum(row.precoRaw, 6)}</div>
                                        <div className="px-1 py-2 text-center font-body text-foreground">{fmtEur(row.kwh * row.precoRaw)}</div>
                                        <div className="px-1 py-2 text-center font-body font-semibold text-green-600 dark:text-green-400">{fmtEur(row.total)}</div>
                                      </div>
                                    ))}
                                  </>
                                )}

                                {simulacao.ciclo_horario === 'tri-horario' && (
                                  <>
                                    {[
                                      { label: 'Vazio', precoRaw: resultado.valores_kwh_raw.vazio || 0, kwh: simulacao.kwh_vazio || 0, total: resultado.custos_energia.vazio || 0 },
                                      { label: 'Ponta', precoRaw: resultado.valores_kwh_raw.ponta || 0, kwh: simulacao.kwh_ponta || 0, total: resultado.custos_energia.ponta || 0 },
                                      { label: 'Cheias', precoRaw: resultado.valores_kwh_raw.cheias || 0, kwh: simulacao.kwh_cheias || 0, total: resultado.custos_energia.cheias || 0 },
                                    ].map((row) => (
                                      <div key={row.label} className="grid grid-cols-5 border-b border-border">
                                        <div className="col-span-2 px-2 py-2">
                                          <div className="font-body font-semibold text-foreground">E. {row.label}</div>
                                          <div className="font-body text-cream-muted text-[10px]">(€/kWh)</div>
                                          {eneDescontoPct > 0 && <div className="font-body text-[10px] text-cream-muted">Desc.: {eneDescontoPct.toFixed(0)}%</div>}
                                        </div>
                                        <div className="px-1 py-2 text-center font-body text-foreground">{fmtNum(row.precoRaw, 6)}</div>
                                        <div className="px-1 py-2 text-center font-body text-foreground">{fmtEur(row.kwh * row.precoRaw)}</div>
                                        <div className="px-1 py-2 text-center font-body font-semibold text-green-600 dark:text-green-400">{fmtEur(row.total)}</div>
                                      </div>
                                    ))}
                                  </>
                                )}

                                <div className="grid grid-cols-5 bg-muted/30">
                                  <div className="col-span-2 px-2 py-2 font-body font-bold text-foreground text-xs">
                                    Total Eletricidade
                                  </div>
                                  <div className="px-1 py-2"></div>
                                  <div className="px-1 py-2 text-center font-body font-bold text-foreground text-xs">
                                    {fmtEur(custoAtualEletDisplay)}
                                  </div>
                                  <div className="px-1 py-2 text-center font-body font-bold text-green-600 dark:text-green-400 text-xs">
                                    {fmtEur(resultado.subtotal_eletricidade !== undefined ? resultado.subtotal_eletricidade : resultado.subtotal)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {dt && (
                            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 space-y-2">
                              <p className="font-body font-bold text-amber-700 dark:text-amber-400 text-sm">
                                Campanha Especial Disponível!
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-body text-cream-muted">Desconto adicional:</span>
                                  <div className="font-body font-bold text-foreground">{fmtEur(dt.valor_mensal)}/mês</div>
                                </div>
                                <div>
                                  <span className="font-body text-cream-muted">Duração:</span>
                                  <div className="font-body font-bold text-foreground">{dt.duracao_meses} meses</div>
                                </div>
                                <div>
                                  <span className="font-body text-cream-muted">Custo mensal com campanha:</span>
                                  <div className="font-body font-bold text-foreground">{fmtEur(dt.custo_mensal_com_desconto)}</div>
                                </div>
                                <div>
                                  <span className="font-body text-cream-muted">Poupança com campanha:</span>
                                  <div className="font-body font-bold text-green-600 dark:text-green-400">{fmtEur(poupancaCampanha)}/mês</div>
                                </div>
                              </div>
                              {dt.descricao && (
                                <p className="font-body text-xs text-amber-700 dark:text-amber-400 italic">
                                  + {dt.descricao}
                                </p>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExportSingle(resultado)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg font-body text-sm text-cream-muted hover:text-foreground hover:border-gold transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Exportar Esta Opção
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="font-body text-xs text-cream-muted text-center leading-relaxed">
                Nota: Esta simulação não considera a tarifa social de energia. Se é beneficiário da tarifa social, consulte os valores específicos junto da sua operadora.
              </p>
            </>
          )}

          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReset}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl font-body text-sm text-cream-muted hover:text-foreground transition-all flex-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={() => resultados.length <= 1 ? handleExportPDF() : setShowExportDialog(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl font-body text-sm text-foreground hover:border-gold hover:text-gold transition-all flex-1"
              >
                <Download className="w-4 h-4" />
                Exportar Todas
              </button>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl font-body text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              Nova Simulação
            </button>
          </div>
        </div>
      </DialogContent>

      {showExportDialog && (
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center mb-2">
                Exportar Relatório PDF
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <p className="font-body text-sm text-cream-muted text-center">
                Selecione as operadoras a incluir no relatório:
              </p>
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
                    {r.poupanca > 0 ? '+' : ''}{fmtEur(r.poupanca)}
                  </span>
                </button>
              ))}
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
