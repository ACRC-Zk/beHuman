# Pollar — onboarding fácil (crear wallet con email) sin romper el anonimato

> Rama: `pollar-onboarding`. Pollar (`@pollar/react`) se integra **solo** como una forma
> amigable de que un usuario sin wallet cree una cuenta Stellar con su email. **No firma nada**
> de beHuman y **no participa del anonimato ZK**, que es la prioridad absoluta.

## Por qué Pollar es custodial (y por qué no puede sostener el anonimato)

El login por email de Pollar genera y guarda la clave en su servidor y firma server-side. Es
**custodial**: Pollar sabe `email → wallet`. Por eso el anonimato de beHuman **no depende** de
la wallet de Pollar. La raíz del anonimato (el `secret`) se crea y vive solo en el dispositivo.

## El modelo: identidad pública (Pollar) ⟂ identidad anónima (ZK), con firewall

```
[Email] --Pollar(custodial)--> [Wallet pública G...]      ← identidad de ENTRADA (opcional)
                                     ⟂  (firewall: sin link)
[secret client-side] --Poseidon(secret, scope)--> [platformId]   ← identidad ANÓNIMA
        └ credencial ZK (matcher) ─ posts/opiniones/donaciones con wallets EFÍMERAS
```

- **Pollar = solo crear la wallet.** Tras el login por email obtenemos `walletAddress` y nada
  más. beHuman **no la usa para firmar** ni la guarda junto al `platformId`.
- **La credencial ZK** (del matcher: DNI + cara → `secret` + camino Merkle) se genera
  **client-side** (`web/src/kyc/credentialStore.ts`) y es lo que habilita la participación.
- **Las acciones anónimas** (posts, opiniones, donaciones) usan **wallets efímeras**
  (`web/src/platform/ephemeral.ts`, fondeadas por friendbot), **nunca** la wallet de Pollar.

## Invariantes (se cumplen)

| # | Invariante | Cómo |
|---|---|---|
| 1 | El `secret` se genera/guarda solo client-side; `platformId` se deriva en el navegador | El flujo Pollar usa `KycFlow mode="credential"` → `randomSecret()` + `computeCommitment` + enroll, igual que hoy. El secret jamás se envía. |
| 2 | La wallet de Pollar es solo entrada pública; las acciones anónimas no la usan | Pollar solo crea la wallet; posts/opiniones/donaciones siguen con efímeras + prueba ZK. |
| 3 | Las efímeras se fondean independiente (friendbot), nunca desde Pollar | `ephemeral.ts` sin cambios; no hay transferencia Pollar → efímera. |
| 4 | El email nunca toca el backend de beHuman ni se mapea a `platformId` | El email vive solo en Pollar (su flujo). beHuman no guarda email ni la wallet de Pollar junto al platformId. |
| 5 | Se SUMA, no reemplaza | Stellar Wallets Kit (Freighter…) sigue intacto para usuarios cripto; Pollar es la ruta email. |

## Qué firma Pollar en beHuman

**Nada.** Decisión de producto: Pollar es únicamente creación de wallet amigable. El registro
on-chain de Capa 1 (`verify_and_register`, un invoke Soroban que requiere firma del titular)
**no** se hace por Pollar — la participación anónima no lo necesita (se gatea por la credencial
ZK + prueba de pertenencia, no por `is_verified(address)`). Si en el futuro se quisiera el
registro on-chain bajo la wallet de Pollar, habría que validar que su SDK firme XDR Soroban
(hoy expone `signAndSubmitTx`/`signTx` pero no documenta soporte Soroban).

## Implementación

- `web/src/identity/pollar.tsx`: `PollarRoot` (monta `<PollarProvider client={{apiKey, stellarNetwork:'testnet'}}>` **solo si** hay `VITE_POLLAR_PUBLISHABLE_KEY`) + `PollarEmailLogin` (botón que abre el modal email/OTP de Pollar y avisa cuando la wallet quedó creada).
- `web/src/main.tsx`: envuelve la app en `PollarRoot`.
- `web/src/pages/AuthPage.tsx`: en "registrarse" agrega **"Crear cuenta con email"** (además de "Conectar wallet"). Al crear la wallet → `/onboarding?via=email`.
- `web/src/kyc/KycFlow.tsx`: nuevo `mode="credential"` → corre el matcher y crea la credencial ZK **sin** conectar wallet ni registrar on-chain.
- `web/src/pages/OnboardingPage.tsx`: `?via=email` → `mode="credential"` + aviso honesto.

## Configuración

`.env` → `VITE_POLLAR_PUBLISHABLE_KEY=` (key de **testnet**, prefijo `pub_testnet_`). Vacío =
la opción de email queda **oculta** (la app funciona igual con Freighter). La red la define el
prefijo de la key.

## Verificación (testnet)

1. Sin wallet: "Crear cuenta con email" → modal de Pollar (email + código) → wallet creada.
2. Onboarding (`?via=email`): DNI + cara → **credencial ZK client-side** (no firma, no on-chain).
3. Participación anónima: opiniones/posts/donaciones con `platformId` + efímeras.
4. Comprobar que **no** hay transferencia desde la wallet de Pollar hacia ninguna efímera
   (las efímeras se fondean por friendbot) → sin rastro Pollar → efímera → opinión.
5. El flujo Freighter sigue funcionando. beHuman no guarda email ni `secret`.

## UX honesta

No afirmamos "no se guarda nada en ningún lado" (Pollar sí guarda su parte). El copy es:
*"Tu email crea tu wallet, pero nunca se vincula a tu identidad anónima."*
