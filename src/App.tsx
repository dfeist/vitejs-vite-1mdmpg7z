import React, { useEffect, useMemo, useState } from "react";
import type { CategoryKey, CategoryScore, DietKey, Phenotypes, Unit } from "./types";
import { SNP_CATEGORIES, CATEGORY_DESCRIPTIONS, DEMOS } from "./data/snpInfo";
import { interpretSnp, categoryScores, defaultUnit, mmolToDisplay, classifyValue } from "./lib/interpret";
import { PHENO_DEFAULT, detectPhenotypes, detectExtraPhenotypes } from "./lib/phenotypes";
import {
  DIET_KEYS,
  DIET_INFO,
  predictLabsMMol,
  estimateApoBmgdl,
  dietBenefitsCautionsTips,
  dietFitScore,
  whyRecommendedText,
} from "./lib/diet";



/**
 * App.tsx — Genetics → Phenotypes → Diet & Labs
 * Full, copy-pasteable file. Uses only existing modules you already have.
 * Avoids dynamic Tailwind class pitfalls by mapping colors → classes.
 */

export default function App() {
  const [tab, setTab] = useState<1 | 2 | 3 | 4>(1);
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<Unit>(defaultUnit());
  const [activeDiet, setActiveDiet] = useState<DietKey>("Mediterranean");

  const categoryMap = useMemo(() => {
    const out = {} as Record<CategoryKey, CategoryScore>;
    (Object.keys(SNP_CATEGORIES) as CategoryKey[]).forEach((k) => {
      out[k] = categoryScores(SNP_CATEGORIES[k], genotypes);
    });
    return out;
  }, [genotypes]);

  const phenotypes = useMemo<Phenotypes>(
    () => (Object.keys(genotypes).length ? detectPhenotypes(genotypes) : PHENO_DEFAULT),
    [genotypes]
  );

  const extraPhenotypes = useMemo(
    () => (Object.keys(genotypes).length ? detectExtraPhenotypes(genotypes, categoryMap) : []),
    [genotypes, categoryMap]
  );

  const rankedDiets = useMemo(() => {
    const items: { key: DietKey; score: number; labs: { LDL: number; HDL: number; TG: number } }[] = [];
    DIET_KEYS.forEach((d) => {
      const labs = predictLabsMMol(d, genotypes, categoryMap, 25);
      const score = dietFitScore(labs);
      items.push({ key: d, score, labs });
    });
    items.sort((a, b) => b.score - a.score);
    return items;
  }, [genotypes, categoryMap]);

  useEffect(() => {
    if (rankedDiets[0]) setActiveDiet(rankedDiets[0].key);
  }, [rankedDiets]);

  const unitToggle = () => setUnit((u) => (u === "mmol" ? "mgdl" : "mmol"));

  /* ---------- File handling ---------- */
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => alert("Failed to read file. Try again.");
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const snpMap: Record<string, string> = {};
      const needed = new Set([
        ...Object.keys(SNP_CATEGORIES).flatMap((k) => SNP_CATEGORIES[k as CategoryKey]),
        "rs5742904",
        "rs137852912",
        "rs28942111", // FH markers
      ]);
      text.split(/\r?\n/).forEach((line) => {
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
    setGenotypes(DEMOS[which]);
    setTab(2);
  }

  /* ---------- UI helpers ---------- */
  const chip = (label: string, color: "red" | "green" | "gray") => (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
        color === "red"
          ? "bg-red-100 text-red-700"
          : color === "green"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );

  // Avoid dynamic Tailwind classes so builds don’t purge them
  const panelClass = (color: "red" | "green" | "gray" | "amber" | "cyan" | "slate") => {
    switch (color) {
      case "red":
        return "p-3 rounded border border-red-300 bg-red-50";
      case "green":
        return "p-3 rounded border border-green-300 bg-green-50";
      case "gray":
        return "p-3 rounded border border-gray-300 bg-gray-50";
      case "amber":
        return "p-3 rounded border border-amber-300 bg-amber-50";
      case "cyan":
        return "p-3 rounded border border-cyan-300 bg-cyan-50";
      case "slate":
        return "p-3 rounded border border-slate-300 bg-slate-50";
      default:
        return "p-3 rounded border border-slate-200 bg-slate-50";
    }
  };
  const statusToPanel = (s: "red" | "orange" | "green") => (s === "red" ? panelClass("red") : s === "orange" ? panelClass("amber") : panelClass("green"));

  /* ---------- Layout ---------- */
  return (
    <div className="max-w-6xl mx-auto p-5 text-slate-800">
      {/* Header / Wizard Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">🧬 Genetics → Phenotypes → Diet & Labs</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={`px-3 py-1 rounded border ${
                tab === n
                  ? "bg-cyan-700 text-white border-cyan-700"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => setTab(n as 1 | 2 | 3 | 4)}
            >
              {n === 1 ? "1. Upload" : n === 2 ? "2. SNPs" : n === 3 ? "3. Phenotypes" : "4. Diet + Labs"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Upload */}
      {tab === 1 && (
        <div className="grid gap-4">
          <div className="p-4 bg-white border rounded shadow-sm">
            <h2 className="font-semibold mb-2">Parse SelfDecode / 23andMe-style file (file is not uploaded anywhere and is only processed locally in your browser!)</h2>
            <input type="file" accept=".txt,.csv" onChange={handleFile} className="border p-2 w-full" />
            <p className="text-xs text-slate-600 mt-2">We read only the SNPs needed for this analysis; other rows are ignored.</p>
          </div>

          <div className="p-4 bg-white border rounded shadow-sm">
            <h2 className="font-semibold mb-2">…or load a demo dataset</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DEMOS).map((k) => (
                <button key={k} onClick={() => loadDemo(k as keyof typeof DEMOS)} className="px-3 py-1.5 rounded border bg-slate-50 hover:bg-slate-100">
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={Object.keys(genotypes).length === 0}
              onClick={() => setTab(2)}
              className={`px-4 py-2 rounded ${
                Object.keys(genotypes).length ? "bg-cyan-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              Next → SNPs
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: SNPs */}
      {tab === 2 && (
        <div className="grid gap-5">
          {(Object.keys(SNP_CATEGORIES) as CategoryKey[]).map((category) => {
            const snps = SNP_CATEGORIES[category];
            const sum = categoryMap[category];
            return (
              <div key={category} className="p-4 bg-white border rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {category} — {" "}
                    <span className={`${sum.color === "red" ? "text-red-600" : sum.color === "green" ? "text-green-600" : "text-slate-500"}`}>
                      {sum.label}
                    </span>
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
                      {snps.map((snp) => {
                        const g = genotypes[snp];
                        const { status, color, tooltip } = interpretSnp(snp, g);
                        return (
                          <tr key={snp} className={`${color === "red" ? "bg-red-50" : color === "green" ? "bg-green-50" : "bg-white"}`}>
                            <td className="py-1 pr-3 font-mono">{snp}</td>
                            <td className="py-1 pr-3">{g || "❌ Not found"}</td>
                            <td className="py-1 pr-3">
                              <span title={tooltip} className={`px-2 py-0.5 rounded ${color === "red" ? "bg-red-100 text-red-700" : color === "green" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
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
            <button onClick={() => setTab(1)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={() => setTab(3)} className="px-4 py-2 rounded bg-cyan-700 text-white">Next → Phenotypes</button>
          </div>
        </div>
      )}

      {/* Tab 3: Phenotypes */}
      {tab === 3 && (
        <div className="grid gap-5">
          <div className="p-4 bg-white border rounded shadow-sm">
            <h3 className="font-semibold mb-2">Phenotype Detection</h3>
            {Object.keys(genotypes).length === 0 ? (
              <p className="text-slate-600">Load data first to view phenotype calls.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Monogenic FH (screen) */}
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${phenotypes.monoFH ? "text-red-600" : "text-slate-500"}`}>{phenotypes.monoFH ? "⚠️" : "ℹ️"}</span>
                    <span className="font-medium">Monogenic FH (screen)</span>
                  </div>
                  <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                    {phenotypes.justifications.monoFH.map((j, i) => <li key={i}>{j}</li>)}
                  </ul>
                </div>

                {/* Polygenic classification (exclusive) */}
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-cyan-700">🧩</span>
                    <span className="font-medium">Polygenic classification: <b>{phenotypes.polyClass}</b></span>
                  </div>
                  <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                    {phenotypes.justifications.polyClass.map((j, i) => <li key={i}>{j}</li>)}
                  </ul>
                </div>

                {/* Hyper-absorber */}
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${phenotypes.hyperAbsorber ? "text-green-600" : "text-slate-500"}`}>{phenotypes.hyperAbsorber ? "✅" : "❌"}</span>
                    <span className="font-medium">Hyper-absorber (APOE/PCSK9)</span>
                  </div>
                  <ul className="text-sm text-slate-700 list-disc ml-6 mt-1">
                    {phenotypes.justifications.hyperAbsorber.map((j, i) => <li key={i}>{j}</li>)}
                  </ul>
                </div>

                {/* Extra phenotype flags */}
                {extraPhenotypes.length > 0 && extraPhenotypes.map((ep, idx) => (
                  <div key={idx} className={panelClass(ep.color)}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ep.icon}</span>
                      <span className="font-medium">{ep.label}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{ep.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setTab(2)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={() => setTab(4)} className="px-4 py-2 rounded bg-cyan-700 text-white">Next → Diet + Labs</button>
          </div>
        </div>
      )}

      {/* Tab 4: Diet + Labs — single diet view with recommendation and selector */}
      {tab === 4 && (
        <div className="grid gap-5">
          {/* Controls */}
          <div className="bg-white p-3 border rounded shadow-sm flex flex-wrap items-end gap-3">
            <div>
              <div className="text-sm text-slate-600">Units</div>
              <button onClick={unitToggle} className="mt-1 px-3 py-1 rounded border bg-slate-50 hover:bg-slate-100">
                {unit === "mmol" ? "mmol/L (click to switch to mg/dL)" : "mg/dL (click to switch to mmol/L)"}
              </button>
            </div>
            <div>
              <div className="text-sm text-slate-600">View another diet</div>
              <select className="mt-1 border rounded px-2 py-1" value={activeDiet} onChange={(e) => setActiveDiet(e.target.value as DietKey)}>
                {DIET_KEYS.map((k) => (
                  <option key={k} value={k}>{DIET_INFO[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recommended banner */}
          {(() => {
            const best = rankedDiets[0];
            if (!best) return null;
            const isRecommended = best.key === activeDiet;
            const info = DIET_INFO[best.key];
            return (
              <div className={`p-3 border rounded ${isRecommended ? "bg-cyan-50 border-cyan-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-sm">
                  <span className={`font-semibold ${isRecommended ? "text-cyan-800" : "text-slate-700"}`}>Recommended diet: {info.label}</span>{" "}
                  {isRecommended ? "(currently shown)" : "(you’re viewing a different diet — select above to switch)"}
                </div>
              </div>
            );
          })()}

          {/* Single diet view */}
          {(() => {
            const sel = rankedDiets.find((r) => r.key === activeDiet) || rankedDiets[0];
            if (!sel) return null;
            const info = DIET_INFO[sel.key];
            const labs = sel.labs;
            const LDLc = classifyValue(labs.LDL, "LDL");
            const HDLc = classifyValue(labs.HDL, "HDL");
            const TGc = classifyValue(labs.TG, "TG");
            const apoBmgdl = estimateApoBmgdl(labs.LDL, labs.TG);
            const apoBDisplay = unit === "mgdl" ? `${apoBmgdl} mg/dL` : `${(apoBmgdl / 100).toFixed(2)} g/L`;

            const why = whyRecommendedText(sel.key, phenotypes, categoryMap);
            const { benefits, cautions, tips } = dietBenefitsCautionsTips(sel.key, genotypes, categoryMap);

            return (
              <div className="p-4 bg-white border rounded shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{info.label}</h3>
                    <div className="text-sm text-slate-600">{info.macros}</div>
                  </div>
                </div>

                {/* Why this (genetics + phenotypes) */}
                <div className="mt-3">
                  <div className="text-sm font-medium">Why this diet (based on your genetics/phenotypes)</div>
                  <ul className="list-disc ml-5 text-sm">
                    {why.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>

                {/* How to do it + foods */}
                <div className="mt-3 grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">How to do it</div>
                    <ul className="list-disc ml-5 text-sm">
                      {info.how.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Example foods</div>
                    <ul className="list-disc ml-5 text-sm">
                      {info.foods.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Genetics-based tweaks */}
                <div className="mt-3 grid gap-2">
                  {benefits.length > 0 && (
                    <div>
                      <div className="text-sm font-medium">Genetic benefits of this diet</div>
                      <ul className="list-disc ml-5 text-sm">{benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
                    </div>
                  )}
                  {cautions.length > 0 && (
                    <div>
                      <div className="text-sm font-medium">Cautions for your genotype</div>
                      <ul className="list-disc ml-5 text-sm">{cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                  )}
                  {tips.length > 0 && (
                    <div>
                      <div className="text-sm font-medium">Tweaks tailored to your SNPs</div>
                      <ul className="list-disc ml-5 text-sm">{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  )}
                </div>

                {/* Expected labs (BMI 25, moderate activity) */}
                <div className="mt-4">
                  <div className="text-sm font-medium">Expected labs (BMI 25, moderate activity)</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <div className={statusToPanel(LDLc)}>
                      <div className="text-xs text-slate-500">LDL-C</div>
                      <div className="font-semibold">{mmolToDisplay(labs.LDL, unit, "chol")}</div>
                    </div>
                    <div className={statusToPanel(HDLc)}>
                      <div className="text-xs text-slate-500">HDL-C</div>
                      <div className="font-semibold">{mmolToDisplay(labs.HDL, unit, "chol")}</div>
                    </div>
                    <div className={statusToPanel(TGc)}>
                      <div className="text-xs text-slate-500">Triglycerides</div>
                      <div className="font-semibold">{mmolToDisplay(labs.TG, unit, "tg")}</div>
                    </div>
                    <div className={panelClass("slate")}>
                      <div className="text-xs text-slate-500">ApoB (est.)</div>
                      <div className="font-semibold">{apoBDisplay}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Estimates are heuristic and for educational use only.</div>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-between">
            <button onClick={() => setTab(3)} className="px-4 py-2 rounded border bg-white">← Back</button>
            <button onClick={() => setTab(1)} className="px-4 py-2 rounded border bg-slate-100">Start over</button>
          </div>
        </div>
      )}
    </div>
  );
}
