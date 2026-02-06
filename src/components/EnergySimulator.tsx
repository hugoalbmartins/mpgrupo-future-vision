import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulacaoInput, CicloHorario, POTENCIAS_DISPONIVEIS, OPERADORAS_MERCADO_LIVRE } from '@/types/energy';
import { Zap, Building2, Calendar, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import SimulatorResults from './SimulatorResults';

interface EnergySimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnergySimulator = ({ open, onOpenChange }: EnergySimulatorProps) => {
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<SimulacaoInput>({
    operadora_atual: '',
    potencia: 6.9,
    valor_potencia_diaria_atual: 0,
    dias_fatura: 30,
    ciclo_horario: 'simples',
    kwh_simples: 0,
    preco_simples: 0,
    debito_direto: false,
    fatura_eletronica: false,
  });

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  const updateField = <K extends keyof SimulacaoInput>(field: K, value: SimulacaoInput[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors.has(field)) {
      setFieldErrors((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const numericDisplayValue = (field: string, numericVal: number | undefined): string | number => {
    if (field in rawInputs) return rawInputs[field];
    if (!numericVal) return '';
    return numericVal;
  };

  const handleNumericChange = (field: keyof SimulacaoInput, raw: string) => {
    setRawInputs((prev) => ({ ...prev, [field]: raw }));
    const parsed = parseFloat(raw);
    updateField(field, (isNaN(parsed) ? 0 : parsed) as never);
  };

  const handleNumericBlur = (field: string) => {
    setRawInputs((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const inputClass = (field: string, base: string) =>
    `${base} ${fieldErrors.has(field) ? 'border-red-500 ring-1 ring-red-500' : ''}`;

  const handleCicloChange = (ciclo: CicloHorario) => {
    setFormData((prev) => ({
      ...prev,
      ciclo_horario: ciclo,
      kwh_simples: ciclo === 'simples' ? prev.kwh_simples : undefined,
      preco_simples: ciclo === 'simples' ? prev.preco_simples : undefined,
      kwh_vazio: undefined,
      preco_vazio: undefined,
      kwh_fora_vazio: undefined,
      preco_fora_vazio: undefined,
      kwh_ponta: undefined,
      preco_ponta: undefined,
      kwh_cheias: undefined,
      preco_cheias: undefined,
    }));
  };

  const validateForm = (): boolean => {
    const errors = new Set<string>();

    if (!formData.valor_potencia_diaria_atual || formData.valor_potencia_diaria_atual === 0) {
      errors.add('valor_potencia_diaria_atual');
    }

    if (formData.ciclo_horario === 'simples') {
      if (!formData.kwh_simples || formData.kwh_simples === 0) errors.add('kwh_simples');
      if (!formData.preco_simples || formData.preco_simples === 0) errors.add('preco_simples');
    } else if (formData.ciclo_horario === 'bi-horario') {
      if (!formData.kwh_vazio || formData.kwh_vazio === 0) errors.add('kwh_vazio');
      if (!formData.preco_vazio || formData.preco_vazio === 0) errors.add('preco_vazio');
      if (!formData.kwh_fora_vazio || formData.kwh_fora_vazio === 0) errors.add('kwh_fora_vazio');
      if (!formData.preco_fora_vazio || formData.preco_fora_vazio === 0) errors.add('preco_fora_vazio');
    } else if (formData.ciclo_horario === 'tri-horario') {
      if (!formData.kwh_vazio || formData.kwh_vazio === 0) errors.add('kwh_vazio');
      if (!formData.preco_vazio || formData.preco_vazio === 0) errors.add('preco_vazio');
      if (!formData.kwh_ponta || formData.kwh_ponta === 0) errors.add('kwh_ponta');
      if (!formData.preco_ponta || formData.preco_ponta === 0) errors.add('preco_ponta');
      if (!formData.kwh_cheias || formData.kwh_cheias === 0) errors.add('kwh_cheias');
      if (!formData.preco_cheias || formData.preco_cheias === 0) errors.add('preco_cheias');
    }

    setFieldErrors(errors);

    if (errors.size > 0) {
      toast.error('Preencha todos os campos obrigatórios com valores superiores a 0.');
      return false;
    }
    return true;
  };

  const handleSimulate = () => {
    if (!validateForm()) return;
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setStep(1);
    setFieldErrors(new Set());
    setRawInputs({});
    setFormData({
      operadora_atual: '',
      potencia: 6.9,
      valor_potencia_diaria_atual: 0,
      dias_fatura: 30,
      ciclo_horario: 'simples',
      kwh_simples: 0,
      preco_simples: 0,
      debito_direto: false,
      fatura_eletronica: false,
    });
  };

  if (showResults) {
    return (
      <SimulatorResults
        open={open}
        onOpenChange={onOpenChange}
        simulacao={formData}
        onReset={handleReset}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-center mb-2">
            <span className="gold-text">Simulador</span> de Poupança Energética
          </DialogTitle>
          <p className="font-body text-cream-muted text-center">
            Descubra quanto pode poupar ao mudar de operadora
          </p>
        </DialogHeader>

        <div className="space-y-8 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                <Building2 className="w-4 h-4 text-gold" />
                Operadora Atual *
              </label>
              <select
                value={formData.operadora_atual}
                onChange={(e) => updateField('operadora_atual', e.target.value)}
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                Potência Contratada (kVA) *
              </label>
              <select
                value={formData.potencia}
                onChange={(e) => updateField('potencia', parseFloat(e.target.value))}
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                Valor Potência Diária Atual (€/dia) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={numericDisplayValue('valor_potencia_diaria_atual', formData.valor_potencia_diaria_atual)}
                onChange={(e) => handleNumericChange('valor_potencia_diaria_atual', e.target.value)}
                onBlur={() => handleNumericBlur('valor_potencia_diaria_atual')}
                required
                placeholder="Ex: 0.3569"
                className={inputClass('valor_potencia_diaria_atual', 'w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
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
                type="number"
                min="1"
                max="365"
                value={formData.dias_fatura}
                onChange={(e) => updateField('dias_fatura', parseInt(e.target.value) || 30)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-3">
              <ClockIcon className="w-4 h-4 text-gold" />
              Ciclo Horário *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['simples', 'bi-horario', 'tri-horario'] as CicloHorario[]).map((ciclo) => (
                <button
                  key={ciclo}
                  type="button"
                  onClick={() => handleCicloChange(ciclo)}
                  className={`p-4 rounded-lg border-2 transition-all font-body ${
                    formData.ciclo_horario === ciclo
                      ? 'border-gold bg-gold/10 text-foreground'
                      : 'border-border bg-muted text-cream-muted hover:border-gold/50'
                  }`}
                >
                  {ciclo === 'simples' && 'Simples'}
                  {ciclo === 'bi-horario' && 'Bi-Horário'}
                  {ciclo === 'tri-horario' && 'Tri-Horário'}
                </button>
              ))}
            </div>
          </div>

          {formData.ciclo_horario === 'simples' && (
            <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
              <h3 className="font-body font-medium text-foreground">Consumo Simples</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm text-cream-muted mb-2 block">
                    kWh Consumidos *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={numericDisplayValue('kwh_simples', formData.kwh_simples)}
                    onChange={(e) => handleNumericChange('kwh_simples', e.target.value)}
                    onBlur={() => handleNumericBlur('kwh_simples')}
                    className={inputClass('kwh_simples', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                  />
                </div>
                <div>
                  <label className="font-body text-sm text-cream-muted mb-2 block">
                    Preço (€/kWh) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={numericDisplayValue('preco_simples', formData.preco_simples)}
                    onChange={(e) => handleNumericChange('preco_simples', e.target.value)}
                    onBlur={() => handleNumericBlur('preco_simples')}
                    className={inputClass('preco_simples', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.ciclo_horario === 'bi-horario' && (
            <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
              <h3 className="font-body font-medium text-foreground">Consumo Bi-Horário</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      kWh Vazio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={numericDisplayValue('kwh_vazio', formData.kwh_vazio)}
                      onChange={(e) => handleNumericChange('kwh_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('kwh_vazio')}
                      className={inputClass('kwh_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      Preço Vazio (€/kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={numericDisplayValue('preco_vazio', formData.preco_vazio)}
                      onChange={(e) => handleNumericChange('preco_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('preco_vazio')}
                      className={inputClass('preco_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      kWh Fora de Vazio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={numericDisplayValue('kwh_fora_vazio', formData.kwh_fora_vazio)}
                      onChange={(e) => handleNumericChange('kwh_fora_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('kwh_fora_vazio')}
                      className={inputClass('kwh_fora_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      Preço Fora de Vazio (€/kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={numericDisplayValue('preco_fora_vazio', formData.preco_fora_vazio)}
                      onChange={(e) => handleNumericChange('preco_fora_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('preco_fora_vazio')}
                      className={inputClass('preco_fora_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.ciclo_horario === 'tri-horario' && (
            <div className="p-6 bg-muted/50 rounded-lg border border-border space-y-4">
              <h3 className="font-body font-medium text-foreground">Consumo Tri-Horário</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      kWh Vazio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={numericDisplayValue('kwh_vazio', formData.kwh_vazio)}
                      onChange={(e) => handleNumericChange('kwh_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('kwh_vazio')}
                      className={inputClass('kwh_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      Preço Vazio (€/kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={numericDisplayValue('preco_vazio', formData.preco_vazio)}
                      onChange={(e) => handleNumericChange('preco_vazio', e.target.value)}
                      onBlur={() => handleNumericBlur('preco_vazio')}
                      className={inputClass('preco_vazio', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      kWh Ponta *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={numericDisplayValue('kwh_ponta', formData.kwh_ponta)}
                      onChange={(e) => handleNumericChange('kwh_ponta', e.target.value)}
                      onBlur={() => handleNumericBlur('kwh_ponta')}
                      className={inputClass('kwh_ponta', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      Preço Ponta (€/kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={numericDisplayValue('preco_ponta', formData.preco_ponta)}
                      onChange={(e) => handleNumericChange('preco_ponta', e.target.value)}
                      onBlur={() => handleNumericBlur('preco_ponta')}
                      className={inputClass('preco_ponta', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      kWh Cheias *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={numericDisplayValue('kwh_cheias', formData.kwh_cheias)}
                      onChange={(e) => handleNumericChange('kwh_cheias', e.target.value)}
                      onBlur={() => handleNumericBlur('kwh_cheias')}
                      className={inputClass('kwh_cheias', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-cream-muted mb-2 block">
                      Preço Cheias (€/kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={numericDisplayValue('preco_cheias', formData.preco_cheias)}
                      onChange={(e) => handleNumericChange('preco_cheias', e.target.value)}
                      onBlur={() => handleNumericBlur('preco_cheias')}
                      className={inputClass('preco_cheias', 'w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-body font-medium text-foreground mb-4">Opções Adicionais</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.debito_direto}
                  onChange={(e) => updateField('debito_direto', e.target.checked)}
                  className="w-5 h-5 text-gold rounded focus:ring-gold"
                />
                <span className="font-body text-foreground">
                  Aderir a Débito Direto (DD)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fatura_eletronica}
                  onChange={(e) => updateField('fatura_eletronica', e.target.checked)}
                  className="w-5 h-5 text-gold rounded focus:ring-gold"
                />
                <span className="font-body text-foreground">
                  Aderir a Fatura Eletrónica (FE)
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={!formData.operadora_atual}
              className="px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simular Poupança
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnergySimulator;
