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
      <ServicesSection />
      <SimulatorCTA onClick={() => setSimulatorOpen(true)} />
      <PhilosophySection />
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
