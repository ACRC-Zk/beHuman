// Artículo (Capa 2, long-form): misma transacción on-chain que un tweet, pero el contentHash
// cubre TODO el artículo (título + banner + cuerpo markdown) → cualquier cambio rompe el hash
// (inmutable). Privacidad: se ancla bajo la identidad anónima (platformId), cero PII.
import { anchorText, quoteText, type Anchored } from "./anchor";

export interface ArticlePayload {
  title: string;
  banner: string; // data URL (o "")
  content: string; // markdown
}

/** Cadena canónica que se hashea on-chain: atar título + banner + cuerpo. */
export function articleCanonical(p: ArticlePayload): string {
  return JSON.stringify({ t: p.title, b: p.banner, c: p.content });
}

export function quoteArticle(p: ArticlePayload) {
  return quoteText(articleCanonical(p));
}

export function anchorArticle(p: ArticlePayload): Promise<Anchored> {
  return anchorText(articleCanonical(p));
}
