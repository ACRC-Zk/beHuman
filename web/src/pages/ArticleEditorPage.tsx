// Capa 2 — Editor de artículo (long-form). Banner + cuerpo markdown con imágenes embebidas.
// "Cotizar" simula la tx real y dice cuánto cuesta anclarlo on-chain (inmutable). "Publicar"
// ancla bajo la identidad anónima (prueba ZK) y guarda el contenido off-chain.
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Markdown } from "../components/markdown/Markdown";
import { loadAnyCredential } from "../kyc/credentialStore";
import { anchorArticle, quoteArticle } from "../identity/article";
import { createArticle } from "../feed/articlesApi";
import "../styles/behuman-ui.css";
import "./Articles.css";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer la imagen"));
    r.readAsDataURL(file);
  });
}

const SAMPLE = `## Introducción

Escribí tu artículo en **Markdown**. Podés usar:

- listas
- **negritas** e *itálicas*
- > citas

\`\`\`
bloques de código
\`\`\`

Y agregar imágenes en el cuerpo con el botón de abajo.`;

export function ArticleEditorPage() {
  const navigate = useNavigate();
  const [cred] = useState(() => loadAnyCredential());
  const [title, setTitle] = useState("");
  const [banner, setBanner] = useState("");
  const [content, setContent] = useState(SAMPLE);
  const [tab, setTab] = useState<"escribir" | "ver">("escribir");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ feeXlm: string } | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  const valid = title.trim().length >= 3 && content.trim().length >= 10;

  async function onBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setBanner(await fileToDataUrl(f));
  }

  async function onInsertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    setContent((c) => `${c}\n\n![imagen](${url})\n`);
    if (imgInput.current) imgInput.current.value = "";
  }

  async function onCotizar() {
    setError(null);
    setQuote(null);
    try {
      setBusy("Generando prueba ZK y simulando la transacción on-chain…");
      const q = await quoteArticle({ title: title.trim(), banner, content });
      setQuote({ feeXlm: q.feeXlm });
      setBusy(null);
    } catch (e) {
      setBusy(null);
      setError(errMsg(e));
    }
  }

  async function onPublicar() {
    setError(null);
    try {
      setBusy("Generando prueba ZK y anclando el artículo on-chain…");
      const anchored = await anchorArticle({ title: title.trim(), banner, content });
      setBusy("Guardando el artículo…");
      const created = await createArticle({
        platformId: anchored.platformId,
        title: title.trim(),
        banner,
        content,
        contentHash: anchored.contentHash,
        txHash: anchored.txHash,
      });
      navigate(`/app/articles/${created.id}`);
    } catch (e) {
      setBusy(null);
      setError(errMsg(e));
    }
  }

  if (!cred) {
    return (
      <div className="bh articles">
        <div className="bh-card">
          <h2 className="bh-h2">Escribir artículo</h2>
          <p className="bh-p">
            Para publicar un artículo primero{" "}
            <Link to="/onboarding" className="bh-back">verificate como humano</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bh articles">
      <Link to="/app/articles" className="bh-back">← Artículos</Link>
      <header style={{ margin: "0.75rem 0 1rem" }}>
        <p className="bh-eyebrow">Nuevo artículo</p>
        <h1 className="bh-h1">Escribí algo que perdure</h1>
        <p className="bh-sub">Se ancla on-chain de forma anónima; nadie podrá modificarlo.</p>
      </header>

      <div className="bh-card">
        <label className="bh-field">
          <span className="bh-label">Título</span>
          <input className="bh-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="El título de tu artículo" />
        </label>

        <span className="bh-label">Banner (portada)</span>
        {banner && <div className="article-banner article-banner--preview" style={{ backgroundImage: `url(${banner})` }} />}
        <div className="bh-actions" style={{ marginBottom: "0.5rem" }}>
          <label className="article-upload">
            {banner ? "Cambiar banner" : "Subir banner"}
            <input type="file" accept="image/*" onChange={onBanner} hidden />
          </label>
          {banner && (
            <Button variant="ghost" onClick={() => setBanner("")}>Quitar</Button>
          )}
        </div>

        <div className="article-tabs">
          <button type="button" className={tab === "escribir" ? "is-active" : ""} onClick={() => setTab("escribir")}>Escribir</button>
          <button type="button" className={tab === "ver" ? "is-active" : ""} onClick={() => setTab("ver")}>Vista previa</button>
        </div>

        {tab === "escribir" ? (
          <>
            <textarea
              className="bh-textarea article-body-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
            />
            <div className="bh-actions">
              <label className="article-upload">
                Insertar imagen
                <input ref={imgInput} type="file" accept="image/*" onChange={onInsertImage} hidden />
              </label>
              <span className="bh-note" style={{ margin: 0 }}>Markdown con bloques tipo Obsidian.</span>
            </div>
          </>
        ) : (
          <div className="article-preview">
            <Markdown>{content || "_(vacío)_"}</Markdown>
          </div>
        )}
      </div>

      {/* Cotizar + Publicar */}
      <div className="bh-card">
        <h2 className="bh-h2">Anclar on-chain</h2>
        <p className="bh-sub">
          Subir el artículo a la blockchain guarda solo un <strong>hash</strong> (no el contenido):
          eso lo vuelve <strong>inmutable</strong> y privado. Coné cuánto cuesta antes de publicar.
        </p>
        <div className="bh-actions">
          <Button variant="secondary" onClick={onCotizar} disabled={!!busy || !valid}>Cotizar</Button>
          <Button onClick={onPublicar} disabled={!!busy || !valid}>Publicar</Button>
        </div>
        {quote && (
          <p className="bh-note bh-note--ok">
            Anclar este artículo cuesta ≈ <strong>{quote.feeXlm} XLM</strong> (tarifa de red Soroban).
            Solo se sube un hash; el contenido queda fuera de la cadena y nadie podrá modificarlo.
          </p>
        )}
        {busy && <p className="bh-note">⏳ {busy}</p>}
        {error && <p className="bh-note bh-note--err">{error}</p>}
      </div>
    </div>
  );
}

function errMsg(e: unknown): string {
  const m = (e as Error).message;
  if (m === "necesitas_verificarte") return "Necesitás verificarte como humano para publicar.";
  return m;
}
