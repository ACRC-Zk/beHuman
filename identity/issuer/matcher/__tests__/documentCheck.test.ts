// Anti-fraude: cotejo de datos declarados vs. OCR del DNI (lógica pura, sin OCR real).
import { describe, it, expect } from "vitest";
import { crossCheckData, extractDocNumbers, extractYears, type DocAnalysis } from "../documentCheck.js";

// Helper: DocAnalysis "leído por OCR" con overrides.
const analysis = (over: Partial<DocAnalysis> = {}): DocAnalysis => ({
  hasFace: true,
  text: "REPUBLICA ARGENTINA DOCUMENTO NACIONAL DE IDENTIDAD 12.345.678 NACIMIENTO 1990",
  tokens: 30,
  keywordsFound: 5,
  hasDocNumber: true,
  docNumbers: ["12345678"],
  years: [1990, 2015],
  ...over,
});

// DNI argentino "leído" por OCR: nº 12.345.678, nacido 1990, ARGENTINA.
const dni: DocAnalysis = {
  hasFace: true,
  text: "REPUBLICA ARGENTINA DOCUMENTO NACIONAL DE IDENTIDAD 12.345.678 NACIMIENTO 1990",
  tokens: 30,
  keywordsFound: 5,
  hasDocNumber: true,
  docNumbers: ["12345678"],
  years: [1990, 2015],
};

describe("crossCheckData (anti-fraude)", () => {
  it("acepta cuando los datos coinciden", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
  });

  it("acepta el nº con puntos declarados", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "12.345.678", countryCode: 32 });
    expect(r.ok).toBe(true);
  });

  it("rebota si el año de nacimiento no coincide", () => {
    const r = crossCheckData(dni, { birthYear: 1985, docId: "12345678", countryCode: 32 });
    expect(r.ok).toBe(false);
    expect(r.mismatches).toContain("birth_year");
  });

  it("rebota si el nº de documento no coincide", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "87654321", countryCode: 32 });
    expect(r.ok).toBe(false);
    expect(r.mismatches).toContain("doc_number");
  });

  it("rebota si se declara otro país y el DNI dice otro", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "12345678", countryCode: 76 }); // Brasil
    expect(r.ok).toBe(false);
    expect(r.mismatches).toContain("country");
  });

  it("no penaliza el país si el OCR no detecta ninguno conocido", () => {
    const noCountry: DocAnalysis = { ...dni, text: "DOCUMENTO 12.345.678 NACIMIENTO 1990" };
    const r = crossCheckData(noCountry, { birthYear: 1990, docId: "12345678", countryCode: 76 });
    expect(r.mismatches).not.toContain("country");
  });

  it("acumula múltiples mismatches", () => {
    // 1955 está claramente lejos de los años leídos (1990/2015) → mismatch real, no fuzzy.
    const r = crossCheckData(dni, { birthYear: 1955, docId: "99999999", countryCode: 32 });
    expect(r.mismatches).toEqual(expect.arrayContaining(["doc_number", "birth_year"]));
  });

  it("la contradicción fuerte (otro país claro) marca contradiction=true", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "12345678", countryCode: 76 });
    expect(r.contradiction).toBe(true);
  });

  it("un mismatch blando (nº distinto) NO es contradicción fuerte", () => {
    const r = crossCheckData(dni, { birthYear: 1990, docId: "87654321", countryCode: 32 });
    expect(r.mismatches).toContain("doc_number");
    expect(r.contradiction).toBe(false);
  });
});

// Casos que reproducen los falsos rechazos en producción (OCR ruidoso/incompleto sobre fotos
// de celular) + el ruido típico de OCR. Con datos CORRECTOS no debe haber mismatch.
describe("crossCheckData — robustez ante ruido de OCR (no falsos rechazos)", () => {
  it("USUARIO REAL 1: el OCR NO leyó el nº (docNumbers vacío) → no rebota por doc_number", () => {
    const a = analysis({
      docNumbers: [],
      hasDocNumber: false,
      text: "REPUBLICA ARGENTINA DOCUMENTO NACIONAL DE IDENTIDAD NACIMIENTO 1990",
    });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("doc_number");
    expect(r.ok).toBe(true);
  });

  it("USUARIO REAL 2: el OCR no detectó años → no rebota por birth_year", () => {
    const a = analysis({ years: [], text: "REPUBLICA ARGENTINA DOCUMENTO 12.345.678" });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("birth_year");
    expect(r.ok).toBe(true);
  });

  it("OCR totalmente ilegible (sin nº ni años) → ok, no rebota", () => {
    const a = analysis({ docNumbers: [], years: [], text: "REPUBLICA ARGENTINA DOCUMENTO" });
    const r = crossCheckData(a, { birthYear: 1995, docId: "30111222", countryCode: 32 });
    expect(r.ok).toBe(true);
    expect(r.mismatches).toEqual([]);
  });

  it("nº con confusiones de dígitos (O↔0, I↔1, S↔5, B↔8) igual matchea", () => {
    // El OCR leyó el 12345678 como "I234S67B" (1→I, 5→S, 8→B) en el texto.
    const a = analysis({ docNumbers: [], text: "DOCUMENTO NACIONAL I234S67B NACIMIENTO 1990" });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("doc_number");
  });

  it("nº con un dígito mal leído (Levenshtein 1) igual matchea", () => {
    // Único candidato del OCR = 12345679 (...79 en vez de ...78); el texto no trae otro nº.
    const a = analysis({ docNumbers: ["12345679"], text: "DOCUMENTO NACIONAL NACIMIENTO 1990" });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("doc_number");
  });

  it("nº partido por espacios (12 345 678) se recupera y matchea", () => {
    const a = analysis({ docNumbers: [], text: "DOCUMENTO 12 345 678 ARGENTINA NACIMIENTO 1990" });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("doc_number");
  });

  it("año con un dígito mal leído (1990 vs 1996) se tolera", () => {
    const a = analysis({ years: [1996, 2015] });
    const r = crossCheckData(a, { birthYear: 1990, docId: "12345678", countryCode: 32 });
    expect(r.mismatches).not.toContain("birth_year");
  });
});

describe("extractores tolerantes a OCR", () => {
  it("extractDocNumbers recupera nº con letras confundidas y separadores", () => {
    expect(extractDocNumbers("NRO I2.E45..")).toEqual([]); // no recuperable → vacío, no inventa
    expect(extractDocNumbers("DNI 12.345.678")).toContain("12345678");
    expect(extractDocNumbers("DNI 12 345 678")).toContain("12345678");
    expect(extractDocNumbers("DNI I234S67B")).toContain("12345678");
  });

  it("extractYears detecta años con confusiones de dígitos", () => {
    expect(extractYears("NACIMIENTO 1990")).toContain(1990);
    expect(extractYears("NAC 199O")).toContain(1990); // O→0
  });
});
