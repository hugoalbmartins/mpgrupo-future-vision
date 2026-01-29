import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SolarSection from "@/components/SolarSection";
import ServicesSection from "@/components/ServicesSection";
import PhilosophySection from "@/components/PhilosophySection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SolarSection />
      <ServicesSection />
      <PhilosophySection />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;
