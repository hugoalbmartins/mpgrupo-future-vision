export type CicloHorario = 'simples' | 'bi-horario' | 'tri-horario';
export type TipoSimulacao = 'eletricidade' | 'gas' | 'dual';
export type EscalaoGas = 1 | 2 | 3 | 4;

export interface TarifaSimples {
  valor_kwh: number;
  valor_diario_potencias: Record<string, number>;
}

export interface TarifaBiHorario {
  valor_kwh_vazio: number;
  valor_kwh_fora_vazio: number;
  valor_diario_potencias: Record<string, number>;
}

export interface TarifaTriHorario {
  valor_kwh_vazio: number;
  valor_kwh_cheias: number;
  valor_kwh_ponta: number;
  valor_diario_potencias: Record<string, number>;
}

export interface GasEscalao {
  valor_diario: number;
  valor_kwh: number;
}

export interface GasTarifa {
  escaloes: Record<string, GasEscalao>;
}

export interface TarifasOperadora {
  simples?: TarifaSimples;
  'bi-horario'?: TarifaBiHorario;
  'tri-horario'?: TarifaTriHorario;
  gas?: GasTarifa;
}

export interface Operadora {
  id: string;
  nome: string;
  logotipo_url: string | null;
  ciclos_disponiveis: CicloHorario[];
  tipos_energia: string[];
  tarifas: TarifasOperadora;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  valor_kwh_simples?: number;
  valor_kwh_vazio?: number;
  valor_kwh_fora_vazio?: number;
  valor_kwh_ponta?: number;
  valor_kwh_cheias?: number;
  valor_diario_potencias?: Record<string, number>;
}

export interface ConfiguracaoDesconto {
  id: string;
  operadora_id: string;
  tipo_energia: string;
  desconto_base_potencia: number;
  desconto_base_energia: number;
  desconto_dd_potencia: number;
  desconto_dd_energia: number;
  desconto_fe_potencia: number;
  desconto_fe_energia: number;
  desconto_dd_fe_potencia: number;
  desconto_dd_fe_energia: number;
  desconto_mensal_temporario: number;
  duracao_meses_desconto: number;
  descricao_desconto_temporario: string | null;
  desconto_temp_requer_dd: boolean;
  desconto_temp_requer_fe: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulacaoInput {
  tipo_simulacao: TipoSimulacao;
  operadora_atual: string;
  potencia: number;
  valor_potencia_diaria_atual: number;
  dias_fatura: number;
  ciclo_horario: CicloHorario;
  kwh_simples?: number;
  preco_simples?: number;
  kwh_vazio?: number;
  preco_vazio?: number;
  kwh_fora_vazio?: number;
  preco_fora_vazio?: number;
  kwh_ponta?: number;
  preco_ponta?: number;
  kwh_cheias?: number;
  preco_cheias?: number;
  debito_direto: boolean;
  fatura_eletronica: boolean;
  gas_escalao?: EscalaoGas;
  gas_valor_diario_atual?: number;
  gas_kwh?: number;
  gas_preco_kwh?: number;
}

export interface ResultadoComparacao {
  operadora: Operadora;
  valor_potencia_diaria: number;
  custo_total_potencia: number;
  custos_energia: {
    simples?: number;
    vazio?: number;
    fora_vazio?: number;
    ponta?: number;
    cheias?: number;
  };
  valores_kwh: {
    simples?: number;
    vazio?: number;
    fora_vazio?: number;
    ponta?: number;
    cheias?: number;
  };
  custo_total_energia: number;
  subtotal: number;
  poupanca: number;
  poupanca_potencial_dd_fe?: number;
  desconto_temporario?: {
    valor_mensal: number;
    duracao_meses: number;
    descricao: string | null;
    poupanca_periodo_desconto: number;
    custo_mensal_com_desconto: number;
    custo_mensal_apos_desconto: number;
    requer_dd: boolean;
    requer_fe: boolean;
    disponivel: boolean;
  };
  subtotal_eletricidade?: number;
  subtotal_gas?: number;
  gas_valor_diario?: number;
  gas_custo_total_diario?: number;
  gas_custo_energia?: number;
  gas_preco_kwh?: number;
}

export const POTENCIAS_DISPONIVEIS = [
  1.15, 2.3, 3.45, 4.6, 5.75, 6.9, 10.35, 13.8, 17.25, 20.7, 27.6, 34.5, 41.4
];

export const ESCALOES_GAS: readonly EscalaoGas[] = [1, 2, 3, 4];

export const ESCALOES_GAS_LABELS: Record<EscalaoGas, string> = {
  1: 'Escalao 1 (ate 220 m3/ano)',
  2: 'Escalao 2 (220 a 500 m3/ano)',
  3: 'Escalao 3 (500 a 1000 m3/ano)',
  4: 'Escalao 4 (acima de 1000 m3/ano)',
};

export interface SimulatorUserContext {
  user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
}

export interface SimulatorEmbedConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userContext?: SimulatorUserContext;
  onSimulationComplete?: (data: {
    simulacao: SimulacaoInput;
    resultados: ResultadoComparacao[];
    custoAtual: number;
  }) => void;
  showExportPDF?: boolean;
  showWhatsApp?: boolean;
  pdfUserInfo?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
}

export const OPERADORAS_MERCADO_LIVRE = [
  'EDP Comercial',
  'Endesa',
  'Iberdrola',
  'Galp',
  'Goldenergy',
  'Luzboa',
  'Ylce',
  'MEO Energia',
  'Coopernico',
  'Muon',
  'SU Eletricidade',
  'Enat',
  'Outra'
];
