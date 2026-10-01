export const site = {
  name: 'Barmaan Dental',
  domain: 'https://barmaandental.co.za',
  phone: '+27 64 829 9032',
  phoneLink: 'tel:+27648299032',
  whatsapp: '27648299032',
  email: 'barmaandental@gmail.com',
  tagline: 'Exclusive South African distributor of Dipotech Switzerland products',
  description:
    'Barmaan Dental is the exclusive South African distributor of Dispotech (Dipotech Switzerland), supplying high-quality disposable dental and medical products to clinics, hospitals and distributors across South Africa.',
};

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function productWhatsApp(title: string) {
  return whatsappLink(
    `Hello Barmaan Dental, I would like a price for: ${title}`
  );
}

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop/' },
  { label: 'Catalogues', href: '/catalogues/' },
  { label: 'About Us', href: '/about_us/' },
  { label: 'Contact Us', href: '/contact-us/' },
];

export interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
}

export function seo({ title, description, path = '', image, type = 'website' }: SeoProps) {
  const url = `${site.domain}${path}`;
  const ogImage = image ? `${site.domain}${image}` : `${site.domain}/og-image.png`;
  return { title, description, url, ogImage, type };
}

// Auto-generate SEO title for product/category pages
export function seoTitle(name: string, suffix?: string) {
  const s = suffix || 'Dental & Medical Supplies South Africa';
  return `${name} | ${s} - Barmaan Dental`;
}

// Auto-generate meta description, trimmed to ~155-160 chars
export function seoDescription(text: string, fallback: string) {
  const clean = (text || fallback).replace(/\s+/g, ' ').trim();
  if (clean.length <= 158) return clean;
  return clean.slice(0, 155).replace(/\s+\S*$/, '') + '...';
}
