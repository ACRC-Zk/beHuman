import { compare } from "../../content/site";
import "./CompareSection.css";

export function CompareSection() {
  return (
    <section id="compare" className="page-section compare">
      <div className="page-section__inner">
        <span className="section-label">{compare.label}</span>
        <h2 className="section-title">{compare.title}</h2>
        <p className="section-lead">{compare.lead}</p>
        <div className="compare__table" role="table">
          <div className="compare__row compare__row--head" role="row">
            <div className="compare__cell" role="columnheader">
              Aspecto
            </div>
            <div className="compare__cell" role="columnheader">
              Modelo tradicional
            </div>
            <div className="compare__cell" role="columnheader">
              beHuman
            </div>
          </div>
          {compare.rows.map((row) => (
            <div key={row.aspect} className="compare__row" role="row">
              <div className="compare__cell compare__cell--aspect" role="cell">
                {row.aspect}
              </div>
              <div className="compare__cell compare__cell--bad" role="cell">
                {row.traditional}
              </div>
              <div className="compare__cell compare__cell--good" role="cell">
                {row.behuman}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
