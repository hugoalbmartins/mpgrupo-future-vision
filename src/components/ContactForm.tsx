import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Send, User, Phone, Mail, MessageSquare, CheckCircle2, Upload, X, FileText } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const SUBJECT_VALUES = [
  "Parceria",
  "Candidatura Espontânea",
  "Análise da minha fatura (Energias ou telecomunicações)",
] as const;

type SubjectValue = typeof SUBJECT_VALUES[number];

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos").max(20),
  subject: z.enum(SUBJECT_VALUES),
  message: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof formSchema>;

const subjects: { value: SubjectValue; label: string; icon: string; hashKey: string }[] = [
  { value: "Parceria", label: "Parceria Comercial", icon: "\u{1F91D}", hashKey: "parceria" },
  { value: "Candidatura Espontânea", label: "Candidatura Espontânea", icon: "\u{1F4BC}", hashKey: "candidatura" },
  { value: "Análise da minha fatura (Energias ou telecomunicações)", label: "Análise da Minha Fatura (Energias ou telecomunicações)", icon: "\u{1F4CA}", hashKey: "fatura" },
];

interface ContactFormProps {
  simulationData?: {
    operadora_atual: string;
    operadora_interesse?: string;
    potencia: number;
    poupanca_estimada?: number;
    dados_completos: unknown;
  };
}

const ContactForm = ({ simulationData }: ContactFormProps = {}) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const hasAutoAdvanced = useRef(false);
  const [formData, setFormData] = useState<Partial<FormData>>({
    name: "",
    email: "",
    phone: "",
    subject: simulationData ? "Análise da minha fatura (Energias ou telecomunicações)" : undefined,
    message: simulationData
      ? `Gostaria de saber mais sobre a mudança para ${simulationData.operadora_interesse || 'uma nova operadora'}.`
      : "",
  });

  const totalSteps = 3;

  useEffect(() => {
    if (hasAutoAdvanced.current) return;

    const hash = window.location.hash;
    const matched = subjects.find((s) => hash === `#contact-${s.hashKey}`);
    if (matched) {
      setFormData((prev) => ({ ...prev, subject: matched.value }));
      setStep(2);
      hasAutoAdvanced.current = true;
    }

    const handleHashChange = () => {
      if (hasAutoAdvanced.current) return;
      const newHash = window.location.hash;
      const m = subjects.find((s) => newHash === `#contact-${s.hashKey}`);
      if (m) {
        setFormData((prev) => ({ ...prev, subject: m.value }));
        setStep(2);
        hasAutoAdvanced.current = true;
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

      if (file.size > maxSize) {
        setFileError("O arquivo deve ter no máximo 5MB");
        setUploadedFile(null);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setFileError("Apenas PDF e imagens (JPG, PNG) são permitidos");
        setUploadedFile(null);
        return;
      }

      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileError("");
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.subject) {
        newErrors.subject = "Selecione um assunto";
      }
    }

    if (currentStep === 2) {
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = "Nome é obrigatório";
      }
      if (!formData.email || !z.string().email().safeParse(formData.email).success) {
        newErrors.email = "Email válido é obrigatório";
      }
      if (!formData.phone || formData.phone.length < 9) {
        newErrors.phone = "Telefone é obrigatório";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step) && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    try {
      let fileData = null;
      if (uploadedFile) {
        const base64 = await convertFileToBase64(uploadedFile);
        fileData = {
          filename: uploadedFile.name,
          content: base64.split(',')[1],
          contentType: uploadedFile.type,
        };
      }

      const { error: dbError } = await supabase.from('pedidos_contacto').insert({
        nome: formData.name,
        email: formData.email,
        telefone: formData.phone,
        operadora_atual: simulationData?.operadora_atual,
        operadora_interesse: simulationData?.operadora_interesse,
        potencia: simulationData?.potencia,
        poupanca_estimada: simulationData?.poupanca_estimada,
        dados_simulacao: simulationData?.dados_completos || null,
        mensagem: `Assunto: ${formData.subject}\n\n${formData.message || ''}`,
        origem: simulationData ? 'simulador' : 'web',
        estado: 'novo',
        anexo_nome: uploadedFile?.name || null,
      });

      if (dbError) throw dbError;

      const emailData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message || '',
        attachment: fileData,
        simulationData: simulationData ? {
          operadora_atual: simulationData.operadora_atual,
          operadora_interesse: simulationData.operadora_interesse,
          potencia: simulationData.potencia,
          poupanca_estimada: simulationData.poupanca_estimada,
        } : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(emailData),
        }
      );

      if (!response.ok) {
        console.error('Email sending failed:', await response.text());
      }

      setIsSubmitted(true);
      toast.success('Pedido de contacto enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar contacto:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const selectedSubjectLabel = subjects.find((s) => s.value === formData.subject)?.label;

  if (isSubmitted) {
    return (
      <section id="contact" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-chocolate-medium via-background to-chocolate-light" />
        <div className="relative z-10 container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center glass-card p-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-gold" />
            </motion.div>
            <h3 className="font-display text-3xl text-foreground mb-4">Mensagem Enviada!</h3>
            <p className="font-body text-cream-muted">
              Obrigado pelo seu contacto. A nossa equipa irá responder em breve.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-chocolate-medium via-background to-chocolate-light" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-body tracking-widest uppercase text-gold mb-4">
            Contacte-nos
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="text-foreground">Vamos</span>{" "}
            <span className="gold-text font-medium">Conversar</span>
          </h2>
          <p className="font-body text-lg text-cream-muted max-w-xl mx-auto">
            Estamos prontos para construir o futuro consigo.
            Preencha o formulário e entraremos em contacto.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 lg:p-12"
          >
            <div className="mb-10">
              <div className="flex justify-between mb-3">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-body text-sm transition-all duration-300 ${
                      s === step
                        ? "bg-gold text-primary-foreground"
                        : s < step
                        ? "bg-gold/30 text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s < step ? "\u2713" : s}
                  </div>
                ))}
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gold"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="min-h-[280px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="font-display text-2xl text-foreground mb-6">
                      Como podemos ajudar?
                    </h3>

                    <div className="grid gap-4">
                      {subjects.map((subject) => (
                        <button
                          key={subject.value}
                          type="button"
                          onClick={() => updateField("subject", subject.value)}
                          className={`w-full p-5 rounded-xl border text-left transition-all duration-300 ${
                            formData.subject === subject.value
                              ? "border-gold bg-gold/10"
                              : "border-border bg-muted hover:border-gold/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{subject.icon}</span>
                            <span className="font-body text-foreground">{subject.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.subject && (
                      <p className="text-destructive text-sm">{errors.subject}</p>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {selectedSubjectLabel && (
                      <div className="px-4 py-2.5 bg-gold/10 border border-gold/30 rounded-lg">
                        <p className="font-body text-sm text-gold font-medium">
                          {selectedSubjectLabel}
                        </p>
                      </div>
                    )}

                    <h3 className="font-display text-2xl text-foreground mb-6">
                      Informações de Contacto
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                          <User className="w-4 h-4 text-gold" strokeWidth={1.5} />
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          className={`w-full px-4 py-3 bg-muted border rounded-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                            errors.name ? "border-destructive" : "border-border"
                          }`}
                          placeholder="O seu nome"
                        />
                        {errors.name && (
                          <p className="text-destructive text-sm mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                          <Mail className="w-4 h-4 text-gold" strokeWidth={1.5} />
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={`w-full px-4 py-3 bg-muted border rounded-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                            errors.email ? "border-destructive" : "border-border"
                          }`}
                          placeholder="seu@email.com"
                        />
                        {errors.email && (
                          <p className="text-destructive text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                          <Phone className="w-4 h-4 text-gold" strokeWidth={1.5} />
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className={`w-full px-4 py-3 bg-muted border rounded-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                            errors.phone ? "border-destructive" : "border-border"
                          }`}
                          placeholder="+351 912 345 678"
                        />
                        {errors.phone && (
                          <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {selectedSubjectLabel && (
                      <div className="px-4 py-2.5 bg-gold/10 border border-gold/30 rounded-lg">
                        <p className="font-body text-sm text-gold font-medium">
                          {selectedSubjectLabel}
                        </p>
                      </div>
                    )}

                    <h3 className="font-display text-2xl text-foreground mb-6">
                      Mensagem Adicional
                    </h3>

                    <div>
                      <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                        <MessageSquare className="w-4 h-4 text-gold" strokeWidth={1.5} />
                        Conte-nos mais (opcional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
                        placeholder="Descreva brevemente o que procura..."
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 font-body text-sm text-cream-muted mb-2">
                        <Upload className="w-4 h-4 text-gold" strokeWidth={1.5} />
                        Anexar Fatura (opcional)
                      </label>

                      {!uploadedFile ? (
                        <label className="block w-full cursor-pointer">
                          <div className="w-full px-4 py-6 bg-muted border-2 border-dashed border-border rounded-lg hover:border-gold/50 transition-all">
                            <div className="flex flex-col items-center gap-2 text-center">
                              <Upload className="w-8 h-8 text-gold" />
                              <p className="font-body text-sm text-foreground">
                                Clique para selecionar um arquivo
                              </p>
                              <p className="font-body text-xs text-cream-muted">
                                PDF, JPG ou PNG (max. 5MB)
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="w-full px-4 py-4 bg-muted border border-gold/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-6 h-6 text-gold" />
                              <div>
                                <p className="font-body text-sm text-foreground font-medium">
                                  {uploadedFile.name}
                                </p>
                                <p className="font-body text-xs text-cream-muted">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-all"
                            >
                              <X className="w-5 h-5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      )}

                      {fileError && (
                        <p className="text-destructive text-sm mt-2">{fileError}</p>
                      )}
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="font-body text-sm text-cream-muted mb-2">Resumo:</p>
                      <p className="font-body text-foreground">
                        <strong>{formData.name}</strong> · {formData.email}
                      </p>
                      <p className="font-body text-gold text-sm mt-1">{formData.subject}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body transition-all ${
                  step === 1
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-foreground hover:text-gold"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium transition-all hover:bg-gold-light"
                >
                  Seguinte
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-gold text-primary-foreground rounded-lg font-body font-medium transition-all hover:bg-gold-light gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export type { ContactFormProps };
export default ContactForm;
