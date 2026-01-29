import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook, MessageCircle } from "lucide-react";

const socialLinks = [
  {
    icon: MessageCircle,
    href: "https://wa.me/351928203793?text=Olá%2C%20gostaria%20de%20mais%20informações",
    label: "WhatsApp",
    isWhatsApp: true
  },
  { icon: Linkedin, href: "https://www.linkedin.com/company/mp-grupo", label: "LinkedIn", isWhatsApp: false },
  { icon: Instagram, href: "#", label: "Instagram", isWhatsApp: false },
  { icon: Facebook, href: "https://www.facebook.com/academiadeformacaoempreendedores", label: "Facebook", isWhatsApp: false },
];

const FloatingSocialButtons = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
    >
      {socialLinks.map((social, index) => (
        <motion.a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
          whileHover={{ scale: 1.1, x: -5 }}
          className={`w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 shadow-lg ${
            social.isWhatsApp
              ? "bg-[#25D366]/90 border-[#25D366]/30 text-white hover:bg-[#25D366]"
              : "bg-chocolate/90 border-gold/20 text-gold hover:bg-gold hover:text-primary-foreground"
          }`}
          aria-label={social.label}
        >
          <social.icon className="w-5 h-5" strokeWidth={1.5} />
        </motion.a>
      ))}
    </motion.div>
  );
};

export default FloatingSocialButtons;
