import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://barmaandental.co.za';
const OUT = path.resolve('src/data');
fs.mkdirSync(OUT, { recursive: true });

async function fetchAll(endpoint) {
  let page = 1;
  const all = [];
  while (true) {
    const res = await fetch(`${BASE}/wp-json/wp/v2/${endpoint}?per_page=100&page=${page}&_embed=wp:featuredmedia&timestamp=${Date.now()}`);
    if (!res.ok) {
      if (res.status === 400 || res.status === 404) break; // no more pages
      throw new Error(`${endpoint} page ${page}: ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return all;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDescription(html) {
  // First meaningful paragraph before "Pack size"/"Price" boilerplate
  const cleaned = html
    .replace(/<h3[^>]*>(Pack size|VAT included|Price|Product detail)<\/h3>[\s\S]*$/i, '')
    .replace(/<h3[^>]*>[\s\S]*$/i, '');
  return stripHtml(cleaned || html);
}

function firstSentence(text, max = 160) {
  if (!text) return '';
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  let s = m ? m[1] : text;
  if (s.length > max) s = s.slice(0, max - 3).replace(/\s+\S*$/, '') + '...';
  return s;
}

// ---- Fetch categories ----
console.log('Fetching categories...');
const cats = await fetchAll('product_cat');
const catMap = {};
for (const c of cats) {
  catMap[c.id] = { slug: c.slug, name: c.name, count: c.count, description: stripHtml(c.description) };
}
fs.writeFileSync(path.join(OUT, 'categories.json'), JSON.stringify(cats.map(c => ({
  slug: c.slug, name: c.name, count: c.count, description: stripHtml(c.description),
})), null, 2));
console.log(`Categories: ${cats.length}`);

// ---- Fetch products ----
console.log('Fetching products...');
const products = await fetchAll('product');
console.log(`Products fetched: ${products.length}`);

const mediaIds = new Set();
const result = [];
for (const p of products) {
  const desc = buildDescription(p.content?.rendered);
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const imageUrl = media?.source_url || null;
  if (media?.id) mediaIds.add(media.id);

  // Extract pack size / detail from content
  const contentHtml = p.content?.rendered || '';
  let packSize = null;
  const packMatch = contentHtml.match(/<h3[^>]*>(Pack size|Product detail)<\/h3>\s*<p[^>]*>([^<]+)</i);
  if (packMatch) packSize = stripHtml(packMatch[2]);

  result.push({
    id: p.id,
    slug: p.slug,
    title: stripHtml(p.title?.rendered),
    description: desc,
    excerpt: firstSentence(desc),
    packSize,
    categories: (p.product_cat || []).map(id => catMap[id]?.slug).filter(Boolean),
    tags: [],
    image: imageUrl ? path.basename(decodeURIComponent(imageUrl)) : null,
    imageUrl,
  });
}

fs.writeFileSync(path.join(OUT, 'products.json'), JSON.stringify(result, null, 2));

// ---- Download images ----
const imgDir = path.resolve('src/assets/products');
fs.mkdirSync(imgDir, { recursive: true });
let downloaded = 0, skipped = 0, failed = 0;
for (const p of result) {
  if (!p.imageUrl) continue;
  const dest = path.join(imgDir, p.image);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { skipped++; continue; }
  try {
    const res = await fetch(p.imageUrl);
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    downloaded++;
  } catch (e) {
    console.error(`FAILED image for ${p.slug}: ${e.message}`);
    failed++;
  }
}
console.log(`Images: ${downloaded} downloaded, ${skipped} already existed, ${failed} failed`);

// ---- Summary ----
const noDesc = result.filter(p => !p.description).length;
const noImg = result.filter(p => !p.image).length;
console.log(`\nSummary: ${result.length} products, ${cats.length} categories`);
console.log(`Missing description: ${noDesc}, missing image: ${noImg}`);
