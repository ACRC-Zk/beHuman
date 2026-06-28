// Capa 3 — Detalle de campaña: donar anónimo, mi posición + recuperar aporte, panel validador
// (aprobar hitos + liberar 2-de-3) y opiniones por campaña (1 voz por humano).
// Cero PII: la wallet de donación es efímera; la opinión usa el platformId scopeado a la campaña.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as StellarSdk from "@stellar/stellar-sdk";
import type { Campaign, CampaignOpinion, Sentiment } from "@behuman/shared";
import { Button } from "../components/ui/Button";
import { loadAnyCredential } from "../kyc/credentialStore";
import { generatePlatformProof } from "../platform/zk2";
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
import { humanState } from "./CausesPage";
import "../styles/behuman-ui.css";

const isRealTx = (h: string) => /^[0-9a-f]{64}$/i.test(h);
const fmt = (n: string | number) => Number(n).toLocaleString("es-AR", { maximumFractionDigits: 4 });

export function CampaignDetailPage() {
  const { id = "" } = useParams();
  const [cred] = useState(() => loadAnyCredential());
  const [c, setC] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("100");
  const [donorWallet, setDonorWallet] = useState<string | null>(null);
  const [donorSecret, setDonorSecret] = useState<string | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

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
    try {
      setBusy("Generando tu prueba de humano (ZK) en el dispositivo…");
      const mp = await membership();
      const kp = StellarSdk.Keypair.random(); // wallet efímera POR donación (anónima)
      setDonorWallet(kp.publicKey());
      setDonorSecret(kp.secret());
      setBusy("Sumando tu aporte (entra a un fondo que genera rendimiento)…");
      const r = await donate(c.id, kp.publicKey(), amount, mp);
      if (r.raisedAmount) setC({ ...c, raisedAmount: r.raisedAmount });
      const sig = signFundingAction(kp.secret(), fundingChallenge("refund", c.id, `position:${kp.publicKey()}`));
      setPosition(await getPosition(c.id, kp.publicKey(), sig.signature));
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError((e as Error).message);
    }
  }

  async function doRefund() {
    if (!c || !donorWallet || !donorSecret) return;
    setError(null);
    try {
      setBusy("Devolviendo tu aporte…");
      const sig = signFundingAction(donorSecret, fundingChallenge("refund", c.id, donorWallet));
      const r = await refundCampaign(c.id, donorWallet, sig);
      setPosition(null);
      setBusy(null);
      alert(`Te devolvimos ${fmt(r.amount)} ${c.asset} a tu wallet anónima.`);
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
      setLastTx(r.txHash);
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
  const pct = Math.min(100, (Number(c.raisedAmount) / Math.max(1, Number(c.goalAmount))) * 100);
  const allApproved = c.milestones.every((m) => m.status === "approved");
  const goalReached = Number(c.raisedAmount) >= Number(c.goalAmount);
  const toggleSigner = (a: string) =>
    setSigners((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));

  return (
    <div className="bh app-page">
      <Link to="/app/causes" className="bh-back">← Causas</Link>
      <header style={{ margin: "0.75rem 0 1rem" }}>
        <span className={`bh-state bh-state--${s.cls}`}>{s.label}</span>
        <h1 className="bh-h1" style={{ marginTop: "0.5rem" }}>{c.title}</h1>
        <p className="bh-muted" style={{ fontSize: "0.9rem" }}>
          {fmt(c.raisedAmount)} / {fmt(c.goalAmount)} {c.asset} · cierra el{" "}
          {new Date(c.deadline).toLocaleDateString("es-AR")}
        </p>
        <div className="bh-progress" style={{ marginTop: "0.6rem" }}>
          <div className="bh-progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="bh-sub" style={{ marginTop: "0.75rem" }}>{c.summary}</p>
      </header>

      {!cred && (
        <div className="bh-card">
          <p className="bh-p">
            Para donar u opinar, primero{" "}
            <Link to="/onboarding" className="bh-back">verificate como humano</Link>.
          </p>
        </div>
      )}

      {/* Donar */}
      {cred && c.state === "fundraising" && (
        <div className="bh-card">
          <h2 className="bh-h2">Donar (anónimo · genera rendimiento)</h2>
          <div className="bh-actions">
            <input className="bh-input bh-input--sm" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="bh-muted">{c.asset}</span>
            <Button onClick={doDonate} disabled={!!busy || Number(amount) <= 0}>Donar</Button>
          </div>
          {position && (
            <p className="bh-note bh-note--ok">
              Aportaste y hoy vale ~{fmt(position.underlying)} {c.asset} (rinde {(position.apy * 100).toFixed(1)}%/año), desde una wallet anónima.
            </p>
          )}
          {position && (
            <div className="bh-actions">
              <Button variant="ghost" onClick={doRefund} disabled={!!busy}>
                Recuperar mi aporte (si la causa no llega a la meta)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Panel validador */}
      <div className="bh-card">
        <h2 className="bh-h2">Panel de validador</h2>
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
        {lastTx && (
          <p className="bh-note bh-note--ok">
            ✅ Fondos entregados a la causa (capital + rendimiento).{" "}
            {isRealTx(lastTx) ? (
              <a href={`https://stellar.expert/explorer/testnet/tx/${lastTx}`} target="_blank" rel="noreferrer" className="bh-back">
                Ver la transacción
              </a>
            ) : (
              <span>(transacción simulada en este entorno)</span>
            )}
          </p>
        )}
      </div>

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
