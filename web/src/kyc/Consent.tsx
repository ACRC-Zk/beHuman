// Pantalla de consentimiento informado (Ley 25.326): debe constar ANTES de capturar
// DNI/biometría. Ver Cumplimiento-Argentina en la vault.

export function Consent({ onAccept }: { onAccept: () => void }) {
  return (
    <section className="app__card">
      <h2>Antes de empezar</h2>
      <p>
        Para verificar que sos una persona real y única vamos a pedirte una{" "}
        <strong>foto de tu DNI</strong> y un <strong>escaneo de tu cara</strong> con la cámara.
      </p>
      <ul>
        <li>Las imágenes se procesan <strong>en el momento</strong> y no se guardan.</li>
        <li>
          <strong>Nada de tus datos</strong> (cara, documento, nombre) toca la blockchain:
          on-chain solo va una prueba criptográfica anónima.
        </li>
        <li>Podés ejercer tus derechos de acceso y supresión (Ley 25.326).</li>
      </ul>
      <p style={{ fontSize: "0.85em", opacity: 0.8 }}>
        ⚠️ Demo testnet: la verificación biométrica es un matcher de prueba (no RENAPER).
      </p>
      <button type="button" onClick={onAccept}>
        Acepto y continúo
      </button>
    </section>
  );
}
