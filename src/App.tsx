import React, { useMemo, useState } from 'react';

// ---------- Types ----------
type SNPInfo = {
  risk?: string[];
  protective?: string[];
  evidence: number; // 1–5
  effect: number;   // 1–5
};
type CategoryScore = {
  label: 'Overall Risk' | 'Overall Protective' | 'Overall Neutral';
  color: 'red' | 'green' | 'gray';
  riskScore: number;
  protectiveScore: number;
  hits: string[];
};
type DietKey = 'Auto' | 'Keto' | 'LowCarb' | 'Moderate' | 'HiProtein';

// ---------- SNP definitions (risk/protective alleles) + weights ----------
const SNP_INFO: Record<string, SNPInfo> = {
  // LDL receptor function / cholesterol clearance
  rs429358:   { risk: ['C'], protective: ['T'], evidence: 5, effect: 5 },
  rs7412:     { risk: ['C'], protective: ['T'], evidence: 5, effect: 5 },
  rs688:      { risk: ['G'], protective: ['A'], evidence: 4, effect: 4 },
  rs6511720:  {                         protective: ['T'], evidence: 5, effect: 4 },
  rs3846662:  { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs11591147: {                         protective: ['T'], evidence: 5, effect: 5 },
  rs1042031:  {                         protective: ['A'], evidence: 3, effect: 3 },
  rs693:      { risk: ['C'], protective: ['T'], evidence: 3, effect: 3 },
  rs6259:     {                         protective: ['A'], evidence: 2, effect: 2 },

  // Triglyceride metabolism & VLDL secretion
  rs662799:   { risk: ['G'], protective: ['A'], evidence: 5, effect: 5 },
  rs3135506:  { risk: ['C'], protective: ['G'], evidence: 4, effect: 4 },
  rs1260326:  { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs780094:   { risk: ['T'], protective: ['C'], evidence: 4, effect: 4 },
  rs328:      { risk: ['C'], protective: ['G'], evidence: 5, effect: 5 },
  rs13702:    { risk: ['T'], protective: ['A'], evidence: 5, effect: 4 },
  rs12678919: { risk: ['A'], protective: ['G'], evidence: 4, effect: 4 },
  rs10503669: {                         protective: ['A'], evidence: 3, effect: 3 },
  rs1748195:  {                         protective: ['G'], evidence: 3, effect: 3 },
  rs10889353: {                         protective: ['C'], evidence: 2, effect: 2 },
  rs1044250:  {                         protective: ['C'], evidence: 3, effect: 3 },
  rs11672433: {                         protective: ['A'], evidence: 3, effect: 3 },
  rs7255436:  {                         protective: ['G'], evidence: 3, effect: 3 },
  rs4846914:  { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs5128:     { risk: ['G'], protective: ['C'], evidence: 3, effect: 3 },
  rs708272:   { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },
  rs5882:     { risk: ['G'], protective: ['A'], evidence: 3, effect: 3 },

  // Insulin sensitivity / fat oxidation / carbohydrate tolerance
  rs1801282:  { risk: ['C'], protective: ['G'], evidence: 3, effect: 3 },
  rs7903146:  { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs2943641:  { risk: ['C'], protective: ['T'], evidence: 4, effect: 4 },
  rs9939609:  { risk: ['A'], protective: ['T'], evidence: 5, effect: 5 },
  rs5400:     { risk: ['T'], protective: ['C'], evidence: 2, effect: 2 },

  // De novo lipogenesis & hepatic signalling
  rs738409:   { risk: ['G'], protective: ['C'], evidence: 5, effect: 5 },
  rs58542926: { risk: ['T'], protective: ['C'], evidence: 5, effect: 5 },
  rs2306986:  {                         protective: ['C'], evidence: 3, effect: 3 },
  rs641738:   { risk: ['T'], protective: ['C'], evidence: 3, effect: 3 }
};

const SNP_CATEGORIES: Record<string, { snps: string[]; description: string }> = {
  'LDL receptor function / cholesterol clearance': {
    snps: ['rs429358','rs7412','rs688','rs6511720','rs3846662','rs11591147','rs1042031','rs693','rs6259'],
    description: 'Genes affecting LDL receptor binding, clearance from blood, and overall cholesterol metabolism.'
  },
  'Triglyceride metabolism & VLDL secretion': {
    snps: ['rs662799','rs3135506','rs1260326','rs780094','rs328','rs13702','rs12678919','rs10503669','rs1748195','rs10889353','rs1044250','rs11672433','rs7255436','rs4846914','rs5128','rs708272','rs5882'],
    description: 'Genes regulating triglyceride production, clearance, and VLDL particle secretion from the liver.'
  },
  'Insulin sensitivity / fat oxidation / carbohydrate tolerance': {
    snps: ['rs1801282','rs7903146','rs2943641','rs9939609','rs5400'],
    description: 'Genes influencing insulin action, fat metabolism, and the body’s ability to process carbohydrates.'
  },
  'De novo lipogenesis & hepatic signalling': {
    snps: ['rs738409','rs58542926','rs2306986','rs641738'],
    description: 'Genes impacting liver fat creation, storage, and signalling pathways linked to NAFLD/NASH.'
  }
};

// ---------- Core helpers ----------
function interpretSnp(snp: string, genotype?: string) {
  const info = SNP_INFO[snp];
  if (!info || !genotype) return { status: 'Neutral', weight: 0, color: 'gray' as const };
  if (info.risk?.some(a => genotype.includes(a))) return { status: 'Risk', weight: info.evidence * info.effect, color: 'red' as const };
  if (info.protective?.some(a => genotype.includes(a))) return { status: 'Protective', weight: info.evidence * info.effect, color: 'green' as const };
  return { status: 'Neutral', weight: 0, color: 'gray' as const };
}

function categoryScores(snps: string[], genotypes: Record<string, string>): CategoryScore {
  let riskScore = 0, protectiveScore = 0;
  const hits: string[] = [];
  for (const snp of snps) {
    const geno = genotypes[snp];
    const { status, weight } = interpretSnp(snp, geno);
    if (status === 'Risk')        { riskScore += weight; hits.push(`${snp} (${geno}) → Risk`); }
    else if (status === 'Protective') { protectiveScore += weight; hits.push(`${snp} (${geno}) → Protective`); }
  }
  const label: CategoryScore['label'] =
    riskScore > protectiveScore ? 'Overall Risk'
    : protectiveScore > riskScore ? 'Overall Protective'
    : 'Overall Neutral';
  const color: CategoryScore['color'] = label === 'Overall Risk' ? 'red' : label === 'Overall Protective' ? 'green' : 'gray';
  return { label, color, riskScore, protectiveScore, hits };
}

// ---------- Phenotypes ----------
function detectPhenotypes(genotypes: Record<string, string>) {
  const ldlr = categoryScores(SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps, genotypes);
  const tg   = categoryScores(SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps, genotypes);
  const liver= categoryScores(SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps, genotypes);

  const fhMono = false; // not detectable from this SNP panel
  const polyFH = ldlr.label === 'Overall Risk';
  const polyCombined = polyFH && tg.label === 'Overall Risk';
  const hyperAbsorber = Boolean((genotypes.rs429358?.includes('C') || genotypes.rs7412?.includes('C')) && genotypes.rs11591147 !== 'T');

  const justifications = {
    fhMono: ['Monogenic FH cannot be determined from this consumer SNP panel. rs6511720/rs688 are polygenic LDLR modifiers. Consider clinical sequencing of LDLR/APOB/PCSK9 if suspected.'],
    polyFH: polyFH ? [
      `LDLR category indicates risk (risk ${ldlr.riskScore} vs protective ${ldlr.protectiveScore}).`,
      ...ldlr.hits
    ] : ['LDLR category not overall at risk.'],
    polyCombined: polyCombined ? [
      'Both LDL receptor and TG/VLDL categories trend to risk.',
      `LDLR: risk ${ldlr.riskScore} vs prot ${ldlr.protectiveScore}; TG: risk ${tg.riskScore} vs prot ${tg.protectiveScore}.`
    ] : ['Both categories are not jointly at risk.'],
    hyperAbsorber: hyperAbsorber ? [
      (genotypes.rs429358?.includes('C') || genotypes.rs7412?.includes('C')) ? 'APOE ε-risk allele present (rs429358 C and/or rs7412 C).' : null,
      genotypes.rs11591147 !== 'T' ? 'PCSK9 loss-of-function not present (rs11591147 T absent), reducing counterbalance.' : null
    ].filter(Boolean) as string[] : ['APOE/PCSK9 pattern not suggestive of hyper-absorption.']
  };

  return { fhMono, polyFH, polyCombined, hyperAbsorber, justifications, ldlr, tg, liver };
}

// ---------- Diet logic ----------
type DietInfo = { desc: string; baseMacros: string };
const DIET_PRESETS: { key: DietKey; label: string }[] = [
  { key: 'Auto',     label: 'Auto (by SNPs)' },
  { key: 'Keto',     label: 'Keto / Very Low Carb' },
  { key: 'LowCarb',  label: 'Low Carb' },
  { key: 'Moderate', label: 'Moderate Carb (Mediterranean)' },
  { key: 'HiProtein',label: 'Moderate-Carb, Higher-Protein' }
];
const DIET_INFO: Record<Exclude<DietKey,'Auto'>, DietInfo> = {
  Keto: {
    desc: 'Very low carb to promote ketosis; strong TG and glycaemia effects in some; watch LDL-C if LDLR clearance is impaired.',
    baseMacros: 'Carbs <10–15% • Protein 20–30% • Fat 55–70%'
  },
  LowCarb: {
    desc: 'Reduced carb load without full ketosis; often lowers TG while easier to maintain.',
    baseMacros: 'Carbs 15–25% • Protein 25–30% • Fat 45–55%'
  },
  Moderate: {
    desc: 'Mediterranean-leaning, high fibre and MUFA/PUFA; supportive for LDLR-related clearance.',
    baseMacros: 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)'
  },
  HiProtein: {
    desc: 'Higher-protein, moderate-carb; helpful for liver fat and satiety.',
    baseMacros: 'Carbs 30–40% • Protein 25–30% • Fat 30–35%'
  }
};

function recommendDiet(genotypes: Record<string, string>) {
  const ldlr = categoryScores(SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps, genotypes);
  const tg   = categoryScores(SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps, genotypes);
  const liver= categoryScores(SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps, genotypes);

  let key: Exclude<DietKey,'Auto'> = 'Moderate';
  let diet = 'Moderate-Carb (Mediterranean-leaning)';
  let macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)';
  const reasons: string[] = [];

  const ldlrRisk = ldlr.label === 'Overall Risk';
  const tgRisk   = tg.label === 'Overall Risk';
  const liverRisk= liver.label === 'Overall Risk';

  if (tgRisk && !ldlrRisk) {
    if (liverRisk) {
      key = 'LowCarb';
      diet = 'Low-Carb (not Keto)';
      macros = 'Carbs 15–25% • Protein 25–30% • Fat 45–55% (favor MUFA/PUFA)';
    } else {
      key = 'Keto';
      diet = 'Low-Carb or Keto';
      macros = 'Keto: Carbs <10–15% • Protein 20–30% • Fat 55–70% (favor MUFA/PUFA)';
    }
    reasons.push('TG/VLDL category at risk → reduce carb load and sugars to lower TG.');
    if (liverRisk) reasons.push('Liver lipogenesis risk → prefer low-carb with higher protein & unsaturated fats over strict keto.');
  }

  if (ldlrRisk && tgRisk) {
    key = 'Moderate';
    diet = 'Moderate-Carb (Mediterranean-leaning)';
    macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%, emphasize MUFA/PUFA)';
    reasons.push('LDLR risk + TG risk → avoid very-low-carb/high-SFA patterns that can raise LDL-C; still limit sugars to control TG.');
  } else if (ldlrRisk && !tgRisk) {
    key = 'Moderate';
    diet = 'Moderate-Carb (Mediterranean-leaning)';
    macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)';
    reasons.push('LDLR category at risk → avoid ketogenic patterns with high saturated fat; use fibre & unsaturated fats.');
  }

  if (!tgRisk && !ldlrRisk && liverRisk) {
    key = 'HiProtein';
    diet = 'Moderate-Carb, Higher-Protein';
    macros = 'Carbs 30–40% • Protein 25–30% • Fat 30–35%';
    reasons.push('Liver lipogenesis risk → higher protein, limit alcohol/fructose, support choline intake.');
  }

  return { key, diet, macros, reasons, badges: { ldlr, tg, liver } };
}

function evaluateDiet(key: Exclude<DietKey,'Auto'>, genotypes: Record<string, string>) {
  const ldlr   = categoryScores(SNP_CATEGORIES['LDL receptor function / cholesterol clearance'].snps, genotypes);
  const tg     = categoryScores(SNP_CATEGORIES['Triglyceride metabolism & VLDL secretion'].snps, genotypes);
  const liver  = categoryScores(SNP_CATEGORIES['De novo lipogenesis & hepatic signalling'].snps, genotypes);
  const insulin= categoryScores(SNP_CATEGORIES['Insulin sensitivity / fat oxidation / carbohydrate tolerance'].snps, genotypes);

  const ldlrRisk   = ldlr.label === 'Overall Risk';
  const tgRisk     = tg.label === 'Overall Risk';
  const liverRisk  = liver.label === 'Overall Risk';
  const insulinRisk= insulin.label === 'Overall Risk';
  const isHyperAbsorber = Boolean((genotypes.rs429358?.includes('C') || genotypes.rs7412?.includes('C')) && genotypes.rs11591147 !== 'T');

  const cautions: string[] = [];
  const benefits: string[] = [];
  let macros = '';
  let how: string[] = [];

  if (key === 'Keto') {
    macros = 'Carbs <10–15% • Protein 20–30% • Fat 55–70%';
    if (tgRisk) benefits.push('TG risk → very low carb reliably lowers fasting TG and VLDL.');
    if (insulinRisk) benefits.push('Insulin resistance → ketosis can improve glycaemia and appetite control.');
    if (ldlrRisk) cautions.push('LDLR clearance risk + low insulin on keto can reduce LDLR activity → LDL-C may rise. Keep SFA very low; prioritise MUFA/PUFA; add viscous fibre.');
    if (isHyperAbsorber) cautions.push('APOE ε-pattern/hyper-absorber → dietary cholesterol sensitivity; limit eggs/organ meats, add plant sterols.');
    if (liverRisk) cautions.push('Hepatic lipogenesis risk → prefer low-carb *not* high-SFA keto; keep protein higher.');
    how = ['Use olive oil/avocado/nuts; avoid butter/coconut oil.', '25–35g/day fibre (oats/psyllium/veg).', 'EPA/DHA 1–2g/day (fish or supplements).'];
  }

  if (key === 'LowCarb') {
    macros = 'Carbs 15–25% • Protein 25–30% • Fat 45–55%';
    if (tgRisk) benefits.push('Lower carb load and sugars → reduces TG and remnant lipoproteins.');
    if (insulinRisk) benefits.push('Improves glycaemic control without extreme carb restriction.');
    if (ldlrRisk) cautions.push('LDLR risk → keep SFA <10% kcal; prefer MUFA/PUFA to avoid LDL-C rise.');
    if (isHyperAbsorber) cautions.push('Hyper-absorber → moderate high-cholesterol foods; add plant sterols/stanols.');
    if (liverRisk) benefits.push('With higher protein, supports liver fat reduction.');
    how = ['Carbs from veg/berries/legumes; avoid refined sugars.', 'Fat sources mainly MUFA/PUFA; minimal butter/cream.', 'Protein 1.2–1.6 g/kg/day.'];
  }

  if (key === 'Moderate') {
    macros = 'Carbs 35–45% • Protein 20–30% • Fat 25–35% (SFA <10%)';
    benefits.push('Mediterranean pattern supports LDL lowering with fibre and MUFA/PUFA.');
    if (ldlrRisk) benefits.push('Favourable for LDLR impairment vs very-low-carb/high-SFA plans.');
    if (tgRisk) cautions.push('If TG remains high, shift toward low-carb end and cut sugars/alcohol.');
    if (isHyperAbsorber) benefits.push('Soluble fibre/plant sterols common here reduce absorption.');
    how = ['Whole grains/legumes/veg for fibre 25–35g/day.', 'Olive oil, nuts, fish; limit red/processed meat.', 'Keep added sugars and alcohol low to control TG.'];
  }

  if (key === 'HiProtein') {
    macros = 'Carbs 30–40% • Protein 25–30% • Fat 30–35%';
    if (liverRisk) benefits.push('Higher protein supports NAFLD reduction and satiety.');
    if (insulinRisk) benefits.push('Higher protein + resistance training improve insulin sensitivity.');
    if (tgRisk) cautions.push('Keep sugars low; choose lower-GI carbs to avoid TG spikes.');
    if (ldlrRisk) cautions.push('Keep SFA <10% kcal; use lean proteins and MUFA/PUFA.');
    how = ['Evenly distribute protein (0.3–0.4 g/kg/meal).', 'Choose low-GI carbs (legumes, intact grains).', 'Add resistance training 2–3×/week.'];
  }

  // Expected lipid response (approximate; BMI 25, moderate activity)
  const projection = (() => {
    const res = { LDL: '↔', HDL: '↔', TG: '↔' };
    if (key === 'Keto') {
      res.TG  = tgRisk ? '↓ 20–40%' : '↓ 10–20%';
      res.HDL = '↑ 5–15%';
      res.LDL = (ldlrRisk || isHyperAbsorber) ? '↑ 10–30% (higher if SFA high)' : '↔ to ↑ 0–10%';
      if (liverRisk) res.TG = '↓ 10–20% (limit SFA; protein high)';
    }
    if (key === 'LowCarb') {
      res.TG  = tgRisk ? '↓ 15–30%' : '↓ 5–15%';
      res.HDL = '↑ 5–10%';
      res.LDL = (ldlrRisk || isHyperAbsorber) ? '↔ to ↑ 0–10% (keep SFA low)' : '↔ to ↓ 0–5%';
    }
    if (key === 'Moderate') {
      res.TG  = tgRisk ? '↓ 10–20% (cut sugars/alcohol)' : '↓ 5–15%';
      res.HDL = '↑ 0–5%';
      res.LDL = ldlrRisk ? '↓ 10–20%' : '↓ 5–15%';
    }
    if (key === 'HiProtein') {
      res.TG  = '↓ 5–15%';
      res.HDL = '↑ 0–5%';
      res.LDL = ldlrRisk ? '↓ 5–10% (if SFA low)' : '↔ to ↓ 0–10%';
    }
    return res;
  })();

  return {
    macros, benefits, cautions, how, projection,
    signals: { ldlr: ldlr.label, tg: tg.label, liver: liver.label, insulin: insulin.label }
  };
}

// ---------- App ----------
export default function App() {
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [compareDiet, setCompareDiet] = useState<DietKey>('Auto');

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => alert('Failed to read file. Try again.');
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const snpMap: Record<string, string> = {};
      const needed = new Set(Object.keys(SNP_INFO));
      text.split(/\r?\n/).forEach(line => {
        if (!line || line[0] === '#') return;
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
    };
    reader.readAsText(file);
  }

  function loadDemo() {
    const demo: Record<string, string> = {};
    Object.keys(SNP_INFO).forEach(snp => {
      demo[snp] = SNP_INFO[snp].protective?.[0] || 'TT';
    });
    setGenotypes(demo);
  }

  const summaries = useMemo(() => {
    const out: Record<string, CategoryScore> = {};
    for (const [cat, { snps }] of Object.entries(SNP_CATEGORIES)) {
      out[cat] = categoryScores(snps, genotypes);
    }
    return out;
  }, [genotypes]);

  const phenotypes = useMemo(() => {
    return Object.keys(genotypes).length ? detectPhenotypes(genotypes) : { justifications: {} as Record<string,string[]> };
  }, [genotypes]);

  const autoDiet = useMemo(() => {
    return Object.keys(genotypes).length ? recommendDiet(genotypes) : null;
  }, [genotypes]);

  const activeDietKey: Exclude<DietKey,'Auto'> = compareDiet === 'Auto'
    ? (autoDiet?.key || 'Moderate')
    : (compareDiet as Exclude<DietKey,'Auto'>);

  const activeDietEval = useMemo(() => evaluateDiet(activeDietKey, genotypes), [activeDietKey, genotypes]);

  const missing = useMemo(() => {
    const m: string[] = [];
    for (const snp of Object.keys(SNP_INFO)) {
      if (!genotypes[snp]) m.push(snp);
    }
    return m;
  }, [genotypes]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">🧬 Lipid SNP Analysis & Diet Recommendation Tool</h1>

      <div className="flex gap-2">
        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="border p-2 w-full" />
        <button onClick={loadDemo} className="px-4 py-2 bg-blue-500 text-white rounded">Load Demo SNPs</button>
      </div>

      {Object.keys(genotypes).length === 0 && (
        <div className="p-4 border rounded text-gray-600">Start by uploading your SelfDecode <code>.txt</code> file or click <strong>Load Demo SNPs</strong>.</div>
      )}

      {Object.keys(genotypes).length > 0 && (
        <>
          {missing.length > 0 && (
            <div className="p-4 border rounded bg-yellow-50">
              <strong>Note:</strong> Missing SNPs ({missing.length}) won’t block analysis, but results may be partial.
            </div>
          )}

          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">Legend</h2>
            <p><span style={{ color: 'red' }}>Risk</span> • <span style={{ color: 'green' }}>Protective</span> • <span style={{ color: 'gray' }}>Neutral</span></p>
          </div>

          {Object.entries(SNP_CATEGORIES).map(([category, { snps, description }]) => {
            const sum = summaries[category];
            return (
              <div key={category} className="mb-4">
                <h3 className="font-medium" style={{ color: sum.color }}>
                  {category} — {sum.label}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{description}</p>
                <ul className="list-disc ml-6">
                  {snps.map(snp => {
                    const genotype = genotypes[snp] || '❌ Not found';
                    const { status, color } = interpretSnp(snp, genotype);
                    return (
                      <li key={snp} style={{ color }}>
                        {snp}: <strong>{genotype}</strong> — {status}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="mt-6 p-4 border rounded">
            <h3 className="font-medium mb-2">Phenotype Detection</h3>
            <p>Mono FH: {phenotypes.fhMono ? '✅' : '❌'}</p>
            <ul className="text-sm list-disc ml-6 mb-3">
              {(phenotypes.justifications as any)?.fhMono?.map((j: string, i: number) => <li key={`fhm-${i}`}>{j}</li>)}
            </ul>
            <p>Polygenic FH: {phenotypes.polyFH ? '✅' : '❌'}</p>
            <ul className="text-sm list-disc ml-6 mb-3">
              {(phenotypes.justifications as any)?.polyFH?.map((j: string, i: number) => <li key={`pfh-${i}`}>{j}</li>)}
            </ul>
            <p>Polygenic Combined FH: {phenotypes.polyCombined ? '✅' : '❌'}</p>
            <ul className="text-sm list-disc ml-6 mb-3">
              {(phenotypes.justifications as any)?.polyCombined?.map((j: string, i: number) => <li key={`pc-${i}`}>{j}</li>)}
            </ul>
            <p>Hyper Absorber: {phenotypes.hyperAbsorber ? '✅' : '❌'}</p>
            <ul className="text-sm list-disc ml-6">
              {(phenotypes.justifications as any)?.hyperAbsorber?.map((j: string, i: number) => <li key={`ha-${i}`}>{j}</li>)}
            </ul>
          </div>

          <div className="mt-6 p-4 border rounded bg-gray-50">
            <h3 className="font-semibold mb-2">Diet Suggestions (by SNP risk)</h3>
            {(() => {
              const r = autoDiet!;
              const autoEval = evaluateDiet(r.key, genotypes);
              return (
                <>
                  <p className="mb-1"><strong>Recommended style:</strong> {r.diet}</p>
                  <p className="mb-2 text-sm text-gray-700"><span className="font-mono font-semibold">{r.macros}</span></p>
                  <ul className="list-disc ml-6 mb-2">
                    {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                  <div className="text-xs text-gray-600 mb-2">
                    <p><strong>Signals:</strong> LDLR: {r.badges.ldlr.label} (risk {r.badges.ldlr.riskScore}, prot {r.badges.ldlr.protectiveScore}) • TG: {r.badges.tg.label} (risk {r.badges.tg.riskScore}, prot {r.badges.tg.protectiveScore}) • Liver: {r.badges.liver.label} (risk {r.badges.liver.riskScore}, prot {r.badges.liver.protectiveScore})</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Expected lipid response (BMI 25, moderate activity; approximate)</p>
                    <ul className="list-disc ml-6">
                      <li>LDL: {autoEval.projection.LDL}</li>
                      <li>HDL: {autoEval.projection.HDL}</li>
                      <li>TG: {autoEval.projection.TG}</li>
                    </ul>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Try an alternative diet</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {DIET_PRESETS.map(p => {
                const active = compareDiet === 'Auto'
                  ? (autoDiet?.key === p.key)
                  : (compareDiet === p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => setCompareDiet(p.key)}
                    className={`px-3 py-1 rounded border ${active ? 'bg-blue-600 text-white' : 'bg-white'}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeKey = compareDiet === 'Auto' ? (autoDiet?.key || 'Moderate') : (compareDiet as Exclude<DietKey,'Auto'>);
              const e = evaluateDiet(activeKey, genotypes);
              return (
                <>
                  <p className="text-sm mb-2">
                    <strong>Selected:</strong> {(compareDiet === 'Auto' ? 'Auto → ' : '')}
                    {DIET_PRESETS.find(d => d.key === activeKey)?.label || activeKey}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">{DIET_INFO[activeKey].desc}</p>
                  <p className="text-sm mb-2"><strong>Base macros:</strong> <span className="font-mono font-semibold">{DIET_INFO[activeKey].baseMacros}</span></p>
                  <p className="text-sm mb-2"><strong>Macros (tuned):</strong> <span className="font-mono font-semibold">{e.macros}</span></p>
                  <p className="text-sm mb-2"><strong>Signals:</strong> LDLR {e.signals.ldlr} • TG {e.signals.tg} • Liver {e.signals.liver} • Insulin {e.signals.insulin}</p>

                  <div className="text-sm mb-3">
                    <p className="font-medium">Expected lipid response (BMI 25, moderate activity; approximate)</p>
                    <ul className="list-disc ml-6">
                      <li>LDL: {e.projection.LDL}</li>
                      <li>HDL: {e.projection.HDL}</li>
                      <li>TG: {e.projection.TG}</li>
                    </ul>
                  </div>

                  {e.benefits.length > 0 && (
                    <>
                      <p className="font-medium">Why this might be good (based on SNPs)</p>
                      <ul className="list-disc ml-6 mb-2">{e.benefits.map((b, i) => <li key={`b-${i}`}>{b}</li>)}</ul>
                    </>
                  )}
                  {e.cautions.length > 0 && (
                    <>
                      <p className="font-medium">Cautions (based on SNPs)</p>
                      <ul className="list-disc ml-6">{e.cautions.map((c, i) => <li key={`c-${i}`}>{c}</li>)}</ul>
                    </>
                  )}
                  {e.how.length > 0 && (
                    <>
                      <p className="font-medium mt-2">Tips tailored to your genetics</p>
                      <ul className="list-disc ml-6">{e.how.map((h, i) => <li key={`h-${i}`}>{h}</li>)}</ul>
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
