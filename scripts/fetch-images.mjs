import fs from 'node:fs';
import path from 'node:path';

const products = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
const imgDir = path.resolve('src/assets/products');
fs.mkdirSync(imgDir, { recursive: true });

let downloaded = 0, skipped = 0, failed = 0;
for (const p of products) {
  if (!p.imageUrl) continue;
  const dest = path.join(imgDir, p.image);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { skipped++; continue; }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const res = await fetch(p.imageUrl, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(res.status);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      downloaded++; ok = true;
    } catch (e) {
      console.error(`attempt ${attempt} FAILED for ${p.slug}: ${e.message}`);
      if (attempt === 3) failed++;
      else await new Promise(r => setTimeout(r, 2000));
    }
  }
}
console.log(`Images: ${downloaded} downloaded, ${skipped} existed, ${failed} failed`);
console.log(`Total files in dir: ${fs.readdirSync(imgDir).length}`);
