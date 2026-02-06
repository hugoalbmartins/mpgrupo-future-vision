import { motion } from 'framer-motion';
import { Calculator, Linkedin, Facebook, Phone } from 'lucide-react';

interface FloatingActionButtonsProps {
  onSimulatorClick: () => void;
}

const FloatingActionButtons = ({ onSimulatorClick }: FloatingActionButtonsProps) => {
  const items = [
    {
      icon: Calculator,
      label: 'Simulador',
      color: 'bg-gradient-to-r from-gold to-gold-light text-primary-foreground',
      hoverColor: 'hover:shadow-gold/30',
      onClick: onSimulatorClick,
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      color: 'bg-[#0077B5] text-white',
      hoverColor: 'hover:shadow-[#0077B5]/30',
      href: 'https://www.linkedin.com/company/mp-grupo',
    },
    {
      icon: Facebook,
      label: 'Facebook',
      color: 'bg-[#1877F2] text-white',
      hoverColor: 'hover:shadow-[#1877F2]/30',
      href: 'https://www.facebook.com/academiadeformacaoempreendedores',
    },
    {
      icon: Phone,
      label: 'WhatsApp',
      color: 'bg-[#25D366] text-white',
      hoverColor: 'hover:shadow-[#25D366]/30',
      href: 'https://wa.me/351928203793?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es',
    },
  ];

  return (
    <>
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 flex-col gap-1.5">
        {items.map((item, index) => {
          const content = (
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
              className={`group relative flex items-center rounded-l-lg overflow-hidden shadow-lg ${item.hoverColor} hover:shadow-xl transition-all duration-300 cursor-pointer`}
            >
              <div className={`flex items-center gap-0 ${item.color} py-2.5 pl-3 pr-3 rounded-l-lg transition-all duration-300 group-hover:pr-2`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap font-body text-sm font-medium opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300">
                  {item.label}
                </span>
              </div>
            </motion.div>
          );

          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}
      </div>

      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {items.map((item, index) => {
          const content = (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg ${item.color} ${item.hoverColor} hover:shadow-xl transition-all duration-300`}
            >
              <item.icon className="w-5 h-5" />
            </motion.div>
          );

          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default FloatingActionButtons;
