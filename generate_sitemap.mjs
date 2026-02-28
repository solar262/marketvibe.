import fs from 'fs';
import { popularNiches } from './src/lib/niches.js';

const BASE_URL = process.env.VITE_SITE_URL || 'https://www.marketvibe1.com';

const generateSitemap = () => {
    const blogPosts = fs.readdirSync('./src/content/blog').filter(f => f.endsWith('.json')).map(f => `/blog/${f.replace('.json', '')}`);

    const pages = [
        '',
        '/tools/naming',
        '/launchpad',
        '/launchpad/submit',
        '/blog',
        '/newsroom',
        ...popularNiches.map(niche => `/validate/${niche.slug}`),
        ...blogPosts
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
    <url>
        <loc>${BASE_URL}${page}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === '' ? '1.0' : page.includes('validate') ? '0.7' : '0.8'}</priority>
    </url>`).join('')}
</urlset>`;

    fs.writeFileSync('./public/sitemap.xml', sitemap);
    console.log('✅ Sitemap generated successfully with', pages.length, 'URLs');
};

generateSitemap();
