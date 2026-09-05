import { HeroSection } from "@/components/home/HeroSection";

export default function HomePage() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative z-10">
        <HeroSection />
      </div>
    </div>
  );
}