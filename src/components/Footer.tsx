import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Linkedin, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-20 pb-8">
      {/* Background */}
      <div className="absolute inset-0 bg-chocolate" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-display text-3xl gold-text font-medium mb-4">MPgrupo</h3>
            <p className="font-body text-cream-muted leading-relaxed mb-6">
              20 anos a construir parcerias de sucesso no mercado português.
            </p>
            <div className="flex gap-4">
              {[Linkedin, Instagram, Facebook].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-cream-muted hover:bg-gold hover:text-primary-foreground transition-all duration-300"
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
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

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-display text-lg text-foreground mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="font-body text-cream-muted">
                  Portugal Continental
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold flex-shrink-0" strokeWidth={1.5} />
                <a
                  href="tel:+351912345678"
                  className="font-body text-cream-muted hover:text-gold transition-colors"
                >
                  +351 912 345 678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0" strokeWidth={1.5} />
                <a
                  href="mailto:info@mpgrupo.pt"
                  className="font-body text-cream-muted hover:text-gold transition-colors"
                >
                  info@mpgrupo.pt
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-muted-foreground">
              © {currentYear} MPgrupo. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Política de Privacidade
              </a>
              <a
                href="#"
                className="font-body text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
