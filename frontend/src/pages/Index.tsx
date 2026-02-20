import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyVoxSection from "@/components/landing/WhyVoxSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Index() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyVoxSection />
      </main>
      <LandingFooter />
    </div>
  );
}
