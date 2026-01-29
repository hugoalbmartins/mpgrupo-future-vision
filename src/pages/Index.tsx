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
import FloatingSocialButtons from "@/components/FloatingSocialButtons";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ServicesSection />
      <PhilosophySection />
      <AboutSection />
      <CareersSection />
      <PartnershipsSection />
      <ContactSection />
      <ContactForm />
      <Footer />
      <FloatingSocialButtons />
    </div>
  );
};

export default Index;
