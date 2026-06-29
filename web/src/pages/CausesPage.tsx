// Capa 3 — Explorar causas. Tarjetas claras con progreso, % financiado, días restantes,
// donantes, asset y rendimiento. Doná como humano verificado, sin revelar quién sos.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "@behuman/shared";
import { listCampaigns } from "../funding/api";
import { daysLeft, fmtAmount, fmtApy, fundedPct, humanState } from "../funding/causeView";
import "../styles/behuman-ui.css";
import "./Causes.css";

function CauseCard({ c }: { c: Campaign }) {
  const pct = fundedPct(c);
  const s = humanState(c);
  const left = daysLeft(c.deadline);
  return (
    <Link to={`/app/causes/${c.id}`} className="cause-card">
      <div className="cause-card__top">
        <span className={`bh-state bh-state--${s.cls}`}>{s.label}</span>
        {typeof c.estApy === "number" && c.estApy > 0 && (
          <span className="cause-card__yield" title="Rendimiento estimado mientras se recauda">
            ↑ {fmtApy(c.estApy)} APY
          </span>
        )}
      </div>

      <h3 className="cause-card__title">{c.title}</h3>
      <p className="cause-card__summary">{c.summary}</p>

      <div className="cause-card__progress">
        <div className="bh-progress">
          <div className="bh-progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="cause-card__amounts">
          <strong>{fmtAmount(c.raisedAmount)} {c.asset}</strong>
          <span>de {fmtAmount(c.goalAmount)}</span>
        </div>
      </div>

      <div className="cause-card__meta">
        <span><strong>{Math.round(pct)}%</strong> financiado</span>
        <span>·</span>
        <span>{c.donorCount ?? 0} donante{(c.donorCount ?? 0) === 1 ? "" : "s"}</span>
        <span>·</span>
        <span>{left > 0 ? `${left} día${left === 1 ? "" : "s"}` : "cerrada"}</span>
      </div>

      <span className="cause-card__cta">Ver causa →</span>
    </Link>
  );
}

type LoadState = "loading" | "ready" | "error";

export function CausesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let alive = true;
    listCampaigns()
      .then((cs) => alive && (setCampaigns(cs), setState("ready")))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="bh app-page">
      <header className="causes-header">
        <p className="bh-eyebrow">Funding ZK</p>
        <h1 className="bh-h1">Causas</h1>
        <p className="bh-sub">
          Apoyá causas reales como humano verificado, <strong>sin revelar quién sos</strong>. Tu
          donación entra a un fondo que genera rendimiento hasta que se cumplen los hitos.
        </p>
      </header>

      {state === "loading" && (
        <div className="bh-grid" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="cause-card cause-card--skeleton" />
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="bh-card causes-empty">
          <p className="bh-note bh-note--err">No pudimos cargar las causas.</p>
          <p className="bh-muted">Verificá que el servicio de funding esté en línea e intentá de nuevo.</p>
        </div>
      )}

      {state === "ready" && campaigns.length === 0 && (
        <div className="bh-card causes-empty">
          <h2 className="bh-h2">Todavía no hay causas</h2>
          <p className="bh-muted">Cuando se publique una causa, vas a poder donar de forma anónima desde acá.</p>
        </div>
      )}

      {state === "ready" && campaigns.length > 0 && (
        <div className="bh-grid">
          {campaigns.map((c) => (
            <CauseCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
