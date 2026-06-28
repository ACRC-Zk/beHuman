// Capa 3 — Detalle de causa: portada + stats grandes + panel de donación guiado (anónimo),
// panel validador (aprobar hitos + release 2-de-3) y opiniones por campaña (1 voz por humano).
// Cero PII: la donación usa una wallet EFÍMERA nueva (RT-05); la opinión usa el platformId
// scopeado a la campaña. El gating es por prueba de pertenencia, nunca por is_verified(address).
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Campaign, CampaignOpinion, Sentiment } from "@behuman/shared";
import { Button } from "../components/ui/Button";
import { loadAnyCredential } from "../kyc/credentialStore";
import { generatePlatformProof } from "../platform/zk2";
import { createFundedEphemeral } from "../platform/ephemeral";
import {
  approveMilestone,
  donate,
  getCampaign,
  getOpinions,
  getPosition,
  postOpinion,
  refund as refundCampaign,
  release as releaseCampaign,
  type Position,
} from "../funding/api";
import {
  fundingChallenge,
  generateFundingOpinionProof,
  handleOfCampaign,
  signFundingAction,
} from "../funding/zk3";
import { daysLeft, fmtAmount, fmtApy, fundedPct, humanState, isRealTx, txUrl } from "../funding/causeView";
import "../styles/behuman-ui.css";
import "./Causes.css";

const PRESETS = ["10", "50", "100"];
type DonateStep = null | "proof" | "wallet" | "sending" | "done";
const STEP_ORDER: Record<Exclude<DonateStep, null>, number> = { proof: 0, wallet: 1, sending: 2, done: 3 };
const STEPS: { key: "proof" | "wallet" | "sending"; label: string }[] = [
  { key: "proof", label: "Generando tu prueba de pertenencia (ZK)…" },
  { key: "wallet", label: "Creando tu wallet anónima y fondeándola…" },
  { key: "sending", label: "Firmando y enviando tu donación…" },
];

export function CampaignDetailPage() {
  const { id = "" } = useParams();
  const [cred] = useState(() => loadAnyCredential());
  const [c, setC] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("50");
  const [donorWallet, setDonorWallet] = useState<string | null>(null);
  const [donorSecret, setDonorSecret] = useState<string | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [donateStep, setDonateStep] = useState<DonateStep>(null);
  const [lastDonationTx, setLastDonationTx] = useState<string | null>(null);
  const [lastReleaseTx, setLastReleaseTx] = useState<string | null>(null);

  const [opinion, setOpinion] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment>("support");
  const [opinions, setOpinions] = useState<CampaignOpinion[]>([]);
  const [counts, setCounts] = useState({ support: 0, oppose: 0 });

  const [signers, setSigners] = useState<string[]>([]);

  useEffect(() => {
    getCampaign(id)
      .then(setC)
      .catch((e) => setError((e as Error).message));
    getOpinions(id)
      .then((o) => {
        setOpinions(o.opinions);
        setCounts(o.sentiment);
      })
      .catch(() => {});
  }, [id]);

  async function membership() {
    if (!cred) throw new Error("Necesitás verificarte para participar.");
    const p = await generatePlatformProof(cred, "0");
    return { proof: p.proof, publicSignals: p.publicSignals };
  }

  async function doDonate() {
    if (!c) return;
    setError(null);
    setLastDonationTx(null);
    setDonateStep("proof");
    try {
      const mp = await membership();
      // RT-05: wallet efímera NUEVA por donación, fondeada por friendbot (testnet). Nunca el
      // address del KYC ni el platformId → sin rastro identidad ↔ donación.
      setDonateStep("wallet");
      const kp = await createFundedEphemeral();
      setDonorWallet(kp.publicKey());
      setDonorSecret(kp.secret());

      setDonateStep("sending");
      const r = await donate(c.id, kp.publicKey(), amount, mp);
      if (r.raisedAmount) {
        setC({ ...c, raisedAmount: r.raisedAmount, donorCount: (c.donorCount ?? 0) + 1 });
      }
      setLastDonationTx(r.donation?.txHash ?? null);

      const sig = signFundingAction(kp.secret(), fundingChallenge("refund", c.id, `position:${kp.publicKey()}`));
      setPosition(await getPosition(c.id, kp.publicKey(), sig.signature));
      setDonateStep("done");
    } catch (e) {
      setDonateStep(null);
      setError((e as Error).message);
    }
  }

  async function doRefund() {
    if (!c || !donorWallet || !donorSecret) return;
    setError(null);
    try {
      setBusy("Devolviendo tu aporte a tu wallet anónima…");
      const sig = signFundingAction(donorSecret, fundingChallenge("refund", c.id, donorWallet));
      const r = await refundCampaign(c.id, donorWallet, sig);
      setPosition(null);
      setBusy(null);
      alert(`Te devolvimos ${fmtAmount(r.amount)} ${c.asset} a tu wallet anónima.`);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  }

  async function publishOpinion() {
    if (!c || !cred || !opinion.trim()) return;
    setError(null);
    try {
      setBusy("Generando tu prueba de opinión (ZK)…");
      const p = await generateFundingOpinionProof(cred, c.id, opinion.trim());
      setBusy("Publicando opinión anónima…");
      await postOpinion(c.id, opinion.trim(), sentiment, { proof: p.proof, publicSignals: p.publicSignals });
      setOpinion("");
      const o = await getOpinions(c.id);
      setOpinions(o.opinions);
      setCounts(o.sentiment);
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  }

  async function approve(milestoneId: string) {
    if (!c) return;
    setError(null);
    try {
      setBusy("Aprobando hito…");
      const sec = c.signerSecretsDev?.platform;
      if (!sec) throw new Error("Sin permiso de validador en este entorno.");
      const sig = signFundingAction(sec, fundingChallenge("approve", c.id, milestoneId));
      await approveMilestone(c.id, milestoneId, sig);
      setC({
        ...c,
        milestones: c.milestones.map((m) => (m.id === milestoneId ? { ...m, status: "approved" } : m)),
      });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  }

  async function doRelease() {
    if (!c) return;
    setError(null);
    try {
      setBusy("Liberando los fondos a la causa…");
      const secrets = c.signerSecretsDev;
      if (!secrets) throw new Error("Sin permiso de validador en este entorno.");
      const byAddr: Record<string, string> = {
        [c.signers.cause]: secrets.cause,
        [c.signers.platform]: secrets.platform,
        [c.signers.neutral]: secrets.neutral,
      };
      const challenge = fundingChallenge("release", c.id, c.raisedAmount);
      const signatures = signers.filter((a) => byAddr[a]).map((a) => signFundingAction(byAddr[a], challenge));
      const r = await releaseCampaign(c.id, signatures);
      setLastReleaseTx(r.txHash);
      setC({ ...c, state: "released" });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  }

  if (error && !c) return <div className="bh app-page"><p className="bh-note bh-note--err">{error}</p></div>;
  if (!c) return <div className="bh app-page"><p className="bh-note">Cargando…</p></div>;

  const s = humanState(c);
  const pct = fundedPct(c);
  const left = daysLeft(c.deadline);
  const allApproved = c.milestones.every((m) => m.status === "approved");
  const goalReached = Number(c.raisedAmount) >= Number(c.goalAmount);
  const donating = donateStep !== null && donateStep !== "done";
  const toggleSigner = (a: string) =>
    setSigners((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));

  return (
    <div className="bh app-page cause-detail">
      <Link to="/app/causes" className="bh-back">← Causas</Link>

      {/* Portada */}
      <header className="cause-cover">
        <span className={`bh-state bh-state--${s.cls}`}>{s.label}</span>
        <h1 className="bh-h1 cause-cover__title">{c.title}</h1>
        <p className="cause-cover__story">{c.summary || "Esta causa todavía no agregó una descripción."}</p>

        <div className="bh-progress cause-cover__progress">
          <div className="bh-progress__bar" style={{ width: `${pct}%` }} />
        </div>

        {/* Stats grandes */}
        <div className="cause-stats">
          <div className="cause-stat">
            <span className="cause-stat__value">{fmtAmount(c.raisedAmount)}</span>
            <span className="cause-stat__label">recaudado ({c.asset})</span>
          </div>
          <div className="cause-stat">
            <span className="cause-stat__value">{fmtAmount(c.goalAmount)}</span>
            <span className="cause-stat__label">meta</span>
          </div>
          <div className="cause-stat">
            <span className="cause-stat__value">{Math.round(pct)}%</span>
            <span className="cause-stat__label">financiado</span>
          </div>
          <div className="cause-stat">
            <span className="cause-stat__value">{c.donorCount ?? 0}</span>
            <span className="cause-stat__label">donantes</span>
          </div>
          <div className="cause-stat">
            <span className="cause-stat__value">{left > 0 ? left : 0}</span>
            <span className="cause-stat__label">días restantes</span>
          </div>
          {typeof c.estApy === "number" && c.estApy > 0 && (
            <div className="cause-stat cause-stat--yield">
              <span className="cause-stat__value">{fmtApy(c.estApy)}</span>
              <span className="cause-stat__label">rinde / año</span>
            </div>
          )}
        </div>
      </header>

      {!cred && (
        <div className="bh-card">
          <p className="bh-p">
            Para donar u opinar, primero{" "}
            <Link to="/onboarding" className="bh-back">verificate como humano</Link>.
          </p>
        </div>
      )}

      {/* Panel de donación */}
      {cred && c.state === "fundraising" && (
        <div className="bh-card donate-panel">
          <h2 className="bh-h2">Donar a esta causa</h2>
          <p className="donate-panel__anon">
            🛡️ Donás desde una <strong>wallet anónima de un solo uso</strong>; no se vincula a tu
            identidad. Tu aporte genera rendimiento hasta que se cumplan los hitos.
          </p>

          {/* Montos: presets + custom */}
          <div className="donate-presets" role="group" aria-label="Montos sugeridos">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`donate-chip ${amount === p ? "is-active" : ""}`}
                onClick={() => setAmount(p)}
                disabled={donating}
              >
                {p} {c.asset}
              </button>
            ))}
          </div>
          <label className="donate-amount">
            <span className="bh-label">Otro monto</span>
            <div className="donate-amount__row">
              <input
                className="bh-input"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={donating}
              />
              <span className="donate-amount__asset">{c.asset}</span>
            </div>
          </label>

          <Button onClick={doDonate} disabled={donating || Number(amount) <= 0} className="donate-cta">
            {donating ? "Procesando…" : `Donar ${fmtAmount(amount)} ${c.asset}`}
          </Button>

          {/* Flujo guiado */}
          {donateStep && (
            <ol className="donate-flow">
              {STEPS.map((step) => {
                const active = donateStep !== "done" ? STEP_ORDER[donateStep] : 3;
                const idx = STEP_ORDER[step.key];
                const status = idx < active ? "done" : idx === active ? "active" : "pending";
                return (
                  <li key={step.key} className={`donate-flow__step is-${status}`}>
                    <span className="donate-flow__icon">
                      {status === "done" ? "✓" : status === "active" ? <span className="donate-flow__spin" /> : ""}
                    </span>
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Confirmación */}
          {donateStep === "done" && (
            <div className="donate-done">
              <p className="bh-note bh-note--ok" style={{ margin: 0 }}>
                ✅ ¡Gracias! Tu donación de {fmtAmount(amount)} {c.asset} entró de forma anónima.
              </p>
              {position && (
                <p className="bh-muted" style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
                  Hoy tu aporte vale ~{fmtAmount(position.underlying)} {c.asset} (rinde {fmtApy(position.apy)}/año).
                </p>
              )}
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>
                {isRealTx(lastDonationTx) ? (
                  <a href={txUrl(lastDonationTx!)} target="_blank" rel="noreferrer" className="bh-back">
                    Ver la transacción on-chain →
                  </a>
                ) : (
                  <span className="bh-muted">(transacción simulada en este entorno de prueba)</span>
                )}
              </p>
              <div className="bh-actions" style={{ marginTop: "0.5rem" }}>
                <Button variant="ghost" onClick={doRefund} disabled={!!busy}>
                  Recuperar mi aporte (si la causa no llega a la meta)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel validador (dev/demo) */}
      <details className="bh-card validator-panel">
        <summary className="bh-h2 validator-panel__summary">Panel de validador</summary>
        {c.milestones.length === 0 && <p className="bh-note">Esta causa no tiene hitos.</p>}
        {c.milestones.map((m) => (
          <div key={m.id} className="bh-milestone">
            <span>{m.status === "approved" ? "✅" : "⏳"}</span>
            <span style={{ flex: 1 }}>{m.title}</span>
            {m.status !== "approved" && (
              <Button variant="ghost" onClick={() => approve(m.id)} disabled={!!busy}>Aprobar</Button>
            )}
          </div>
        ))}
        <p className="bh-note">Firmantes para liberar (2 de 3):</p>
        {(["cause", "platform", "neutral"] as const).map((role) => {
          const addr = c.signers[role];
          const label = role === "cause" ? "Causa" : role === "platform" ? "Plataforma" : "Neutral";
          return (
            <label key={role} className="bh-signer">
              <input type="checkbox" checked={signers.includes(addr)} onChange={() => toggleSigner(addr)} />
              {label}
            </label>
          );
        })}
        <div className="bh-actions">
          <Button
            onClick={doRelease}
            disabled={!!busy || c.state !== "fundraising" || signers.length < 2 || !allApproved || !goalReached}
          >
            Liberar los fondos a la causa
          </Button>
        </div>
        {c.state === "fundraising" && (!allApproved || !goalReached) && (
          <p className="bh-note">Requiere todos los hitos aprobados y la meta alcanzada.</p>
        )}
        {lastReleaseTx && (
          <p className="bh-note bh-note--ok">
            ✅ Fondos entregados a la causa (capital + rendimiento).{" "}
            {isRealTx(lastReleaseTx) ? (
              <a href={txUrl(lastReleaseTx)} target="_blank" rel="noreferrer" className="bh-back">
                Ver la transacción
              </a>
            ) : (
              <span>(transacción simulada en este entorno)</span>
            )}
          </p>
        )}
      </details>

      {/* Opiniones */}
      <div className="bh-card">
        <h2 className="bh-h2">Opiniones (1 persona, 1 voz)</h2>
        <div className="bh-sentiment">
          <span>👍 {counts.support}</span>
          <span>👎 {counts.oppose}</span>
        </div>
        {cred && (
          <>
            <textarea className="bh-textarea" rows={2} value={opinion} onChange={(e) => setOpinion(e.target.value)} placeholder="Tu opinión sobre esta causa…" />
            <div className="bh-actions">
              <select className="bh-select bh-input--sm" value={sentiment} onChange={(e) => setSentiment(e.target.value as Sentiment)}>
                <option value="support">A favor</option>
                <option value="oppose">En contra</option>
                <option value="neutral">Neutral</option>
              </select>
              <Button onClick={publishOpinion} disabled={!!busy || !opinion.trim()}>Opinar</Button>
            </div>
          </>
        )}
        {opinions.map((o) => (
          <div key={o.id} className="bh-opinion">
            <span className="bh-opinion__handle">@{handleOfCampaign(o.platformId)}</span>
            <span className="bh-opinion__sentiment">
              {o.sentiment === "support" ? "👍" : o.sentiment === "oppose" ? "👎" : "·"}
            </span>
            <p style={{ margin: "0.2rem 0 0" }}>{o.content}</p>
          </div>
        ))}
      </div>

      {busy && <p className="bh-note">⏳ {busy}</p>}
      {error && <p className="bh-note bh-note--err">{error}</p>}
    </div>
  );
}
