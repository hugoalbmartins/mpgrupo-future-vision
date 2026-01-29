import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

const PhilosophySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={sectionRef}
      className="py-32 lg:py-48 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-chocolate-light via-background to-chocolate-medium" />
      
      {/* Animated Gold Lines */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gold/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/10 pointer-events-none" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 container mx-auto px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Quote Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-12"
          >
            <Quote className="w-10 h-10 text-gold" strokeWidth={1} />
          </motion.div>

          {/* Quote Text */}
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="font-display text-3xl md:text-4xl lg:text-5xl font-light leading-relaxed text-foreground mb-8">
              <span className="gold-text">"</span>
              Sozinhos vamos mais rápido,
              <br />
              <span className="gold-text font-medium">mas juntos vamos mais longe</span>
              <span className="gold-text">"</span>
            </p>
          </motion.blockquote>

          {/* Attribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="w-12 h-px bg-gold/50" />
            <p className="font-body text-sm tracking-widest uppercase text-cream-muted">
              A Nossa Filosofia
            </p>
            <div className="w-12 h-px bg-gold/50" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-body text-lg text-cream-muted mt-12 max-w-2xl mx-auto"
          >
            Esta crença guia cada parceria que construímos. 
            O sucesso partilhado é o único sucesso verdadeiro.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
};

export default PhilosophySection;
