import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Linkedin, Facebook, Phone } from 'lucide-react';

interface FloatingActionButtonsProps {
  onSimulatorClick: () => void;
}

const items = [
  {
    icon: Calculator,
    label: 'Simulador',
    color: 'bg-gradient-to-r from-gold to-gold-light text-primary-foreground',
    shadowColor: 'shadow-gold/20',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'bg-[#0077B5] text-white',
    shadowColor: 'shadow-[#0077B5]/20',
    href: 'https://www.linkedin.com/company/mp-grupo',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    color: 'bg-[#1877F2] text-white',
    shadowColor: 'shadow-[#1877F2]/20',
    href: 'https://www.facebook.com/academiadeformacaoempreendedores',
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    color: 'bg-[#25D366] text-white',
    shadowColor: 'shadow-[#25D366]/20',
    href: 'https://wa.me/351928203793?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es',
  },
];

const FloatingActionButtons = ({ onSimulatorClick }: FloatingActionButtonsProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 flex-col items-end gap-1.5">
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;

          const inner = (
            <motion.div
              initial={{ x: 44, opacity: 0 }}
              animate={{
                x: isHovered ? -6 : 0,
                opacity: 1,
              }}
              transition={
                index === hoveredIndex || hoveredIndex === null
                  ? { x: { duration: 0.25, ease: 'easeOut' }, opacity: { duration: 0.4, delay: 0.3 + index * 0.08 } }
                  : { x: { duration: 0.25, ease: 'easeOut' } }
              }
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center rounded-l-lg shadow-lg ${item.shadowColor} cursor-pointer overflow-hidden`}
            >
              <div className={`flex items-center ${item.color} py-2.5 pl-3 pr-3 rounded-l-lg`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  initial={false}
                  animate={{
                    width: isHovered ? 'auto' : 0,
                    opacity: isHovered ? 1 : 0,
                    marginLeft: isHovered ? 10 : 0,
                  }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden whitespace-nowrap font-body text-sm font-medium"
                >
                  {item.label}
                </motion.span>
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
                {inner}
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={onSimulatorClick}
              aria-label={item.label}
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {items.map((item, index) => {
          const inner = (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg ${item.color} transition-all duration-300`}
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
                {inner}
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={onSimulatorClick}
              aria-label={item.label}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default FloatingActionButtons;
