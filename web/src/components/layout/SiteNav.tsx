import { useState } from "react";
import { navLinks } from "../../content/site";
import { Button } from "../ui/Button";
import "./SiteNav.css";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-nav-shell">
      <header className="site-nav">
        <a href="#" className="site-nav__brand" onClick={closeMenu}>
          beHuman
        </a>

        <nav className="site-nav__links site-nav__links--desktop" aria-label="Principal">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-nav__actions">
          <Button
            variant="ghost"
            disabled
            className="site-nav__wallet"
            title="Próximamente — Stellar Wallets Kit"
          >
            <span className="site-nav__wallet-full">Conectar wallet</span>
            <span className="site-nav__wallet-short" aria-hidden="true">
              Wallet
            </span>
          </Button>
          <button
            type="button"
            className="site-nav__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-nav-mobile"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`site-nav__menu-icon ${menuOpen ? "is-open" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      <nav
        id="site-nav-mobile"
        className={`site-nav__mobile ${menuOpen ? "is-open" : ""}`}
        aria-label="Principal móvil"
        aria-hidden={!menuOpen}
      >
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
