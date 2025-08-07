import React, { useState } from 'react';

// ---- SNP definitions (risk/protective alleles) + weights (1–5) ----
const SNP_INFO = {
  // LDL receptor function / cholesterol clearance
  rs429358: { risk: ['C'], protective: ['T'], evidence: 5, effect: 5 },
  rs7412: { risk: ['C'], protective: ['T'], evidence: 5, effect: 5 },
  rs688: { risk: ['G'], protective: ['A'], evidence: 4, effect: 4 },
  rs6511720: { protective: ['T'], evidence: 5, effect: 4 },
  rs3846662: { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs11591147: { protective: ['T'], evidence: 5, effect: 5 },
  rs1042031: { protective: ['A'], evidence: 3, effect: 3 },
  rs693: { risk: ['C'], protective: ['T'], evidence: 3, effect: 3 },
  rs6259: { protective: ['A'], evidence: 2, effect: 2 },

  // Triglyceride metabolism & VLDL secretion
  rs662799: { risk: ['G'], protective: ['A'], evidence: 5, effect: 5 },
  rs3135506: { risk: ['C'], protective: ['G'], evidence: 4, effect: 4 },
  rs1260326: { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs780094: { risk: ['T'], protective: ['C'], evidence: 4, effect: 4 },
  rs328: { risk: ['C'], protective: ['G'], evidence: 5, effect: 5 },
  rs13702: { risk: ['T'], protective: ['A'], evidence: 5, effect: 4 },
  rs12678919: { risk: ['A'], protective: ['G'], evidence: 4, effect: 4 },
  rs10503669: { protective: ['A'], evidence: 3, effect: 3 },
  rs1748195: { protective: ['G'], evidence: 3, effect: 3 },
  rs10889353: { protective: ['C'], evidence: 2, effect: 2 },
  rs1044250: { protective: ['C'], evidence: 3, effect: 3 },
  rs11672433: { protective: ['A'], evidence: 3, effect: 3 },
  rs7255436: { protective: ['G'], evidence: 3, effect: 3 },
  rs4846914: { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs5128: { risk: ['G'], protective: ['C'], evidence: 3, effect: 3 },
  rs708272: { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs5882: { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },

  // Insulin sensitivity / fat oxidation / carbohydrate tolerance
  rs1801282: { risk: ['C'], protective: ['G'], evidence: 3, effect: 3 },
  rs7903146: { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs2943641: { risk: ['C'], protective: ['T'], evidence: 4, effect: 4 },
  rs9939609: { risk: ['A'], protective: ['T'], evidence: 5, effect: 5 },
  rs5400: { risk: ['T'], protective: ['C'], evidence: 2, effect: 2 },

  // De novo lipogenesis & hepatic signalling
  rs738409: { risk: ['G'], protective: ['C'], evidence: 5, effect: 5 },
  rs58542926: { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs2306986: { protective: ['C'], evidence: 3, effect: 3 },
  rs641738: { risk: ['T'], protective: ['C'], evidence: 3, effect: 3 },
};

// ---- Categories with descriptions ----
const SNP_CATEGORIES = {
  'LDL receptor function / cholesterol clearance': {
    snps: [
      'rs429358',
      'rs7412',
      'rs688',
      'rs6511720',
      'rs3846662',
      'rs11591147',
      'rs1042031',
      'rs693',
      'rs6259',
    ],
    description:
      'Genes affecting LDL receptor binding, clearance from blood, and overall cholesterol metabolism.',
  },
  'Triglyceride metabolism & VLDL secretion': {
    snps: [
      'rs662799',
      'rs3135506',
      'rs1260326',
      'rs780094',
      'rs328',
      'rs13702',
      'rs12678919',
      'rs10503669',
      'rs1748195',
      'rs10889353',
      'rs1044250',
      'rs11672433',
      'rs7255436',
      'rs4846914',
      'rs5128',
      'rs708272',
      'rs5882',
    ],
    description:
      'Genes regulating triglyceride production, clearance, and VLDL particle secretion from the liver.',
  },
  'Insulin sensitivity / fat oxidation / carbohydrate tolerance': {
    snps: ['rs1801282', 'rs7903146', 'rs2943641', 'rs9939609', 'rs5400'],
    description:
      "Genes influencing insulin action, fat metabolism, and the body's ability to process carbohydrates.",
  },
  'De novo lipogenesis & hepatic signalling': {
    snps: ['rs738409', 'rs58542926', 'rs2306986', 'rs641738'],
    description:
      'Genes impacting liver fat creation, storage, and signalling pathways linked to NAFLD/NASH.',
  },
};

export default function InsulinZoneApp() {
  const [genotypes, setGenotypes] = useState({});
  const [compareDiet, setCompareDiet] = useState('Auto'); // diet toggle

  // ---- File upload & parsing ----
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => alert('Failed to read file. Try again.');
    reader.onload = (ev) => {
      const text = String(ev.target.result || '');
      const snpMap = {};
      text.split(/\r?\n/).forEach((line) => {
        if (!line || line[0] === '#') return;
        const parts = line.split(/\t|,/);
        if (parts.length >= 4) {
          const rsid = parts[0].trim();
          const genotype = parts[3].trim();
          snpMap[rsid] = genotype;
        }
      });
      setGenotypes(snpMap);
    };
    reader.readAsText(file);
  };

  // Demo data (loads protective/default-ish alleles so you can test quickly)
  const loadDemoData = () => {
    const demo = {};
    Object.keys(SNP_INFO).forEach((snp) => {
      demo[snp] = SNP_INFO[snp].protective?.[0] || 'TT';
    });
    setGenotypes(demo);
  };

  // ---- Helpers ----
  const getSnpInterpretation = (snp, genotype) => {
    const info = SNP_INFO[snp];
    if (!info || !genotype)
      return { status: 'Neutral', weight: 0, color: 'gray' };
    if (info.risk && info.risk.some((a) => genotype.includes(a))) {
      return {
        status: 'Risk',
        weight: info.evidence * info.effect,
        color: 'red',
      };
    }
    if (info.protective && info.protective.some((a) => genotype.includes(a))) {
      return {
        status: 'Protective',
        weight: info.evidence * info.effect,
        color: 'green',
      };
    }
    return { status: 'Neutral', weight: 0, color: 'gray' };
  };

  const getCategoryScores = (snps) => {
    let riskScore = 0,
      protectiveScore = 0;
    const hits = [];
    for (const snp of snps) {
      const interp = getSnpInterpretation(snp, genotypes[snp]);
      if (interp.status === 'Risk') {
        riskScore += interp.weight;
        hits.push(`${snp} (${genotypes[snp]}) → Risk`);
      } else if (interp.status === 'Protective') {
        protectiveScore += interp.weight;
        hits.push(`${snp} (${genotypes[snp]}) → Protective`);
      }
    }
    const label =
      riskScore > protectiveScore
        ? 'Overall Risk'
        : protectiveScore > riskScore
        ? 'Overall Protective'
        : 'Overall Neutral';
    const color =
      label === 'Overall Risk'
        ? 'red'
        : label === 'Overall Protective'
        ? 'green'
        : 'gray';
    return { label, color, riskScore, protectiveScore, hits };
  };

  const getCategorySummary = (snps) => {
    const { label, color } = getCategoryScores(snps);
    return { label, color };
  };

  // ---- Phenotypes (non-exclusive) + justification ----
  const detectPhenotypes = () => {
    const ldlr = getCategoryScores(
      SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps
    );
    const tg = getCategoryScores(
      SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps
    );
    const liver = getCategoryScores(
      SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps
    );

    // Mono‑FH detection is limited to clearly pathogenic variants (not included in this common SNP panel).
    // rs6511720 and rs688 are **polygenic modifiers**, not monogenic‑FH markers.
    const fhMono = false;

    const polyFH = ldlr.label === 'Overall Risk';
    const polyCombined = polyFH && tg.label === 'Overall Risk';
    const hyperAbsorber = Boolean(
      (genotypes.rs429358?.includes('C') || genotypes.rs7412?.includes('C')) &&
        genotypes.rs11591147 !== 'T'
    );

    const justifications = {
      fhMono: [
        'No known monogenic‑FH variants in this SNP panel. rs6511720/rs688 are polygenic LDLR modifiers, not mono‑FH. If mono‑FH is suspected, consider clinical sequencing of LDLR/APOB/PCSK9.',
      ],
      polyFH: polyFH
        ? [
            `LDL receptor category weighted score indicates risk (risk ${ldlr.riskScore} vs protective ${ldlr.protectiveScore}).`,
            ...ldlr.hits,
          ]
        : ['LDLR category not in risk overall.'],
      polyCombined: polyCombined
        ? [
            'Both LDL receptor and TG/VLDL categories trend to risk.',
            `LDLR: risk ${ldlr.riskScore} vs prot ${ldlr.protectiveScore}; TG: risk ${tg.riskScore} vs prot ${tg.protectiveScore}.`,
          ]
        : ['Both categories are not jointly at risk.'],
      hyperAbsorber: hyperAbsorber
        ? [
            genotypes.rs429358?.includes('C') || genotypes.rs7412?.includes('C')
              ? 'APOE ε‑risk allele present (rs429358 C and/or rs7412 C).'
              : null,
            genotypes.rs11591147 !== 'T'
              ? 'PCSK9 loss‑of‑function not present (rs11591147 T absent), reducing counterbalance.'
              : null,
          ].filter(Boolean)
        : ['APOE/PCSK9 pattern not suggestive of hyper‑absorption.'],
    };

    return { fhMono, polyFH, polyCombined, hyperAbsorber, justifications };
  };

  const phenotypes = Object.keys(genotypes).length
    ? detectPhenotypes()
    : { justifications: {} };

  // ---- Diet suggestions from category risks ----
  const recommendDiet = () => {
    const ldlr = getCategoryScores(
      SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps
    );
    const tg = getCategoryScores(
      SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps
    );
    const liver = getCategoryScores(
      SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps
    );

    let diet = 'Moderate-Carb (Mediterranean-leaning)';
    let macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)';
    const reasons = [];

    const ldlrRisk = ldlr.label === 'Overall Risk';
    const tgRisk = tg.label === 'Overall Risk';
    const liverRisk = liver.label === 'Overall Risk';

    if (tgRisk && !ldlrRisk) {
      diet = liverRisk ? 'Low-Carb (not Keto)' : 'Low-Carb or Keto';
      macros = liverRisk
        ? 'Carbs 15–25% • Protein 25–30% • Fat 45–55% (favor MUFA/PUFA)'
        : 'Keto: Carbs <10–15% • Protein 20–30% • Fat 55–70% (favor MUFA/PUFA)';
      reasons.push(
        'TG/VLDL category at risk → reduce carb load and sugars to lower TG.'
      );
      if (liverRisk)
        reasons.push(
          'Liver lipogenesis risk → prefer low-carb with higher protein & unsaturated fats over strict keto.'
        );
    }

    if (ldlrRisk && tgRisk) {
      diet = 'Moderate-Carb (Mediterranean-leaning)';
      macros =
        'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%, emphasize MUFA/PUFA)';
      reasons.push(
        'LDLR risk + TG risk → avoid very-low-carb/high-SFA patterns that can raise LDL-C; still limit sugars to control TG.'
      );
    } else if (ldlrRisk && !tgRisk) {
      diet = 'Moderate-Carb (Mediterranean-leaning)';
      macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)';
      reasons.push(
        'LDLR category at risk → avoid ketogenic patterns with high saturated fat; use fibre & unsaturated fats.'
      );
    }

    if (!tgRisk && !ldlrRisk && liverRisk) {
      diet = 'Moderate-Carb, Higher-Protein';
      macros = 'Carbs 30–40% • Protein 25–30% • Fat 30–35%';
      reasons.push(
        'Liver lipogenesis risk → higher protein, limit alcohol/fructose, support choline intake.'
      );
    }

    return { diet, macros, reasons, badges: { ldlr, tg, liver } };
  };

  // ---- Diet comparison presets ----
  const DIET_PRESETS = [
    { key: 'Auto', label: 'Auto (by SNPs)' },
    { key: 'Keto', label: 'Keto / Very Low Carb' },
    { key: 'LowCarb', label: 'Low Carb' },
    { key: 'Moderate', label: 'Moderate Carb (Mediterranean)' },
    { key: 'HiProtein', label: 'Moderate-Carb, Higher-Protein' },
  ];

  const evaluateDiet = (key) => {
    const ldlr = getCategoryScores(
      SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps
    );
    const tg = getCategoryScores(
      SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps
    );
    const liver = getCategoryScores(
      SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps
    );

    const cautions = [];
    const benefits = [];

    if (key === 'Keto') {
      if (ldlr.label === 'Overall Risk')
        cautions.push(
          'LDLR risk → keto with high SFA may elevate LDL-C; strictly limit SFA, prefer MUFA/PUFA.'
        );
      if (liver.label === 'Overall Risk')
        cautions.push(
          'Lipogenesis risk → consider low-carb not strict keto; keep protein higher.'
        );
      if (tg.label === 'Overall Risk')
        benefits.push('TG risk → very low carb can reduce TG significantly.');
    }
    if (key === 'LowCarb') {
      if (tg.label === 'Overall Risk')
        benefits.push('Lower carb load helps TG/apoB.');
      if (ldlr.label === 'Overall Risk')
        cautions.push('Keep SFA low to avoid LDL-C rise.');
    }
    if (key === 'Moderate') {
      benefits.push(
        'Balances LDLR risk and TG control; emphasise fibre, MUFA/PUFA.'
      );
      if (tg.label === 'Overall Risk')
        cautions.push('May need tighter carb control to manage TG.');
    }
    if (key === 'HiProtein') {
      if (liver.label === 'Overall Risk')
        benefits.push(
          'Higher protein supports liver fat reduction and satiety.'
        );
      if (tg.label === 'Overall Risk')
        cautions.push('Keep sugars low; use lower end of moderate carbs.');
    }

    return {
      cautions,
      benefits,
      signals: { ldlr: ldlr.label, tg: tg.label, liver: liver.label },
    };
  };

  const plan = Object.keys(genotypes).length
    ? recommendDiet()
    : { headline: '', recs: [] };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">🧬 Lipid SNP Analysis</h1>

      <div className="flex gap-2">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="border p-2 w-full"
        />
        <button
          onClick={loadDemoData}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Load Demo SNPs
        </button>
      </div>

      {Object.keys(genotypes).length > 0 && (
        <>
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">Legend</h2>
            <p>
              <span style={{ color: 'red' }}>Risk</span>: Associated with
              increased likelihood of adverse metabolic/lipid outcomes.
            </p>
            <p>
              <span style={{ color: 'green' }}>Protective</span>: Associated
              with reduced likelihood or better outcomes.
            </p>
            <p>
              <span style={{ color: 'gray' }}>Neutral</span>: No strong known
              effect or insufficient evidence.
            </p>
          </div>

          {Object.entries(SNP_CATEGORIES).map(
            ([category, { snps, description }]) => {
              const summary = getCategorySummary(snps);
              return (
                <div key={category} className="mb-4">
                  <h3 className="font-medium" style={{ color: summary.color }}>
                    {category} — {summary.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{description}</p>
                  <ul>
                    {snps.map((snp) => {
                      const genotype = genotypes[snp] || '❌ Not found';
                      const { status, color } = getSnpInterpretation(
                        snp,
                        genotype
                      );
                      return (
                        <li key={snp} style={{ color }}>
                          {snp}: {genotype} — {status}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }
          )}

          <div className="mt-6 p-4 border rounded">
            <h3 className="font-medium mb-2">Phenotype Detection</h3>
            {(() => {
              const p = phenotypes;
              return (
                <>
                  <p>Mono FH: {p.fhMono ? '✅' : '❌'}</p>
                  <ul className="text-sm list-disc ml-6 mb-3">
                    {(p.justifications?.fhMono || []).map((j, i) => (
                      <li key={`fhm-${i}`}>{j}</li>
                    ))}
                  </ul>
                  <p>Polygenic FH: {p.polyFH ? '✅' : '❌'}</p>
                  <ul className="text-sm list-disc ml-6 mb-3">
                    {(p.justifications?.polyFH || []).map((j, i) => (
                      <li key={`pfh-${i}`}>{j}</li>
                    ))}
                  </ul>
                  <p>Polygenic Combined FH: {p.polyCombined ? '✅' : '❌'}</p>
                  <ul className="text-sm list-disc ml-6 mb-3">
                    {(p.justifications?.polyCombined || []).map((j, i) => (
                      <li key={`pc-${i}`}>{j}</li>
                    ))}
                  </ul>
                  <p>Hyper Absorber: {p.hyperAbsorber ? '✅' : '❌'}</p>
                  <ul className="text-sm list-disc ml-6">
                    {(p.justifications?.hyperAbsorber || []).map((j, i) => (
                      <li key={`ha-${i}`}>{j}</li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>

          <div className="mt-6 p-4 border rounded bg-gray-50">
            <h3 className="font-semibold mb-2">
              Diet Suggestions (by SNP risk)
            </h3>
            {() => {
              const r = recommendDiet();
              return (
                <>
                  <p className="mb-1">
                    <strong>Recommended style:</strong> {r.diet}
                  </p>
                  <p className="mb-2 text-sm text-gray-700">{r.macros}</p>
                  <ul className="list-disc ml-6 mb-2">
                    {r.reasons.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-gray-600">
                    <p>
                      <strong>Signals:</strong> LDLR: {r.badges.ldlr.label}{' '}
                      (risk {r.badges.ldlr.riskScore}, prot{' '}
                      {r.badges.ldlr.protectiveScore}) • TG: {r.badges.tg.label}{' '}
                      (risk {r.badges.tg.riskScore}, prot{' '}
                      {r.badges.tg.protectiveScore}) • Liver:{' '}
                      {r.badges.liver.label} (risk {r.badges.liver.riskScore},
                      prot {r.badges.liver.protectiveScore})
                    </p>
                  </div>
                </>
              );
            }}
          </div>

          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Try an alternative diet</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { key: 'Auto', label: 'Auto (by SNPs)' },
                { key: 'Keto', label: 'Keto / Very Low Carb' },
                { key: 'LowCarb', label: 'Low Carb' },
                { key: 'Moderate', label: 'Moderate Carb (Mediterranean)' },
                { key: 'HiProtein', label: 'Moderate-Carb, Higher-Protein' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setCompareDiet(p.key)}
                  className={`px-3 py-1 rounded border ${
                    compareDiet === p.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {compareDiet !== 'Auto' &&
              (() => {
                const e = evaluateDiet(compareDiet);
                return (
                  <>
                    <p className="text-sm mb-2">
                      <strong>Signals:</strong> LDLR {e.signals.ldlr} • TG{' '}
                      {e.signals.tg} • Liver {e.signals.liver}
                    </p>
                    {e.benefits.length > 0 && (
                      <>
                        <p className="font-medium">Potential benefits</p>
                        <ul className="list-disc ml-6 mb-2">
                          {e.benefits.map((b, i) => (
                            <li key={`b-${i}`}>{b}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {e.cautions.length > 0 && (
                      <>
                        <p className="font-medium">Cautions</p>
                        <ul className="list-disc ml-6">
                          {e.cautions.map((c, i) => (
                            <li key={`c-${i}`}>{c}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                );
              })()}
          </div>
        </>
      )}
    </div>
  );
}
