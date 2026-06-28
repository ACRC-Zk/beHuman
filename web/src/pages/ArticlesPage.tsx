// Capa 2 — Artículos (long-form). Cada artículo se ancla on-chain (igual que un tweet) y su
// contentHash lo hace inmutable. Listado con banner + extracto.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { listArticles, type ArticleListItem } from "../feed/articlesApi";
import { formatTimeAgo } from "../feed/feedApi";
import { useI18n } from "../i18n/I18nProvider";
import "./Articles.css";

export function ArticlesPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArticles()
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="bh articles">
      <header className="articles__top">
        <div>
          <p className="bh-eyebrow">Capa 2 · long-form</p>
          <h1 className="bh-h1">Artículos</h1>
          <p className="bh-sub">Publicaciones extensas, ancladas on-chain para que nadie las modifique.</p>
        </div>
        <Button onClick={() => navigate("/app/articles/new")}>Escribir artículo</Button>
      </header>

      {error && <p className="bh-note bh-note--err">No se pudieron cargar los artículos: {error}</p>}
      {items.length === 0 && !error && <p className="bh-note">Todavía no hay artículos. ¡Escribí el primero!</p>}

      <div className="articles__list">
        {items.map((a) => (
          <Link key={a.id} to={`/app/articles/${a.id}`} className="article-card">
            {a.banner && <div className="article-card__banner" style={{ backgroundImage: `url(${a.banner})` }} />}
            <div className="article-card__body">
              <h3 className="article-card__title">{a.title}</h3>
              <p className="article-card__excerpt">{a.excerpt}</p>
              <p className="article-card__meta">
                <span>@{a.handle}</span>
                <span>·</span>
                <span>{formatTimeAgo(a.ts, locale)}</span>
                {a.txHash && /^[0-9a-f]{64}$/i.test(a.txHash) && <span className="article-card__chip">on-chain ✓</span>}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
