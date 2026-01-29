import { motion } from "framer-motion";
import { Users, Target, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 lg:py-32 relative">
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
            Sobre Nós
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Quem</span>{" "}
            <span className="gold-text font-medium">Somos</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card p-8 lg:p-12">
            <div className="space-y-6 mb-12">
              <p className="font-body text-lg text-cream-muted leading-relaxed">
                Com mais de 20 anos de experiência no mercado português, o MPgrupo é uma referência em soluções integradas de telecomunicações, energia e energia solar. A nossa missão é simples: ajudar clientes finais a encontrar as melhores soluções para as suas necessidades.
              </p>
              <p className="font-body text-lg text-cream-muted leading-relaxed">
                Estamos disponíveis para apoiar particulares e empresas na otimização dos seus serviços, com um compromisso total de transparência e excelência. Acreditamos em parcerias duradouras e valorizamos cada oportunidade de crescimento conjunto.
              </p>
              <p className="font-body text-lg text-cream-muted leading-relaxed">
                Estamos sempre abertos a novas parcerias comerciais e oportunidades de carreira com potencial de crescimento. Se procura uma equipa experiente e comprometida, está no lugar certo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-border">
              {[
                { icon: Users, title: "Cliente no Centro", desc: "Soluções personalizadas para cada perfil" },
                { icon: Target, title: "Foco em Resultados", desc: "Compromisso com a sua satisfação" },
                { icon: Heart, title: "Relações Duradouras", desc: "Parcerias construídas com confiança" },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gold/10 mb-4">
                    <item.icon className="w-7 h-7 text-gold" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="font-body text-sm text-cream-muted">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
