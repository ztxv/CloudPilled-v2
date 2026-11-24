// Verifies every official AWS reference in src/content/refs.ts still resolves.
// Network required. Usage: npm run check:links
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/content/refs.ts', import.meta.url), 'utf8');
const urls = [...new Set([...src.matchAll(/'(https:\/\/[^']+)'/g)].map((m) => m[1]))];
const limit = 8;
let bad = 0;
let i = 0;

async function check(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
        headers: { 'user-agent': 'Mozilla/5.0 (CloudPilled link check)' },
      });
      return res.status;
    } catch (e) {
      if (attempt === 1) return `ERR ${e.message}`;
    }
  }
}

async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    const status = await check(url);
    if (status !== 200) {
      bad++;
      console.log(`${status}  ${url}`);
    }
  }
}

await Promise.all(Array.from({ length: limit }, worker));
console.log(`${urls.length - bad}/${urls.length} references resolved.`);
process.exit(bad ? 1 : 0);
