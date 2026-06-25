import { platform } from "../../content/site";
import "./PlatformSection.css";

export function PlatformSection() {
  return (
    <section id="plataforma" className="page-section platform">
      <div className="page-section__inner">
        <span className="section-label">{platform.label}</span>
        <h2 className="section-title">{platform.title}</h2>
        <p className="section-lead">{platform.lead}</p>
        <div className="platform__kinds" aria-label="Tipos de publicación">
          {platform.postKinds.map((kind) => (
            <span key={kind} className="platform__kind">
              {kind}
            </span>
          ))}
        </div>
        <div className="platform__grid">
          {platform.features.map((feature) => (
            <article key={feature.title} className="platform-card">
              <h3 className="platform-card__title">{feature.title}</h3>
              <p className="platform-card__body">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
