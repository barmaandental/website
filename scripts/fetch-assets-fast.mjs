import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://barmaandental.co.za';
const jobs = [];

function add(url, dest) { jobs.push({ url, dest }); }

// Logo (full size)
add(`${BASE}/wp-content/uploads/2026/05/Barmaan-Logo_result.webp`, 'src/assets/site/logo.webp');

fs.mkdirSync('src/assets/site', { recursive: true });
fs.mkdirSync('public/catalogues', { recursive: true });

// Discover PDFs from catalogues page
const catPage = await (await fetch(`${BASE}/catalogues/`)).text();
const pdfLinks = [...new Set([...catPage.matchAll(/https?:\/\/[^\s"'<>]+?\.pdf/gi)].map(m => m[0]))];
console.log('PDFs:', pdfLinks);
for (const url of pdfLinks) {
  const name = decodeURIComponent(path.basename(new URL(url).pathname));
  add(url, path.join('public/catalogues', name));
}

async function dl({ url, dest }) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return 'exists';
  for (let a = 1; a <= 2; a++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return 'ok';
    } catch (e) {
      console.error(`fail(${a}) ${url}: ${e.message}`);
    }
  }
  return 'failed';
}

const results = await Promise.all(jobs.map(dl));
jobs.forEach((j, i) => console.log(results[i], '->', j.dest));
