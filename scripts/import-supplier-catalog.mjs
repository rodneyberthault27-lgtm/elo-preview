import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const imageRoot = path.join(root, "assets", "supplier-products");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const providerAliases = {
  xbz: "xbz",
  asia: "asia",
  spot: "spotgifts",
  spotgifts: "spotgifts",
};

const providerOrder = String(args.providers || "xbz,asia,spot")
  .split(",")
  .map((value) => providerAliases[value.trim().toLowerCase()])
  .filter(Boolean);

const output = path.resolve(root, args.output || "products.suppliers.json");
const writeMain = args.write === "true";
const limit = Number(args.limit || 0);
const downloadImages = (args.images || "download").toLowerCase() !== "remote";
const concurrency = Math.max(1, Number(args.concurrency || 8));

await fs.mkdir(imageRoot, { recursive: true });

const providerFetchers = {
  xbz: fetchXbzRows,
  asia: fetchAsiaRows,
  spotgifts: fetchSpotRows,
};

const warnings = [];
const rawRows = [];

for (const providerId of providerOrder) {
  const fetcher = providerFetchers[providerId];
  if (!fetcher) continue;
  try {
    const rows = await fetcher();
    rawRows.push(...rows);
    console.log(`${providerId}: ${rows.length} itens recebidos`);
  } catch (error) {
    warnings.push(`${providerId}: ${error.message}`);
    console.warn(`Aviso ${providerId}: ${error.message}`);
  }
}

const uniqueRows = dedupeRows(rawRows);
const limitedRows = limit > 0 ? uniqueRows.slice(0, limit) : uniqueRows;
const products = (
  await mapWithConcurrency(limitedRows, concurrency, (row, index) => normalizeSupplierRow(row, index, { downloadImages }))
).filter(Boolean);

await fs.writeFile(output, `${JSON.stringify(products, null, 2)}\n`, "utf8");
if (writeMain) await fs.copyFile(output, path.join(root, "products.json"));

console.log(`\nCatalogo gerado: ${output}`);
console.log(`Produtos exportados: ${products.length}`);
console.log(`Imagens: ${downloadImages ? "download local" : "urls remotas"}`);
if (warnings.length) {
  console.log("\nAvisos:");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}
if (writeMain) console.log("products.json atualizado para o Elo Preview.");

async function fetchXbzRows() {
  const url = "https://api.minhaxbz.com.br:5001/api/clientes/GetListaDeProdutos?cnpj=03259144000155&token=632AA6D31B";
  const items = await fetchJson(url);
  if (!Array.isArray(items)) throw new Error("resposta inesperada da XBZ");

  return items.map((item) => ({
    providerId: "xbz",
    providerName: "XBZ",
    code: item.CodigoComposto || item.CodigoAmigavel || item.CodigoXbz || "",
    baseCode: item.CodigoAmigavel || "",
    supplierCode: item.CodigoXbz || "",
    name: item.Nome || "",
    description: item.Descricao || "",
    imageUrl: item.ImageLink || "",
    sourceUrl: item.SiteLink || "",
    color: item.CorWebPrincipal || "",
    stock: Number(item.QuantidadeDisponivel ?? 0),
    price: Number(item.PrecoVenda ?? 0),
    ncm: item.Ncm || "",
    categoryHint: item.WebSubTipo || item.WebTipo || "",
    dimensions: formatDimensions(item),
    raw: item,
  }));
}

async function fetchAsiaRows() {
  const firstPage = await fetchAsiaPage(1);
  const totalPages = Math.max(1, Number(firstPage.total_paginas || 1));
  const rows = normalizeAsiaPage(firstPage);

  for (let page = 2; page <= totalPages; page += 1) {
    const payload = await fetchAsiaPage(page);
    rows.push(...normalizeAsiaPage(payload));
  }

  return rows;
}

async function fetchAsiaPage(page) {
  const body = new URLSearchParams({
    api_key: "eb160de1de89d9058fcb0b968dbbbd68",
    secret_key: "67AYfcQYMz3KKMOPX06c6oAkhuge55jM7sKqTQlAYQ5jMuMwNQ4LMXtm0kZkimoUaikEcDfGuS6P4iIUewPESM65xvEfkuDFozNh03EMFkaDVAN3Js4tbDR97M6n3rh",
    funcao: "listarProdutos2",
    pagina: String(page),
  });

  const payload = await fetchJson("https://api.asiaimport.com.br", {
    method: "POST",
    body,
  });

  if (!Array.isArray(payload?.produtos)) throw new Error(`pagina ${page} da Asia sem lista de produtos`);
  return payload;
}

function normalizeAsiaPage(payload) {
  return payload.produtos.flatMap((product) => {
    const variations = Array.isArray(product.variacoes) && product.variacoes.length ? product.variacoes : [null];
    return variations.map((variation) => ({
      providerId: "asia",
      providerName: "Asia Import",
      code: variation?.referencia || product.referencia || "",
      baseCode: product.referencia || "",
      supplierCode: product.referencia || "",
      name: variation?.nome || product.nome || "",
      description: product.descricao || "",
      imageUrl: variation?.imagem || product.imagem || "",
      sourceUrl: product.link || product.url || "",
      color: variation?.atributos?.cor?.value || variation?.atributos?.cor?.name || "",
      stock: Number(variation?.qtd_estoque ?? 0),
      price: Number(variation?.preco ?? product.preco ?? 0),
      ncm: variation?.ncm || product?.propriedades?.ncm || "",
      categoryHint: firstObjectValue(product.categorias) || "",
      dimensions:
        product?.propriedades?.["dimensao-produto"] ||
        product?.propriedades?.["dimensão-produto"] ||
        product?.propriedades?.["dimensao da caixa"] ||
        "",
      raw: product,
    }));
  });
}

async function fetchSpotRows() {
  const authText = await fetchText("https://ws.spotgifts.com.br/api/v1SSL/AuthenticateClient?accessKey=19vNgPfapJqkeFcd");
  const token = extractSpotToken(authText);
  if (!token) throw new Error("token nao retornado pela Spot Gifts");

  const [productsXml, stocksXml] = await Promise.all([
    fetchText(`https://ws.spotgifts.com.br/api/v1SSL/optionalsComplete?token=${token}&lang=PT`),
    fetchText(`https://ws.spotgifts.com.br/api/v1SSL/stocks?token=${token}&lang=PT`),
  ]);

  await fetchText(`https://ws.spotgifts.com.br/api/v1SSL/CloseSession?token=${token}`).catch(() => {});

  const productPayload = parseSpotPayload(productsXml);
  const stockPayload = parseSpotPayload(stocksXml);
  const productItems = Array.isArray(productPayload?.OptionalsComplete)
    ? productPayload.OptionalsComplete
    : productsFromXml(productsXml, /<OptionalComplete>(.*?)<\/OptionalComplete>/gs).map((match) => match[1]);
  const stockItems = Array.isArray(stockPayload?.Stocks)
    ? stockPayload.Stocks
    : productsFromXml(stocksXml, /<Stock>.*?<Sku>(.*?)<\/Sku>.*?<Quantity>(.*?)<\/Quantity>.*?<\/Stock>/gs).map((match) => ({
        Sku: match[1],
        Quantity: match[2],
      }));

  const stockMap = {};
  for (const item of stockItems) {
    const sku = typeof item === "string" ? extractXmlField(item, "Sku") : item?.Sku;
    if (!sku) continue;
    const quantity = typeof item === "string" ? extractXmlField(item, "Quantity") : item?.Quantity;
    stockMap[sku] = Number(quantity || 0);
  }

  return productItems
    .map((item) => normalizeSpotItem(item, stockMap))
    .filter(Boolean);
}

function extractSpotToken(authText) {
  const xmlToken = authText.match(/<Token>(.*?)<\/Token>/)?.[1];
  if (xmlToken) return xmlToken;
  try {
    return JSON.parse(authText)?.Token || "";
  } catch {
    return "";
  }
}

function parseSpotPayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeSpotItem(item, stockMap) {
  const source = typeof item === "string" ? null : item;
  const code = source?.Sku || extractXmlField(item, "Sku");
  if (!code) return null;

  const imageName = source?.MainImage || extractXmlField(item, "MainImage");
  const description = source?.Description || extractXmlField(item, "Description") || "";
  const type = source?.Type || extractXmlField(item, "Type") || "";
  const subType = source?.SubType || extractXmlField(item, "SubType") || "";
  const customizationTypes = source?.CustomizationTypes || extractXmlField(item, "CustomizationTypes") || "";
  const defaultCustomization = source?.DefaultCustomization || extractXmlField(item, "DefaultCustomization") || "";

  return {
    providerId: "spotgifts",
    providerName: "Spot Gifts",
    code,
    baseCode: source?.ProdReference || extractXmlField(item, "ProdReference") || "",
    supplierCode: source?.ProdReference || extractXmlField(item, "ProdReference") || "",
    name: source?.Name || extractXmlField(item, "Name") || "",
    description,
    customizationTypes,
    imageUrl: imageName ? `https://www.spotgifts.com.br/fotos/produtos/${imageName}` : "",
    sourceUrl: "",
    color: source?.ColorDesc1 || extractXmlField(item, "ColorDesc1") || "",
    stock: Number(stockMap[code] || 0),
    price: Number(source?.YourPrice || source?.Price1 || extractXmlField(item, "YourPrice") || extractXmlField(item, "Price1") || 0),
    ncm: source?.Taric || extractXmlField(item, "Taric") || "",
    categoryHint: `${type} ${subType}`.trim(),
    dimensions:
      source?.CombinedSizes ||
      source?.ProductComponentDefaultLocationAreaMM ||
      extractXmlField(item, "CombinedSizes") ||
      extractXmlField(item, "ProductComponentDefaultLocationAreaMM") ||
      "",
    raw: source || { xml: item, defaultCustomization },
  };
}

function productsFromXml(text, regex) {
  return [...String(text).matchAll(regex)];
}

function extractXmlField(block, tag) {
  if (typeof block !== "string") return "";
  return block.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`))?.[1] || "";
}

async function normalizeSupplierRow(row, index, { downloadImages }) {
  const code = cleanText(row.code);
  const name = cleanText(row.name);
  const imageUrl = cleanText(row.imageUrl);
  if (!code || !name || !imageUrl) return null;

  const inferredCategory = inferCategory(`${cleanText(row.categoryHint)} ${name} ${row.description}`);
  const resolvedCategory = resolveCategory(cleanText(row.categoryHint), `${name} ${row.description}`);
  const category =
    row.providerId === "spotgifts" || resolvedCategory.length > 26 || resolvedCategory.includes(",")
      ? inferredCategory
      : resolvedCategory;
  const src = downloadImages ? await downloadImage(imageUrl, row.providerId, code).catch(() => imageUrl) : imageUrl;
  const color = cleanText(row.color) || "A definir";
  const techniques = inferTechniques(`${name} ${row.description} ${row.customizationTypes || ""}`);

  return {
    id: `${row.providerId}:${code}:${row.supplierCode || row.baseCode || index}`,
    code,
    name,
    category,
    src,
    sourceUrl: cleanText(row.sourceUrl),
    sourceImage: imageUrl,
    sourceSupplier: row.providerId,
    supplierName: row.providerName,
    supplierCode: cleanText(row.supplierCode || row.baseCode),
    color,
    techniques,
    dimensions: cleanText(row.dimensions) || "A definir",
    area: defaultArea(category),
    minimumQuantity: "A definir",
    removePreviewBg: true,
    safeArea: defaultSafeArea(category),
    searchTerms: [
      code,
      name,
      category,
      color,
      row.providerId,
      row.providerName,
      row.baseCode,
      row.supplierCode,
      row.description,
    ]
      .map(cleanText)
      .filter(Boolean),
    stock: Number(row.stock ?? 0),
    price: Number(row.price ?? 0),
    ncm: cleanText(row.ncm),
  };
}

async function downloadImage(url, providerId, code) {
  const parsed = new URL(url);
  const extension = normalizeExtension(path.extname(parsed.pathname), url);
  const fileName = `${safeSlug(code)}${extension}`;
  const localDir = path.join(imageRoot, providerId);
  const localPath = path.join(localDir, fileName);
  const relativePath = `assets/supplier-products/${providerId}/${fileName}`;

  await fs.mkdir(localDir, { recursive: true });

  try {
    await fs.access(localPath);
    return relativePath;
  } catch {}

  const response = await fetch(url);
  if (!response.ok) throw new Error(`falha ao baixar imagem ${url}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(localPath, bytes);
  return relativePath;
}

function normalizeExtension(extension, url) {
  const cleaned = String(extension || "").toLowerCase().split("?")[0];
  if (cleaned && cleaned.length <= 5) return cleaned;
  const matched = String(url).match(/\.(png|jpg|jpeg|webp|gif|svg)(?:\?|$)/i)?.[1]?.toLowerCase();
  return matched ? `.${matched === "jpeg" ? "jpg" : matched}` : ".jpg";
}

function formatDimensions(item) {
  const parts = [
    ["Alt.", item.Altura],
    ["Larg.", item.Largura],
    ["Prof.", item.Profundidade],
    ["Comp.", item.Comprimento],
  ]
    .map(([label, value]) => [label, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([label, value]) => `${label} ${String(value).replace(".", ",")} cm`);

  return parts.join(" | ");
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.providerId}:${row.code}`;
    if (!row.code || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function mapWithConcurrency(items, workerCount, callback) {
  const results = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(workerCount, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await callback(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "user-agent": "Elo Preview supplier importer" },
    ...options,
  });
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    headers: { "user-agent": "Elo Preview supplier importer" },
    ...options,
  });
  if (!response.ok) throw new Error(`${url} respondeu ${response.status}`);
  return response.text();
}

function inferCategory(text) {
  const value = normalize(text);
  if (
    value.includes("guarda chuva") ||
    value.includes("guardachuva") ||
    value.includes("umbrella") ||
    value.includes("lancheira") ||
    value.includes("lunch bag")
  ) {
    return "Guarda Chuvas &amp; Lancheiras";
  }
  if (value.includes("caneta") || value.includes("lapis")) return "Canetas";
  if (value.includes("squeeze") || value.includes("garrafa") || value.includes("coqueteleira")) return "Squeezes";
  if (value.includes("caneca") || value.includes("copo") || value.includes("taca")) return "Canecas";
  if (value.includes("mochila") || value.includes("mala")) return "Mochilas";
  if (value.includes("sacola") || value.includes("ecobag") || value.includes("bolsa")) return "Sacolas";
  if (value.includes("caderno") || value.includes("bloco") || value.includes("agenda")) return "Cadernos";
  if (value.includes("mouse pad")) return "Mouse Pads";
  if (value.includes("churrasqueira") || value.includes("grelha") || value.includes("churrasco")) return "Churrasco";
  return "Outros";
}

function resolveCategory(explicitCategory, fallbackText = "") {
  const cleaned = cleanText(explicitCategory);
  const normalized = normalize(cleaned);
  const inferred = inferCategory(`${cleaned} ${fallbackText}`);
  if (!cleaned) return inferred;
  if (normalized === "outros" || normalized === "sem categoria") return inferred;
  return cleaned;
}

function inferTechniques(text) {
  const haystack = normalize(text);
  const matches = [
    ["Laser", ["laser", "laser engraving", "gravacao a laser", "engraving"]],
    ["Serigrafia", ["serigrafia", "silk", "silk screen", "screen print", "screen printing"]],
    ["Tampografia", ["tampografia", "pad print", "pad printing"]],
    ["UV digital", ["uv", "uv digital", "digital uv", "uv print"]],
    ["Sublimacao", ["sublim", "sublimacao", "sublimation"]],
    ["Transfer", ["transfer", "termo transfer", "heat transfer"]],
    ["Bordado", ["bordado", "embroidery", "embroidered"]],
    ["Baixo-relevo", ["baixo relevo", "baixo-relevo", "deboss", "debossed", "emboss"]],
  ]
    .filter(([, needles]) => needles.some((needle) => haystack.includes(needle)))
    .map(([label]) => label);
  return matches.length ? [...new Set(matches)] : ["A definir"];
}

function defaultArea(category) {
  const labels = {
    Canetas: "Corpo da caneta",
    Squeezes: "Area frontal do squeeze",
    Canecas: "Area frontal da caneca",
    Cadernos: "Capa frontal",
    Sacolas: "Painel frontal da sacola",
    Mochilas: "Bolso ou painel frontal",
    "Mouse Pads": "Area plana do mouse pad",
    Churrasco: "Face principal do produto",
  };
  return labels[category] || "Area sugerida no produto";
}

function defaultSafeArea(category) {
  const areas = {
    Canetas: { x: 350, y: 320, width: 500, height: 92 },
    Squeezes: { x: 420, y: 220, width: 360, height: 300 },
    Canecas: { x: 390, y: 230, width: 420, height: 260 },
    Cadernos: { x: 350, y: 180, width: 500, height: 360 },
    Sacolas: { x: 360, y: 190, width: 480, height: 340 },
    Mochilas: { x: 380, y: 190, width: 440, height: 330 },
    "Mouse Pads": { x: 300, y: 210, width: 600, height: 390 },
    Churrasco: { x: 320, y: 210, width: 580, height: 320 },
  };
  return areas[category] || { x: 360, y: 210, width: 480, height: 300 };
}

function firstObjectValue(value) {
  if (!value || typeof value !== "object") return "";
  return Object.values(value).find(Boolean) || "";
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function safeSlug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produto";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
