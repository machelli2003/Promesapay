import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import CampaignShowcase from "../components/landing/CampaignShowcase";
import DualMode from "../components/landing/DualMode";
import TrustSection from "../components/landing/TrustSection";
import Testimonials from "../components/landing/Testimonials";
import CTASection from "../components/landing/CTASection";

export default function Landing() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <HowItWorks />
      <CampaignShowcase />
      <DualMode />
      <TrustSection />
      <Testimonials />
      <CTASection />
    </div>
  );
}