// "Ver mi identidad" — SOLO por wallet. Conecta la wallet y consulta is_verified(address)
// on-chain. No se guarda ni se envía ningún dato de la persona (ZK: cero PII off/on-chain).
import { useState } from "react";
import { connectWallet } from "./wallet";
import { isVerified } from "./chain";
import { CONTRACT_ID } from "./stellar";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; address: string; verified: boolean }
  | { kind: "error"; msg: string };

export function Status({ onBack }: { onBack: () => void }) {
  const [s, setS] = useState<State>({ kind: "idle" });

  async function check() {
    setS({ kind: "checking" });
    try {
      const address = await connectWallet();
      const verified = await isVerified(address);
      setS({ kind: "result", address, verified });
    } catch (e) {
      setS({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <section className="app__card">
      <h2>Ver mi identidad</h2>
      <p>
        Conectá tu wallet para ver si tu identidad ya está registrada on-chain.{" "}
        <strong>No se guarda ningún dato tuyo</strong>: sólo se consulta tu dirección.
      </p>
      {!CONTRACT_ID && (
        <p style={{ color: "#c5221f" }}>⚠️ Falta <code>VITE_KYC_VERIFIER_CONTRACT_ID</code>.</p>
      )}

      {s.kind !== "result" && (
        <button type="button" onClick={check} disabled={s.kind === "checking"}>
          {s.kind === "checking" ? "Consultando on-chain…" : "Conectar wallet y ver estado"}
        </button>
      )}
      {s.kind === "error" && <p style={{ color: "#c5221f" }}>Error: {s.msg}</p>}

      {s.kind === "result" && (
        <div>
          <p>
            Tu identidad (dirección Stellar):
            <br />
            <code style={{ wordBreak: "break-all" }}>{s.address}</code>
          </p>
          <p style={{ fontSize: "1.3em" }}>
            {s.verified ? "✅ Identidad validada on-chain" : "❌ Todavía no estás registrado"}
          </p>
          <p>
            <code>is_verified({s.address.slice(0, 4)}…{s.address.slice(-4)}) = {String(s.verified)}</code>
          </p>
          <p>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${s.address}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver tu cuenta y transacciones
            </a>
            {" · "}
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver el contrato
            </a>
          </p>
          {!s.verified && <p>Todavía no te validaste: volvé y elegí “Validar mi identidad”.</p>}
        </div>
      )}

      <button type="button" onClick={onBack} style={{ marginTop: 12 }}>
        Volver
      </button>
    </section>
  );
}
