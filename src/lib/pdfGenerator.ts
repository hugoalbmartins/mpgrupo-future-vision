import jsPDF from 'jspdf';
import { SimulacaoInput, ResultadoComparacao } from '@/types/energy';

interface PDFData {
  simulacao: SimulacaoInput;
  custoAtual: number;
  resultados: ResultadoComparacao[];
  dataGeracao: Date;
  userInfo?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
}

const MPGRUPO_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const generateSimulationPDF = (data: PDFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const primaryColor = [139, 115, 85] as [number, number, number];
  const goldColor = [212, 175, 55] as [number, number, number];
  const textColor = [51, 51, 51] as [number, number, number];
  const lightGray = [245, 245, 245] as [number, number, number];
  const greenColor = [34, 139, 34] as [number, number, number];
  const redColor = [220, 38, 38] as [number, number, number];

  doc.setTextColor(...textColor);

  doc.setFillColor(...goldColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('MPGrupo', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Simulação Energética', pageWidth / 2, 35, { align: 'center' });

  yPosition = 55;

  const addSection = (title: string, yStart: number): number => {
    doc.setFillColor(...goldColor);
    doc.rect(margin, yStart, pageWidth - 2 * margin, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yStart + 6);

    doc.setTextColor(...textColor);
    return yStart + 15;
  };

  yPosition = addSection('Dados da Simulação', yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const addInfoLine = (label: string, value: string, y: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, y);
    return y + 6;
  };

  if (data.userInfo) {
    yPosition = addInfoLine('Consultor', data.userInfo.nome, yPosition);
    if (data.userInfo.telefone) yPosition = addInfoLine('Telefone', data.userInfo.telefone, yPosition);
    if (data.userInfo.email) yPosition = addInfoLine('Email', data.userInfo.email, yPosition);
    yPosition += 3;
  }
  yPosition = addInfoLine('Data do Relatório', data.dataGeracao.toLocaleDateString('pt-PT'), yPosition);
  yPosition = addInfoLine('Operadora Atual', data.simulacao.operadora_atual, yPosition);
  yPosition = addInfoLine('Potência Contratada', `${data.simulacao.potencia} kVA`, yPosition);
  yPosition = addInfoLine('Valor Potência Diária', `€${data.simulacao.valor_potencia_diaria_atual.toFixed(4)}`, yPosition);
  yPosition = addInfoLine('Dias de Fatura', `${data.simulacao.dias_fatura} dias`, yPosition);
  yPosition = addInfoLine('Ciclo Horário', data.simulacao.ciclo_horario.charAt(0).toUpperCase() + data.simulacao.ciclo_horario.slice(1), yPosition);

  if (data.simulacao.ciclo_horario === 'simples' && data.simulacao.kwh_simples) {
    yPosition = addInfoLine('Consumo', `${data.simulacao.kwh_simples.toFixed(2)} kWh`, yPosition);
    yPosition = addInfoLine('Preço kWh', `€${data.simulacao.preco_simples?.toFixed(6)}`, yPosition);
  } else if (data.simulacao.ciclo_horario === 'bi-horario') {
    if (data.simulacao.kwh_vazio) {
      yPosition = addInfoLine('Consumo Vazio', `${data.simulacao.kwh_vazio.toFixed(2)} kWh`, yPosition);
    }
    if (data.simulacao.kwh_fora_vazio) {
      yPosition = addInfoLine('Consumo Fora Vazio', `${data.simulacao.kwh_fora_vazio.toFixed(2)} kWh`, yPosition);
    }
  } else if (data.simulacao.ciclo_horario === 'tri-horario') {
    if (data.simulacao.kwh_vazio) {
      yPosition = addInfoLine('Consumo Vazio', `${data.simulacao.kwh_vazio.toFixed(2)} kWh`, yPosition);
    }
    if (data.simulacao.kwh_ponta) {
      yPosition = addInfoLine('Consumo Ponta', `${data.simulacao.kwh_ponta.toFixed(2)} kWh`, yPosition);
    }
    if (data.simulacao.kwh_cheias) {
      yPosition = addInfoLine('Consumo Cheias', `${data.simulacao.kwh_cheias.toFixed(2)} kWh`, yPosition);
    }
  }

  yPosition += 5;

  doc.setFillColor(...lightGray);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Custo Atual (Fatura):', margin + 5, yPosition + 6);

  doc.setFontSize(14);
  doc.setTextColor(...goldColor);
  doc.text(`€${data.custoAtual.toFixed(2)}`, margin + 5, yPosition + 12);

  yPosition += 25;

  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition = addSection('Comparação de Operadoras', yPosition);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  const topResults = data.resultados;

  for (let i = 0; i < topResults.length; i++) {
    const resultado = topResults[i];

    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    const isTopSaving = i === 0 && resultado.poupanca > 0;

    if (isTopSaving) {
      doc.setFillColor(240, 255, 240);
    } else {
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
    }
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(`${i + 1}. ${resultado.operadora.nome}`, margin + 3, yPosition + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textColor);

    const col1X = margin + 3;
    const col2X = margin + (pageWidth - 2 * margin) / 2;

    doc.text(`Potência: €${resultado.custo_total_potencia.toFixed(2)}`, col1X, yPosition + 12);
    doc.text(`Energia: €${resultado.custo_total_energia.toFixed(2)}`, col1X, yPosition + 17);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total: €${resultado.subtotal.toFixed(2)}`, col2X, yPosition + 12);

    if (resultado.poupanca > 0) {
      doc.setTextColor(...greenColor);
      doc.text(`Poupança: €${resultado.poupanca.toFixed(2)}`, col2X, yPosition + 17);
    } else if (resultado.poupanca < 0) {
      doc.setTextColor(...redColor);
      doc.text(`Custo adicional: €${Math.abs(resultado.poupanca).toFixed(2)}`, col2X, yPosition + 17);
    } else {
      doc.setTextColor(...textColor);
      doc.text(`Igual ao atual`, col2X, yPosition + 17);
    }

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    yPosition += 27;
  }

  yPosition += 5;

  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition = addSection('Projeção Anual', yPosition);

  const melhorOpcao = data.resultados[0];
  if (melhorOpcao && melhorOpcao.poupanca > 0) {
    const poupancaMensal = (melhorOpcao.poupanca / data.simulacao.dias_fatura) * 30;
    const poupancaAnual = poupancaMensal * 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mudando para ${melhorOpcao.operadora.nome}, pode poupar aproximadamente:`, margin + 5, yPosition);

    yPosition += 10;
    doc.setFillColor(240, 255, 240);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...goldColor);
    doc.text(`€${poupancaAnual.toFixed(2)} / ano`, pageWidth / 2, yPosition + 13, { align: 'center' });

    yPosition += 25;
  }

  const resultadosComAlertaDDFE = data.resultados.filter((r) => {
    if (!r.poupanca_potencial_dd_fe || r.poupanca_potencial_dd_fe <= 0) return false;
    const poupancaTotalComDDFE = data.custoAtual - (r.subtotal - r.poupanca_potencial_dd_fe);
    return poupancaTotalComDDFE > 0;
  });

  if (resultadosComAlertaDDFE.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = addSection('Poupança Adicional com Débito Direto e Fatura Eletrónica', yPosition);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);

    for (const resultado of resultadosComAlertaDDFE) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      const poupancaTotalComDDFE = data.custoAtual - (resultado.subtotal - resultado.poupanca_potencial_dd_fe!);
      const poupancaAnualComDDFE = poupancaTotalComDDFE * 12;

      doc.setFont('helvetica', 'bold');
      doc.text(`${resultado.operadora.nome}:`, margin + 5, yPosition);

      doc.setFont('helvetica', 'normal');
      yPosition += 5;
      doc.text(`Caso aderisse com Débito Direto e Fatura Eletrónica, a poupança total`, margin + 5, yPosition);
      yPosition += 4;
      doc.text(`em relação à fatura atual seria de `, margin + 5, yPosition);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text(`€${poupancaTotalComDDFE.toFixed(2)}`, margin + 70, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text(` por mês`, margin + 95, yPosition);

      yPosition += 5;
      doc.text(`Projeção anual: `, margin + 5, yPosition);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text(`€${poupancaAnualComDDFE.toFixed(2)}`, margin + 35, yPosition);

      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      yPosition += 10;
    }
  }

  const resultadosComCampanha = data.resultados.filter((r) => r.desconto_temporario);

  if (resultadosComCampanha.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = addSection('Campanhas Adicionais', yPosition);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);

    for (const resultado of resultadosComCampanha) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      const dt = resultado.desconto_temporario!;

      doc.setFont('helvetica', 'bold');
      doc.text(`${resultado.operadora.nome}:`, margin + 5, yPosition);

      doc.setFont('helvetica', 'normal');
      yPosition += 5;

      if (dt.descricao) {
        doc.text(`${dt.descricao}`, margin + 5, yPosition);
        yPosition += 5;
      }

      doc.text(`Desconto mensal: €${dt.valor_mensal.toFixed(2)} durante ${dt.duracao_meses} ${dt.duracao_meses === 1 ? 'mês' : 'meses'}`, margin + 5, yPosition);
      yPosition += 5;

      doc.text(`Custo mensal com campanha: €${dt.custo_mensal_com_desconto.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 5;

      doc.text(`Custo mensal após campanha: €${dt.custo_mensal_apos_desconto.toFixed(2)}`, margin + 5, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text(`Poupança total no período: €${dt.poupanca_periodo_desconto.toFixed(2)}`, margin + 5, yPosition);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      if (!dt.disponivel) {
        yPosition += 5;
        const requisitos: string[] = [];
        if (dt.requer_dd && !data.simulacao.debito_direto) requisitos.push('Débito Direto');
        if (dt.requer_fe && !data.simulacao.fatura_eletronica) requisitos.push('Fatura Eletrónica');
        if (requisitos.length > 0) {
          doc.setFontSize(8);
          doc.text(`Requer adesão a: ${requisitos.join(' e ')}`, margin + 5, yPosition);
          doc.setFontSize(9);
        }
      }

      yPosition += 10;
    }
  }

  if (yPosition > pageHeight - 40) {
    doc.addPage();
  }

  const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
  for (let i = 1; i <= currentPage; i++) {
    doc.setPage(i);

    doc.setFillColor(...primaryColor);
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('MPGrupo - Soluções Energéticas', margin, pageHeight - 15);
    doc.text('+351 928 203 793 | info@mpgrupo.pt | www.mpgrupo.pt', margin, pageHeight - 10);

    doc.setFontSize(8);
    doc.text(`Gerado em ${data.dataGeracao.toLocaleString('pt-PT')}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  const fileName = `MPGrupo_Simulacao_${data.simulacao.operadora_atual.replace(/\s+/g, '_')}_${data.dataGeracao.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
