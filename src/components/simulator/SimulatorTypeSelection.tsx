import { TipoSimulacao } from '@/types/energy';
import { Zap, Flame, Layers } from 'lucide-react';

interface SimulatorTypeSelectionProps {
  onSelect: (tipo: TipoSimulacao) => void;
  availableEnergies: {
    hasElectricidade: boolean;
    hasGas: boolean;
  };
}

const SimulatorTypeSelection = ({ onSelect, availableEnergies }: SimulatorTypeSelectionProps) => {
  const allTypes = [
    {
      id: 'eletricidade' as TipoSimulacao,
      title: 'Eletricidade',
      description: 'Compare tarifas e descubra a melhor opção para eletricidade',
      icon: Zap,
      available: availableEnergies.hasElectricidade,
    },
    {
      id: 'gas' as TipoSimulacao,
      title: 'Gás Natural',
      description: 'Encontre as tarifas mais competitivas para gás natural',
      icon: Flame,
      available: availableEnergies.hasGas,
    },
    {
      id: 'dual' as TipoSimulacao,
      title: 'Eletricidade + Gás',
      description: 'Maximize a poupança combinando ambas as energias',
      icon: Layers,
      available: availableEnergies.hasElectricidade && availableEnergies.hasGas,
    },
  ];

  const types = allTypes.filter(type => type.available);

  return (
    <div className="space-y-3 py-4">
      {types.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className="w-full p-6 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-gold/50 transition-all duration-300 group text-left"
          >
            <div className="flex items-center gap-6">
              <div className="shrink-0 w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <Icon className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-body font-semibold text-lg text-foreground mb-1 group-hover:text-gold transition-colors">
                  {type.title}
                </h3>
                <p className="font-body text-sm text-cream-muted leading-relaxed">
                  {type.description}
                </p>
              </div>
              <div className="shrink-0 text-cream-muted group-hover:text-gold transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SimulatorTypeSelection;
