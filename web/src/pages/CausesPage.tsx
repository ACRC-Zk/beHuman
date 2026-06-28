// Capa 3 — Listado de causas/campañas. Doná como humano verificado, sin revelar quién sos.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "@behuman/shared";
import { listCampaigns } from "../funding/api";
import "../styles/behuman-ui.css";

const fmt = (n: string | number) =>
  Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 });

export function humanState(c: Campaign): { cls: string; label: string } {
  const raised = Number(c.raisedAmount);
  const goal = Number(c.goalAmount);
  if (c.state === "released") return { cls: "released", label: "Fondos entregados" };
  if (c.state === "refunding") return { cls: "refunding", label: "Devolviendo aportes" };
  if (c.state === "disputed") return { cls: "disputed", label: "En disputa" };
  if (Date.now() > c.deadline && raised < goal) return { cls: "failed", label: "No alcanzó la meta" };
  if (raised >= goal) return { cls: "reached", label: "Meta alcanzada" };
  return { cls: "fundraising", label: "Activa" };
}

function CauseCard({ c }: { c: Campaign }) {
  const pct = Math.min(100, (Number(c.raisedAmount) / Math.max(1, Number(c.goalAmount))) * 100);
  const s = humanState(c);
  return (
    <Link to={`/app/causes/${c.id}`} className="bh-cause-card">
      <span className={`bh-state bh-state--${s.cls}`}>{s.label}</span>
      <span className="bh-cause-card__title">{c.title}</span>
      <span className="bh-cause-card__summary">{c.summary}</span>
      <div className="bh-progress">
        <div className="bh-progress__bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="bh-progress__label">
        <span>{fmt(c.raisedAmount)} {c.asset}</span>
        <span>meta {fmt(c.goalAmount)}</span>
      </div>
    </Link>
  );
}

export function CausesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="bh app-page">
      <header style={{ marginBottom: "1.25rem" }}>
        <p className="bh-eyebrow">Funding ZK</p>
        <h1 className="bh-h1">Causas</h1>
        <p className="bh-sub">Doná como humano verificado, sin revelar quién sos.</p>
      </header>
      {error && <p className="bh-note bh-note--err">No se pudieron cargar las causas: {error}</p>}
      <div className="bh-grid">
        {campaigns.map((c) => (
          <CauseCard key={c.id} c={c} />
        ))}
      </div>
      {campaigns.length === 0 && !error && <p className="bh-note">Todavía no hay causas.</p>}
    </div>
  );
}
