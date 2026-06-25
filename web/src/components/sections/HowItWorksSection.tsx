import { kycFlow } from "../../content/site";
import "./HowItWorksSection.css";

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="page-section how-it-works">
      <div className="page-section__inner">
        <span className="section-label">{kycFlow.label}</span>
        <h2 className="section-title">{kycFlow.title}</h2>
        <p className="section-lead">{kycFlow.lead}</p>
        <ol className="how-it-works__steps">
          {kycFlow.steps.map((step) => (
            <li key={step.num} className="step-card">
              <span className="step-card__num">{step.num}</span>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__body">{step.body}</p>
              <pre className="step-card__code">{step.code}</pre>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
