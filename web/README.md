# web · Frontend (React + Vite + TypeScript)

La app de beHuman. Landing + flujo de verificación (en progreso). Consume `@behuman/sdk`.

> 📐 Diseño: inspiración [zk.me](https://www.zk.me/) — ver **`web/docs/DESIGN.md`**
> 📐 Flujo KYC en vault: `Flujo de KYC`

## Documentación

Toda la documentación del frontend vive en **`web/docs/`**:

- [Índice](./docs/README.md)
- [Design system](./docs/DESIGN.md)
- [Copy / contenido](./docs/COPY.md)
- [Componentes](./docs/COMPONENTS.md)
- [Implementación](./docs/IMPLEMENTATION.md)

## Desarrollo

```bash
npm install          # desde la raíz del monorepo
npm run dev          # o: npm run dev --workspace @behuman/web
```

Abre http://localhost:5173

## Rama de trabajo

Frontend: `feat/web-onboarding` (una feature = una rama).

## Estructura

```text
web/
├── docs/                 # documentación (design, componentes, changelog)
├── index.html
├── vite.config.ts
└── src/
    ├── content/          # copy centralizado (site.ts)
    ├── components/
    │   ├── hero/         # HeroSection, HeroBackground (canvas)
    │   ├── layout/       # SiteNav, SiteFooter
    │   ├── sections/     # HowItWorks, Stats, Compare
    │   └── ui/           # Button, Badge
    ├── hooks/            # pointer spring/trail, reduced motion
    ├── styles/           # tokens.css, global.css
    ├── test/             # setup vitest
    ├── App.tsx
    └── main.tsx
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + bundle |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |

## Próximos pasos

Ver checklist en [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md).
