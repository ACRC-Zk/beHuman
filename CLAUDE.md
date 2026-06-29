# beHuman — Guía para agentes de IA

> Leé esto antes de tocar el código. Este archivo encapsula el contexto que vive en la
> **vault de Obsidian** (repo hermano `obsidian-vault-zk`, en `../obsidian-vault-zk/`).

## Qué es beHuman

Proyecto de **dos capas**:
- **CAPA 1 · Identidad (KYC-ZK):** *proof of personhood*. Una persona prueba que es **real y
  única** sin revelar su PII; un contrato Soroban la verifica y registra. Expone el puente
  **`is_verified(address)`**.
- **CAPA 2 · Plataforma de opinión:** personas verificadas opinan y publican artículos/
  estudios como humanos únicos, sin exponer su identidad, con curaduría (agentes IA +
  moderación). Solo depende de la CAPA 1 por `is_verified(address)`.

## ⚠️ Antes de escribir código (regla de Stellar)

1. **Leé `skills.stellar.org`** — en especial la skill **zk-proofs** (verificación Groth16
   con BN254 / Poseidon). Mejora drásticamente el código.
2. Usá las skills instaladas (`stellar-dev-skill`, `openzeppelin-skills`) y `llms.txt`
   (https://developers.stellar.org/llms.txt) como contexto.
3. Seguí los patrones de seguridad de stellar-dev-skill y los detectores de OpenZeppelin
   para todo lo que toque el contrato.

## Decisiones ya tomadas (no reabrir sin avisar)

- **Toolchain ZK: Circom + Groth16** (verificación on-chain más barata, verificador oficial
  de `soroban-examples`). Plan B: Noir/UltraHonk.
- **Monorepo único** (este repo). Docs separadas en la vault de Obsidian.
- Nombre de trabajo: **human**. Organización GitHub: **behuman-org**.

## Estructura (por capas)

| Carpeta | Capa | Qué es |
|---|---|---|
| `identity/circuits/` | 1 | Circuito Circom (`kyc.circom`) |
| `identity/contracts/kyc_verifier/` | 1 | Soroban (`verify_and_register`, `is_verified`) ← **el puente** |
| `identity/issuer/` | 1 | Issuer KYC **mock** (TS) |
| `platform/contracts/opinion_board/` | 2 | Soroban: ancla post (autor verificado + hash) |
| `platform/api/` | 2 | Backend: feed, posts, contenido off-chain (TS) |
| `platform/curation/` | 2 | Agentes validadores (IA, Claude API) + moderación (TS) |
| `packages/sdk/` | — | Prover + orquestación de tx Stellar (TS, compartido) |
| `packages/shared/` | — | Tipos TS compartidos (identidad + plataforma) |
| `web/` | — | Frontend **React + Vite + TS** (único) |
| `scripts/` · `docs/` | — | Deploy/e2e · puente a la vault |

> Los contratos Rust (ambas capas) son miembros del **workspace Cargo raíz** (`/Cargo.toml`):
> `stellar contract build` los compila todos.
> Modelo de identidad en la plataforma: **seudónimo estable** (posts linkeables, PII oculta).
> Contenido de la CAPA 2: **híbrido** (ancla on-chain + contenido off-chain en `api`).

## Dónde está cada cosa en la vault (la fuente de verdad del diseño)

- `IDEA`, `Prueba de Persona Única` — la visión.
- `Flujo de KYC` — las 4 fases (emisión → prueba → verificación → consumo).
- `Diseño del Circuito ZK` — inputs/outputs, commitment, nullifier, riesgos.
- `Contrato Verificador (Soroban)` — la interfaz on-chain.
- `Modelo de Datos` — credencial y storage.
- `09 - Tools/*` — recursos, skills de IA, verificadores de referencia, **Plan de armado con IA**.

## Estado

Esto es **scaffolding**: estructura + stubs con `TODO`. Implementar en el orden de
`09 - Tools/Plan de armado con IA`. **No es un KYC real**: el issuer es un mock (declararlo).

## Convenciones

- Commits: convencionales (`feat:`, `fix:`, `chore:`…).
- Revisión humana obligatoria de la cripto (nullifier, address binding, issuer root).
- Secretos en `.env` (ver `.env.example`); nunca commitear PII ni claves.
