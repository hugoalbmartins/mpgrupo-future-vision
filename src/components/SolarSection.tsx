import { motion } from "framer-motion";
import { Sun, Home, Building2, Sparkles, ArrowRight } from "lucide-react";
import solarVilla from "@/assets/solar-villa.jpg";

const solarCards = [
  {
    icon: Home,
    title: "Residencial",
    description: "Soluções personalizadas para a sua casa. Reduza a fatura de energia e aumente o valor do seu imóvel.",
    features: ["Análise gratuita", "Instalação profissional", "Garantia 25 anos"],
  },
  {
    icon: Building2,
    title: "Empresarial",
    description: "Maximize o retorno do investimento. Soluções escaláveis para qualquer dimensão de negócio.",
    features: ["ROI calculado", "Manutenção incluída", "Monitorização 24/7"],
  },
];

const SolarSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <section id="solar" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-chocolate-medium to-background" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Sun className="w-6 h-6 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-body tracking-widest uppercase text-cream-muted">
              Energia Solar
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Propostas</span>{" "}
            <span className="gold-text font-medium">à Medida</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-2xl mx-auto">
            Investir em energia solar nunca foi tão acessível. 
            Desenvolvemos soluções personalizadas para cada cliente.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={solarVilla}
                alt="Modern villa with solar panels"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-6 left-6 right-6 glass-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-cream-muted mb-1">Poupança média anual</p>
                    <p className="font-display text-3xl gold-text font-medium">€1,200+</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div>
                    <p className="font-body text-sm text-cream-muted mb-1">Retorno investimento</p>
                    <p className="font-display text-3xl text-foreground font-medium">5-7 anos</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative Element */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border border-gold/30 rounded-2xl -z-10" />
          </motion.div>

          {/* Cards Side */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            {solarCards.map((card, index) => (
              <motion.div
                key={card.title}
                variants={itemVariants}
                className="group card-3d"
              >
                <div className="glass-card p-8 transition-all duration-500 group-hover:border-gold/30">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors duration-300">
                      <card.icon className="w-7 h-7 text-gold" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-2xl text-foreground mb-3 group-hover:text-gold transition-colors duration-300">
                        {card.title}
                      </h3>
                      <p className="font-body text-cream-muted mb-4 leading-relaxed">
                        {card.description}
                      </p>
                      <ul className="space-y-2">
                        {card.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 font-body text-sm text-cream-muted">
                            <Sparkles className="w-4 h-4 text-gold" strokeWidth={1.5} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Hover Arrow */}
                  <motion.div
                    className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ x: 4 }}
                  >
                    <ArrowRight className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolarSection;
