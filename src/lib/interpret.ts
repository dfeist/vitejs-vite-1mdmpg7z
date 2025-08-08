import type { CategoryScore, Unit } from "../types.ts";
import { SNP_INFO } from "../data/snpInfo.ts";

export function interpretSnp(snp: string, genotype?: string) {
  const info = SNP_INFO[snp];
  if (!info || !genotype)
    return { status: "Neutral" as const, weight: 0, color: "gray" as const, tooltip: "No call / no known effect." };
  if (info.risk?.some(a => genotype.includes(a)))
    return { status: "Risk" as const, weight: info.evidence * info.effect, color: "red" as const, tooltip: "Risk-associated allele present." };
  if (info.protective?.some(a => genotype.includes(a)))
    return { status: "Protective" as const, weight: info.evidence * info.effect, color: "green" as const, tooltip: "Protective allele present." };
  return { status: "Neutral" as const, weight: 0, color: "gray" as const, tooltip: "No strong effect known." };
}

export function categoryScores(snps: string[], genotypes: Record<string, string>): CategoryScore {
  let riskScore = 0, protectiveScore = 0;
  const hits: string[] = [];
  for (const snp of snps) {
    const geno = genotypes[snp];
    const { status, weight } = interpretSnp(snp, geno);
    if (status === "Risk")        { riskScore += weight; hits.push(`${snp} (${geno}) → Risk`); }
    else if (status === "Protective") { protectiveScore += weight; hits.push(`${snp} (${geno}) → Protective`); }
  }
  const label: CategoryScore["label"] =
    riskScore > protectiveScore ? "Overall Risk"
    : protectiveScore > riskScore ? "Overall Protective"
    : "Overall Neutral";
  const color: CategoryScore["color"] = label === "Overall Risk" ? "red" : label === "Overall Protective" ? "green" : "gray";
  return { label, color, riskScore, protectiveScore, hits };
}

export function defaultUnit(): Unit {
  try {
    const l = navigator.language || "";
    const upper = l.toUpperCase();
    if (upper.includes("US")) return "mgdl";
  } catch {}
  return "mmol";
}

export function mmolToDisplay(valMmol: number, unit: Unit, lipid: "chol" | "tg"): string {
  if (unit === "mmol") return `${valMmol.toFixed(1)} mmol/L`;
  const factor = lipid === "tg" ? 88.57 : 38.67;
  return `${Math.round(valMmol * factor)} mg/dL`;
}

export function classifyValue(valMmol: number, analyte: "LDL" | "HDL" | "TG"): "green" | "orange" | "red" {
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
  if (valMmol < 1.7) return "green";
  if (valMmol < 2.3) return "orange";
  return "red";
}