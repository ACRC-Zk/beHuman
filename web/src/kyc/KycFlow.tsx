// Orquesta el flujo del gate de Capa 1: consentimiento -> DNI -> cámara -> resultado.
//
// Demuestra la validación biométrica EN VIVO (match 1:1 + liveness). La creación de la
// identidad (commitment -> prueba ZK -> registro on-chain) se ejecuta vía el SDK / e2e
// (ver scripts/e2e_demo.sh): el commitment es no-custodial y en producción se calcula
// en el device.
import { useState } from "react";
import type { MatchResult } from "@behuman/shared";
import { Consent } from "./Consent";
import { DocumentUpload } from "./DocumentUpload";
import { FaceScan } from "./FaceScan";
import { verifyGate } from "./api";

type Step = "consent" | "document" | "scan" | "verifying" | "result";

export function KycFlow() {
  const [step, setStep] = useState<Step>("consent");
  const [doc, setDoc] = useState<Blob | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCaptured(frames: Blob[]) {
    setStep("verifying");
    try {
      setResult(await verifyGate(doc!, frames));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStep("result");
    }
  }

  function reset() {
    setStep("consent");
    setDoc(null);
    setResult(null);
    setError(null);
  }

  if (step === "consent") return <Consent onAccept={() => setStep("document")} />;
  if (step === "document")
    return (
      <DocumentUpload
        onNext={(d) => {
          setDoc(d);
          setStep("scan");
        }}
      />
    );
  if (step === "scan") return <FaceScan onCaptured={onCaptured} />;
  if (step === "verifying")
    return (
      <section className="app__card">
        <h2>Verificando…</h2>
        <p>Comparando tu cara con la del DNI y evaluando vivacidad…</p>
      </section>
    );

  return (
    <section className="app__card">
      <h2>{result?.ok ? "✅ Verificación exitosa" : "❌ No verificado"}</h2>
      {error && <p>Error: {error}</p>}
      {result && (
        <ul>
          <li>
            Coincidencia con el DNI: <strong>{result.matchScore >= 0.4 ? "sí" : "no"}</strong>{" "}
            (distancia {result.matchDistance})
          </li>
          <li>
            Vivacidad (liveness): <strong>{result.livenessOk ? "sí" : "no"}</strong>
          </li>
          {result.reasons.length > 0 && <li>Motivos: {result.reasons.join(", ")}</li>}
        </ul>
      )}
      {result?.ok && (
        <p>
          Tu identidad de Capa 1 puede crearse. En el e2e: commitment → prueba ZK →{" "}
          <code>verify_and_register</code> → <code>Verified(address)</code>.
        </p>
      )}
      <button type="button" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
