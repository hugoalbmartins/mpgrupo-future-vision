import { TipoSimulacao } from '@/types/energy';
import { Zap, Flame } from 'lucide-react';

interface SimulatorTypeSelectionProps {
  selected: TipoSimulacao | null;
  onSelect: (tipo: TipoSimulacao) => void;
}

const SimulatorTypeSelection = ({ selected, onSelect }: SimulatorTypeSelectionProps) => {
  const options: { value: TipoSimulacao; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'eletricidade',
      label: 'Eletricidade',
      icon: <Zap className="w-8 h-8" />,
      description: 'Simular apenas poupanca em eletricidade'
    },
    {
      value: 'gas',
      label: 'Gas Natural',
      icon: <Flame className="w-8 h-8" />,
      description: 'Simular apenas poupanca em gas'
    },
    {
      value: 'dual',
      label: 'Dual (Eletricidade + Gas)',
      icon: (
        <div className="flex gap-1">
          <Zap className="w-6 h-6" />
          <Flame className="w-6 h-6" />
        </div>
      ),
      description: 'Simular poupanca combinada'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-body text-lg font-medium text-foreground mb-2">
          Que tipo de poupanca pretende simular?
        </h3>
        <p className="font-body text-sm text-cream-muted">
          Selecione uma opcao para continuar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`p-6 rounded-lg border-2 transition-all text-center ${
              selected === option.value
                ? 'border-gold bg-gold/10 shadow-lg'
                : 'border-border bg-muted hover:border-gold/50 hover:bg-muted/80'
            }`}
          >
            <div className={`flex justify-center mb-3 ${selected === option.value ? 'text-gold' : 'text-cream-muted'}`}>
              {option.icon}
            </div>
            <div className="font-body font-medium text-foreground mb-2">
              {option.label}
            </div>
            <div className="font-body text-xs text-cream-muted">
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimulatorTypeSelection;
