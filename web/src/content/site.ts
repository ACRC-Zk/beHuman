/**
 * Copy de la landing — alineado a README, CLAUDE.md y vault Obsidian.
 * Fuente de verdad del producto: obsidian-vault-zk.
 */

export const siteMeta = {
  name: "beHuman",
  org: "ACRC-Zk",
  tagline: "Proof of personhood con Zero-Knowledge sobre Stellar",
  description:
    "Verificá que sos una persona real y única sin revelar tu identidad. Opiná y publicá como humano verificado, con seudónimo estable y curaduría que no censura.",
};

export const hero = {
  badge: "Proof of personhood · Groth16 · Soroban",
  title: "Una persona real.",
  accent: "Una sola vez. Sin exponer quién sos.",
  lead:
    "beHuman es proof of personhood sobre Stellar: probás en Zero-Knowledge que sos humano único, te registrás on-chain una vez, y accedés a una plataforma donde solo personas verificadas publican opinión, artículos y estudios — con seudónimo estable, sin que tu PII toque la cadena.",
  stackLabel: "Stack open-source del monorepo",
  stackItems: [
    "Stellar",
    "Soroban",
    "Circom",
    "Groth16",
    "BN254",
    "Poseidon",
    "snarkjs",
    "React",
  ],
};

export const layers = {
  label: "Arquitectura",
  title: "Dos capas, un solo puente",
  lead:
    "Identidad ZK y plataforma de opinión son módulos separados. Se conectan únicamente por is_verified(address) en el contrato kyc_verifier — la CAPA 2 nunca ve tu PII.",
  items: [
    {
      id: "capa-1",
      tag: "CAPA 1 · Identidad",
      title: "KYC con Zero-Knowledge",
      body:
        "Una persona prueba que es real y única sin revelar datos personales. El circuito Circom (kyc.circom) genera la prueba Groth16 en tu dispositivo; el contrato Soroban kyc_verifier la verifica y registra tu dirección. Expone el puente is_verified(address) para todo lo demás.",
      bullets: [
        "Issuer mock off-chain (demo — no es KYC bancario real)",
        "Commitment + nullifier: unicidad sin identidad",
        "verify_and_register(proof) → registro on-chain",
      ],
    },
    {
      id: "capa-2",
      tag: "CAPA 2 · Plataforma",
      title: "Opinión verificada",
      body:
        "Personas ya verificadas opinan y publican como humanos únicos. El contrato opinion_board ancla cada post (autor verificado + hash del contenido); el backend api guarda texto y archivos off-chain. Curaduría en dos niveles: agente IA + moderación humana.",
      bullets: [
        "Solo is_verified(address) puede publicar",
        "Seudónimo estable: posts linkeables, PII oculta",
        "Contenido híbrido: ancla on-chain + cuerpo off-chain",
      ],
    },
  ],
};

export const kycFlow = {
  label: "Flujo de KYC",
  title: "Cuatro fases, de credencial a consumo",
  lead:
    "La prueba se computa en tu dispositivo. El verificador on-chain recibe la prueba Groth16 y los public signals — nunca tu documento ni tu nombre.",
  steps: [
    {
      num: "01",
      title: "Emisión",
      body:
        "El issuer mock (identity/issuer) valida una sola vez que sos una persona real y te emite una credencial firmada off-chain. En producción sería un emisor KYC regulado; hoy es scaffolding para la demo.",
      code: "// identity/issuer — mock\nissueCredential({ userId, attributes })",
    },
    {
      num: "02",
      title: "Prueba ZK",
      body:
        "En el navegador, el circuito kyc.circom y snarkjs producen la prueba Groth16: demostrás conocer la credencial válida sin revelar PII. Incluye commitment y nullifier para unicidad.",
      code: "snarkjs.groth16.fullProve(witness, wasm, zkey)",
    },
    {
      num: "03",
      title: "Verificación on-chain",
      body:
        "El contrato kyc_verifier en Soroban verifica la prueba BN254/Poseidon, registra tu dirección Stellar y marca el nullifier como usado. A partir de ahí is_verified(tu_address) === true.",
      code: "kyc_verifier.verify_and_register(proof, pubSignals)",
    },
    {
      num: "04",
      title: "Consumo",
      body:
        "La plataforma — opinion_board, api, feed — solo acepta acciones de direcciones verificadas. Publicás bajo tu address como seudónimo estable; nadie necesita volver a pedirte el DNI.",
      code: "if (kyc_verifier.is_verified(author)) { anchorPost(...) }",
    },
  ],
};

export const platform = {
  label: "Plataforma",
  title: "Publicar como humano verificado",
  lead:
    "Opiniones, artículos y estudios de personas reales — sin bots, sin sybils anónimos, sin exponer quién sos en la vida real.",
  features: [
    {
      title: "Ancla on-chain",
      body:
        "opinion_board registra autor verificado + content_hash. Prueba pública de que un humano único publicó ese contenido en ese momento.",
    },
    {
      title: "Contenido off-chain",
      body:
        "Texto largo, PDFs de estudios y media viven en platform/api (MVP: base de datos; futuro: IPFS/Arweave). Liviano on-chain, rico off-chain.",
    },
    {
      title: "Seudónimo estable",
      body:
        "Tu address Stellar verificada es tu identidad pública en la plaza: posts linkeables entre sí, reputación acumulable, PII real nunca expuesta.",
    },
  ],
  postKinds: ["Opinión", "Artículo", "Estudio"],
};

export const curation = {
  label: "Curaduría",
  title: "Calidad sin censura",
  lead:
    "Dos niveles mantienen veracidad y civilidad. El principio rector: filtrar ruido y abuso, no acallar opiniones legítimas.",
  levels: [
    {
      title: "Agente validador (IA)",
      body:
        "Automático vía Claude API: evalúa veracidad, fuentes citadas, coherencia, toxicidad y plagio. Devuelve aprobado, etiquetado o escalado a humanos.",
    },
    {
      title: "Moderación humana",
      body:
        "Casos ambiguos, sensibles o fuera de criterio del agente entran a una cola para moderadores. La persona tiene la última palabra en lo dudoso.",
    },
  ],
  principle:
    "No perder el criterio de la persona — filtrar ruido/abuso, no censurar.",
};

export const stats = {
  label: "Protocolo",
  title: "Diseñado para verificabilidad",
  items: [
    { value: "2", label: "Capas (identidad + plataforma)" },
    { value: "1", label: "Puente · is_verified(address)" },
    { value: "0", label: "PII almacenada on-chain" },
    { value: "4", label: "Fases del flujo KYC" },
  ],
};

export const compare = {
  label: "Por qué ZK",
  title: "El modelo tradicional vs beHuman",
  lead:
    "KYC clásico concentra riesgo y fricción. beHuman separa identidad (una vez, con ZK) de participación (seudónimo verificado, contenido curado).",
  rows: [
    {
      aspect: "Prueba de persona",
      traditional: "Documento en servidor; confianza en el operador",
      behuman: "Groth16 en tu dispositivo; verificación criptográfica on-chain",
    },
    {
      aspect: "Datos personales",
      traditional: "PII centralizada — objetivo de brechas",
      behuman: "PII off-chain en emisión; cadena solo ve prueba y señales",
    },
    {
      aspect: "Unicidad (anti-sybil)",
      traditional: "Base de datos por plataforma, fácil de evadir",
      behuman: "Nullifier on-chain: una persona, un registro",
    },
    {
      aspect: "Reutilización",
      traditional: "Repetís KYC en cada servicio",
      behuman: "Verificás una vez; is_verified habilita toda la plataforma",
    },
    {
      aspect: "Opinión pública",
      traditional: "Anónimo sin prueba, o identidad real expuesta",
      behuman: "Seudónimo estable: humano verificado, identidad real oculta",
    },
    {
      aspect: "Contenido",
      traditional: "Todo en silos cerrados del operador",
      behuman: "Ancla on-chain + cuerpo off-chain auditable",
    },
    {
      aspect: "Curaduría",
      traditional: "Manual o algoritmos opacos",
      behuman: "Agente IA + escalado humano; principio anti-censura",
    },
  ],
};

export const footer = {
  tagline:
    "Proyecto open-source · ACRC-Zk · Stellar Hacks: Real-World ZK. Issuer KYC mock en demo — no sustituye verificación regulada.",
  links: [
    { label: "Monorepo", href: "https://github.com/ACRC-Zk/beHuman" },
    { label: "Organización", href: "https://github.com/ACRC-Zk" },
  ],
};

export const navLinks = [
  { label: "Arquitectura", href: "#capas" },
  { label: "Flujo KYC", href: "#como-funciona" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Curaduría", href: "#curacion" },
  { label: "Por qué ZK", href: "#compare" },
];
