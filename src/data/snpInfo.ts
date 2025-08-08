import type { CategoryKey, SNPInfo } from "../types.ts";

export const SNP_INFO: Record<string, SNPInfo> = {
  rs429358: { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 },
  rs7412:   { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 },
  rs688:    { risk: ["G"], protective: ["A"], evidence: 4, effect: 4 },
  rs6511720:{ protective: ["T"], evidence: 5, effect: 4 },
  rs3846662:{ risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs11591147:{ protective: ["T"], evidence: 5, effect: 5 },
  rs1042031:{ protective: ["A"], evidence: 3, effect: 3 },
  rs693:    { risk: ["C"], protective: ["T"], evidence: 3, effect: 3 },
  rs6259:   { protective: ["A"], evidence: 2, effect: 2 },
  rs662799: { risk: ["G"], protective: ["A"], evidence: 5, effect: 5 },
  rs3135506:{ risk: ["C"], protective: ["G"], evidence: 4, effect: 4 },
  rs1260326:{ risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs780094: { risk: ["T"], protective: ["C"], evidence: 4, effect: 4 },
  rs328:    { risk: ["C"], protective: ["G"], evidence: 5, effect: 5 },
  rs13702:  { risk: ["T"], protective: ["A"], evidence: 5, effect: 4 },
  rs12678919:{ risk: ["A"], protective: ["G"], evidence: 4, effect: 4 },
  rs10503669:{ protective: ["A"], evidence: 3, effect: 3 },
  rs1748195:{ protective: ["G"], evidence: 3, effect: 3 },
  rs10889353:{ protective: ["C"], evidence: 2, effect: 2 },
  rs1044250:{ protective: ["C"], evidence: 3, effect: 3 },
  rs11672433:{ protective: ["A"], evidence: 3, effect: 3 },
  rs7255436:{ protective: ["G"], evidence: 3, effect: 3 },
  rs4846914:{ risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs5128:   { risk: ["G"], protective: ["C"], evidence: 3, effect: 3 },
  rs708272: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs5882:   { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs1801282:{ risk: ["C"], protective: ["G"], evidence: 3, effect: 3 },
  rs7903146:{ risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs2943641:{ risk: ["C"], protective: ["T"], evidence: 4, effect: 4 },
  rs9939609:{ risk: ["A"], protective: ["T"], evidence: 5, effect: 5 },
  rs5400:   { risk: ["T"], protective: ["C"], evidence: 2, effect: 2 },
  rs738409: { risk: ["G"], protective: ["C"], evidence: 5, effect: 5 },
  rs58542926:{ risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs2306986:{ protective: ["C"], evidence: 3, effect: 3 },
  rs641738: { risk: ["T"], protective: ["C"], evidence: 3, effect: 3 },
};

export const SNP_CATEGORIES: Record<CategoryKey, string[]> = {
  "LDL receptor function / cholesterol clearance": [
    "rs429358","rs7412","rs688","rs6511720","rs3846662","rs11591147","rs1042031","rs693","rs6259",
  ],
  "Triglyceride metabolism & VLDL secretion": [
    "rs662799","rs3135506","rs1260326","rs780094","rs328","rs13702","rs12678919","rs10503669","rs1748195",
    "rs10889353","rs1044250","rs11672433","rs7255436","rs4846914","rs5128","rs708272","rs5882",
  ],
  "Insulin sensitivity / fat oxidation / carbohydrate tolerance": [
    "rs1801282","rs7903146","rs2943641","rs9939609","rs5400",
  ],
  "De novo lipogenesis & hepatic signalling": [
    "rs738409","rs58542926","rs2306986","rs641738",
  ],
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  "LDL receptor function / cholesterol clearance":
    "Genes affecting LDL receptor binding, APOB/APOE interactions, and clearance of LDL particles from blood.",
  "Triglyceride metabolism & VLDL secretion":
    "Genes regulating hepatic VLDL export, lipoprotein lipase activity, and triglyceride turnover.",
  "Insulin sensitivity / fat oxidation / carbohydrate tolerance":
    "Genes influencing insulin signalling, adiposity risk, and tolerance to carbohydrate loads.",
  "De novo lipogenesis & hepatic signalling":
    "Genes impacting liver fat creation, export and signalling pathways (NAFLD/NASH risk).",
};

export const MONO_FH_MARKERS = [
  { rsid: "rs5742904",   gene: "APOB",  variant: "p.Arg3527Gln (R3527Q)", pathogenicAllele: "A", note: "APOB pathogenic variant linked to FH." },
  { rsid: "rs137852912", gene: "PCSK9", variant: "p.Asp374Tyr (D374Y)",   pathogenicAllele: "A", note: "PCSK9 GOF; raises LDL-C." },
  { rsid: "rs28942111",  gene: "PCSK9", variant: "p.Ser127Arg (S127R)",   pathogenicAllele: "G", note: "PCSK9 GOF; raises LDL-C." },
];

export const DEMOS: Record<string, Record<string, string>> = {
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
  "MonoFH-positive": {
    rs5742904: "GA",
    rs137852912: "GG",
    rs28942111: "AA",
    rs429358: "CT", rs7412: "CT", rs688: "AG", rs6511720: "GG", rs3846662: "GG",
    rs11591147: "GG", rs1042031: "CC", rs693: "CC", rs6259: "GG",
    rs662799: "GA", rs3135506: "CG", rs1260326: "TC", rs780094: "TC",
    rs328: "CG", rs13702: "AT", rs12678919: "AG", rs10503669: "AC",
    rs1748195: "GC", rs10889353: "CT", rs1044250: "CG", rs11672433: "AG",
    rs7255436: "GC", rs4846914: "AG", rs5128: "GT", rs708272: "AG", rs5882: "AG",
    rs1801282: "CG", rs7903146: "CT", rs2943641: "CT", rs9939609: "AT", rs5400: "CT",
    rs738409: "GC", rs58542926: "TC", rs2306986: "CG", rs641738: "CT",
  },
};
