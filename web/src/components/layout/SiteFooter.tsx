import { footer, siteMeta } from "../../content/site";
import "./SiteFooter.css";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span className="site-footer__brand">{siteMeta.name}</span>
        <p className="site-footer__tagline">{footer.tagline}</p>
        <nav className="site-footer__links" aria-label="Enlaces externos">
          {footer.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="site-footer__meta">
          {siteMeta.tagline} · Documentación técnica en <code>web/docs/</code>
        </p>
      </div>
    </footer>
  );
}
