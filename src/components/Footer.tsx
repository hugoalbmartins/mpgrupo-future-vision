import { motion } from "framer-motion";
import { useState } from "react";
import PrivacyPolicyDialog from "./PrivacyPolicyDialog";
import TermsDialog from "./TermsDialog";
import CookiePolicyDialog from "./CookiePolicyDialog";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);

  return (
    <>
      <footer className="relative pt-20 pb-8">
        {/* Background */}
        <div className="absolute inset-0 bg-chocolate" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="relative z-10 container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-display text-3xl gold-text font-medium mb-4">MPgrupo</h3>
              <p className="font-body text-cream-muted leading-relaxed">
                20 anos a construir parcerias de sucesso no mercado português.
              </p>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="font-display text-lg text-foreground mb-6">Serviços</h4>
              <ul className="space-y-3">
                {["Energia Solar", "Telecomunicações", "Energia Geral"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#services"
                        className="font-body text-cream-muted hover:text-gold transition-colors duration-300"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </motion.div>

            {/* Company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-display text-lg text-foreground mb-6">Empresa</h4>
              <ul className="space-y-3">
                {[
                  { name: "Sobre Nós", href: "#about" },
                  { name: "Carreiras", href: "#careers" },
                  { name: "Parcerias", href: "#partnerships" },
                  { name: "Contactos", href: "#contacts" },
                ].map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="font-body text-cream-muted hover:text-gold transition-colors duration-300"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="font-body text-sm text-muted-foreground">
                  © {currentYear} MPgrupo. Todos os direitos reservados.
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Site construído por Serv2all
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                <button
                  onClick={() => setPrivacyOpen(true)}
                  className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Política de Privacidade
                </button>
                <button
                  onClick={() => setTermsOpen(true)}
                  className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Termos de Uso
                </button>
                <button
                  onClick={() => setCookiesOpen(true)}
                  className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Política de Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <PrivacyPolicyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
      <CookiePolicyDialog open={cookiesOpen} onOpenChange={setCookiesOpen} />
    </>
  );
};

export default Footer;
