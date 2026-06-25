import { curation } from "../../content/site";
import "./CurationSection.css";

export function CurationSection() {
  return (
    <section id="curacion" className="page-section curation">
      <div className="page-section__inner">
        <span className="section-label">{curation.label}</span>
        <h2 className="section-title">{curation.title}</h2>
        <p className="section-lead">{curation.lead}</p>
        <div className="curation__grid">
          {curation.levels.map((level, index) => (
            <article key={level.title} className="curation-card">
              <span className="curation-card__level">Nivel {index + 1}</span>
              <h3 className="curation-card__title">{level.title}</h3>
              <p className="curation-card__body">{level.body}</p>
            </article>
          ))}
        </div>
        <blockquote className="curation__quote">
          <p>{curation.principle}</p>
        </blockquote>
      </div>
    </section>
  );
}
