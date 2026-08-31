import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="relative z-10">
        <HeroSection />
        <Footer />
      </div>
    </div>
  );
}