import { SimulacaoInput, EscalaoGas } from '@/types/energy';
import { Flame, Calendar } from 'lucide-react';

interface SimulatorGasFormProps {
  formData: SimulacaoInput;
  updateField: <K extends keyof SimulacaoInput>(field: K, value: SimulacaoInput[K]) => void;
  numericDisplayValue: (field: string, numericVal: number | undefined) => string | number;
  handleNumericChange: (field: keyof SimulacaoInput, raw: string) => void;
  handleNumericBlur: (field: string) => void;
  fieldErrors: Set<string>;
  inputClass: (field: string, base: string) => string;
}

const baseInputCls = 'w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50';

const SimulatorGasForm = ({
  formData, updateField, numericDisplayValue, handleNumericChange, handleNumericBlur,
  fieldErrors, inputClass,
}: SimulatorGasFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
            <Flame className="w-4 h-4 text-gold" />
            Escalão de Gas *
          </label>
          <select
            value={formData.escalao_gas || ''}
            onChange={(e) => updateField('escalao_gas', e.target.value as EscalaoGas)}
            className={inputClass('escalao_gas', baseInputCls)}
          >
            <option value="">Selecione...</option>
            <option value="1">Escalão 1</option>
            <option value="2">Escalão 2</option>
            <option value="3">Escalão 3</option>
            <option value="4">Escalão 4</option>
          </select>
          <p className="font-body text-xs text-cream-muted mt-1">
            Encontra o escalão na sua fatura de gás
          </p>
        </div>
        <div>
          <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
            <Flame className="w-4 h-4 text-gold" />
            Valor Diário do Escalão Atual (EUR/dia) *
          </label>
          <input
            type="number" step="0.01" min="0"
            value={numericDisplayValue('gas_valor_escalao_diario_atual', formData.gas_valor_escalao_diario_atual)}
            onChange={(e) => handleNumericChange('gas_valor_escalao_diario_atual', e.target.value)}
            onBlur={() => handleNumericBlur('gas_valor_escalao_diario_atual')}
            placeholder="Ex: 0.2500"
            className={inputClass('gas_valor_escalao_diario_atual', baseInputCls)}
          />
          <p className="font-body text-xs text-cream-muted mt-1">
            Valor diário do escalão na fatura atual
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
            <Calendar className="w-4 h-4 text-gold" />
            Dias da Fatura de Gas *
          </label>
          <input
            type="number" min="1" max="365"
            value={formData.gas_dias_fatura || 30}
            onChange={(e) => updateField('gas_dias_fatura', parseInt(e.target.value) || 30)}
            className={baseInputCls}
          />
        </div>
      </div>

      <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
        <h3 className="font-body font-medium text-foreground">Consumo de Gas</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-sm text-cream-muted mb-2 block">kWh Consumidos *</label>
            <input
              type="number" step="0.01" min="0"
              value={numericDisplayValue('gas_kwh_consumidos', formData.gas_kwh_consumidos)}
              onChange={(e) => handleNumericChange('gas_kwh_consumidos', e.target.value)}
              onBlur={() => handleNumericBlur('gas_kwh_consumidos')}
              placeholder="Ex: 150.00"
              className={inputClass('gas_kwh_consumidos', baseInputCls)}
            />
          </div>
          <div>
            <label className="font-body text-sm text-cream-muted mb-2 block">Preço (EUR/kWh) *</label>
            <input
              type="number" step="0.000001" min="0"
              value={numericDisplayValue('gas_preco_kwh_atual', formData.gas_preco_kwh_atual)}
              onChange={(e) => handleNumericChange('gas_preco_kwh_atual', e.target.value)}
              onBlur={() => handleNumericBlur('gas_preco_kwh_atual')}
              placeholder="Ex: 0.085000"
              className={inputClass('gas_preco_kwh_atual', baseInputCls)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorGasForm;
