// Ancla de opinión/tweet (Capa 2): delega en el núcleo robusto de anclaje (anchorText),
// que genera la prueba ZK, registra la identidad si hace falta y ancla en opinion_board con
// una cuenta efímera (no la wallet del KYC). La persistencia off-chain la hace el llamador.
import { anchorText, type Anchored } from "./anchor";

export type AnchoredOpinion = Anchored;

export function anchorOpinion(content: string): Promise<AnchoredOpinion> {
  return anchorText(content);
}
