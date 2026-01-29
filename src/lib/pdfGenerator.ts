import jsPDF from 'jspdf';
import { SimulacaoInput, ResultadoComparacao } from '@/types/energy';

interface PDFData {
  simulacao: SimulacaoInput;
  custoAtual: number;
  resultados: ResultadoComparacao[];
  dataGeracao: Date;
}

export const generateSimulationPDF = (data: PDFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const primaryColor = [139, 115, 85];
  const goldColor = [212, 175, 55];
  const textColor = [51, 51, 51];
  const lightGray = [245, 245, 245];

  doc.setTextColor(...textColor);

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MPGrupo', margin, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Simulação Energética', margin, 30);

  yPosition = 50;

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

  const topResults = data.resultados.slice(0, 5);

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
      doc.setTextColor(34, 139, 34);
      doc.text(`Poupança: €${resultado.poupanca.toFixed(2)}`, col2X, yPosition + 17);
    } else if (resultado.poupanca < 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Mais caro: €${Math.abs(resultado.poupanca).toFixed(2)}`, col2X, yPosition + 17);
    } else {
      doc.setTextColor(...textColor);
      doc.text(`Igual ao atual`, col2X, yPosition + 17);
    }

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    if (resultado.poupanca_potencial_dd_fe && resultado.poupanca_potencial_dd_fe > 0) {
      doc.setFontSize(8);
      doc.setTextColor(0, 102, 204);
      doc.text(`+ Poupança potencial com DD/FE: €${resultado.poupanca_potencial_dd_fe.toFixed(2)}`, col2X, yPosition + 22);
    }

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
    const poupancaAnual = (melhorOpcao.poupanca / data.simulacao.dias_fatura) * 365;

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

  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('MPGrupo - Soluções Energéticas', margin, pageHeight - 15);
  doc.text('www.mpgrupo.pt | contacto@mpgrupo.pt', margin, pageHeight - 10);

  doc.setFontSize(8);
  doc.text(`Gerado em ${data.dataGeracao.toLocaleString('pt-PT')}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  const fileName = `MPGrupo_Simulacao_${data.simulacao.operadora_atual.replace(/\s+/g, '_')}_${data.dataGeracao.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
