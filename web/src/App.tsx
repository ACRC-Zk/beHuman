import { CompareSection } from "./components/sections/CompareSection";
import { CurationSection } from "./components/sections/CurationSection";
import { HowItWorksSection } from "./components/sections/HowItWorksSection";
import { LayersSection } from "./components/sections/LayersSection";
import { PlatformSection } from "./components/sections/PlatformSection";
import { StatsSection } from "./components/sections/StatsSection";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteNav } from "./components/layout/SiteNav";
import { HeroSection } from "./components/hero/HeroSection";

function App() {
  return (
    <>
      <SiteNav />
      <main>
        <HeroSection />
        <LayersSection />
        <HowItWorksSection />
        <PlatformSection />
        <CurationSection />
        <StatsSection />
        <CompareSection />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
