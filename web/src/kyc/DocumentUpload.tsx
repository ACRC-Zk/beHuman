// Subida de la foto del DNI (frente, con la cara visible).
import { useState } from "react";

export function DocumentUpload({ onNext }: { onNext: (doc: Blob) => void }) {
  const [doc, setDoc] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setDoc(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <section className="app__card">
      <h2>1 · Foto del DNI</h2>
      <p>Subí una foto del <strong>frente</strong> de tu documento (que se vea tu cara).</p>
      <input type="file" accept="image/*" onChange={onPick} />
      {preview && (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="DNI" style={{ maxWidth: "100%", borderRadius: 8 }} />
        </div>
      )}
      <button type="button" disabled={!doc} onClick={() => doc && onNext(doc)}>
        Continuar al escaneo de cara
      </button>
    </section>
  );
}
