import { stats } from "../../content/site";
import "./StatsSection.css";

export function StatsSection() {
  return (
    <section className="page-section stats" aria-labelledby="stats-title">
      <div className="page-section__inner">
        <span className="section-label">{stats.label}</span>
        <h2 id="stats-title" className="section-title">
          {stats.title}
        </h2>
        <div className="stats__grid">
          {stats.items.map((stat) => (
            <div key={stat.label} className="stat-card">
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
