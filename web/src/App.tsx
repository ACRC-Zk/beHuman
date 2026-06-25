import "./App.css";
import { KycFlow } from "./kyc/KycFlow";

// beHuman — Frontend. Capa 1: gate de identidad (DNI + cara) en vivo.
// 📐 Pasos del usuario en la vault: `Flujo de KYC` · `Spec — Matcher DNI + Selfie`.

function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>beHuman</h1>
        <p className="app__tagline">
          Probá que sos una persona <strong>real y única</strong> sin revelar quién sos
        </p>
      </header>

      <KycFlow />

      <footer className="app__footer">
        demo testnet · el matcher es de prueba (no RENAPER) · cero PII on-chain
      </footer>
    </main>
  );
}

export default App;
