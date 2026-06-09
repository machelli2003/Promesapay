import { Link } from "react-router-dom";
import { FiCoffee, FiHeart, FiArrowRight } from "react-icons/fi";
import Hero from "../components/landing/Hero";
import CircularShowcase from "../components/landing/CircularShowcase";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import CTASection from "../components/landing/CTASection";
import AppButton from "../components/ui/AppButton";

export default function Landing() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <CircularShowcase />

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