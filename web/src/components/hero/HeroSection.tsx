import { hero } from "../../content/site";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { HeroBackground } from "./HeroBackground";
import "./HeroSection.css";

const MARQUEE_ITEMS = [...hero.stackItems, ...hero.stackItems];

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HeroBackground />
      <div className="hero__content">
        <Badge>{hero.badge}</Badge>
        <h1 id="hero-title" className="hero__title">
          {hero.title}
          <span className="hero__accent">{hero.accent}</span>
        </h1>
        <p className="hero__lead">{hero.lead}</p>
        <div className="hero__actions">
          <Button variant="primary" disabled title="Próximamente — flujo KYC con @behuman/sdk">
            Comenzar verificación
          </Button>
          <Button
            variant="secondary"
            onClick={() => document.getElementById("como-funciona")?.scrollIntoView()}
          >
            Ver flujo KYC
          </Button>
        </div>
        <p className="hero__chains">{hero.stackLabel}</p>
        <div className="hero__marquee" aria-hidden="true">
          <div className="hero__marquee-track">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
