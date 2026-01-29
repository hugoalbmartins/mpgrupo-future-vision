import { motion } from "framer-motion";
import { Linkedin, Instagram, Facebook } from "lucide-react";

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
          whileHover={{ scale: 1.1, x: -5 }}
          className="w-12 h-12 rounded-full bg-chocolate/90 backdrop-blur-sm border border-gold/20 flex items-center justify-center text-gold hover:bg-gold hover:text-primary-foreground transition-all duration-300 shadow-lg"
          aria-label={social.label}
        >
          <social.icon className="w-5 h-5" strokeWidth={1.5} />
        </motion.a>
      ))}
    </motion.div>
  );
};

export default FloatingSocialButtons;
