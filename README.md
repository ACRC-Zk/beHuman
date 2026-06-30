# human

> **KYC con Zero-Knowledge sobre Stellar** — *proof of personhood*: probás que sos una
> persona real y **única** sin revelar quién sos. Monorepo del producto.

human tiene **dos capas**: una de **identidad** (KYC-ZK, *proof of personhood*) y una de
**aplicación** (plataforma de opinión verificada). Una persona verifica su identidad una vez
(off-chain, sin que su PII toque la cadena), obtiene una identidad **única y anónima**
on-chain, y eso le habilita opinar y publicar como **humano real y único** sin exponer quién
es. Las dos capas se unen por un solo punto: **`is_verified(address)`**.

📚 **La documentación, diseño y decisiones viven en la vault de Obsidian** (repo hermano
`obsidian-vault-zk`). Este repo es **solo el código**. Ver [`docs/`](./docs/README.md).

---

## 🗂️ Estructura del monorepo (por capas)

```text
human/
├── identity/                 # ── CAPA 1 · KYC con ZK ──
│   ├── circuits/             #   Circom — circuito kyc
│   ├── contracts/            #   Soroban — kyc_verifier  ← EL PUENTE (is_verified)
│   └── issuer/               #   mock issuer (firma credenciales)
│
├── platform/                 # ── CAPA 2 · Plataforma de opinión ──
│   ├── contracts/            #   Soroban — opinion_board (ancla: autor + hash)
│   ├── api/                  #   backend: feed, posts, contenido off-chain
│   └── curation/             #   agentes validadores (IA) + moderación humana
│
├── packages/
│   ├── sdk/                  # cliente: prueba ZK + tx Stellar (compartido)
│   └── shared/               # tipos TS compartidos (identidad + plataforma)
│
├── web/                      # React + Vite + TypeScript (frontend único)
├── scripts/                  # deploy_testnet.sh, e2e_demo.sh
└── docs/                     # enlaza a la vault de Obsidian
```

| Capa | Carpeta | Stack |
|---|---|---|
| 1 · Identidad | `identity/circuits` · `identity/contracts/kyc_verifier` · `identity/issuer` | Circom+Groth16 · Rust/Soroban · TS |
| 2 · Plataforma | `platform/contracts/opinion_board` · `platform/api` · `platform/curation` | Rust/Soroban · TS · TS + Claude API |
| Compartido | `packages/sdk` · `packages/shared` · `web` | TypeScript · React+Vite |

> 🌉 La CAPA 2 solo depende de la CAPA 1 por `is_verified(address)`. El contrato
> `opinion_board` exige que el autor esté verificado antes de anclar un post.

---

## 🚀 Quickstart

> Esto es **scaffolding**: la estructura está; la implementación se desarrolla más adelante.

```bash
# Requisitos: Node 20+, Rust + wasm32-unknown-unknown, Stellar CLI, circom + snarkjs
npm install                 # instala los workspaces JS (web, issuer, packages/*)

npm run dev                 # levanta el frontend React (web/)
make contracts-build        # compila los contratos Soroban (ambas capas)
make circuit-compile        # compila el circuito Circom
```

Ver targets disponibles en el [`Makefile`](./Makefile).

---

## 🧱 Estado

- [x] Estructura del monorepo (por capas)
- [ ] **CAPA 1** — Circuito `kyc.circom` (`identity/circuits/`)
- [ ] **CAPA 1** — Contrato `kyc_verifier` (`identity/contracts/`)
- [ ] **CAPA 1** — Issuer mock (`identity/issuer/`)
- [ ] **CAPA 2** — Contrato `opinion_board` (`platform/contracts/`)
- [ ] **CAPA 2** — Backend `api` + curaduría (`platform/api`, `platform/curation`)
- [ ] SDK + tipos compartidos (`packages/`)
- [ ] Frontend React (`web/`)
- [ ] Deploy testnet + demo E2E (`scripts/`)

## 📄 Licencia

Pendiente de definir (la hackathon requiere repo open-source).

---

*Organización: [behuman-org](https://github.com/behuman-org) · Hackathon: Stellar PULSO Hackathon*
