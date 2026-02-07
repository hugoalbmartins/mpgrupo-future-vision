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
      description: 'Simular poupança apenas em eletricidade',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500',
      available: availableEnergies.hasElectricidade,
    },
    {
      id: 'gas' as TipoSimulacao,
      title: 'Gás',
      description: 'Simular poupança apenas em gás natural',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      available: availableEnergies.hasGas,
    },
    {
      id: 'dual' as TipoSimulacao,
      title: 'Dual (Eletricidade + Gás)',
      description: 'Simular poupança em eletricidade e gás',
      icon: Layers,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      available: availableEnergies.hasElectricidade && availableEnergies.hasGas,
    },
  ];

  const types = allTypes.filter(type => type.available);

  return (
    <div className="grid md:grid-cols-3 gap-6 py-6">
      {types.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-6 rounded-lg border-2 ${type.borderColor} ${type.bgColor} hover:shadow-lg transition-all group`}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-full bg-background ${type.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-body font-bold text-lg text-foreground mb-2">{type.title}</h3>
                <p className="font-body text-sm text-cream-muted">{type.description}</p>
              </div>
              <div className="mt-2 px-4 py-2 bg-gold text-primary-foreground rounded-lg font-body font-medium group-hover:bg-gold-light transition-all">
                Selecionar
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SimulatorTypeSelection;
