import { Link } from "react-router-dom";
import { Coffee, Heart, ArrowRight } from "lucide-react";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import CTASection from "../components/landing/CTASection";
import AppButton from "../components/ui/AppButton";

export default function Landing() {
  return (
    <div className="animate-fade-in">
      <Hero />

      {/* How it Works Section - Moved up for better flow */}
      <HowItWorks />

      {/* Features Section */}
      <Features />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}