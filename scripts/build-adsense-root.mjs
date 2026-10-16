import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination) throw new Error('Informe a pasta do repositório raiz: node scripts/build-adsense-root.mjs ../adsense-root');
const out = path.resolve(root, destination);
if (out === root || out.startsWith(root + path.sep)) throw new Error('A saída deve ficar fora do repositório do editor.');
const host = 'https://rodneyberthault27-lgtm.github.io/';
const blog = `${host}elo-preview/blog/`;
const publisher = 'pub-9069202979021478';
let html = await fs.readFile(path.join(root, 'blog/index.html'), 'utf8');
if (!html.includes(`content="ca-${publisher}"`)) throw new Error('Gere o blog com a metatag de verificação primeiro.');
html = html.replace('<head>', `<head><base href="${blog}">`);
// Keep the blog's canonical URL: this is a second entrance to the same portal.
await fs.mkdir(out, {recursive:true});
await fs.writeFile(path.join(out,'index.html'), html);
await fs.writeFile(path.join(out,'ads.txt'), `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
await fs.writeFile(path.join(out,'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${blog}sitemap.xml\n`);
await fs.writeFile(path.join(out,'.nojekyll'), '');
await fs.writeFile(path.join(out,'README.md'), `# Entrada pública do Elo Preview\n\nPágina inicial e ads.txt de ${host}.\n\nGerados pelo repositório elo-preview, com o comando:\n\n\`node scripts/build-adsense-root.mjs ../adsense-root\`\n\nO blog e o editor permanecem em /elo-preview/. A metatag e o ads.txt identificam a conta ${publisher}; não carregam anúncios nem comprovam aprovação pelo Google.\n`);
console.log(`Raiz preparada em ${out}`);
