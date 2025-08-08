import React, { useState } from "react";
import "./App.css";

// ---------------------------
// SNP Definitions & Categories
// ---------------------------
const SNP_INFO: Record<
  string,
  {
    risk?: string[];
    protective?: string[];
    evidence: number;
    effect: number;
  }
> = {
  rs429358: { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 },
  rs7412: { risk: ["C"], protective: ["T"], evidence: 5, effect: 5 },
  rs688: { risk: ["G"], protective: ["A"], evidence: 4, effect: 4 },
  rs6511720: { protective: ["T"], evidence: 5, effect: 4 },
  rs3846662: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs11591147: { protective: ["T"], evidence: 5, effect: 5 },
  rs1042031: { protective: ["A"], evidence: 3, effect: 3 },
  rs693: { risk: ["C"], protective: ["T"], evidence: 3, effect: 3 },
  rs6259: { protective: ["A"], evidence: 2, effect: 2 },

  rs662799: { risk: ["G"], protective: ["A"], evidence: 5, effect: 5 },
  rs3135506: { risk: ["C"], protective: ["G"], evidence: 4, effect: 4 },
  rs1260326: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs780094: { risk: ["T"], protective: ["C"], evidence: 4, effect: 4 },
  rs328: { protective: ["G"], risk: ["C"], evidence: 5, effect: 5 },
  rs13702: { protective: ["A"], risk: ["T"], evidence: 5, effect: 4 },
  rs12678919: { protective: ["G"], risk: ["A"], evidence: 4, effect: 4 },
  rs4846914: { risk: ["G"], protective: ["A"], evidence: 3, effect: 3 },
  rs5128: { risk: ["G"], protective: ["C"], evidence: 3, effect: 3 },
  rs708272: { protective: ["A"], risk: ["G"], evidence: 3, effect: 3 },
  rs5882: { protective: ["A"], risk: ["G"], evidence: 3, effect: 3 },

  rs1801282: { protective: ["G"], risk: ["C"], evidence: 3, effect: 3 },
  rs7903146: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs2943641: { protective: ["T"], risk: ["C"], evidence: 4, effect: 4 },
  rs9939609: { risk: ["A"], protective: ["T"], evidence: 5, effect: 5 },

  rs738409: { risk: ["G"], protective: ["C"], evidence: 5, effect: 5 },
  rs58542926: { risk: ["T"], protective: ["C"], evidence: 5, effect: 5 },
  rs2306986: { protective: ["C"], evidence: 3, effect: 3 },
  rs641738: { risk: ["T"], protective: ["C"], evidence: 3, effect: 3 },
};

const SNP_CATEGORIES: Record<string, string[]> = {
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
    "rs4846914",
    "rs5128",
    "rs708272",
    "rs5882",
  ],
  "Insulin sensitivity / carbohydrate tolerance": [
    "rs1801282",
    "rs7903146",
    "rs2943641",
    "rs9939609",
  ],
  "Liver fat & de novo lipogenesis": [
    "rs738409",
    "rs58542926",
    "rs2306986",
    "rs641738",
  ],
};

// ---------------------------
// Helper functions
// ---------------------------
const getSnpStatus = (snp: string, genotype: string) => {
  const info = SNP_INFO[snp];
  if (!info || !genotype) return "Neutral";
  if (info.risk?.some((allele) => genotype.includes(allele))) return "Risk";
  if (info.protective?.some((allele) => genotype.includes(allele)))
    return "Protective";
  return "Neutral";
};

const formatLabs = (value: number, unit: "mmol" | "mg") => {
  if (unit === "mmol") return value.toFixed(1);
  return Math.round(value);
};

// ---------------------------
// Main App
// ---------------------------
export default function App() {
  const [tab, setTab] = useState(1);
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [bmi, setBmi] = useState(25);
  const [unit, setUnit] = useState<"mmol" | "mg">(
    navigator.language.includes("US") ? "mg" : "mmol"
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const snpMap: Record<string, string> = {};
      text.split(/\r?\n/).forEach((line) => {
        if (!line || line.startsWith("#")) return;
        const parts = line.split(/\t|,/);
        if (parts.length >= 4) {
          snpMap[parts[0]] = parts[3];
        }
      });
      setGenotypes(snpMap);
    };
    reader.readAsText(file);
  };

  const dietPredictions = {
    Keto: { LDL: 3.9, HDL: 1.6, TG: 0.8 },
    "Low Carb": { LDL: 3.5, HDL: 1.5, TG: 1.0 },
    "Moderate Carb": { LDL: 3.2, HDL: 1.3, TG: 1.3 },
  };

  const scaleByBmi = (value: number) => value * (bmi / 25);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="max-w-5xl mx-auto p-6 font-sans">
      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-2 mb-4">
        {["Upload", "SNPs", "Phenotypes", "Diet + Labs"].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setTab(idx + 1)}
            className={`px-4 py-2 ${
              tab === idx + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            } rounded-t`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1 */}
      {tab === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload or Demo Data</h2>
          <input type="file" accept=".txt,.csv" onChange={handleFile} />
          <button
            className="ml-4 px-4 py-2 bg-green-600 text-white rounded"
            onClick={() => {
              const demo: Record<string, string> = {};
              Object.keys(SNP_INFO).forEach((snp) => (demo[snp] = "CT"));
              setGenotypes(demo);
            }}
          >
            Load Demo Data
          </button>
        </div>
      )}

      {/* Tab 2 */}
      {tab === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Full SNP List</h2>
          {Object.entries(SNP_CATEGORIES).map(([cat, snps]) => (
            <div key={cat} className="mb-4 border p-3 rounded">
              <h3 className="font-bold">{cat}</h3>
              <ul>
                {snps.map((snp) => {
                  const status = getSnpStatus(snp, genotypes[snp]);
                  return (
                    <li
                      key={snp}
                      className={
                        status === "Risk"
                          ? "text-red-600"
                          : status === "Protective"
                          ? "text-green-600"
                          : "text-gray-700"
                      }
                    >
                      {snp}: {genotypes[snp] || "Not found"} ({status})
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3 */}
      {tab === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Phenotype Detection</h2>
          <p>Coming soon: logic based on SNP categories</p>
        </div>
      )}

      {/* Tab 4 */}
      {tab === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Diet Choice + Expected Labs
          </h2>
          <label className="block mb-4">
            BMI:{" "}
            <input
              type="range"
              min="18"
              max="35"
              step="0.5"
              value={bmi}
              onChange={(e) => setBmi(parseFloat(e.target.value))}
            />{" "}
            {bmi}
          </label>
          {Object.entries(dietPredictions).map(([diet, labs]) => (
            <div
              key={diet}
              className="mb-3 p-3 border rounded bg-gray-50 flex justify-between"
            >
              <div>
                <strong>{diet}</strong>
              </div>
              <div>
                LDL: {formatLabs(scaleByBmi(labs.LDL), unit)} {unit}, HDL:{" "}
                {formatLabs(scaleByBmi(labs.HDL), unit)} {unit}, TG:{" "}
                {formatLabs(scaleByBmi(labs.TG), unit)} {unit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
