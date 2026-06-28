// Núcleo de anclaje on-chain (Capa 2) compartido por tweets y artículos.
// Genera la prueba ZK, asegura la identidad de plataforma registrada, y ancla el contenido
// en `opinion_board` con una cuenta EFÍMERA (no la wallet del KYC). Cero PII: solo va el
// contentHash + la prueba; la identidad real (platformId) no se expone en la UI.
import * as StellarSdk from "@stellar/stellar-sdk";
import { loadAnyCredential } from "../kyc/credentialStore";
import { contentHashField, generatePlatformProof, platformIdHex } from "../platform/zk2";
import { createFundedEphemeral } from "../platform/ephemeral";
import { postTweet, quotePost, registerIdentity, ContractError } from "../platform/chain2";

export interface Anchored {
  platformId: string;
  contentHash: string;
  txHash: string;
}

/** Registra la identidad de plataforma si todavía no lo está (idempotente). */
async function ensureRegistered(kp: StellarSdk.Keypair, idProof: Awaited<ReturnType<typeof generatePlatformProof>>) {
  try {
    await registerIdentity(kp, idProof);
  } catch (e) {
    if (!(e instanceof ContractError && e.code === 3)) throw e; // 3 = ya registrada
  }
}

/** Ancla `text` on-chain (prueba ZK + opinion_board.post). Requiere credencial Capa 1. */
export async function anchorText(text: string): Promise<Anchored> {
  const cred = loadAnyCredential();
  if (!cred) throw new Error("necesitas_verificarte");

  const contentHash = await contentHashField(text);
  const proof = await generatePlatformProof(cred, contentHash);
  const platformId = platformIdHex(proof.publicSignals[1]);
  const kp = await createFundedEphemeral();

  let txHash = "";
  try {
    txHash = await postTweet(kp, proof);
  } catch (e) {
    if (e instanceof ContractError && e.code === 4) {
      // Identidad aún no registrada en el board → registrar y reintentar.
      await ensureRegistered(kp, await generatePlatformProof(cred, "0"));
      txHash = await postTweet(kp, proof);
    } else if (e instanceof ContractError && e.code === 5) {
      txHash = ""; // anti-replay: este contenido ya estaba anclado (sigue siendo inmutable)
    } else {
      throw e;
    }
  }
  return { platformId, contentHash, txHash };
}

/** Cotiza (sin enviar) el costo on-chain de anclar `text`. Devuelve fee en XLM + stroops. */
export async function quoteText(text: string): Promise<{ feeXlm: string; feeStroops: string; contentHash: string }> {
  const cred = loadAnyCredential();
  if (!cred) throw new Error("necesitas_verificarte");

  const contentHash = await contentHashField(text);
  const proof = await generatePlatformProof(cred, contentHash);
  const kp = await createFundedEphemeral();

  let stroops: bigint;
  try {
    stroops = await quotePost(kp, proof);
  } catch (e) {
    if (e instanceof ContractError && e.code === 4) {
      await ensureRegistered(kp, await generatePlatformProof(cred, "0"));
      stroops = await quotePost(kp, proof);
    } else {
      throw e;
    }
  }
  return {
    feeStroops: stroops.toString(),
    feeXlm: (Number(stroops) / 1e7).toFixed(7),
    contentHash,
  };
}
