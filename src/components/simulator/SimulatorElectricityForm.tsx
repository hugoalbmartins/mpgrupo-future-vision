import { SimulacaoInput, CicloHorario, POTENCIAS_DISPONIVEIS, OPERADORAS_MERCADO_LIVRE } from '@/types/energy';
import { Zap, Building2, Calendar, ClockIcon } from 'lucide-react';

interface SimulatorElectricityFormProps {
  formData: SimulacaoInput;
  updateField: <K extends keyof SimulacaoInput>(field: K, value: SimulacaoInput[K]) => void;
  numericDisplayValue: (field: string, numericVal: number | undefined) => string | number;
  handleNumericChange: (field: keyof SimulacaoInput, raw: string) => void;
  handleNumericBlur: (field: string) => void;
  fieldErrors: Set<string>;
  inputClass: (field: string, base: string) => string;
  showCommonFields: boolean;
}

const baseInputCls = 'w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';
const smallInputCls = 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';

const SimulatorElectricityForm = ({
  formData, updateField, numericDisplayValue, handleNumericChange, handleNumericBlur,
  fieldErrors, inputClass, showCommonFields,
}: SimulatorElectricityFormProps) => {
  const handleCicloChange = (ciclo: CicloHorario) => {
    updateField('ciclo_horario', ciclo);
  };

  return (
    <div className="space-y-6">
      {showCommonFields && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                <Building2 className="w-4 h-4 text-gold" />
                Operadora Atual *
              </label>
              <select
                value={formData.operadora_atual}
                onChange={(e) => updateField('operadora_atual', e.target.value)}
                className={baseInputCls}
              >
                <option value="">Selecione...</option>
                {OPERADORAS_MERCADO_LIVRE.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                <Zap className="w-4 h-4 text-gold" />
                Potencia Contratada (kVA) *
              </label>
              <select
                value={formData.potencia}
                onChange={(e) => updateField('potencia', parseFloat(e.target.value))}
                className={baseInputCls}
              >
                {POTENCIAS_DISPONIVEIS.map((pot) => (
                  <option key={pot} value={pot}>{pot} kVA</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                <Zap className="w-4 h-4 text-gold" />
                Valor Potencia Diaria Atual (EUR/dia) *
              </label>
              <input
                type="number" step="0.01" min="0"
                value={numericDisplayValue('valor_potencia_diaria_atual', formData.valor_potencia_diaria_atual)}
                onChange={(e) => handleNumericChange('valor_potencia_diaria_atual', e.target.value)}
                onBlur={() => handleNumericBlur('valor_potencia_diaria_atual')}
                placeholder="Ex: 0.3569"
                className={inputClass('valor_potencia_diaria_atual', baseInputCls)}
              />
              <p className="font-body text-xs text-cream-muted mt-1">
                Encontra este valor na sua fatura atual
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                <Calendar className="w-4 h-4 text-gold" />
                Dias da Fatura *
              </label>
              <input
                type="number" min="1" max="365"
                value={formData.dias_fatura}
                onChange={(e) => updateField('dias_fatura', parseInt(e.target.value) || 30)}
                className={baseInputCls}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-3">
          <ClockIcon className="w-4 h-4 text-gold" />
          Ciclo Horario *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['simples', 'bi-horario', 'tri-horario'] as CicloHorario[]).map((ciclo) => (
            <button
              key={ciclo} type="button"
              onClick={() => handleCicloChange(ciclo)}
              className={`p-4 rounded-lg border-2 transition-all font-body ${
                formData.ciclo_horario === ciclo
                  ? 'border-gold bg-gold/10 text-foreground'
                  : 'border-border bg-muted text-cream-muted hover:border-gold/50'
              }`}
            >
              {ciclo === 'simples' && 'Simples'}
              {ciclo === 'bi-horario' && 'Bi-Horario'}
              {ciclo === 'tri-horario' && 'Tri-Horario'}
            </button>
          ))}
        </div>
      </div>

      {formData.ciclo_horario === 'simples' && (
        <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
          <h3 className="font-body font-medium text-foreground">Consumo Simples</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm text-cream-muted mb-2 block">kWh Consumidos *</label>
              <input
                type="number" step="0.01" min="0"
                value={numericDisplayValue('kwh_simples', formData.kwh_simples)}
                onChange={(e) => handleNumericChange('kwh_simples', e.target.value)}
                onBlur={() => handleNumericBlur('kwh_simples')}
                className={inputClass('kwh_simples', smallInputCls)}
              />
            </div>
            <div>
              <label className="font-body text-sm text-cream-muted mb-2 block">Preco (EUR/kWh) *</label>
              <input
                type="number" step="0.000001" min="0"
                value={numericDisplayValue('preco_simples', formData.preco_simples)}
                onChange={(e) => handleNumericChange('preco_simples', e.target.value)}
                onBlur={() => handleNumericBlur('preco_simples')}
                className={inputClass('preco_simples', smallInputCls)}
              />
            </div>
          </div>
        </div>
      )}

      {formData.ciclo_horario === 'bi-horario' && (
        <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
          <h3 className="font-body font-medium text-foreground">Consumo Bi-Horario</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">kWh Vazio *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={numericDisplayValue('kwh_vazio', formData.kwh_vazio)}
                  onChange={(e) => handleNumericChange('kwh_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('kwh_vazio')}
                  className={inputClass('kwh_vazio', smallInputCls)}
                />
              </div>
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">Preco Vazio (EUR/kWh) *</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={numericDisplayValue('preco_vazio', formData.preco_vazio)}
                  onChange={(e) => handleNumericChange('preco_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('preco_vazio')}
                  className={inputClass('preco_vazio', smallInputCls)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">kWh Fora de Vazio *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={numericDisplayValue('kwh_fora_vazio', formData.kwh_fora_vazio)}
                  onChange={(e) => handleNumericChange('kwh_fora_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('kwh_fora_vazio')}
                  className={inputClass('kwh_fora_vazio', smallInputCls)}
                />
              </div>
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">Preco Fora de Vazio (EUR/kWh) *</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={numericDisplayValue('preco_fora_vazio', formData.preco_fora_vazio)}
                  onChange={(e) => handleNumericChange('preco_fora_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('preco_fora_vazio')}
                  className={inputClass('preco_fora_vazio', smallInputCls)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.ciclo_horario === 'tri-horario' && (
        <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
          <h3 className="font-body font-medium text-foreground">Consumo Tri-Horario</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">kWh Vazio *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={numericDisplayValue('kwh_vazio', formData.kwh_vazio)}
                  onChange={(e) => handleNumericChange('kwh_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('kwh_vazio')}
                  className={inputClass('kwh_vazio', smallInputCls)}
                />
              </div>
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">Preco Vazio (EUR/kWh) *</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={numericDisplayValue('preco_vazio', formData.preco_vazio)}
                  onChange={(e) => handleNumericChange('preco_vazio', e.target.value)}
                  onBlur={() => handleNumericBlur('preco_vazio')}
                  className={inputClass('preco_vazio', smallInputCls)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">kWh Ponta *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={numericDisplayValue('kwh_ponta', formData.kwh_ponta)}
                  onChange={(e) => handleNumericChange('kwh_ponta', e.target.value)}
                  onBlur={() => handleNumericBlur('kwh_ponta')}
                  className={inputClass('kwh_ponta', smallInputCls)}
                />
              </div>
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">Preco Ponta (EUR/kWh) *</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={numericDisplayValue('preco_ponta', formData.preco_ponta)}
                  onChange={(e) => handleNumericChange('preco_ponta', e.target.value)}
                  onBlur={() => handleNumericBlur('preco_ponta')}
                  className={inputClass('preco_ponta', smallInputCls)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">kWh Cheias *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={numericDisplayValue('kwh_cheias', formData.kwh_cheias)}
                  onChange={(e) => handleNumericChange('kwh_cheias', e.target.value)}
                  onBlur={() => handleNumericBlur('kwh_cheias')}
                  className={inputClass('kwh_cheias', smallInputCls)}
                />
              </div>
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">Preco Cheias (EUR/kWh) *</label>
                <input
                  type="number" step="0.000001" min="0"
                  value={numericDisplayValue('preco_cheias', formData.preco_cheias)}
                  onChange={(e) => handleNumericChange('preco_cheias', e.target.value)}
                  onBlur={() => handleNumericBlur('preco_cheias')}
                  className={inputClass('preco_cheias', smallInputCls)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showCommonFields && (
        <div className="p-6 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-body font-medium text-foreground mb-4">Opcoes Adicionais</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.debito_direto}
                onChange={(e) => updateField('debito_direto', e.target.checked)}
                className="w-5 h-5 text-gold rounded focus:ring-gold"
              />
              <span className="font-body text-foreground">Aderir a Debito Direto (DD)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fatura_eletronica}
                onChange={(e) => updateField('fatura_eletronica', e.target.checked)}
                className="w-5 h-5 text-gold rounded focus:ring-gold"
              />
              <span className="font-body text-foreground">Aderir a Fatura Eletronica (FE)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulatorElectricityForm;
