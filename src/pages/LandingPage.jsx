import { useCallback, useEffect, useRef } from "react";

import BrushBackground from "@/components/landing/BrushBackground";
import ScrollProgress from "@/components/landing/ScrollProgress";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import PainPointSection from "@/components/landing/PainPointSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import NanaChatDemo from "@/components/landing/NanaChatDemo";
import GamificationSection from "@/components/landing/GamificationSection";
import VideoSection from "@/components/landing/VideoSection";
import TestimonialSection from "@/components/landing/TestimonialSection";
import FaqSection from "@/components/landing/FaqSection";
import PricingSection from "@/components/landing/PricingSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const pricingRef = useRef(null);
  const howRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const scrollToNewsletter = useCallback(() => {
    document.getElementById("newsletter-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-x-hidden">
      <BrushBackground />
      <style>{`
        .g-text { background: linear-gradient(135deg,#F97316 0%,#FFB347 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glow { box-shadow: 0 0 40px rgba(255,106,0,0.28); }
        .card-d { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .iphone-frame { background:#111; border-radius:44px; border:3px solid #333; position:relative; padding:14px; box-shadow:0 30px 80px rgba(0,0,0,0.7),inset 0 0 0 1px #222; }
        .iphone-notch { width:90px; height:22px; background:#111; border-radius:0 0 14px 14px; margin:0 auto -8px; position:relative; z-index:1; }
      `}</style>

      <ScrollProgress />

      <LandingNav howRef={howRef} pricingRef={pricingRef} />

      <HeroSection onScrollToNewsletter={scrollToNewsletter} />
      <PainPointSection />
      <FeaturesSection ref={howRef} />
      <NanaChatDemo />
      <GamificationSection />
      <VideoSection />
      <TestimonialSection />
      <FaqSection />
      <PricingSection ref={pricingRef} />
      <NewsletterSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}