import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulacaoInput, TipoSimulacao } from '@/types/energy';
import { ChevronLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import SimulatorResults from './SimulatorResults';
import SimulatorTypeSelection from './simulator/SimulatorTypeSelection';
import SimulatorElectricityForm from './simulator/SimulatorElectricityForm';
import SimulatorGasForm from './simulator/SimulatorGasForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnergySimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnergySimulator = ({ open, onOpenChange }: EnergySimulatorProps) => {
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [availableEnergies, setAvailableEnergies] = useState<{
    hasElectricidade: boolean;
    hasGas: boolean;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);

  const [formData, setFormData] = useState<SimulacaoInput>({
    tipo_simulacao: undefined,
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
    if (fieldErrors.has(field as string)) {
      setFieldErrors((prev) => {
        const next = new Set(prev);
        next.delete(field as string);
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

  useEffect(() => {
    if (!open) return;

    const checkAvailableEnergies = async () => {
      try {
        setIsCheckingAvailability(true);

        const { data: operadoras, error } = await supabase
          .from('operadoras')
          .select('tipos_energia')
          .eq('ativo', true);

        if (error) {
          console.error('Erro ao verificar operadoras:', error);
          setAvailableEnergies({ hasElectricidade: true, hasGas: true });
          setIsCheckingAvailability(false);
          return;
        }

        const hasElectricidade = operadoras?.some(op =>
          op.tipos_energia?.includes('eletricidade')
        ) ?? false;

        const hasGas = operadoras?.some(op =>
          op.tipos_energia?.includes('gas')
        ) ?? false;

        setAvailableEnergies({ hasElectricidade, hasGas });

        if (!hasElectricidade && hasGas) {
          updateField('tipo_simulacao', 'gas');
          setStep(1);
        } else if (hasElectricidade && !hasGas) {
          updateField('tipo_simulacao', 'eletricidade');
          setStep(1);
        }
      } catch (err) {
        console.error('Erro ao verificar operadoras:', err);
        setAvailableEnergies({ hasElectricidade: true, hasGas: true });
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailableEnergies();
  }, [open]);

  const validateElectricityForm = (): boolean => {
    const errors = new Set<string>();

    if (!formData.operadora_atual) {
      errors.add('operadora_atual');
    }

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

  const validateGasForm = (): boolean => {
    const errors = new Set<string>();

    if (!formData.gas_escalao) {
      errors.add('gas_escalao');
    }

    if (!formData.gas_valor_diario_atual || formData.gas_valor_diario_atual === 0) {
      errors.add('gas_valor_diario_atual');
    }

    if (!formData.gas_kwh || formData.gas_kwh === 0) {
      errors.add('gas_kwh');
    }

    if (!formData.gas_preco_kwh || formData.gas_preco_kwh === 0) {
      errors.add('gas_preco_kwh');
    }

    setFieldErrors(errors);

    if (errors.size > 0) {
      toast.error('Preencha todos os campos obrigatórios de gás com valores superiores a 0.');
      return false;
    }
    return true;
  };

  const handleTypeSelection = (tipo: TipoSimulacao) => {
    updateField('tipo_simulacao', tipo);
    setStep(1);
  };

  const handleNextFromElectricity = () => {
    if (!validateElectricityForm()) return;

    if (formData.tipo_simulacao === 'eletricidade') {
      setShowResults(true);
    } else if (formData.tipo_simulacao === 'dual') {
      setStep(2);
    }
  };

  const handleNextFromGas = () => {
    if (formData.tipo_simulacao === 'gas' && step === 1) {
      if (!validateGasForm()) return;
      setShowResults(true);
    } else if (formData.tipo_simulacao === 'dual' && step === 2) {
      if (!validateGasForm()) return;
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const onlyOneEnergyAvailable = availableEnergies &&
        ((availableEnergies.hasElectricidade && !availableEnergies.hasGas) ||
         (!availableEnergies.hasElectricidade && availableEnergies.hasGas));

      if (step === 1 && onlyOneEnergyAvailable) {
        onOpenChange(false);
        return;
      }

      setStep(step - 1);
      setFieldErrors(new Set());
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setStep(0);
    setFieldErrors(new Set());
    setRawInputs({});
    setAvailableEnergies(null);
    setIsCheckingAvailability(true);
    setFormData({
      tipo_simulacao: undefined,
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

  const getUnavailableEnergyMessage = () => {
    if (!availableEnergies) return null;

    if (availableEnergies.hasElectricidade && !availableEnergies.hasGas) {
      return 'Estamos a trabalhar para trazer ao utilizador também simulação de gás natural.';
    }

    if (!availableEnergies.hasElectricidade && availableEnergies.hasGas) {
      return 'Estamos a trabalhar para trazer ao utilizador também simulação de eletricidade.';
    }

    return null;
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

  const getStepTitle = () => {
    if (step === 0) return 'Selecione o Tipo de Simulação';
    if (step === 1 && formData.tipo_simulacao === 'gas') return 'Dados de Gás';
    if (step === 1) return 'Dados de Eletricidade';
    if (step === 2) return 'Dados de Gás';
    return 'Simulação';
  };

  const getStepSubtitle = () => {
    if (step === 0) return 'Escolha o tipo de energia que pretende simular';
    if (step === 1 && formData.tipo_simulacao === 'gas') return 'Preencha os dados da sua fatura de gás atual';
    if (step === 1) return 'Preencha os dados da sua fatura de eletricidade atual';
    if (step === 2) return 'Preencha os dados da sua fatura de gás atual';
    return '';
  };

  const showCommonFields =
    (formData.tipo_simulacao === 'eletricidade' && step === 1) ||
    (formData.tipo_simulacao === 'dual' && step === 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-center mb-2">
            <span className="gold-text">Simulador</span> de Poupança Energética
          </DialogTitle>
          <p className="font-body text-cream-muted text-center">
            {getStepSubtitle()}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {isCheckingAvailability ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-body text-cream-muted">A verificar operadoras disponíveis...</p>
              </div>
            </div>
          ) : (
            <>
              {getUnavailableEnergyMessage() && step === 1 && (
                <Alert className="bg-blue-500/10 border-blue-500">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="font-body text-sm">
                    {getUnavailableEnergyMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {step > 0 && !(
                step === 1 &&
                availableEnergies &&
                ((availableEnergies.hasElectricidade && !availableEnergies.hasGas) ||
                 (!availableEnergies.hasElectricidade && availableEnergies.hasGas))
              ) && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-cream-muted hover:text-gold transition-colors font-body"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}

              {step === 0 && availableEnergies && (
                <SimulatorTypeSelection
                  onSelect={handleTypeSelection}
                  availableEnergies={availableEnergies}
                />
              )}

              {step === 1 && formData.tipo_simulacao === 'gas' && (
                <SimulatorGasForm
                  formData={formData}
                  updateField={updateField}
                  numericDisplayValue={numericDisplayValue}
                  handleNumericChange={handleNumericChange}
                  handleNumericBlur={handleNumericBlur}
                  fieldErrors={fieldErrors}
                  inputClass={inputClass}
                />
              )}

              {step === 1 && (formData.tipo_simulacao === 'eletricidade' || formData.tipo_simulacao === 'dual') && (
                <SimulatorElectricityForm
                  formData={formData}
                  updateField={updateField}
                  numericDisplayValue={numericDisplayValue}
                  handleNumericChange={handleNumericChange}
                  handleNumericBlur={handleNumericBlur}
                  fieldErrors={fieldErrors}
                  inputClass={inputClass}
                  showCommonFields={showCommonFields}
                />
              )}

              {step === 2 && formData.tipo_simulacao === 'dual' && (
                <SimulatorGasForm
                  formData={formData}
                  updateField={updateField}
                  numericDisplayValue={numericDisplayValue}
                  handleNumericChange={handleNumericChange}
                  handleNumericBlur={handleNumericBlur}
                  fieldErrors={fieldErrors}
                  inputClass={inputClass}
                />
              )}

              {step > 0 && (
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-6 py-3 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all"
                  >
                    Cancelar
                  </button>
                  {(step === 1 && formData.tipo_simulacao === 'gas') && (
                    <button
                      type="button"
                      onClick={handleNextFromGas}
                      className="px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Simular Poupança
                    </button>
                  )}
                  {(step === 1 && formData.tipo_simulacao === 'eletricidade') && (
                    <button
                      type="button"
                      onClick={handleNextFromElectricity}
                      className="px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Simular Poupança
                    </button>
                  )}
                  {(step === 1 && formData.tipo_simulacao === 'dual') && (
                    <button
                      type="button"
                      onClick={handleNextFromElectricity}
                      className="px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Seguinte
                    </button>
                  )}
                  {(step === 2 && formData.tipo_simulacao === 'dual') && (
                    <button
                      type="button"
                      onClick={handleNextFromGas}
                      className="px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium hover:bg-gold-light transition-all"
                    >
                      Simular Poupança
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnergySimulator;
