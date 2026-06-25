import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("muestra la marca beHuman en la navegación", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /^beHuman$/i })).toBeInTheDocument();
  });

  it("describe las dos capas del protocolo", () => {
    render(<App />);
    const capas = document.getElementById("capas");
    expect(capas).toBeInTheDocument();
    expect(capas?.querySelector(".section-title")).toHaveTextContent(/Dos capas, un solo puente/i);
    expect(document.getElementById("capa-1")).toBeInTheDocument();
    expect(document.getElementById("capa-2")).toBeInTheDocument();
  });

  it("documenta el flujo KYC en cuatro fases", () => {
    render(<App />);
    const section = document.getElementById("como-funciona");
    expect(section?.querySelectorAll(".step-card")).toHaveLength(4);
    expect(section?.textContent).toMatch(/Emisión/i);
    expect(section?.textContent).toMatch(/Consumo/i);
  });

  it("incluye plataforma y curaduría", () => {
    render(<App />);
    const plataforma = document.getElementById("plataforma");
    const curacion = document.getElementById("curacion");
    expect(plataforma?.querySelector(".section-title")).toHaveTextContent(
      /Publicar como humano verificado/i,
    );
    expect(curacion?.querySelector(".section-title")).toHaveTextContent(/Calidad sin censura/i);
  });

  it("expone menú móvil accesible para navegación", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument();
    expect(document.getElementById("site-nav-mobile")).toBeInTheDocument();
  });
});
