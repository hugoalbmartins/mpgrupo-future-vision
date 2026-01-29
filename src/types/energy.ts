export type CicloHorario = 'simples' | 'bi-horario' | 'tri-horario';

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

export interface TarifasOperadora {
  simples?: TarifaSimples;
  'bi-horario'?: TarifaBiHorario;
  'tri-horario'?: TarifaTriHorario;
}

export interface Operadora {
  id: string;
  nome: string;
  logotipo_url: string | null;
  ciclos_disponiveis: CicloHorario[];
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
  desconto_dd_potencia: number;
  desconto_dd_energia: number;
  desconto_fe_potencia: number;
  desconto_fe_energia: number;
  created_at: string;
  updated_at: string;
}

export interface SimulacaoInput {
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
  custo_total_energia: number;
  subtotal: number;
  poupanca: number;
  poupanca_potencial_dd_fe?: number;
}

export const POTENCIAS_DISPONIVEIS = [
  1.15, 2.3, 3.45, 4.6, 5.75, 6.9, 10.35, 13.8, 17.25, 20.7, 27.6, 34.5, 41.4
];

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
