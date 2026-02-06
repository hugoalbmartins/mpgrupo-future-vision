import { motion } from "framer-motion";
import { Phone, Zap, Sun, Award, TrendingUp, Shield } from "lucide-react";

const services = [
  {
    icon: Phone,
    title: "Telecomunicações",
    description: "Representamos os principais operadores nacionais. Soluções móveis, internet e TV para particulares e empresas.",
    stat: "20+ anos",
    statLabel: "de experiência",
  },
  {
    icon: Zap,
    title: "Energia",
    description: "Otimize os seus custos energéticos. Comparamos tarifas e encontramos a melhor solução para o seu perfil de consumo.",
    stat: "30%",
    statLabel: "poupança média",
  },
  {
    icon: Sun,
    title: "Energia Solar",
    description: "Soluções fotovoltaicas personalizadas para residências e empresas. Reduza a fatura e aumente o valor do seu imóvel.",
    stat: "até 25 anos",
    statLabel: "de garantia",
  },
];

const achievements = [
  { icon: Award, value: "20+", label: "Anos no Mercado" },
  { icon: TrendingUp, value: "1M+", label: "Clientes Satisfeitos" },
  { icon: Shield, value: "100%", label: "Compromisso" },
];

const ServicesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <section id="services" className="py-24 lg:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-chocolate-light" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gold/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-24"
        >
          <span className="inline-block text-sm font-body tracking-widest uppercase text-gold mb-4">
            Os Nossos Serviços
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Soluções</span>{" "}
            <span className="gold-text font-medium">Integradas</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-2xl mx-auto">
            Mais de duas décadas a construir parcerias de sucesso 
            com os principais operadores do mercado português.
          </p>
        </motion.div>

        {/* Services Grid - Glassmorphism */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-24"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="glass-card h-full p-8 transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-6 group-hover:from-gold/30 group-hover:to-gold/10 transition-all duration-300">
                  <service.icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl text-foreground mb-3 group-hover:text-gold transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="font-body text-cream-muted leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Stat */}
                <div className="pt-6 border-t border-border">
                  <p className="font-display text-3xl gold-text font-medium">{service.stat}</p>
                  <p className="font-body text-sm text-cream-muted">{service.statLabel}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-card p-8 lg:p-12"
        >
          <div className="grid grid-cols-3 gap-8">
            {achievements.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 mb-4">
                  <item.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                </div>
                <p className="font-display text-3xl lg:text-4xl gold-text font-medium mb-1">
                  {item.value}
                </p>
                <p className="font-body text-sm text-cream-muted">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
