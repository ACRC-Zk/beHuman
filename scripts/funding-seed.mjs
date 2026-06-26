// Seed de campañas para probar el Funding ZK (CAPA 3) en local (modo dev).
// Uso: node scripts/funding-seed.mjs   (con la API levantada en FUNDING_API_PORT)
const BASE = process.env.FUNDING_API_URL ?? `http://localhost:${process.env.FUNDING_API_PORT ?? 8789}`;

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`${path} -> HTTP ${r.status} ${await r.text()}`);
    return r.json();
  });

// Firmantes de ejemplo (en dev cualquier address G... sirve; no se firma realmente).
const signers = {
  cause: "GCAUSE_DEV_EXAMPLE_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAA",
  platform: "GPLATFORM_DEV_EXAMPLE_ADDRESS_AAAAAAAAAAAAAAAAAAAAAA",
  neutral: process.env.FUNDING_NEUTRAL_ADDRESS ?? "GNEUTRAL_DEV_EXAMPLE_ADDRESS_AAAAAAAAAAAAAAAAAAAAA",
};

const campaigns = [
  {
    title: "Escuela rural en Salta",
    summary: "Construir dos aulas y comprar material didáctico para 80 chicos.",
    goalAmount: "500",
    deadline: Date.now() + 30 * 24 * 3600 * 1000,
    causeWallet: signers.cause,
    signers,
    milestones: [
      { title: "Comprar materiales de construcción" },
      { title: "Terminar las aulas y entregar material" },
    ],
  },
  {
    title: "Reforestación del bosque nativo",
    summary: "Plantar 3.000 árboles nativos y monitorear su crecimiento un año.",
    goalAmount: "1000",
    deadline: Date.now() + 45 * 24 * 3600 * 1000,
    causeWallet: signers.cause,
    signers,
    milestones: [{ title: "Plantación inicial" }, { title: "Monitoreo y reposición" }],
  },
];

const health = await fetch(`${BASE}/health`).then((r) => r.json()).catch(() => null);
if (!health?.ok) {
  console.error(`❌ La API no responde en ${BASE}. Levantala primero (npm run -w @behuman/funding-api serve).`);
  process.exit(1);
}
console.log(`API OK (provider=${health.provider}, asset=${health.asset})`);

for (const c of campaigns) {
  const created = await post("/campaigns", c);
  console.log(`✅ ${created.title}  id=${created.id}  meta=${created.goalAmount} ${created.asset}`);
}
console.log("\nListo. Abrí la web y entrá a “Funding ZK”.");
