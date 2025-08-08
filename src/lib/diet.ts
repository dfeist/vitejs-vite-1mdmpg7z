// src/lib/diet.ts — diet metadata, lab prediction, scoring and explanations
import type {CategoryScore, DietKey, LabsMMol } from "../types.ts";
import { SNP_CATEGORIES } from "../data/snpInfo.ts";
import  { categoryScores } from "./interpret.ts";
import  { isHyperAbsorber } from "./phenotypes.ts";

/* ========================
   Diet logic + Expected Labs
======================== */
export const DIET_KEYS: DietKey[] = ["Keto", "Carnivore", "LowCarb", "HighCarb", "Mediterranean"];

export const DIET_INFO: Record<DietKey, {
  label: string;
  macros: string;
  desc: string;
  foods: string[];
  how: string[];
}> = {
  Keto: {
    label: "Keto (<40g carbs)",
    macros: "Carbs <10–15% (~<40g) • Protein 20–30% • Fat 55–70% (low SFA, higher MUFA/PUFA)",
    desc: "Very low carb to promote ketosis. Often lowers TG and improves glycaemia; LDL-C can rise if LDLR clearance is limited or SFA is high.",
    foods: ["fish, eggs", "olive oil, avocado, nuts", "non-starchy veg", "berries (small)", "full-fat dairy if tolerated"],
    how: [
      "Cap carbs at ~20–40g/day; track for 2–3 weeks.",
      "Prioritise unsaturated fats; keep SFA low (butter, coconut) if LDLR risk.",
      "Protein 1.2–1.6 g/kg/day; spread evenly.",
      "Add viscous fibre (psyllium/oats) if LDL climbs."
    ]
  },
  Carnivore: {
    label: "Carnivore",
    macros: "Carbs ~0% • Protein 25–35% • Fat 65–75% (watch SFA)",
    desc: "All-animal foods. Frequently very low TG; LDL-C often rises, especially with low insulin and higher SFA.",
    foods: ["beef, lamb, pork, poultry", "fish, eggs", "animal fats; consider leaner cuts if LDLR risk"],
    how: [
      "Focus on leaner cuts + fish if LDLR risk or hyper-absorber.",
      "Consider adding soluble fibre (supplement) despite diet rules.",
      "Limit butter/tallow; prefer olive oil with fish where possible."
    ]
  },
  LowCarb: {
    label: "Low Carb (60–100g)",
    macros: "Carbs 20–30% (~60–100g) • Protein 25–30% • Fat 40–50%",
    desc: "Lower carbohydrate load without full ketosis. Often lowers TG; easier to sustain than keto with fewer LDL spikes if SFA is kept modest.",
    foods: ["fish, poultry, lean meats", "eggs, Greek yogurt", "veg, salads, berries", "olive oil, nuts"],
    how: [
      "Keep carbs ~60–100g/day from low-GI sources.",
      "Protein 1.2–1.6 g/kg/day; distribute across meals.",
      "SFA <10% kcal if LDLR risk; emphasise MUFA/PUFA."
    ]
  },
  HighCarb: {
    label: "High Carb (150g+)",
    macros: "Carbs 45–60% (≥150g) • Protein 20–25% • Fat 20–30%",
    desc: "Higher carb, lower fat. LDL-C may fall; TG can rise if carbs are refined or if TG/VLDL risk.",
    foods: ["whole grains, legumes", "fruit, starchy veg", "lean proteins", "minimal added sugar"],
    how: [
      "Prefer intact grains/legumes and fruit over juices/sugar.",
      "Keep added sugars low; time higher-carb meals around activity.",
      "Maintain adequate protein for satiety and glycaemia."
    ]
  },
  Mediterranean: {
    label: "Mediterranean",
    macros: "Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%; MUFA/PUFA emphasis)",
    desc: "High fibre + MUFA/PUFA; favourable for LDL lowering and cardio-metabolic risk.",
    foods: ["fish/seafood, poultry", "olive oil, nuts, seeds", "vegetables, legumes, whole grains", "limited sweets/alcohol"],
    how: [
      "Fibre 25–35 g/day; legumes most days.",
      "Olive oil as primary fat; fish 2–3×/week.",
      "Limit refined carbs and alcohol (helps TG)."
    ]
  }
};

// Baseline mmol/L (BMI 25, moderate activity) before SNP adjustments
export const DIET_BASE_MMol: Record<DietKey, LabsMMol> = {
  Keto:          { LDL: 3.6, HDL: 1.4, TG: 0.9 },
  Carnivore:     { LDL: 3.8, HDL: 1.3, TG: 0.9 },
  LowCarb:       { LDL: 3.3, HDL: 1.3, TG: 1.1 },
  HighCarb:      { LDL: 3.0, HDL: 1.0, TG: 1.6 },
  Mediterranean: { LDL: 2.9, HDL: 1.2, TG: 1.1 },
};

export function predictLabsMMol(
  diet: DietKey,
  genotypes: Record<string, string>,
  //cat: Record<CategoryKey, CategoryScore>,
  //bmi: number // currently unused (fixed at 25)
): LabsMMol {
  const base = { ...DIET_BASE_MMol[diet] };
  const ldl = categoryScores(SNP_CATEGORIES["LDL receptor function / cholesterol clearance"], genotypes);
  const tg  = categoryScores(SNP_CATEGORIES["Triglyceride metabolism & VLDL secretion"], genotypes);
  const liver = categoryScores(SNP_CATEGORIES["De novo lipogenesis & hepatic signalling"], genotypes);

  const ldlRisk = ldl.label === "Overall Risk";
  const tgRisk = tg.label === "Overall Risk";
  const liverRisk = liver.label === "Overall Risk";
  const hyperAbs = isHyperAbsorber(genotypes);

  let LDL = base.LDL;
  let HDL = base.HDL;
  let TG  = base.TG;

  if (diet === "Keto" || diet === "Carnivore") {
    if (tgRisk) TG -= 0.3;
    if (ldlRisk) LDL += diet === "Carnivore" ? 0.4 : 0.3;
    if (hyperAbs) LDL += 0.1;
    if (liverRisk && diet === "Keto") { TG -= 0.05; }
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
  if (diet === "HighCarb") {
    if (ldlRisk) LDL -= 0.15;
    if (tgRisk) TG += 0.2;
    if (liverRisk) TG += 0.05;
  }

  LDL = Math.max(1.5, LDL);
  HDL = Math.max(0.6, HDL);
  TG  = Math.max(0.6, TG);

  return { LDL, HDL, TG };
}

export function estimateApoBmgdl(ldlMmol: number, tgMmol: number) {
  // crude heuristic — for UI illustration only
  const ldlMg = ldlMmol * 38.67;
  const tgMg  = tgMmol * 88.57;
  let apoB = 0.95 * ldlMg;          // tracks LDL-C
  if (tgMg > 200) apoB += 20;       // more particles at higher TG
  else if (tgMg > 150) apoB += 10;
  else if (tgMg < 100) apoB -= 5;
  return Math.max(40, Math.round(apoB)); // clamp
}

export function dietBenefitsCautionsTips(
  diet: DietKey,
  genotypes: Record<string, string>,
  cat: Record<CategoryKey, CategoryScore>
) {
  const benefits: string[] = [];
  const cautions: string[] = [];
  const tips: string[] = [];

  const ldlRisk = cat["LDL receptor function / cholesterol clearance"].label === "Overall Risk";
  const tgRisk  = cat["Triglyceride metabolism & VLDL secretion"].label === "Overall Risk";
  const liverRisk = cat["De novo lipogenesis & hepatic signalling"].label === "Overall Risk";
  const insulinRisk = cat["Insulin sensitivity / fat oxidation / carbohydrate tolerance"].label === "Overall Risk";
  const hyperAbs = isHyperAbsorber(genotypes);

  if (diet === "Keto") {
    if (tgRisk) benefits.push("Very low carb strongly reduces TG/remnants.");
    if (insulinRisk) benefits.push("Low insulin exposure may improve glycaemia/appetite.");
    if (ldlRisk) cautions.push("LDLR clearance risk + very low insulin can raise LDL-C if SFA is high.");
    if (hyperAbs) cautions.push("Potential cholesterol sensitivity — moderate eggs/organ meats; add plant sterols.");
    if (liverRisk) cautions.push("Prefer unsaturated fats + higher protein to protect liver.");
    tips.push("Keep SFA low; emphasise olive oil, nuts, fish; add viscous fibre (oats/psyllium).");
  }

  if (diet === "Carnivore") {
    if (tgRisk) benefits.push("Nearly zero carb typically drives TG down.");
    if (insulinRisk) benefits.push("Very low insulin exposure can control appetite/glycaemia.");
    cautions.push("High SFA load may elevate LDL-C, especially with LDLR risk or hyper-absorber pattern.");
    if (hyperAbs) cautions.push("Manage dietary cholesterol; consider leaner cuts and more fish.");
    tips.push("Prefer fish/seafood and leaner cuts; consider fibre supplement for LDL/TG.");
  }

  if (diet === "LowCarb") {
    if (tgRisk) benefits.push("Lower carb load reduces fasting TG.");
    if (insulinRisk) benefits.push("Improves glycaemic control without full ketosis.");
    if (ldlRisk) cautions.push("Keep SFA <10% kcal; prioritise MUFA/PUFA.");
    if (hyperAbs) cautions.push("Moderate very high-cholesterol foods; consider sterols/stanols.");
    if (liverRisk) benefits.push("Higher protein supports liver fat reduction.");
    tips.push("Carbs from veg/berries/legumes; protein 1.2–1.6 g/kg/day.");
  }

  if (diet === "HighCarb") {
    if (ldlRisk) benefits.push("Lower dietary fat can reduce LDL-C.");
    if (tgRisk) cautions.push("Refined carbs/sugars can worsen TG — keep low-GI, fibre-rich sources.");
    if (insulinRisk) cautions.push("High carb load may challenge glycaemia; emphasise whole foods and protein.");
    tips.push("Use intact grains and legumes; time carbs near activity; keep added sugars minimal.");
  }

  if (diet === "Mediterranean") {
    benefits.push("High fibre + MUFA/PUFA supports LDL lowering.");
    if (ldlRisk) benefits.push("Favourable for LDLR impairment vs very-low-carb/high-SFA.");
    if (tgRisk) cautions.push("If TG stubborn, reduce sugars/alcohol; tilt slightly lower-carb.");
    if (hyperAbs) benefits.push("Soluble fibre and plant sterols reduce cholesterol absorption.");
    tips.push("25–35 g/day fibre; olive oil, nuts, fish; limit refined carbs and alcohol.");
  }

  return { benefits, cautions, tips };
}

export function dietFitScore(labsMMol: LabsMMol) {
  const ldlScore = Math.max(0, 1 - Math.max(0, labsMMol.LDL - 3.0) / 1.5);
  const tgScore  = Math.max(0, 1 - Math.max(0, labsMMol.TG  - 1.7) / 0.8);
  const hdlScore = Math.min(1, labsMMol.HDL / 1.2);
  return 0.45 * ldlScore + 0.35 * tgScore + 0.20 * hdlScore;
}

export function whyRecommendedText(
  diet: DietKey,
  phenos: { polyClass: string; hyperAbsorber: boolean },
  cat: Record<CategoryKey, CategoryScore>
) {
  const ldl = cat["LDL receptor function / cholesterol clearance"].label;
  const tg  = cat["Triglyceride metabolism & VLDL secretion"].label;
  const liver = cat["De novo lipogenesis & hepatic signalling"].label;
  const insulin = cat["Insulin sensitivity / fat oxidation / carbohydrate tolerance"].label;

  const bits: string[] = [];
  bits.push(`Genetics summary — LDLR: ${ldl}, TG/VLDL: ${tg}, Liver: ${liver}, Insulin: ${insulin}.`);
  if (phenos.polyClass !== "None") bits.push(`Polygenic classification: ${phenos.polyClass}.`);
  if (phenos.hyperAbsorber) bits.push(`Hyper-absorber (APOE/PCSK9) pattern present.`);
  if (diet === "Keto" || diet === "Carnivore") {
    if (tg === "Overall Risk") bits.push("Very low carb targets TG/VLDL risk directly.");
    if (ldl === "Overall Risk") bits.push("But LDLR risk means watch saturated fat to avoid LDL-C rise.");
  }
  if (diet === "LowCarb") {
    if (tg === "Overall Risk") bits.push("Lower carb intake reduces fasting TG while avoiding deep ketosis.");
    if (ldl === "Overall Risk") bits.push("Moderate fat and lower SFA are friendlier for LDLR impairment.");
  }
  if (diet === "HighCarb") {
    if (ldl === "Overall Risk") bits.push("Lower dietary fat can reduce LDL-C with LDLR constraints.");
    if (tg === "Overall Risk") bits.push("But refine carbs carefully to prevent TG elevation.");
  }
  if (diet === "Mediterranean") {
    if (ldl === "Overall Risk") bits.push("MUFA/PUFA emphasis and fibre support LDL lowering with LDLR risk.");
    if (tg === "Overall Risk") bits.push("Lower alcohol/sugar variant of Mediterranean helps TG.");
  }
  return bits;
}
