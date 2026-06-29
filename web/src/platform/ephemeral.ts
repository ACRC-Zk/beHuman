// Cuenta efímera para pagar el fee on-chain — NUNCA el address del KYC.
// Se genera al vuelo y se fondea con friendbot (testnet). No tiene relación con la
// identidad del KYC: rompe el link address-KYC <-> actividad de plataforma.
import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc } from "./stellar2";

const FRIENDBOT = import.meta.env.VITE_FRIENDBOT_URL ?? "https://friendbot.stellar.org";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function createFundedEphemeral(): Promise<StellarSdk.Keypair> {
  const kp = StellarSdk.Keypair.random();
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(kp.publicKey())}`);
  if (!res.ok) throw new Error(`friendbot no pudo fondear la cuenta efímera (${res.status})`);
  await res.json().catch(() => null);
  // friendbot confirma el envío, pero el RPC puede tardar en reflejar la cuenta nueva
  // (consistencia eventual) → "Account not found". Esperamos a que sea visible antes de usarla.
  for (let i = 0; i < 20; i++) {
    try {
      await rpc.getAccount(kp.publicKey());
      return kp;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("la cuenta efímera no apareció en el RPC tras el fondeo");
}
