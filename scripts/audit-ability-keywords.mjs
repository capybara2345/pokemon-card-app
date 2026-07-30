/**
 * Audit ability effects that produce no keywords from inferKeywords.
 */
import fs from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// Extract inferKeywords by wrapping fill-keywords without running main
const src = fs.readFileSync('fill-keywords.mjs', 'utf8');
const start = src.indexOf('function inferKeywords');
const end = src.indexOf('\nexport { inferKeywords }');
if (start < 0 || end < 0) {
  console.error('Could not locate inferKeywords', start, end);
  process.exit(1);
}
const fnSrc = src.slice(start, end);
const inferKeywords = new Function(`${fnSrc}\nreturn inferKeywords;`)();

const wb = XLSX.readFile('app/data/card_list.xlsx');
const byEffect = new Map();

for (const sn of wb.SheetNames) {
  if (sn === '추천덱') continue;
  for (const r of XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' })) {
    const ae = String(r['특성효과'] || '').trim();
    if (!ae || ae === '-') continue;
    const fromAb = inferKeywords('', '', ae);
    if (!byEffect.has(ae)) {
      byEffect.set(ae, { ae, fromAb, count: 0, samples: [] });
    }
    const e = byEffect.get(ae);
    e.count++;
    if (e.samples.length < 3) {
      e.samples.push({
        id: r.ID,
        name: r['이름'],
        ab: r['특성'],
        sheet: sn,
        cur: String(r['키워드'] || '').trim(),
      });
    }
  }
}

const uncovered = [...byEffect.values()]
  .filter((e) => !e.fromAb)
  .sort((a, b) => b.count - a.count);

console.log('Uncovered ability-effect patterns:', uncovered.length);
for (const e of uncovered) {
  console.log('\n--- count', e.count);
  console.log('ability:', e.samples.map((s) => s.ab).filter(Boolean)[0] || '(no name)');
  console.log('effect:', e.ae);
  console.log(
    'samples:',
    e.samples.map((s) => `${s.id} ${s.name} [${s.cur || 'empty'}]`).join(' | '),
  );
}
