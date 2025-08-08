export type Unit = "mmol" | "mgdl";

export type CategoryKey =
  | "LDL receptor function / cholesterol clearance"
  | "Triglyceride metabolism & VLDL secretion"
  | "Insulin sensitivity / fat oxidation / carbohydrate tolerance"
  | "De novo lipogenesis & hepatic signalling";

export type SNPInfo = {
  risk?: string[];
  protective?: string[];
  evidence: number; // 1–5 strength of evidence
  effect: number;   // 1–5 relative effect size/weight
};

export type CategoryScore = {
  label: "Overall Risk" | "Overall Protective" | "Overall Neutral";
  color: "red" | "green" | "gray";
  riskScore: number;
  protectiveScore: number;
  hits: string[]; // e.g., ["rs123 (AG) → Risk"]
};

export type DietKey = "Keto" | "Carnivore" | "LowCarb" | "HighCarb" | "Mediterranean";

export type PolyClass = "None" | "FHC" | "FHT" | "FCHC";

export type Phenotypes = {
  monoFH: boolean;              // screen-positive if any known pathogenic marker detected
  hyperAbsorber: boolean;       // APOE ε-risk without PCSK9 LOF T at rs11591147
  polyClass: PolyClass;         // exclusive polygenic classification
  justifications: {
    monoFH: string[];
    polyClass: string[];
    hyperAbsorber: string[];
  };
};

export type LabsMMol = {
  LDL: number;
  HDL: number;
  TG: number;
};

export type ExtraPhenotype = {
  label: string;
  desc: string;
  icon: string;  // emoji or icon name
  color: "red" | "green" | "gray" | "amber" | "cyan" | "slate";
};