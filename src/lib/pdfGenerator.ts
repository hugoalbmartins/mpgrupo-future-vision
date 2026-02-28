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

const darkBlue: [number, number, number] = [30, 58, 95];
const green: [number, number, number] = [34, 139, 34];
const orange: [number, number, number] = [230, 126, 34];
const textDark: [number, number, number] = [33, 33, 33];
const textMuted: [number, number, number] = [100, 100, 100];
const white: [number, number, number] = [255, 255, 255];
const lightGray: [number, number, number] = [245, 247, 250];
const borderGray: [number, number, number] = [200, 210, 220];
const greenLight: [number, number, number] = [235, 255, 235];
const orangeLight: [number, number, number] = [255, 248, 235];

const fmt = (val: number, dec = 2) =>
  val.toLocaleString('pt-PT', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtEur = (val: number, dec = 2) => `${fmt(val, dec)} €`;

export const generateSimulationPDF = (data: PDFData): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHeader = () => {
    const consultorNome = data.userInfo?.nome || 'MP Grupo';
    const consultorEmail = data.userInfo?.email || 'info@mpgrupo.pt';

    doc.setFillColor(...darkBlue);
    doc.rect(0, 0, pageWidth, 1, 'F');

    doc.setTextColor(...darkBlue);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(consultorNome, margin, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('O seu comercial de energias.', margin, y + 14);

    doc.setTextColor(...darkBlue);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Simulação de Energia', pageWidth - margin, y + 8, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Data: ${data.dataGeracao.toLocaleDateString('pt-PT')}`, pageWidth - margin, y + 14, { align: 'right' });

    y += 18;

    doc.setDrawColor(...darkBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const consultorNome = data.userInfo?.nome || 'MP Grupo';
    const consultorEmail = data.userInfo?.email || 'info@mpgrupo.pt';
    const fy = pageHeight - 18;

    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin, fy - 2, pageWidth - margin, fy - 2);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text(`${consultorNome} — Comparador de Energia`, margin, fy + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Contacto: ${consultorEmail}`, margin, fy + 8);

    doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, fy + 5, { align: 'right' });
  };

  const drawSectionTitle = (title: string) => {
    checkPage(12);
    doc.setFillColor(...darkBlue);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, y + 5.5);
    y += 12;
  };

  const drawInfoRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ':', margin + 4, y);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, margin + 70, y);
    y += 5.5;
  };

  drawHeader();

  drawSectionTitle('Dados do Consumo Atual');

  const cicloLabel = {
    'simples': 'Simples',
    'bi-horario': 'Bi-Horário',
    'tri-horario': 'Tri-Horário',
  }[data.simulacao.ciclo_horario];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Tipo de Energia: ${data.simulacao.tipo_simulacao.charAt(0).toUpperCase() + data.simulacao.tipo_simulacao.slice(1)}`, margin + 4, y);
  y += 5.5;

  if (data.simulacao.tipo_simulacao !== 'gas') {
    const custoElet = data.simulacao.tipo_simulacao === 'dual'
      ? data.custoAtual - ((data.simulacao.gas_valor_diario_atual || 0) * data.simulacao.dias_fatura + (data.simulacao.gas_kwh || 0) * (data.simulacao.gas_preco_kwh || 0))
      : data.custoAtual;
    doc.setTextColor(...textMuted);
    doc.text(`Custo Mensal Eletricidade: ${fmtEur(custoElet)}`, margin + 6, y);
    y += 5.5;
  }

  if (data.simulacao.tipo_simulacao === 'gas' || data.simulacao.tipo_simulacao === 'dual') {
    const custoGas = (data.simulacao.gas_valor_diario_atual || 0) * data.simulacao.dias_fatura + (data.simulacao.gas_kwh || 0) * (data.simulacao.gas_preco_kwh || 0);
    doc.setTextColor(...textMuted);
    doc.text(`Custo Mensal Gás: ${fmtEur(custoGas)}`, margin + 6, y);
    y += 5.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.text(`Custo Total Mensal Atual: ${fmtEur(data.custoAtual)}`, margin + 4, y);
  y += 7;

  const detalhes: string[] = [];
  if (data.simulacao.tipo_simulacao !== 'gas') {
    detalhes.push(`Potência: ${data.simulacao.potencia} kW`);
    detalhes.push(`Ciclo: ${cicloLabel}`);
    detalhes.push(`Dias: ${data.simulacao.dias_fatura}`);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(detalhes.join('   |   '), margin + 4, y);
  y += 5.5;

  const consumos: string[] = [];
  if (data.simulacao.ciclo_horario === 'simples' && data.simulacao.kwh_simples) {
    consumos.push(`Simples: ${fmt(data.simulacao.kwh_simples)} kWh`);
  } else if (data.simulacao.ciclo_horario === 'bi-horario') {
    if (data.simulacao.kwh_vazio) consumos.push(`Vazio: ${fmt(data.simulacao.kwh_vazio)} kWh`);
    if (data.simulacao.kwh_fora_vazio) consumos.push(`Fora Vazio: ${fmt(data.simulacao.kwh_fora_vazio)} kWh`);
  } else if (data.simulacao.ciclo_horario === 'tri-horario') {
    if (data.simulacao.kwh_vazio) consumos.push(`Vazio: ${fmt(data.simulacao.kwh_vazio)} kWh`);
    if (data.simulacao.kwh_ponta) consumos.push(`Ponta: ${fmt(data.simulacao.kwh_ponta)} kWh`);
    if (data.simulacao.kwh_cheias) consumos.push(`Cheias: ${fmt(data.simulacao.kwh_cheias)} kWh`);
  }
  if (consumos.length > 0) {
    doc.text(`Consumos: ${consumos.join('   ')}`, margin + 4, y);
    y += 5.5;
  }

  y += 4;

  for (let i = 0; i < data.resultados.length; i++) {
    const resultado = data.resultados[i];
    const isBest = i === 0 && resultado.poupanca > 0;
    const dt = resultado.desconto_temporario;

    checkPage(60);

    const blockHeaderColor: [number, number, number] = isBest ? [34, 120, 60] : [50, 80, 130];

    doc.setFillColor(...blockHeaderColor);
    doc.rect(margin, y, contentWidth, 10, 'F');

    doc.setTextColor(...white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const titleText = `${i + 1}. ${resultado.operadora.nome}`;
    doc.text(titleText, margin + 3, y + 6.5);

    if (isBest) {
      const badgeText = 'Melhor Opção';
      doc.setFontSize(8);
      const badgeW = doc.getTextWidth(badgeText) + 4;
      const badgeX = margin + 3 + doc.getTextWidth(titleText) + 4;
      doc.setFillColor(255, 230, 0);
      doc.rect(badgeX, y + 2, badgeW, 6, 'F');
      doc.setTextColor(...textDark);
      doc.text(badgeText, badgeX + 2, y + 6.5);
    }

    const custoMensal = (resultado.subtotal / data.simulacao.dias_fatura) * 30;
    const poupancaMensal = (resultado.poupanca / data.simulacao.dias_fatura) * 30;
    const poupancaAnual = poupancaMensal * 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...white);
    doc.text(`Custo Mensal: ${fmtEur(custoMensal)}`, pageWidth - margin - 3, y + 6.5, { align: 'right' });
    y += 14;

    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    if (resultado.poupanca > 0) {
      doc.text(`Poupança Mensal: ${fmtEur(poupancaMensal)}`, margin + 4, y + 5);
      doc.setTextColor(...green);
      doc.text(`Poupança Anual: ${fmtEur(poupancaAnual)}`, pageWidth - margin - 4, y + 5, { align: 'right' });
    } else {
      doc.setTextColor(...textMuted);
      doc.text('Sem poupança face à operadora atual', margin + 4, y + 5);
    }
    y += 11;

    if (data.simulacao.tipo_simulacao !== 'gas') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('Eletricidade — Detalhe de Preços e Custos', margin + 2, y);
      y += 6;

      const colW = [42, 28, 28, 25, 25];
      const colX = [margin + 2, margin + 44, margin + 72, margin + 100, margin + 125];
      const headers = ['Componente', 'Preço Unit.', 'Preço c/ Desc.', 'Total s/ Desc.', 'Total c/ Desc.'];

      doc.setFillColor(230, 236, 245);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkBlue);
      headers.forEach((h, idx) => {
        doc.text(h, colX[idx], y + 4.5);
      });
      y += 7;

      const potUnitRaw = resultado.valor_potencia_diaria_raw;
      const potUnitDesc = resultado.valor_potencia_diaria;
      const potTotalRaw = potUnitRaw * data.simulacao.dias_fatura;
      const potTotalDesc = resultado.custo_total_potencia;
      const potDescontoPct = resultado.desconto_pct_potencia;
      const eneDescontoPct = resultado.desconto_pct_energia;

      const addTableRow = (
        comp: string,
        unit: string,
        precoRaw: number,
        precoComDesc: number,
        totalSemDesc: number,
        totalComDesc: number,
        descontoPct: number,
        rowIndex: number
      ) => {
        checkPage(18);
        if (rowIndex % 2 === 0) {
          doc.setFillColor(252, 252, 252);
        } else {
          doc.setFillColor(...white);
        }
        doc.rect(margin, y, contentWidth, descontoPct > 0 ? 12 : 8, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textDark);
        doc.text(comp, colX[0], y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text(`(${unit})`, colX[0], y + 7.5);

        doc.setTextColor(...textDark);
        doc.setFontSize(8);
        doc.text(fmtEur(precoRaw, 6), colX[1], y + 4);

        doc.setTextColor(...green);
        doc.setFont('helvetica', 'bold');
        doc.text(fmtEur(precoComDesc, 6), colX[2], y + 4);

        doc.setTextColor(...textDark);
        doc.setFont('helvetica', 'normal');
        doc.text(fmtEur(totalSemDesc), colX[3], y + 4);

        doc.setTextColor(...green);
        doc.setFont('helvetica', 'bold');
        doc.text(fmtEur(totalComDesc), colX[4], y + 4);

        if (descontoPct > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...textMuted);
          doc.text(`Desconto aplicado: ${fmt(descontoPct, 0)}%`, colX[0], y + 10);
        }

        y += descontoPct > 0 ? 13 : 9;
      };

      addTableRow(
        'Potência',
        '€/kW/dia',
        potUnitRaw,
        potUnitDesc,
        potTotalRaw,
        potTotalDesc,
        potDescontoPct,
        0
      );

      if (data.simulacao.ciclo_horario === 'simples') {
        const kwhSimples = data.simulacao.kwh_simples || 0;
        const precoRaw = resultado.valores_kwh_raw.simples || 0;
        const precoDesc = resultado.valores_kwh.simples || 0;
        addTableRow('Energia', '€/kWh', precoRaw, precoDesc, kwhSimples * precoRaw, resultado.custos_energia.simples || 0, eneDescontoPct, 1);
      } else if (data.simulacao.ciclo_horario === 'bi-horario') {
        const kwhV = data.simulacao.kwh_vazio || 0;
        const kwhFV = data.simulacao.kwh_fora_vazio || 0;
        const pVRaw = resultado.valores_kwh_raw.vazio || 0;
        const pFVRaw = resultado.valores_kwh_raw.fora_vazio || 0;
        const pVDesc = resultado.valores_kwh.vazio || 0;
        const pFVDesc = resultado.valores_kwh.fora_vazio || 0;
        addTableRow('Energia Vazio', '€/kWh', pVRaw, pVDesc, kwhV * pVRaw, resultado.custos_energia.vazio || 0, eneDescontoPct, 1);
        addTableRow('Energia Fora Vazio', '€/kWh', pFVRaw, pFVDesc, kwhFV * pFVRaw, resultado.custos_energia.fora_vazio || 0, eneDescontoPct, 2);
      } else if (data.simulacao.ciclo_horario === 'tri-horario') {
        const kwhV = data.simulacao.kwh_vazio || 0;
        const kwhP = data.simulacao.kwh_ponta || 0;
        const kwhC = data.simulacao.kwh_cheias || 0;
        const pVRaw = resultado.valores_kwh_raw.vazio || 0;
        const pPRaw = resultado.valores_kwh_raw.ponta || 0;
        const pCRaw = resultado.valores_kwh_raw.cheias || 0;
        const pVDesc = resultado.valores_kwh.vazio || 0;
        const pPDesc = resultado.valores_kwh.ponta || 0;
        const pCDesc = resultado.valores_kwh.cheias || 0;
        addTableRow('Energia Vazio', '€/kWh', pVRaw, pVDesc, kwhV * pVRaw, resultado.custos_energia.vazio || 0, eneDescontoPct, 1);
        addTableRow('Energia Ponta', '€/kWh', pPRaw, pPDesc, kwhP * pPRaw, resultado.custos_energia.ponta || 0, eneDescontoPct, 2);
        addTableRow('Energia Cheias', '€/kWh', pCRaw, pCDesc, kwhC * pCRaw, resultado.custos_energia.cheias || 0, eneDescontoPct, 3);
      }

      const custoAtualElet = data.simulacao.tipo_simulacao === 'dual'
        ? data.custoAtual - ((data.simulacao.gas_valor_diario_atual || 0) * data.simulacao.dias_fatura + (data.simulacao.gas_kwh || 0) * (data.simulacao.gas_preco_kwh || 0))
        : data.custoAtual;

      doc.setFillColor(230, 236, 245);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkBlue);
      doc.text('TOTAL ELETRICIDADE', colX[0], y + 5);
      doc.setTextColor(...textDark);
      doc.text(fmtEur(custoAtualElet), colX[3], y + 5);
      doc.setTextColor(...green);
      doc.text(fmtEur(resultado.subtotal_eletricidade !== undefined ? resultado.subtotal_eletricidade : resultado.subtotal), colX[4], y + 5);
      y += 10;
    }

    if (dt) {
      checkPage(40);
      doc.setFillColor(...orangeLight);
      doc.setDrawColor(...orange);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orange);
      doc.text('CAMPANHA ESPECIAL', margin + 4, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      doc.setFontSize(8.5);

      if (dt.descricao) {
        doc.text(dt.descricao, margin + 4, y + 13);
        doc.text(`Durante ${dt.duracao_meses} meses, o custo mensal será de ${fmtEur(dt.custo_mensal_com_desconto)} (desconto adicional de`, margin + 4, y + 19);
        doc.text(`${fmtEur(dt.valor_mensal)}/mês)`, margin + 4, y + 25);
      } else {
        doc.text(`Durante ${dt.duracao_meses} meses, o custo mensal será de ${fmtEur(dt.custo_mensal_com_desconto)} (desconto adicional de`, margin + 4, y + 13);
        doc.text(`${fmtEur(dt.valor_mensal)}/mês)`, margin + 4, y + 19);
      }

      const poupancaCampanha = (resultado.poupanca / data.simulacao.dias_fatura) * 30 + dt.valor_mensal;
      const poupancaSemCampanha = (resultado.poupanca / data.simulacao.dias_fatura) * 30;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...green);
      doc.text(`Poupança c/ Campanha: ${fmtEur(poupancaCampanha)}/mês`, margin + 4, y + 31);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(`Sem campanha: ${fmtEur(poupancaSemCampanha)}/mês`, margin + 4, y + 36);

      y += 42;
    } else {
      const poupancaMensalCalc = (resultado.poupanca / data.simulacao.dias_fatura) * 30;
      if (resultado.poupanca > 0) {
        checkPage(16);
        doc.setFillColor(...greenLight);
        doc.setDrawColor(...green);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, 14, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...green);
        doc.text(`Poupança: ${fmtEur(poupancaMensalCalc)}/mês`, margin + 4, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...textMuted);
        doc.text(`Poupança anual: ${fmtEur(poupancaAnual)}`, margin + 4, y + 11);
        y += 18;
      }
    }

    y += 5;
  }

  checkPage(20);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...textMuted);
  const notaText = 'Nota: Esta simulação não considera a tarifa social de energia. Se é beneficiário da tarifa social, consulte os valores específicos junto da sua operadora.';
  const notaLines = doc.splitTextToSize(notaText, contentWidth);
  doc.text(notaLines, margin, y);
  y += notaLines.length * 4.5 + 4;

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  const consultorNome = (data.userInfo?.nome || 'MPGrupo').replace(/\s+/g, '_');
  const fileName = `MPGrupo_Simulacao_${consultorNome}_${data.dataGeracao.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
