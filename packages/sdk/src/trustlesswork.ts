// Wrapper de Trustless Work (escrow / release) — https://docs.trustlesswork.com
//
// Capa de workflow/condiciones/disputas (NO custodia los fondos: el dinero vive en el
// vault DeFindex/Blend). Provider configurable "real" (API) / "dev" (mock).
//
// Roles (ver 05 - Roles y Modelo de Confianza): causa = Service Provider + Receiver,
// plataforma = Approver, release multi-firma 2-de-3, neutral = Dispute Resolver.
// ⚠️ Shapes "real" siguen el patrón de la doc; verificar contra docs.trustlesswork.com.
import type { FundingProviderKind } from "./defindex.js";

export interface TrustlessWorkConfig {
  provider: FundingProviderKind;
  apiUrl: string;
  apiKey?: string;
  /** Firma un XDR (con la secret del rol) antes de /helper/send-transaction. Inyectado por el server. */
  signXdr?: (xdr: string) => Promise<string> | string;
}

export interface EscrowRoles {
  serviceProvider: string; // causa
  approver: string; // plataforma
  receiver: string; // causa (wallet de la causa)
  disputeResolver: string; // neutral
  platformAddress: string; // plataforma (fee)
  releaseSigners: string[]; // 2-de-3: [causa, plataforma, neutral]
}

export interface EscrowMilestone {
  id: string;
  title: string;
}

export interface DeployEscrowInput {
  asset: string;
  amount: string;
  roles: EscrowRoles;
  milestones: EscrowMilestone[];
  /** Trustline del escrow (TW = escrow de stablecoin): issuer clásico G... + símbolo. */
  trustline?: { address: string; symbol: string };
}

export interface TrustlessWork {
  readonly provider: FundingProviderKind;
  deployEscrow(input: DeployEscrowInput): Promise<{ escrowId: string }>;
  updateMilestone(escrowId: string, milestoneId: string, evidenceUri?: string): Promise<void>;
  approveMilestone(escrowId: string, milestoneId: string, approver: string): Promise<void>;
  /** Release multi-firma. `signers` debe alcanzar el umbral (2-de-3). */
  releaseFunds(escrowId: string, signers: string[]): Promise<{ hash: string }>;
  startDispute(escrowId: string, by: string, reason: string): Promise<void>;
  resolveDispute(escrowId: string, resolver: string, outcome: "release" | "refund"): Promise<void>;
}

export function createTrustlessWork(cfg: TrustlessWorkConfig): TrustlessWork {
  return cfg.provider === "real" ? realTW(cfg) : devTW();
}

const RELEASE_THRESHOLD = 2; // 2-de-3

// Endpoints/bodies VALIDADOS contra la API real (dev.api.trustlesswork.com) con un escrow
// single-release desplegado en testnet. Auth = header `x-api-key`. Host dev/testnet:
// https://dev.api.trustlesswork.com (prod = api.trustlesswork.com).
//
// PATRÓN REAL: cada acción devuelve `{ unsignedTransaction }`; el rol correspondiente lo firma
// (callback cfg.signXdr, inyectado por el server con la secret del rol) y se envía a
// POST /helper/send-transaction { signedXdr } -> { status, contractId, escrow, ... }.
//
// TW es escrow de STABLECOIN: la `trustline` es { address: <issuer clásico G...>, symbol }
// (p.ej. USDC testnet). NO custodia las donaciones (eso es DeFindex/Blend, en XLM); es la
// capa de workflow/disputa. La autoridad de release 2-de-3 la tiene el contrato
// on-chain `campaign_controller`.
//
// Endpoints reales (single-release): /deployer/single-release, approve-milestone,
// release-funds, change-milestone-status, dispute-escrow, resolve-dispute, /helper/send-transaction.
function realTW(cfg: TrustlessWorkConfig): TrustlessWork {
  const base = cfg.apiUrl.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers["x-api-key"] = cfg.apiKey;
  async function post(path: string, body: unknown): Promise<any> {
    const res = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`trustlesswork ${path} -> HTTP ${res.status} ${await res.text().catch(() => "")}`);
    return res.json();
  }
  /** Firma el unsignedTransaction (con la secret del rol) y lo envía a /helper/send-transaction. */
  async function send(unsignedTransaction: string): Promise<any> {
    const signed = cfg.signXdr ? await cfg.signXdr(unsignedTransaction) : unsignedTransaction;
    return post(`/helper/send-transaction`, { signedXdr: signed });
  }
  const twRoles = (r: EscrowRoles) => ({
    approver: r.approver,
    serviceProvider: r.serviceProvider,
    releaseSigner: r.releaseSigners[0] ?? r.platformAddress,
    platformAddress: r.platformAddress,
    disputeResolver: r.disputeResolver,
    receiver: r.receiver,
  });
  return {
    provider: "real",
    async deployEscrow(input) {
      const r = await post(`/deployer/single-release`, {
        signer: input.roles.platformAddress,
        engagementId: input.milestones[0]?.id ?? "campaign",
        title: "beHuman campaign escrow",
        description: "Funding ZK campaign",
        roles: twRoles(input.roles),
        amount: Number(input.amount),
        platformFee: 0,
        milestones: input.milestones.map((m) => ({ description: m.title })),
        trustline: input.trustline ?? { address: input.asset, symbol: "USDC" },
      });
      const res = await send(r.unsignedTransaction);
      return { escrowId: String(res.contractId ?? "") };
    },
    async updateMilestone(contractId, milestoneIndex, _evidenceUri) {
      const r = await post(`/escrow/single-release/change-milestone-status`, {
        contractId,
        milestoneIndex,
        newStatus: "completed",
      });
      await send(r.unsignedTransaction);
    },
    async approveMilestone(contractId, milestoneIndex, approver) {
      const r = await post(`/escrow/single-release/approve-milestone`, { contractId, milestoneIndex, approver });
      await send(r.unsignedTransaction);
    },
    async releaseFunds(contractId, signers) {
      if (signers.length < RELEASE_THRESHOLD) throw new Error("release: faltan firmas (2-de-3)");
      const r = await post(`/escrow/single-release/release-funds`, { contractId, releaseSigner: signers[0] });
      const res = await send(r.unsignedTransaction);
      return { hash: String(res.txHash ?? res.contractId ?? "") };
    },
    async startDispute(contractId, _by, _reason) {
      const r = await post(`/escrow/single-release/dispute-escrow`, { contractId });
      await send(r.unsignedTransaction);
    },
    async resolveDispute(contractId, _resolver, outcome) {
      const r = await post(`/escrow/single-release/resolve-dispute`, { contractId, outcome });
      await send(r.unsignedTransaction);
    },
  };
}

// dev: simulador sin red (el funding/api lleva el estado real de la campaña).
function devTW(): TrustlessWork {
  const fakeHash = () => "twdev" + Math.random().toString(16).slice(2, 12);
  return {
    provider: "dev",
    async deployEscrow() {
      return { escrowId: "escrow_dev_" + Math.random().toString(16).slice(2, 10) };
    },
    async updateMilestone() {},
    async approveMilestone() {},
    async releaseFunds(_escrowId, signers) {
      if (signers.length < RELEASE_THRESHOLD) throw new Error("release: faltan firmas (2-de-3)");
      return { hash: fakeHash() };
    },
    async startDispute() {},
    async resolveDispute() {},
  };
}

export { RELEASE_THRESHOLD };
