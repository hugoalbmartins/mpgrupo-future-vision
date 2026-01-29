import { motion } from "framer-motion";
import { TrendingUp, Users, Award, Briefcase } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Progressão de Carreira",
    description: "Oportunidades reais de crescimento com planos de progressão claros e objetivos.",
  },
  {
    icon: Users,
    title: "Gestão de Equipa",
    description: "Possibilidade de gerir a sua própria equipa e construir o seu sucesso.",
  },
  {
    icon: Award,
    title: "Condições Premium",
    description: "Salários e comissões acima da média do mercado com estrutura transparente.",
  },
  {
    icon: Briefcase,
    title: "Ambiente Profissional",
    description: "Equipa experiente, ferramentas modernas e suporte constante.",
  },
];

const CareersSection = () => {
  return (
    <section id="careers" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-chocolate-light" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-body tracking-widest uppercase text-gold mb-4">
            Carreiras
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Junte-se à</span>{" "}
            <span className="gold-text font-medium">Nossa Equipa</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-2xl mx-auto">
            Construa uma carreira sólida com oportunidades de crescimento, condições competitivas e um ambiente de trabalho profissional.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 lg:p-12 mb-12"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="font-body text-cream-muted leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-card p-8 lg:p-12"
          >
            <div className="text-center">
              <h3 className="font-display text-2xl text-foreground mb-4">
                Pronto para Crescer Connosco?
              </h3>
              <p className="font-body text-cream-muted mb-6">
                Valorizamos profissionais ambiciosos que procuram fazer a diferença. Oferecemos ganhos acima da média, possibilidade de gestão de equipa e progressão de carreira.
              </p>
              <a
                href="#contact"
                className="inline-block px-8 py-3 bg-gold text-primary-foreground font-body font-medium rounded-lg hover:bg-gold-light transition-all duration-300"
              >
                Candidate-se Agora
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CareersSection;
