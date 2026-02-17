import { motion } from "framer-motion";
import { ChevronDown, Zap } from "lucide-react";
import heroImage from "@/assets/hero-city.jpg";

interface HeroProps {
  onSimulatorClick: () => void;
}

const Hero = ({ onSimulatorClick }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <motion.img
          src={heroImage}
          alt="Futuristic smart city"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/40" />
      </div>

      {/* Animated Gold Light Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-gold/30 to-transparent rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse-gold" />
            <span className="text-sm font-body text-cream-muted tracking-widest uppercase">
              Desde 2004
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] sm:leading-[0.9] mb-6"
          >
            <span className="text-foreground">MPgrupo:</span>
            <br />
            <span className="gold-text font-medium">+ de 20 Anos</span>
            <br />
            <span className="text-foreground">a Ligar o Futuro</span>
          </motion.h1>

          {/* Motto */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-2xl md:text-3xl text-cream-muted italic mb-12"
          >
            "Juntos somos mais fortes"
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              onClick={onSimulatorClick}
              animate={{
                scale: [1, 1.07, 1, 1.07, 1, 1, 1, 1, 1, 1],
                boxShadow: [
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 32px 10px rgba(251,191,36,0.9), 0 0 70px 20px rgba(251,191,36,0.4)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 32px 10px rgba(251,191,36,0.9), 0 0 70px 20px rgba(251,191,36,0.4)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                  "0 0 16px 4px rgba(251,191,36,0.5), 0 0 40px 8px rgba(251,191,36,0.2)",
                ],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.96 }}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gold text-primary-foreground font-body font-semibold rounded-lg transition-colors duration-200 hover:bg-gold-light relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 rounded-lg"
                animate={{
                  background: [
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
                  ],
                }}
                transition={{ duration: 1.75, repeat: Infinity }}
              />
              <Zap className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Simule aqui a sua poupança!</span>
              <motion.span
                className="inline-block relative z-10"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
            <a
              href="#services"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 glass-card font-body font-medium text-foreground rounded-lg transition-all duration-300 hover:bg-white/10"
            >
              Descobrir Serviços
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-cream-muted"
        >
          <span className="text-xs font-body tracking-widest uppercase">Explorar</span>
          <ChevronDown className="w-5 h-5 text-gold" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
