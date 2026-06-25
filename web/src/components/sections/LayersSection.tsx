import { layers } from "../../content/site";
import "./LayersSection.css";

export function LayersSection() {
  return (
    <section id="capas" className="page-section layers">
      <div className="page-section__inner">
        <span className="section-label">{layers.label}</span>
        <h2 className="section-title">{layers.title}</h2>
        <p className="section-lead">{layers.lead}</p>
        <div className="layers__grid">
          {layers.items.map((layer) => (
            <article key={layer.id} id={layer.id} className="layer-card">
              <span className="layer-card__tag">{layer.tag}</span>
              <h3 className="layer-card__title">{layer.title}</h3>
              <p className="layer-card__body">{layer.body}</p>
              <ul className="layer-card__list">
                {layer.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="layers__bridge">
          Puente entre capas:{" "}
          <code className="inline-code">is_verified(address)</code> en{" "}
          <code className="inline-code">kyc_verifier</code>
        </p>
      </div>
    </section>
  );
}
