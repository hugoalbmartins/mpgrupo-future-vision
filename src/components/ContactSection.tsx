import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Localização",
    content: "Portugal Continental",
    link: null,
  },
  {
    icon: Phone,
    title: "Telefone",
    content: "+351 912 345 678",
    link: "tel:+351912345678",
  },
  {
    icon: Mail,
    title: "Email",
    content: "info@mpgrupo.pt",
    link: "mailto:info@mpgrupo.pt",
  },
  {
    icon: Clock,
    title: "Horário",
    content: "Seg-Sex: 9h-18h",
    link: null,
  },
];

const ContactSection = () => {
  return (
    <section id="contacts" className="py-24 lg:py-32 relative">
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
            Contactos
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Entre em</span>{" "}
            <span className="gold-text font-medium">Contacto</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-2xl mx-auto">
            Estamos disponíveis para ajudar. Entre em contacto através de qualquer um dos canais abaixo.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                className="glass-card p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <info.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground mb-2">
                      {info.title}
                    </h3>
                    {info.link ? (
                      <a
                        href={info.link}
                        className="font-body text-cream-muted hover:text-gold transition-colors"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="font-body text-cream-muted">{info.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
