import React, { useEffect, useMemo, useState } from "react";

/**
 * App.tsx — SNP → Phenotype → Diet + Labs (Premium healthcare UI)
 * - Tab 1: Upload / Demo datasets
 * - Tab 2: Full SNP list by category (colour-coded, with descriptions & category summaries)
 * - Tab 3: Phenotype detection (Mono FH*, Poly FH, Poly Combined FH, Hyper-absorber) + justifications
 * - Tab 4: Diet choice + Expected labs (LDL/HDL/TG) with BMI slider (live), units auto-detected (mmol vs mg/dL)
 *
 * Notes:
 * - Monogenic FH: cannot be determined via this consumer SNP panel → flagged as not detectable (explanation provided).
 * - Predictions are heuristic and illustrative; not medical advice.
 */

// ---------- Types (kept simple to avoid TS noise) ----------
type Unit = "mmol" | "mgdl";
type CategoryKey =
  | "LDL receptor function / cholesterol clearance"
  | "Triglyceride metabolism & VLDL secretion"
  | "Insulin sensitivity / fat oxidation / carbohydrate tolerance"
  | "De novo lipogenesis & hepatic signalling";

type SNPInfo = { risk?: string[]; protective?: string[]; evidence: number; effect: number };
type CategoryScores = { label: "Overall Risk" | "Overall Protective" | "Overall Neutral"; color: "red" | "green" | "gray"; riskScore: number; protectiveScore: number; hits: string[] };

type DietKey = "Keto" | "LowCarb" | "ModerateCarb" | "Mediterranean" | "LowFat";

type Phenotypes = {
  monoFH: boolean; // not detectable → always false; justification explains
  polyFH: boolean;
  polyCombinedFH: boolean;
  hyperAbsorber: boolean;
  justifications: {
    monoFH: string[];
    polyFH: string[];
    polyCombinedFH: string[];
    hyperAbsorber: string[];
  };
};

// ---------- SNP definitions (full set we used before) ----------
const SNP_INFO: Record<string, SNPInfo> = {
  // LDL receptor function / cholesterol clearance
  rs429358: { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 }, // APOE
  rs7412: { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 },   // APOE
  rs688: { risk: ["G"], protective: ["A"], evidence: 4, effect: 4 },    // LDLR splicing/uptake
  rs6511720: { protective: ["T"], evidence: 5, effect: 4 },             // LDLR protective
  rs3846662: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },// LDLR
  rs11591147: { protective: ["T"], evidence: 5, effect: 5 },            // PCSK9 LOF protective
  rs1042031: { protective: ["A"], evidence: 3, effect: 3 },             // APOB
  rs693: { risk: ["C"], protective: ["T"], evidence: 3, effect: 3 },    // APOB
  rs6259: { protective: ["A"], evidence: 2, effect: 2 },                // SHBG (minor)

  // Triglyceride metabolism & VLDL secretion
  rs662799: { risk: ["G"], protective: ["A"], evidence: 5, effect: 5 }, // APOA5
  rs3135506: { risk: ["C"], protective: ["G"], evidence: 4, effect: 4 },// APOA5
  rs1260326: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },// GCKR
  rs780094: { risk: ["T"], protective: ["C"], evidence: 4, effect: 4 }, // GCKR
  rs328: { risk: ["C"], protective: ["G"], evidence: 5, effect: 5 },    // LPL S447X protective G
  rs13702: { risk: ["T"], protective: ["A"], evidence: 5, effect: 4 },  // LPL
  rs12678919: { risk: ["A"], protective: ["G"], evidence: 4, effect: 4 },// LPL
  rs10503669: { protective: ["A"], evidence: 3, effect: 3 },            // LPL
  rs1748195: { protective: ["G"], evidence: 3, effect: 3 },             // ANGPTL3
  rs10889353: { protective: ["C"], evidence: 2, effect: 2 },            // ANGPTL3
  rs1044250: { protective: ["C"], evidence: 3, effect: 3 },             // ANGPTL4
  rs11672433: { protective: ["A"], evidence: 3, effect: 3 },            // ANGPTL4
  rs7255436: { protective: ["G"], evidence: 3, effect: 3 },             // ANGPTL4
  rs4846914: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },// GALNT2
  rs5128: { risk: ["G"], protective: ["C"], evidence: 3, effect: 3 },   // APOC3
  rs708272: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 }, // CETP
  rs5882: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },   // CETP

  // Insulin sensitivity / fat oxidation / carbohydrate tolerance
  rs1801282: { risk: ["C"], protective: ["G"], evidence: 3, effect: 3 },// PPARG
  rs7903146: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },// TCF7L2
  rs2943641: { risk: ["C"], protective: ["T"], evidence: 4, effect: 4 },// IRS1 region
  rs9939609: { risk: ["A"], protective: ["T"], evidence: 5, effect: 5 },// FTO
  rs5400: { risk: ["T"], protective: ["C"], evidence: 2, effect: 2 },   // SLC2A2 (GLUT2)

  // De novo lipogenesis & hepatic signalling
  rs738409: { risk: ["G"], protective: ["C"], evidence: 5, effect: 5 }, // PNPLA3
  rs58542926: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },// TM6SF2
  rs2306986: { protective: ["C"], evidence: 3, effect: 3 },             // MTTP
  rs641738: { risk: ["T"], protective: ["C"], evidence: 3, effect: 3 }, // MBOAT7
};

const SNP_CATEGORIES: Record<CategoryKey, string[]> = {
  "LDL receptor function / cholesterol clearance": [
    "rs429358",
    "rs7412",
    "rs688",
    "rs6511720",
    "rs3846662",
    "rs11591147",
    "rs1042031",
    "rs693",
    "rs6259",
  ],
  "Triglyceride metabolism & VLDL secretion": [
    "rs662799",
    "rs3135506",
    "rs1260326",
    "rs780094",
    "rs328",
    "rs13702",
    "rs12678919",
    "rs10503669",
    "rs1748195",
    "rs10889353",
    "rs1044250",
    "rs11672433",
    "rs7255436",
    "rs4846914",
    "rs5128",
    "rs708272",
    "rs5882",
  ],
  "Insulin sensitivity / fat oxidation / carbohydrate tolerance": [
    "rs1801282",
    "rs7903146",
    "rs2943641",
    "rs9939609",
    "rs5400",
  ],
  "De novo lipogenesis & hepatic signalling": [
    "rs738409",
    "rs58542926",
    "rs2306986",
    "rs641738",
  ],
};

const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  "LDL receptor function / cholesterol clearance":
    "Genes affecting LDL receptor binding, APOB/APOE interactions, and clearance of LDL particles from blood.",
  "Triglyceride metabolism & VLDL secretion":
    "Genes regulating hepatic VLDL export, lipoprotein lipase activity, and triglyceride turnover.",
  "Insulin sensitivity / fat oxidation / carbohydrate tolerance":
    "Genes influencing insulin signalling, adiposity risk, and tolerance to carbohydrate loads.",
  "De novo lipogenesis & hepatic signalling":
    "Genes impacting liver fat creation, export and signalling pathways (NAFLD/NASH risk).",
};

// ---------- Demo datasets (3 profiles) ----------
const DEMOS: Record<
  string,
  Record<string, string>
> = {
  "LDLR-risk": {
    rs429358: "CT", rs7412: "CT", rs688: "AG", rs6511720: "GG", rs3846662: "GG",
    rs11591147: "GG", rs1042031: "CC", rs693: "CC", rs6259: "GG",
    rs662799: "GA", rs3135506: "CG", rs1260326: "TC", rs780094: "TC",
    rs328: "CG", rs13702: "AT", rs12678919: "AG", rs10503669: "AC",
    rs1748195: "GC", rs10889353: "CT", rs1044250: "CG", rs11672433: "AG",
    rs7255436: "GC", rs4846914: "AG", rs5128: "GT", rs708272: "AG", rs5882: "AG",
    rs1801282: "CG", rs7903146: "CT", rs2943641: "CT", rs9939609: "AT", rs5400: "CT",
    rs738409: "GC", rs58542926: "TC", rs2306986: "CG", rs641738: "CT",
  },
  "TG-risk": {
    rs429358: "TT", rs7412: "TT", rs688: "AA", rs6511720: "TT", rs3846662: "AA",
    rs11591147: "TT", rs1042031: "AA", rs693: "TT", rs6259: "AA",
    rs662799: "GG", rs3135506: "CC", rs1260326: "TT", rs780094: "TT",
    rs328: "CC", rs13702: "TT", rs12678919: "AA", rs10503669: "AA",
    rs1748195: "GG", rs10889353: "CC", rs1044250: "CC", rs11672433: "AA",
    rs7255436: "GG", rs4846914: "GG", rs5128: "GG", rs708272: "GG", rs5882: "GG",
    rs1801282: "CC", rs7903146: "CC", rs2943641: "TT", rs9939609: "TT", rs5400: "CC",
    rs738409: "CC", rs58542926: "CC", rs2306986: "CC", rs641738: "CC",
  },
  "Mixed": {
    rs429358: "CT", rs7412: "TT", rs688: "AG", rs6511720: "TT", rs3846662: "AG",
    rs11591147: "GT", rs1042031: "AC", rs693: "CT", rs6259: "AG",
    rs662799: "GA", rs3135506: "CG", rs1260326: "TC", rs780094: "TC",
    rs328: "GG", rs13702: "AA", rs12678919: "AG", rs10503669: "AA",
    rs1748195: "GC", rs10889353: "CT", rs1044250: "CG", rs11672433: "AG",
    rs7255436: "GC", rs4846914: "AG", rs5128: "GT", rs708272: "AG", rs5882: "AG",
    rs1801282: "CG", rs7903146: "CT", rs2943641: "CT", rs9939609: "AT", rs5400: "CT",
    rs738409: "GC", rs58542926: "TC", rs2306986: "CG", rs641738: "CT",
  },
};

// ---------- Helpers ----------
function interpretSnp(snp: string, genotype?: string) {
  const info = SNP_INFO[snp];
  if (!info || !genotype) return { status: "Neutral" as const, weight: 0, color: "gray" as const, tooltip: "No call / no known effect." };
  if (info.risk?.some(a => genotype.includes(a))) return { status: "Risk" as const, weight: info.evidence * info.effect, color: "red" as const, tooltip: "Risk-associated allele present." };
  if (info.protective?.some(a => genotype.includes(a))) return { status: "Protective" as const, weight: info.evidence * info.effect, color: "green" as const, tooltip: "Protective allele present." };
  return { status: "Neutral" as const, weight: 0, color: "gray" as const, tooltip: "No strong effect known." };
}

function categoryScores(snps: string[], genotypes: Record<string, string>): CategoryScores {
  let riskScore = 0, protectiveScore = 0;
  const hits: string[] = [];
  for (const snp of snps) {
    const geno = genotypes[snp];
    const { status, weight } = interpretSnp(snp, geno);
    if (status === "Risk")        { riskScore += weight; hits.push(`${snp} (${geno}) → Risk`); }
    else if (status === "Protective") { protectiveScore += weight; hits.push(`${snp} (${geno}) → Protective`); }
  }
  const label: CategoryScores["label"] =
    riskScore > protectiveScore ? "Overall Risk"
    : protectiveScore > riskScore ? "Overall Protective"
    : "Overall Neutral";
  const color: CategoryScores["color"] = label === "Overall Risk" ? "red" : label === "Overall Protective" ? "green" : "gray";
  return { label, color, riskScore, protectiveScore, hits };
}

function defaultUnit(): Unit {
  try {
    const l = navigator.language || "";
    const upper = l.toUpperCase();
    // Americas default to mg/dL (US, CA, MX, BR), else mmol/L
    if (upper.includes("US") || upper.includes("CA") || upper.includes("MX") || upper.includes("BR")) return "mgdl";
  } catch {}
  return "mmol";
}

function mmolToDisplay(valMmol: number, unit: Unit, lipid: "chol" | "tg"): string {
  if (unit === "mmol") return `${valMmol.toFixed(1)} mmol/L`;
  // mg/dL
  const factor = lipid === "tg" ? 88.57 : 38.67;
  return `${Math.round(valMmol * factor)} mg/dL`;
}

function classifyValue(valMmol: number, analyte: "LDL" | "HDL" | "TG", unit: Unit): "green" | "orange" | "red" {
  // Thresholds by region: mmol (ESC/EAS) vs mg/dL (AHA/ACC). We'll compare in mmol for simplicity (convert mg thresholds).
  // mmol thresholds:
  // LDL desirable <3.0; borderline 3.0–3.9; high >=4.0
  // HDL desirable >=1.0; borderline 0.9–1.0; low <0.9
  // TG desirable <1.7; borderline 1.7–2.2; high >=2.3
  if (analyte === "LDL") {
    if (valMmol < 3.0) return "green";
    if (valMmol < 4.0) return "orange";
    return "red";
  }
  if (analyte === "HDL") {
    if (valMmol >= 1.0) return "green";
    if (valMmol >= 0.9) return "orange";
    return "red";
  }
  // TG
  if (valMmol < 1.7) return "green";
  if (valMmol < 2.3) return "orange";
  return "red";
}

// ---------- Phenotype detection ----------
function detectPhenotypes(genotypes: Record<string, string>): Phenotypes {
  const ldl = categoryScores(SNP_CATEGORIES["LDL receptor function / cholesterol clearance"], genotypes);
  const tg  = categoryScores(SNP_CATEGORIES["Triglyceride metabolism & VLDL secretion"], genotypes);

  // Monogenic FH cannot be determined from this consumer SNP panel
  const monoFH = false;

  const polyFH = ldl.label === "Overall Risk";
  const polyCombinedFH = polyFH && tg.label === "Overall Risk";

  const hyperAbsorber = Boolean(
    ((genotypes.rs429358 || "").includes("C") || (genotypes.rs7412 || "").includes("C"))
    && !(genotypes.rs11591147 || "").includes("T") // lack of PCSK9 LOF counterbalance
  );

  const justifications = {
    monoFH: [
      "Monogenic FH not detectable with this SNP panel; requires clinical sequencing (LDLR/APOB/PCSK9).",
      "rs6511720/rs688 are LDLR *modifiers* (polygenic), not diagnostic for mono-FH."
    ],
    polyFH: polyFH ? [
      `LDLR category indicates risk (risk ${ldl.riskScore} vs protective ${ldl.protectiveScore}).`,
      ...ldl.hits
    ] : ["LDLR category not overall at risk."],
    polyCombinedFH: polyCombinedFH ? [
      "Both LDL receptor and TG/VLDL categories trend to risk simultaneously.",
      `LDLR: risk ${ldl.riskScore} vs prot ${ldl.protectiveScore}; TG: risk ${tg.riskScore} vs prot ${tg.protectiveScore}.`
    ] : ["LDLR and TG/VLDL are not jointly at risk."],
    hyperAbsorber: hyperAbsorber ? [
      (genotypes.rs429358 || "").includes("C") || (genotypes.rs7412 || "").includes("C")
        ? "APOE ε-risk allele present (rs429358 C and/or rs7412 C)." : "",
      (genotypes.rs11591147 || "").includes("T") ? "" : "PCSK9 LOF (rs11591147 T) not present → less counterbalance for absorption."
    ].filter(Boolean) as string[] : ["APOE/PCSK9 pattern not suggestive of hyper-absorption."]
  };

  return { monoFH, polyFH, polyCombinedFH, hyperAbsorber, justifications };
}

// ---------- Diet logic + Expected Labs ----------
const DIET_INFO: Record<DietKey, { label: string; macros: string; desc: string }> = {
  Keto:           { label: "Keto / Very Low Carb", macros: "Carbs <10–15% • Protein 20–30% • Fat 55–70%", desc: "Very low carb to promote ketosis. Strong TG reduction; watch LDL-C if LDLR clearance is impaired." },
  LowCarb:        { label: "Low Carb",             macros: "Carbs 15–25% • Protein 25–30% • Fat 45–55%", desc: "Lower carbohydrate load without full ketosis. Often lowers TG; easier to sustain than keto." },
  ModerateCarb:   { label: "Moderate Carb",        macros: "Carbs 30–40% • Protein 25–30% • Fat 30–35%", desc: "Higher-protein, moderate-carb pattern; supportive for liver fat and satiety." },
  Mediterranean:  { label: "Mediterranean",        macros: "Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)", desc: "High fibre, MUFA/PUFA emphasis; favourable for LDL lowering and cardiometabolic risk." },
  LowFat:         { label: "Low Fat",              macros: "Carbs 50–60% • Protein 20–25% • Fat 20–25%", desc: "Lower fat; may help LDL when LDLR risk present, but can worsen TG if refined carbs are high." },
};

// Baseline mmol/L (BMI 25, moderate activity) before SNP adjustments
const DIET_BASE_MMol: Record<DietKey, { LDL: number; HDL: number; TG: number }> = {
  Keto:          { LDL: 3.6, HDL: 1.4, TG: 0.9 },
  LowCarb:       { LDL: 3.3, HDL: 1.3, TG: 1.1 },
  ModerateCarb:  { LDL: 3.1, HDL: 1.2, TG: 1.2 },
  Mediterranean: { LDL: 2.9, HDL: 1.2, TG: 1.1 },
  LowFat:        { LDL: 3.0, HDL: 1.1, TG: 1.3 },
};

function dietBenefitsCautionsTips(diet: DietKey, genotypes: Record<string, string>, cat: Record<CategoryKey, CategoryScores>, phen: Phenotypes) {
  const benefits: string[] = [];
  const cautions: string[] = [];
  const tips: string[] = [];

  const ldlRisk = cat["LDL receptor function / cholesterol clearance"].label === "Overall Risk";
  const tgRisk  = cat["Triglyceride metabolism & VLDL secretion"].label === "Overall Risk";
  const liverRisk = cat["De novo lipogenesis & hepatic signalling"].label === "Overall Risk";
  const insulinRisk = cat["Insulin sensitivity / fat oxidation / carbohydrate tolerance"].label === "Overall Risk";

  const hyperAbs = phen.hyperAbsorber;

  if (diet === "Keto") {
    if (tgRisk) benefits.push("Strong TG reduction with very low carb aligns with your TG/VLDL risk.");
    if (insulinRisk) benefits.push("Lower glucose/insulin exposure can improve glycaemia and appetite control.");
    if (ldlRisk) cautions.push("LDLR clearance risk + low insulin on keto can raise LDL-C if SFA is high.");
    if (hyperAbs) cautions.push("Hyper-absorber pattern → dietary cholesterol sensitivity (eggs/organ meats).");
    if (liverRisk) cautions.push("Prefer unsaturated fats and higher protein to avoid liver fat accumulation.");
    tips.push("Keep SFA very low; emphasise olive oil/avocado/nuts/fish; add viscous fibre (oats/psyllium).");
  }

  if (diet === "LowCarb") {
    if (tgRisk) benefits.push("Lower carb load reduces remnant lipoproteins and fasting TG.");
    if (insulinRisk) benefits.push("Improves glycaemic control without full ketosis.");
    if (ldlRisk) cautions.push("Keep SFA <10% kcal; prefer MUFA/PUFA to avoid LDL-C rise.");
    if (hyperAbs) cautions.push("Moderate high-cholesterol foods; consider plant sterols/stanols.");
    if (liverRisk) benefits.push("With higher protein, supports liver fat reduction.");
    tips.push("Carbs from veg/berries/legumes; avoid sugars; protein 1.2–1.6 g/kg/day.");
  }

  if (diet === "Mediterranean") {
    benefits.push("Fibre, MUFA/PUFA, and plant sterols support LDL lowering.");
    if (ldlRisk) benefits.push("Favourable for LDLR impairment vs very-low-carb/high-SFA patterns.");
    if (tgRisk) cautions.push("If TG remains high, reduce sugars and alcohol, consider lower-carb tilt.");
    if (hyperAbs) benefits.push("Soluble fibre and sterols reduce cholesterol absorption.");
    tips.push("25–35 g/day fibre; olive oil, nuts, fish; limit refined carbs and alcohol.");
  }

  if (diet === "ModerateCarb") {
    if (liverRisk) benefits.push("Higher protein can help reduce liver fat and improve satiety.");
    if (insulinRisk) benefits.push("Protein + resistance training improve insulin sensitivity.");
    if (tgRisk) cautions.push("Choose low-GI carbs to avoid TG spikes.");
    tips.push("Even protein distribution (0.3–0.4 g/kg/meal); low-GI carbs; resistance training 2–3×/week.");
  }

  if (diet === "LowFat") {
    if (ldlRisk) benefits.push("Lower dietary fat can reduce LDL when LDLR clearance is limited.");
    if (tgRisk) cautions.push("If carbs are refined/high-sugar, TG can worsen — prioritise fibre-rich, low-GI carbs.");
    if (insulinRisk) cautions.push("High-carb load may be less favourable with insulin signalling risk.");
    tips.push("Keep carbs minimally processed; emphasise fibre, legumes, intact grains.");
  }

  return { benefits, cautions, tips };
}

function predictLabsMMol(diet: DietKey, genotypes: Record<string, string>, cat: Record<CategoryKey, CategoryScores>, phen: Phenotypes, bmi: number) {
  const base = { ...DIET_BASE_MMol[diet] };
  const ldl = categoryScores(SNP_CATEGORIES["LDL receptor function / cholesterol clearance"], genotypes);
  const tg  = categoryScores(SNP_CATEGORIES["Triglyceride metabolism & VLDL secretion"], genotypes);
  const liver = categoryScores(SNP_CATEGORIES["De novo lipogenesis & hepatic signalling"], genotypes);

  const ldlRisk = ldl.label === "Overall Risk";
  const tgRisk = tg.label === "Overall Risk";
  const liverRisk = liver.label === "Overall Risk";
  const hyperAbs = phen.hyperAbsorber;

  // SNP adjustments (mmol/L)
  let LDL = base.LDL;
  let HDL = base.HDL;
  let TG  = base.TG;

  // Diet-specific interactions with categories
  if (diet === "Keto") {
    if (tgRisk) TG -= 0.3;
    if (ldlRisk) LDL += 0.3;
    if (hyperAbs) LDL += 0.1;
    if (liverRisk) { TG -= 0.05; /* keep protein higher */ }
  }
  if (diet === "LowCarb") {
    if (tgRisk) TG -= 0.2;
    if (ldlRisk) LDL += 0.1;
    if (hyperAbs) LDL += 0.05;
  }
  if (diet === "Mediterranean") {
    if (ldlRisk) LDL -= 0.25;
    if (tgRisk) TG -= 0.1;
  }
  if (diet === "ModerateCarb") {
    if (liverRisk) { TG -= 0.05; HDL += 0.05; }
    if (tgRisk) TG -= 0.05;
  }
  if (diet === "LowFat") {
    if (ldlRisk) LDL -= 0.1;
    if (tgRisk) TG += 0.1; // high-carb risk
  }

  // BMI scaling (relative to 25; modest effect sizes)
  const dBMI = bmi - 25;
  LDL *= 1 + 0.005 * dBMI;        // LDL small slope
  TG  *= 1 + 0.03 * dBMI * 0.8;   // TG more BMI-sensitive
  HDL *= 1 - 0.01 * dBMI * 0.5;   // HDL declines with BMI

  // floor minimums
  LDL = Math.max(1.5, LDL);
  HDL = Math.max(0.6, HDL);
  TG  = Math.max(0.6, TG);

  return { LDL, HDL, TG };
}

function dietFitScore(labsMMol: { LDL: number; HDL: number; TG: number }) {
  // Lower LDL, lower TG, higher HDL preferred. Simple composite with rough scaling.
  // Normalize around desirable cut-points: LDL 3.0, TG 1.7, HDL 1.0
  const ldlScore = Math.max(0, 1 - Math.max(0, labsMMol.LDL - 3.0) / 1.5); // drops if above 3.0
  const tgScore  = Math.max(0, 1 - Math.max(0, labsMMol.TG  - 1.7) / 0.8);
  const hdlScore = Math.min(1, labsMMol.HDL / 1.2);
  // Weighted
  return 0.45 * ldlScore + 0.35 * tgScore + 0.20 * hdlScore;
}

// ---------- App ----------
export default function App() {
  const [tab, setTab] = useState<1 | 2 | 3 | 4>(1);
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<Unit>(defaultUnit());
  const [bmi, setBmi] = useState<number>(() => {
    const saved = localStorage.getItem("bmi");
    return saved ? Number(saved) : 25;
  });
  const [activeDiet, setActiveDiet] = useState<DietKey>("Mediterranean");
  const [demoKey, setDemoKey] = useState<keyof typeof DEMOS>("Mixed");

  useEffect(() => localStorage.setItem("bmi", String(bmi)), [bmi]);

  const categoryMap = useMemo(() => {
    const out = {} as Record<CategoryKey, CategoryScores>;
    (Object.keys(SNP_CATEGORIES) as CategoryKey[]).forEach((k) => {
      out[k] = categoryScores(SNP_CATEGORIES[k], genotypes);
    });
    return out;
  }, [genotypes]);

  const phenotypes = useMemo<Phenotypes>(() => detectPhenotypes(genotypes), [genotypes]);

  // Rank diets to auto-pick best
  const rankedDiets = useMemo(() => {
    const items: { key: DietKey; score: number; labs: { LDL: number; HDL: number; TG: number } }[] = [];
    (["Keto","LowCarb","ModerateCarb","Mediterranean","LowFat"] as DietKey[]).forEach(d => {
      const labs = predictLabsMMol(d, genotypes, categoryMap, phenotypes, bmi);
      const score = dietFitScore(labs);
      items.push({ key: d, score, labs });
    });
    items.sort((a,b)=> b.score - a.score);
    return items;
  }, [genotypes, categoryMap, phenotypes, bmi]);

  useEffect(() => {
    // Auto-select best diet when data changes
    if (rankedDiets.length) setActiveDiet(rankedDiets[0].key);
  }, [rankedDiets.length]); // eslint-disable-line

  const unitToggle = () => setUnit(u => u === "mmol" ? "mgdl" : "mmol");

  // ---------- File handling ----------
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => alert("Failed to read file. Try again.");
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const snpMap: Record<string, string> = {};
      const needed = new Set(Object.keys(SNP_INFO));
      text.split(/\r?\n/).forEach(line => {
        if (!line || line[0] === "#") return;
        const parts = line.split(/\t|,/);
        if (parts.length >= 4) {
          const rsid = parts[0].trim();
          if (needed.has(rsid)) {
            const genotype = parts[3].trim();
            snpMap[rsid] = genotype;
          }
        }
      });
      setGenotypes(snpMap);
      setTab(2);
    };
    reader.readAsText(file);
  }

  function loadDemo(which: keyof typeof DEMOS) {
    setDemoKey(which);
    setGenotypes(DEMOS[which]);
    setTab(2);
  }

  // ---------- UI helpers ----------
  const chip = (label: string, color: "red" | "green" | "gray") => (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${color === "red" ? "bg-red-100 text-red-700" : color === "green" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );

  const phenoBadge = (ok: boolean, label: string, tips: string[]) => (
    <div className={`flex items-start gap-2 px-2 py-1 rounded ${ok ? "bg-green-50" : "bg-gray-50"}`} title={tips.join(" • ")}>
      <span className={`mt-0.5 ${ok ? "text-green-600" : "text-gray-500"}`}>{ok ? "✅" : "❌"}</span>
      <span className="text-sm">{label}</span>
    </div>
  );

  // ---------- Layout ----------
  return (
    <div className="max-w-6xl mx-auto p-5 text-slate-800">
      {/* Header / Wizard Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">🧬 Genetics → Phenotypes → Diet & Labs</h1>
        <div className="flex gap-2">
          {[1,2,3,4].map(n => (
            <button key={n}
              className={`px-3 py-1 rounded border ${tab===n? "bg-cyan-700 text-white border-cyan-700" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
              onClick={()=>setTab(n)}
            >
              {n===1?"1. Upload":n===2?"2. SNPs":n===3?"3. Phenotypes":"4. Diet + Labs"}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky phenotype summary */}
      {Object.keys(genotypes).length > 0 && (
        <div className="sticky top-0 z-10 mb-4 p-3 bg-white/90 backdrop-blur rounded border shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold">Phenotypes:</div>
            {phenoBadge(false, "Mono FH (not detectable via SNP panel)", phenotypes.justifications.monoFH)}
            {phenoBadge(phenotypes.polyFH, "Polygenic FH", phenotypes.justifications.polyFH)}
            {phenoBadge(phenotypes.polyCombinedFH, "Polygenic Combined FH", phenotypes.justifications.polyCombinedFH)}
            {phenoBadge(phenotypes.hyperAbsorber, "Hyper-absorber (APOE/PCSK9)", phenotypes.justifications.hyperAbsorber)}
          </div>
        </div>
      )}

      {/* TABS */}
      {tab===1 && (
        <div className="grid gap-4">
          <div className="p-4 bg-white border rounded shadow-sm">
            <h2 className="font-semibold mb-2">Upload SelfDecode / 23andMe-style file</h2>
            <input type="file" accept=".txt,.csv" onChange={handleFile} className="border p-2 w-full"/>
            <p className="text-xs text-slate-600 mt-2">We read only the SNPs needed for this analysis; other rows are ignored.</p>
          </div>

          <div className="p-4 bg-white border rounded shadow-sm">
            <h2 className="font-semibold mb-2">…or load a demo dataset</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DEMOS).map(k => (
                <button key={k} onClick={()=>loadDemo(k as keyof typeof DEMOS)}
                        className="px-3 py-1.5 rounded border bg-slate-50 hover:bg-slate-100">
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={Object.keys(genotypes).length===0}
              onClick={()=>setTab(2)}
              className={`px-4 py-2 rounded ${Object.keys(genotypes).length? "bg-cyan-700 text-white":"bg-slate-200 text-slate-500 cursor-not-allowed"}`}
            >
              Next → SNPs
            </button>
          </div>
        </div>
      )}

      {tab===2 && (
        <div className="grid gap-5">
          {(Object.keys(SNP_CATEGORIES) as CategoryKey[]).map((category) => {
            const snps = SNP_CATEGORIES[category];
            const sum = categoryMap[category];
            return (
              <div key={category} className="p-4 bg-white border rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {category} — <span className={`${sum.color==="red"?"text-red-600":sum.color==="green"?"text-green-600":"text-slate-500"}`}>{sum.label}</span>
                  </h3>
                  <div>
                    {chip(`Risk ${sum.riskScore}`, "red")}
                    {chip(`Protective ${sum.protectiveScore}`, "green")}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{CATEGORY_DESCRIPTIONS[category]}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-1 pr-3">rsID</th>
                        <th className="py-1 pr-3">Genotype</th>
                        <th className="py-1 pr-3">Call</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snps.map(snp => {
                        const g = genotypes[snp];
                        const { status, color, tooltip } = interpretSnp(snp, g);
                        return (
                          <tr key={snp} className={`${color==="red"?"bg-red-50":color==="green"?"bg-green-50":"bg-white"}`}>
                            <td className="py-1 pr-3 font-mono">{snp}</td>
                            <td className="py-1 pr-3">{g || "❌ Not found"}</td>
                            <td className="py-1 pr-3">
                              <span title={tooltip} className={`px-2 py-0.5 rounded ${color==="red"?"bg-red-100 text-red-700":color==="green"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-600"}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between">
            <button onClick={()=>setTab(1)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={()=>setTab(3)} className="px-4 py-2 rounded bg-cyan-700 text-white">Next → Phenotypes</button>
          </div>
        </div>
      )}

      {tab===3 && (
        <div className="grid gap-5">
          <div className="p-4 bg-white border rounded shadow-sm">
            <h3 className="font-semibold mb-2">Phenotype Detection</h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded border" title={phenotypes.justifications.monoFH.join(" • ")}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{phenotypes.monoFH ? "✅" : "❌"}</span>
                  <span className="font-medium">Monogenic FH</span>
                </div>
                <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                  {phenotypes.justifications.monoFH.map((j,i)=><li key={i}>{j}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded border" title={phenotypes.justifications.polyFH.join(" • ")}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{phenotypes.polyFH ? "✅" : "❌"}</span>
                  <span className="font-medium">Polygenic FH (LDLR-risk)</span>
                </div>
                <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                  {phenotypes.justifications.polyFH.map((j,i)=><li key={i}>{j}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded border" title={phenotypes.justifications.polyCombinedFH.join(" • ")}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{phenotypes.polyCombinedFH ? "✅" : "❌"}</span>
                  <span className="font-medium">Polygenic Combined FH (LDLR + TG)</span>
                </div>
                <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                  {phenotypes.justifications.polyCombinedFH.map((j,i)=><li key={i}>{j}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded border" title={phenotypes.justifications.hyperAbsorber.join(" • ")}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{phenotypes.hyperAbsorber ? "✅" : "❌"}</span>
                  <span className="font-medium">Hyper-absorber (APOE/PCSK9)</span>
                </div>
                <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                  {phenotypes.justifications.hyperAbsorber.map((j,i)=><li key={i}>{j}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={()=>setTab(2)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={()=>setTab(4)} className="px-4 py-2 rounded bg-cyan-700 text-white">Next → Diet + Labs</button>
          </div>
        </div>
      )}

      {tab===4 && (
        <div className="grid gap-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-white border rounded shadow-sm">
              <div className="text-sm text-slate-600">Units</div>
              <button onClick={unitToggle} className="mt-1 px-3 py-1 rounded border bg-slate-50 hover:bg-slate-100">
                {unit === "mmol" ? "mmol/L (click to switch to mg/dL)" : "mg/dL (click to switch to mmol/L)"}
              </button>
            </div>
            <div className="grow p-3 bg-white border rounded shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600">BMI (assume moderate activity):</div>
                <input type="range" min={18} max={35} step={0.5} value={bmi} onChange={e=>setBmi(+e.target.value)} className="w-64"/>
                <div className="font-semibold">{bmi}</div>
              </div>
            </div>
          </div>

          {/* Diet ranking cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {rankedDiets.map(({ key, score, labs }) => {
              const isActive = activeDiet === key;
              const info = DIET_INFO[key];
              const { benefits, cautions, tips } = dietBenefitsCautionsTips(key, genotypes, categoryMap, phenotypes);

              const LDLc = classifyValue(labs.LDL, "LDL", unit);
              const HDLc = classifyValue(labs.HDL, "HDL", unit);
              const TGc  = classifyValue(labs.TG,  "TG",  unit);

              const cardBorder = isActive ? "border-cyan-700" : "border-slate-200";
              const cardRing = isActive ? "ring-2 ring-cyan-200" : "";
              return (
                <div key={key}
                     className={`p-4 bg-white border rounded shadow-sm ${cardBorder} ${cardRing}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{info.label}</h3>
                      <div className="text-sm text-slate-600">{info.macros}</div>
                    </div>
                    <button onClick={()=>setActiveDiet(key)}
                            className={`ml-3 px-3 py-1 rounded ${isActive? "bg-cyan-700 text-white":"bg-slate-100"}`}>
                      {isActive ? "Selected" : "Select"}
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{info.desc}</p>

                  {/* Expected labs */}
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Expected labs (live, BMI-adjusted)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`p-2 rounded border ${LDLc==="red"?"border-red-300 bg-red-50":LDLc==="orange"?"border-amber-300 bg-amber-50":"border-green-300 bg-green-50"}`}
                           title="Colour based on local desirable ranges.">
                        <div className="text-xs text-slate-500">LDL</div>
                        <div className="font-semibold">
                          {mmolToDisplay(labs.LDL, unit, "chol")}
                        </div>
                      </div>
                      <div className={`p-2 rounded border ${HDLc==="red"?"border-red-300 bg-red-50":HDLc==="orange"?"border-amber-300 bg-amber-50":"border-green-300 bg-green-50"}`}>
                        <div className="text-xs text-slate-500">HDL</div>
                        <div className="font-semibold">
                          {mmolToDisplay(labs.HDL, unit, "chol")}
                        </div>
                      </div>
                      <div className={`p-2 rounded border ${TGc==="red"?"border-red-300 bg-red-50":TGc==="orange"?"border-amber-300 bg-amber-50":"border-green-300 bg-green-50"}`}>
                        <div className="text-xs text-slate-500">TG</div>
                        <div className="font-semibold">
                          {mmolToDisplay(labs.TG, unit, "tg")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why good/bad & tips */}
                  <div className="mt-3 grid gap-2">
                    {benefits.length>0 && (
                      <div>
                        <div className="text-sm font-medium">Why this may suit your genetics</div>
                        <ul className="list-disc ml-5 text-sm">
                          {benefits.map((b,i)=><li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                    {cautions.length>0 && (
                      <div>
                        <div className="text-sm font-medium">Cautions</div>
                        <ul className="list-disc ml-5 text-sm">
                          {cautions.map((c,i)=><li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    {tips.length>0 && (
                      <div>
                        <div className="text-sm font-medium">Tips tailored to your SNPs</div>
                        <ul className="list-disc ml-5 text-sm">
                          {tips.map((t,i)=><li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Fit score */}
                  <div className="mt-3 text-xs text-slate-500">Fit score: {(score*100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button onClick={()=>setTab(3)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={()=>setTab(1)} className="px-4 py-2 rounded border bg-slate-100">Start over</button>
          </div>
        </div>
      )}
    </div>
  );
}
