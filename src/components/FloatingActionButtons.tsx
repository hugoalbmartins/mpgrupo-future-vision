import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Linkedin, Facebook, Phone, X, ChevronLeft } from 'lucide-react';

interface FloatingActionButtonsProps {
  onSimulatorClick: () => void;
}

const FloatingActionButtons = ({ onSimulatorClick }: FloatingActionButtonsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const socialLinks = [
    {
      icon: Linkedin,
      href: 'https://www.linkedin.com/company/mp-grupo',
      label: 'LinkedIn',
      color: 'from-[#0077B5] to-[#00A0DC]'
    },
    {
      icon: Facebook,
      href: 'https://www.facebook.com/academiadeformacaoempreendedores',
      label: 'Facebook',
      color: 'from-[#1877F2] to-[#4267B2]'
    },
    {
      icon: Phone,
      href: 'https://wa.me/351928203793?text=Olá%2C%20gostaria%20de%20mais%20informações',
      label: 'WhatsApp',
      color: 'from-[#25D366] to-[#128C7E]'
    }
  ];

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2 pr-2"
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSimulatorClick}
              className="group relative bg-gradient-to-r from-gold to-gold-light text-primary-foreground px-4 py-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
            >
              <Calculator className="w-5 h-5 flex-shrink-0" />
              <span className="font-body font-medium text-sm whitespace-nowrap">
                Simulador
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>
            </motion.button>

            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative bg-gradient-to-r ${social.color} text-white p-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all`}
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-background/95 text-foreground px-3 py-1 rounded-lg text-sm font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-border">
                  {social.label}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative bg-gradient-to-br from-chocolate-medium to-chocolate-dark text-gold border-2 border-gold/30 p-3 rounded-l-xl shadow-2xl hover:shadow-gold/20 transition-all ${
          isExpanded ? 'mt-2' : ''
        }`}
        aria-label={isExpanded ? 'Fechar menu' : 'Abrir menu'}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-6 h-6 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default FloatingActionButtons;
