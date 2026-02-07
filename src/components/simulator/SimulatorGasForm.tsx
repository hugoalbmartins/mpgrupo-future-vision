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
            Escalão de Gás *
          </label>
          <select
            value={formData.gas_escalao || ''}
            onChange={(e) => updateField('gas_escalao', parseInt(e.target.value) as EscalaoGas)}
            className={inputClass('gas_escalao', baseInputCls)}
          >
            <option value="">Selecione...</option>
            <option value="1">Escalão 1 (até 220 m³/ano)</option>
            <option value="2">Escalão 2 (220 a 500 m³/ano)</option>
            <option value="3">Escalão 3 (500 a 1000 m³/ano)</option>
            <option value="4">Escalão 4 (acima de 1000 m³/ano)</option>
          </select>
          <p className="font-body text-xs text-cream-muted mt-1">
            Encontra o escalão na sua fatura de gás
          </p>
        </div>
        <div>
          <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
            <Flame className="w-4 h-4 text-gold" />
            Valor Diário do Escalão Atual (€/dia) *
          </label>
          <input
            type="number" step="0.000001" min="0"
            value={numericDisplayValue('gas_valor_diario_atual', formData.gas_valor_diario_atual)}
            onChange={(e) => handleNumericChange('gas_valor_diario_atual', e.target.value)}
            onBlur={() => handleNumericBlur('gas_valor_diario_atual')}
            placeholder="Ex: 0.2500"
            className={inputClass('gas_valor_diario_atual', baseInputCls)}
          />
          <p className="font-body text-xs text-cream-muted mt-1">
            Valor diário do escalão na fatura atual
          </p>
        </div>
      </div>

      <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
        <h3 className="font-body font-medium text-foreground">Consumo de Gás</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-sm text-cream-muted mb-2 block">kWh Consumidos *</label>
            <input
              type="number" step="0.01" min="0"
              value={numericDisplayValue('gas_kwh', formData.gas_kwh)}
              onChange={(e) => handleNumericChange('gas_kwh', e.target.value)}
              onBlur={() => handleNumericBlur('gas_kwh')}
              placeholder="Ex: 150.00"
              className={inputClass('gas_kwh', baseInputCls)}
            />
            <p className="font-body text-xs text-cream-muted mt-1">
              Consumo em kWh na fatura atual
            </p>
          </div>
          <div>
            <label className="font-body text-sm text-cream-muted mb-2 block">Preço Atual (€/kWh) *</label>
            <input
              type="number" step="0.000001" min="0"
              value={numericDisplayValue('gas_preco_kwh', formData.gas_preco_kwh)}
              onChange={(e) => handleNumericChange('gas_preco_kwh', e.target.value)}
              onBlur={() => handleNumericBlur('gas_preco_kwh')}
              placeholder="Ex: 0.085000"
              className={inputClass('gas_preco_kwh', baseInputCls)}
            />
            <p className="font-body text-xs text-cream-muted mt-1">
              Preço por kWh na fatura atual
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorGasForm;
