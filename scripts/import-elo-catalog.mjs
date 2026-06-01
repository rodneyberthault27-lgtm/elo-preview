import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://www.elobrindes.com.br";
const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const imageDir = path.join(root, "assets", "elo-products");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const pages = Number(args.pages || 1);
const limit = Number(args.limit || pages * 20);
const output = path.resolve(root, args.output || "products.elobrindes.json");
const writeMain = args.write === "true";
const downloadImages = args.images !== "false";

await fs.mkdir(imageDir, { recursive: true });

const products = [];
const seen = new Set();

for (let page = 1; page <= pages && products.length < limit; page += 1) {
  const url = `${SITE}/produtos?ordem=mais-novos${page > 1 ? `&página=${page}` : ""}`;
  const html = await fetchText(url);
  const pageProducts = extractProducts(html);

  for (const raw of pageProducts) {
    if (seen.has(raw.ref) || products.length >= limit) continue;
    seen.add(raw.ref);
    const product = await normalizeProduct(raw);
    products.push(product);
    console.log(`${products.length}. ${product.code} ${product.name}`);
  }
}

await fs.writeFile(output, `${JSON.stringify(products, null, 2)}\n`, "utf8");
if (writeMain) {
  await fs.copyFile(output, path.join(root, "products.json"));
}

console.log(`\nCatálogo gerado: ${output}`);
console.log(`Produtos importados: ${products.length}`);
if (writeMain) console.log("products.json atualizado para o Elo Preview.");

async function normalizeProduct(raw) {
  const description = stripHtml(raw.technical_description);
  const remoteImage = absoluteUrl(raw.image);
  const localImage = downloadImages ? await downloadImage(remoteImage, raw.ref) : remoteImage;
  const techniques = extractTechniques(description);

  return {
    code: raw.ref,
    name: raw.name,
    category: inferCategory(raw.name, description),
    src: localImage,
    sourceUrl: absoluteUrl(raw.url),
    sourceImage: remoteImage,
    color: extractField(description, ["Cores", "Cor", "Cores disponíveis"]) || "A definir",
    techniques,
    dimensions: extractField(description, ["Dimensões", "Tamanho total aproximado"]) || "A definir",
    area: extractField(description, ["Área de gravação", "Área de gravação aproximada"]) || "Área sugerida no produto",
    minimumQuantity: extractField(description, ["Quantidade mínima", "Mínimo"]) || "A definir",
    removePreviewBg: true,
    safeArea: defaultSafeArea(inferCategory(raw.name, description)),
  };
}

function extractProducts(html) {
  const matches = [...html.matchAll(/\{ref:"((?:\\.|[^"])*)",name:"((?:\\.|[^"])*)",url:"((?:\\.|[^"])*)",image:"((?:\\.|[^"])*)",technical_description:"((?:\\.|[^"])*)"/g)];
  return matches.map((match) => ({
    ref: decodeJsString(match[1]),
    name: decodeJsString(match[2]),
    url: decodeJsString(match[3]),
    image: decodeJsString(match[4]),
    technical_description: decodeJsString(match[5]),
  }));
}

function decodeJsString(value) {
  return Function(`"use strict"; return "${value}";`)();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Elo Preview catalog importer; contato: elobrindes@elobrindes.com.br",
    },
  });
  if (!response.ok) throw new Error(`Falha ao buscar ${url}: ${response.status}`);
  return response.text();
}

async function downloadImage(url, code) {
  const parsed = new URL(url);
  const extension = path.extname(parsed.pathname).split("?")[0] || ".jpg";
  const fileName = `${safeSlug(code)}${extension.toLowerCase()}`;
  const localPath = path.join(imageDir, fileName);
  const relativePath = `assets/elo-products/${fileName}`;

  try {
    await fs.access(localPath);
    return relativePath;
  } catch {
    const response = await fetch(url);
    if (!response.ok) return url;
    const bytes = new Uint8Array(await response.arrayBuffer());
    await fs.writeFile(localPath, bytes);
    return relativePath;
  }
}

function absoluteUrl(value) {
  return new URL(value, SITE).href;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|Â /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractField(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}:?\\s*([^\\n]+)`, "i"));
    if (match?.[1]) return match[1].replace(/\.$/, "").trim();
  }
  return "";
}

function extractTechniques(text) {
  const value = extractField(text, ["Tipo de gravação", "Gravação", "Área de gravação"]);
  const haystack = normalize(`${value} ${text}`);
  const techniques = [
    ["laser cilíndrico", "laser cilindrico"],
    ["laser", "laser"],
    ["serigrafia", "serigrafia"],
    ["transfer", "transfer"],
    ["uv digital", "uv"],
    ["tampografia", "tampografia"],
    ["sublimação", "sublimacao"],
    ["bordado", "bordado"],
    ["baixo-relevo", "baixo relevo"],
    ["digital", "digital"],
  ]
    .filter(([, needle]) => haystack.includes(needle))
    .map(([label]) => label);

  return [...new Set(techniques)].length ? [...new Set(techniques)] : ["A definir"];
}

function inferCategory(name, description) {
  const value = normalize(`${name} ${description}`);
  if (value.includes("caneta") || value.includes("lapis")) return "Canetas";
  if (value.includes("squeeze") || value.includes("garrafa")) return "Squeezes";
  if (value.includes("caneca") || value.includes("copo") || value.includes("taca")) return "Canecas";
  if (value.includes("mochila")) return "Mochilas";
  if (value.includes("sacola") || value.includes("bolsa ecologica")) return "Sacolas";
  if (value.includes("caderno") || value.includes("bloco") || value.includes("agenda")) return "Cadernos";
  if (value.includes("necessaire")) return "Necessaires";
  if (value.includes("bolsa")) return "Bolsas";
  if (value.includes("chaveiro")) return "Chaveiros";
  return "Outros";
}

function defaultSafeArea(category) {
  const areas = {
    Canetas: { x: 350, y: 320, width: 500, height: 92 },
    Squeezes: { x: 420, y: 220, width: 360, height: 300 },
    Canecas: { x: 390, y: 230, width: 420, height: 260 },
    Cadernos: { x: 350, y: 180, width: 500, height: 360 },
    Sacolas: { x: 360, y: 190, width: 480, height: 340 },
    Mochilas: { x: 380, y: 190, width: 440, height: 330 },
  };
  return areas[category] || { x: 360, y: 210, width: 480, height: 300 };
}

function safeSlug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
