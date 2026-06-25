import { useEffect, useRef } from "react";
import { usePointerSpring } from "../../hooks/usePointerSpring";
import { usePointerTrail } from "../../hooks/usePointerTrail";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./HeroBackground.css";

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function drawOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Fondo interactivo del hero: orbes naranja/blanco con spring al pointer + trail + dot-grid.
 * Ver web/docs/DESIGN.md § Hero interactivo.
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerRef = usePointerSpring({ enabled: !reducedMotion });
  const { points, decay } = usePointerTrail({ enabled: !reducedMotion });

  useEffect(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      time += reducedMotion ? 0 : 0.004;

      const glowPrimary = cssVar("--hero-glow-primary", "rgba(249, 115, 22, 0.32)");
      const glowSecondary = cssVar("--hero-glow-secondary", "rgba(255, 255, 255, 0.06)");
      const glowTertiary = cssVar("--hero-glow-tertiary", "rgba(249, 115, 22, 0.1)");
      const accentRgb = cssVar("--color-accent-rgb", "249, 115, 22");

      ctx.clearRect(0, 0, w, h);

      const pointer = pointerRef.current;
      const baseX = reducedMotion ? w * 0.5 : pointer.x * w;
      const baseY = reducedMotion ? h * 0.38 : pointer.y * h;
      const drift = Math.sin(time) * 24;

      drawOrb(ctx, baseX + drift, baseY, Math.min(w, h) * 0.42, glowPrimary);
      drawOrb(ctx, baseX - w * 0.18, baseY + h * 0.12, Math.min(w, h) * 0.28, glowSecondary);
      drawOrb(ctx, baseX + w * 0.22, baseY - h * 0.08, Math.min(w, h) * 0.22, glowTertiary);

      if (!reducedMotion) {
        decay();
        for (const point of points.current) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 28 * point.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentRgb}, ${0.08 * point.life})`;
          ctx.fill();
        }

        if (grid) {
          const offsetX = (pointer.x - 0.5) * 18;
          const offsetY = (pointer.y - 0.5) * 18;
          grid.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
      } else if (grid) {
        grid.style.transform = "";
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion, pointerRef, points, decay]);

  return (
    <div className="hero-bg" aria-hidden="true">
      <div ref={gridRef} className="hero-bg__grid" />
      <canvas ref={canvasRef} className="hero-bg__canvas" />
      <div className="hero-bg__vignette" />
    </div>
  );
}
