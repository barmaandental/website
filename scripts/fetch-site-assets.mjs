import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://barmaandental.co.za';

async function dl(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { console.log('exists:', dest); return true; }
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(res.status);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log('ok:', dest);
      return true;
    } catch (e) {
      console.error(`attempt ${a} failed ${url}: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

// --- Discover catalog PDFs from the catalogues page ---
const catPage = await (await fetch(`${BASE}/catalogues/`)).text();
const pdfLinks = [...new Set([...catPage.matchAll(/https?:\/\/[^\s"'<>]+?\.pdf/gi)].map(m => m[0]))];
console.log('PDFs found:', pdfLinks);

// --- Discover logo & key images from home page ---
const home = await (await fetch(`${BASE}/`)).text();
const imgLinks = [...new Set([...home.matchAll(/https?:\/\/[^\s"'<>]+?\.(?:png|jpe?g|svg|webp)/gi)].map(m => m[0]))];
console.log('Home images found:', imgLinks.length);

// Logo: look for logo in page
const logoMatch = home.match(/https?:\/\/[^\s"'<>]*logo[^\s"'<>]*\.(?:png|svg|webp)/i);
const logoUrl = logoMatch ? logoMatch[0] : imgLinks.find(u => /logo/i.test(u));
console.log('Logo URL:', logoUrl);

fs.mkdirSync('src/assets/site', { recursive: true });
fs.mkdirSync('public/catalogues', { recursive: true });

let results = { pdfs: [], siteImages: [] };

// Download PDFs
let i = 1;
for (const url of pdfLinks) {
  const name = decodeURIComponent(path.basename(new URL(url).pathname));
  const ok = await dl(url, path.join('public/catalogues', name));
  if (ok) results.pdfs.push({ url, file: name });
  i++;
}

// Download logo
if (logoUrl) {
  const name = decodeURIComponent(path.basename(new URL(logoUrl).pathname));
  if (await dl(logoUrl, path.join('src/assets/site', name))) {
    results.siteImages.push({ type: 'logo', url: logoUrl, file: name });
  }
}

fs.writeFileSync('src/data/site-assets.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
