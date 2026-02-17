import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import PhilosophySection from "@/components/PhilosophySection";
import AboutSection from "@/components/AboutSection";
import CareersSection from "@/components/CareersSection";
import PartnershipsSection from "@/components/PartnershipsSection";
import ContactSection from "@/components/ContactSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import SimulatorCTA from "@/components/SimulatorCTA";
import EnergySimulator from "@/components/EnergySimulator";

const Index = () => {
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <Hero onSimulatorClick={() => setSimulatorOpen(true)} />
      <AboutSection />
      <div className="py-10 flex justify-center">
        <a
          href="#contact-parceria"
          onClick={(e) => {
            e.preventDefault();
            window.history.replaceState(null, '', '#contact-parceria');
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gold text-primary-foreground font-body font-semibold rounded-lg transition-all duration-300 hover:bg-gold-light shadow-lg hover:shadow-gold/30"
        >
          Iniciar Parceria
          <span>→</span>
        </a>
      </div>
      <ServicesSection />
      <SimulatorCTA onClick={() => setSimulatorOpen(true)} />
      <PhilosophySection />
      <SimulatorCTA onClick={() => setSimulatorOpen(true)} variant="compact" />
      <CareersSection />
      <PartnershipsSection />
      <ContactSection />
      <ContactForm />
      <Footer />
      <FloatingActionButtons onSimulatorClick={() => setSimulatorOpen(true)} />
      <CookieConsent />
      <EnergySimulator open={simulatorOpen} onOpenChange={setSimulatorOpen} />
    </div>
  );
};

export default Index;
