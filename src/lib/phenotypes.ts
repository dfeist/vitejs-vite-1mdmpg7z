import type { CategoryKey, CategoryScore, Phenotypes } from "../types";
import  { MONO_FH_MARKERS, SNP_CATEGORIES } from "../data/snpInfo";
import  { categoryScores } from "./interpret";

export function isHyperAbsorber(genotypes: Record<string, string>) {
  return (
    ((genotypes.rs429358 || "").includes("C") || (genotypes.rs7412 || "").includes("C")) &&
    !(genotypes.rs11591147 || "").includes("T")
  );
}

export const PHENO_DEFAULT: Phenotypes = {
  monoFH: false,
  hyperAbsorber: false,
  polyClass: "None",
  justifications: {
    monoFH: [
      "Monogenic FH (screen): no known APOB/PCSK9 pathogenic markers detected in this file.",
      "Screen is limited to common markers on some consumer arrays; absence does not rule out FH."
    ],
    polyClass: ["Polygenic classification: None (LDLR and TG/VLDL categories are not overall at risk)."],
    hyperAbsorber: ["APOE/PCSK9 pattern not suggestive of hyper-absorption."]
  }
};

export function detectPhenotypes(genotypes: Record<string, string>): Phenotypes {
  const ldl = categoryScores(SNP_CATEGORIES["LDL receptor function / cholesterol clearance"], genotypes);
  const tg  = categoryScores(SNP_CATEGORIES["Triglyceride metabolism & VLDL secretion"], genotypes);

  const monoHits: string[] = [];
  for (const m of MONO_FH_MARKERS) {
    const g = genotypes[m.rsid];
    if (g && g.includes(m.pathogenicAllele)) {
      monoHits.push(`${m.gene} ${m.variant} (${m.rsid}) — detected; ${m.note}`);
    }
  }
  const monoFH = monoHits.length > 0;

  const ldlRisk = ldl.label === "Overall Risk";
  const tgRisk  = tg.label === "Overall Risk";
  let polyClass: Phenotypes["polyClass"] = "None";
  if (ldlRisk && tgRisk) polyClass = "FCHC";
  else if (ldlRisk)      polyClass = "FHC";
  else if (tgRisk)       polyClass = "FHT";

  const hyperAbs = isHyperAbsorber(genotypes);

  const justifications = {
    monoFH: monoFH
      ? [
          "Monogenic FH (screen): POSITIVE.",
          ...monoHits,
          "This is a screen; confirmatory clinical testing may be warranted."
        ]
      : [
          "Monogenic FH (screen): NEGATIVE for APOB R3527Q and PCSK9 D374Y/S127R in this file.",
          "Screen is limited; many LDLR/APOB/PCSK9 variants are not on consumer arrays."
        ],
    polyClass:
      polyClass === "FCHC"
        ? [
            "Polygenic FCHC (combined hypercholesterolaemia + hypertriglyceridaemia).",
            `LDLR category indicates risk (risk ${ldl.riskScore} vs protective ${ldl.protectiveScore}).`,
            `TG/VLDL category indicates risk (risk ${tg.riskScore} vs protective ${tg.protectiveScore}).`,
            ...ldl.hits.slice(0, 5),
            ...tg.hits.slice(0, 5),
          ]
        : polyClass === "FHC"
        ? [
            "Polygenic FHC (hypercholesterolaemia, LDL-dominant).",
            `LDLR category indicates risk (risk ${ldl.riskScore} vs protective ${ldl.protectiveScore}).`,
            ...ldl.hits.slice(0, 8),
          ]
        : polyClass === "FHT"
        ? [
            "Polygenic FHT (hypertriglyceridaemia, TG-dominant).",
            `TG/VLDL category indicates risk (risk ${tg.riskScore} vs protective ${tg.protectiveScore}).`,
            ...tg.hits.slice(0, 8),
          ]
        : ["Polygenic classification: None (LDLR and TG/VLDL categories are not overall at risk)."],
    hyperAbsorber: hyperAbs
      ? [
          (genotypes.rs429358 || "").includes("C") || (genotypes.rs7412 || "").includes("C")
            ? "APOE ε-risk allele present (rs429358 C and/or rs7412 C)."
            : "APOE ε-risk pattern suggested.",
          (genotypes.rs11591147 || "").includes("T")
            ? "PCSK9 LOF protective (rs11591147 T) present — may mitigate absorption-driven LDL."
            : "PCSK9 LOF protective (rs11591147 T) absent — less counterbalance."
        ]
      : ["APOE/PCSK9 pattern not suggestive of hyper-absorption."]
  };

  return { monoFH, hyperAbsorber: hyperAbs, polyClass, justifications };
}

export function detectExtraPhenotypes(genotypes: Record<string, string>, cat: Record<CategoryKey, CategoryScore>) {
  const extras: { label: string; desc: string; icon: string; color: "red" | "green" | "gray" | "amber" | "cyan" | "slate" }[] = [];
  const ldlRisk = cat["LDL receptor function / cholesterol clearance"].label === "Overall Risk";
  const tgRisk  = cat["Triglyceride metabolism & VLDL secretion"].label === "Overall Risk";
  const tgProt  = cat["Triglyceride metabolism & VLDL secretion"].label === "Overall Protective";
  const hdlProt = cat["Insulin sensitivity / fat oxidation / carbohydrate tolerance"].label === "Overall Protective";
  const hyperAbs = isHyperAbsorber(genotypes);
  const insulinRisk = cat["Insulin sensitivity / fat oxidation / carbohydrate tolerance"].label === "Overall Risk";

  if (ldlRisk && (tgProt || !tgRisk) && (hdlProt || !insulinRisk) && !hyperAbs) {
    extras.push({
      label: "Possible LMHR-like response",
      desc: "LDL clearance risk with low TG/neutral HDL pattern may respond with large LDL rise on very low carb.",
      icon: "⚡", color: "amber"
    });
  }
  if (tgRisk && insulinRisk) {
    extras.push({
      label: "Possible insulin-resistant TG pattern",
      desc: "TG/VLDL and insulin signalling both at risk — higher TG likely with high refined carb intake.",
      icon: "🍬", color: "red"
    });
  }
  return extras;
}