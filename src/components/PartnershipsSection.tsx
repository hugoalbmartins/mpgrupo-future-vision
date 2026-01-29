import { motion } from "framer-motion";
import { Handshake, TrendingUp, Award, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Handshake,
    title: "Operadoras Premium",
    description: "Trabalhamos com as principais operadoras do mercado português em telecomunicações, energia e solar.",
  },
  {
    icon: TrendingUp,
    title: "Comissões Superiores",
    description: "Oferecemos estruturas de comissões acima da média do mercado, com transparência total.",
  },
  {
    icon: HeadphonesIcon,
    title: "Apoio Total",
    description: "Suporte completo pré e pós-venda. A nossa equipa está sempre disponível para os nossos parceiros.",
  },
  {
    icon: Award,
    title: "Experiência Consolidada",
    description: "Mais de 20 anos de experiência no mercado garantem credibilidade e resultados.",
  },
];

const PartnershipsSection = () => {
  return (
    <section id="partnerships" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="absolute top-20 left-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-body tracking-widest uppercase text-gold mb-4">
            Parcerias
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Crescer</span>{" "}
            <span className="gold-text font-medium">Juntos</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-2xl mx-auto">
            Estabeleça uma parceria comercial sólida com condições competitivas e apoio de excelência.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 lg:p-12 mb-12"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-body text-cream-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-card p-8 lg:p-12"
          >
            <div className="text-center">
              <h3 className="font-display text-2xl text-foreground mb-4">
                Vamos Trabalhar Juntos?
              </h3>
              <p className="font-body text-cream-muted mb-6">
                Procuramos parceiros comerciais que valorizem a excelência e o compromisso. Oferecemos comissões competitivas, apoio contínuo e anos de experiência ao seu dispor.
              </p>
              <a
                href="#contact"
                className="inline-block px-8 py-3 bg-gold text-primary-foreground font-body font-medium rounded-lg hover:bg-gold-light transition-all duration-300"
              >
                Iniciar Parceria
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnershipsSection;
