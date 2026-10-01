import productsJson from './products.json';
import categoriesJson from './categories.json';

export interface Product {
  id: number;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  packSize: string | null;
  categories: string[];
  image: string | null;
  imageMeta?: ImageMetadata;
}

export interface Category {
  slug: string;
  name: string;
  count: number;
  description: string;
}

const categoriesRaw = (categoriesJson as Category[]).filter(
  (c) => c.slug !== 'uncategorized' && c.count > 0
);

// Map image filenames to importable modules via import.meta.glob (build-time)
const imageModules = import.meta.glob<{ default: ImageMetadata }>('../assets/products/*', {
  eager: true,
});

const imageByName: Record<string, ImageMetadata> = {};
for (const [file, mod] of Object.entries(imageModules)) {
  imageByName[file.split('/').pop() as string] = mod.default;
}

export const products: Product[] = (productsJson as any[])
  .map((p) => ({
    ...p,
    imageMeta: p.image ? imageByName[p.image] : undefined,
  }))
  .sort((a: Product, b: Product) => a.title.localeCompare(b.title));

export const categories: Category[] = categoriesRaw.sort((a: Category, b: Category) =>
  a.name.localeCompare(b.name)
);

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(catSlug: string): Product[] {
  return products.filter((p) => p.categories.includes(catSlug));
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function relatedProducts(product: Product, n = 3): Product[] {
  const sameCat = products.filter(
    (p) => p.id !== product.id && p.categories.some((c) => product.categories.includes(c))
  );
  return sameCat.slice(0, n);
}
