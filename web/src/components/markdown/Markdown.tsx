// Intérprete de Markdown (GFM) → bloques renderizados (estilo Obsidian). No permite HTML
// crudo (seguro); permite imágenes embebidas como data URLs (banner / imágenes del cuerpo).
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Markdown.css";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={(u) => u}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
