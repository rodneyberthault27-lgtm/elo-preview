const canvas = document.querySelector("#mockupCanvas");
const ctx = canvas.getContext("2d");
const emptyState = document.querySelector("#emptyState");
const downloadBtn = document.querySelector("#downloadBtn");
const approvalBtn = document.querySelector("#approvalBtn");
const printSheetBtn = document.querySelector("#printSheetBtn");
const downloadSheetBtn = document.querySelector("#downloadSheetBtn");
const logoUpload = document.querySelector("#logoUpload");
const productUpload = document.querySelector("#productUpload");
const hidePhotoLogoBtn = document.querySelector("#hidePhotoLogoBtn");
const autoHidePhotoLogoBtn = document.querySelector("#autoHidePhotoLogoBtn");
const clearPhotoLogoBtn = document.querySelector("#clearPhotoLogoBtn");
const cleanupHint = document.querySelector("#cleanupHint");
const cleanupIntensityControl = document.querySelector("#cleanupIntensityControl");
const cleanupOpacityControl = document.querySelector("#cleanupOpacityControl");
const cleanupFeatherControl = document.querySelector("#cleanupFeatherControl");
const cleanupBlurControl = document.querySelector("#cleanupBlurControl");
const removeBgToggle = document.querySelector("#removeBgToggle");
const xControl = document.querySelector("#xControl");
const yControl = document.querySelector("#yControl");
const scaleControl = document.querySelector("#scaleControl");
const rotationControl = document.querySelector("#rotationControl");
const opacityControl = document.querySelector("#opacityControl");
const bendControl = document.querySelector("#bendControl");
const logoCutoutControl = document.querySelector("#logoCutoutControl");
const resetSettingsBtn = document.querySelector("#resetSettingsBtn");
const finePreviewCanvas = document.querySelector("#finePreviewCanvas");
const finePreviewCtx = finePreviewCanvas ? finePreviewCanvas.getContext("2d") : null;
const logoColorMode = document.querySelector("#logoColorMode");
const logoColorWheel = document.querySelector("#logoColorWheel");
const logoColorPreview = document.querySelector("#logoColorPreview");
const colorSwatches = document.querySelector(".color-swatches");
const techniqueControl = document.querySelector("#techniqueControl");
const productGrid = document.querySelector("#productGrid");
const productSearch = document.querySelector("#productSearch");
const productCount = document.querySelector("#productCount");
const loadMoreProductsBtn = document.querySelector("#loadMoreProductsBtn");
const quickCats = document.querySelector(".quick-cats");
const contrastAlert = document.querySelector("#contrastAlert");
const qualityHint = document.querySelector("#qualityHint");
const currentProductName = document.querySelector("#currentProductName");
const currentProductMeta = document.querySelector("#currentProductMeta");
const currentLogoName = document.querySelector("#currentLogoName");
const currentLogoMeta = document.querySelector("#currentLogoMeta");
const currentTechniqueName = document.querySelector("#currentTechniqueName");
const currentTechniqueMeta = document.querySelector("#currentTechniqueMeta");
const previewProductName = document.querySelector("#previewProductName");
const previewProductCode = document.querySelector("#previewProductCode");
const previewSupplier = document.querySelector("#previewSupplier");
const liveProductThumb = document.querySelector("#liveProductThumb");
const liveProductTitle = document.querySelector("#liveProductTitle");
const liveProductDetails = document.querySelector("#liveProductDetails");

const state = {
  product: new Image(),
  productMask: null,
  productCanSampleMask: true,
  productLoadNonce: 0,
  logo: null,
  logoOriginal: null,
  logoHasTransparency: false,
  logoFile: null,
  products: [],
  visibleProductCount: 80,
  selectedProduct: null,
  activeCategory: "all",
  logoX: Number(xControl.value),
  logoY: Number(yControl.value),
  scale: Number(scaleControl.value) / 100,
  rotation: Number(rotationControl.value),
  opacity: Number(opacityControl.value) / 100,
  bend: Number(bendControl.value) / 100,
  logoColorMode: logoColorMode.value,
  logoColor: "#0f7a6c",
  technique: techniqueControl.value,
  removeBackground: removeBgToggle.checked,
  logoCutout: Number(logoCutoutControl.value),
  cleanupMode: false,
  productCleanups: [],
  cleanupDraft: null,
  cleanupStart: null,
  cleanupSettings: {
    intensity: Number(cleanupIntensityControl.value),
    opacity: Number(cleanupOpacityControl.value),
    feather: Number(cleanupFeatherControl.value),
    blur: Number(cleanupBlurControl.value),
  },
  logoQuad: null,
  logoSelected: false,
  activeHandle: null,
  handleStart: null,
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  undoStack: [],
  pendingHistory: null,
  controlHistoryKey: null,
};

state.product.crossOrigin = "anonymous";
loadProducts();
drawColorWheel();
updateExperienceSummary();

async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) throw new Error("Nao foi possivel carregar products.json");
    state.products = normalizeCatalogPayload(await response.json());
    renderCategoryButtons();
    renderProducts();
    if (state.products[0]) selectProduct(state.products[0]);
  } catch (error) {
    productCount.textContent = "Catálogo indisponível";
    productGrid.innerHTML = '<p class="hint">Rode por um servidor local para carregar o catálogo.</p>';
    console.error(error);
  }
}

function renderCategoryButtons() {
  const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  quickCats.innerHTML = '<button class="is-active" type="button" data-category="all">Todos</button>';
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.textContent = category;
    quickCats.appendChild(button);
  });
}

function renderProducts() {
  const term = normalizeText(productSearch.value);
  const filtered = state.products.filter((product) => {
    const haystack = normalizeText(
      [
        product.code,
        product.name,
        product.category,
        product.color,
        product.sourceSupplier,
        product.supplierName,
        product.supplierCode,
        ...(product.techniques || []),
        ...(product.searchTerms || []),
      ].join(" "),
    );
    const matchesTerm = !term || haystack.includes(term);
    const matchesCategory = state.activeCategory === "all" || product.category === state.activeCategory;
    return matchesTerm && matchesCategory;
  });
  const visibleProducts = filtered.slice(0, state.visibleProductCount);

  productCount.textContent =
    filtered.length > visibleProducts.length
      ? `${visibleProducts.length} de ${filtered.length} produtos`
      : `${filtered.length} produto${filtered.length === 1 ? "" : "s"}`;
  productGrid.innerHTML = "";
  loadMoreProductsBtn.hidden = filtered.length <= visibleProducts.length;

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="hint">Nenhum produto encontrado.</p>';
    return;
  }

  visibleProducts.forEach((product) => {
    const button = document.createElement("button");
    button.className = `product-option${state.selectedProduct?.id === product.id ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.productId = product.id;
    button.innerHTML = `
      <img src="${product.src}" alt="${product.name}" loading="lazy" />
      <span>${product.code}<br>${product.name}</span>
    `;
    productGrid.appendChild(button);
  });
}

function selectProduct(product) {
  state.undoStack = [];
  state.pendingHistory = null;
  state.controlHistoryKey = null;
  state.selectedProduct = product;
  state.productCleanups = [];
  state.cleanupDraft = null;
  loadProductImage(product.src, product.removePreviewBg);
  techniqueControl.value = techniqueToValue(product.techniques?.[0] || "Laser");
  state.technique = techniqueControl.value;
  renderProducts();
  updateContrastAlert();
  updateExperienceSummary();
}

function loadProductImage(src, removePreviewBg = false) {
  const loadNonce = ++state.productLoadNonce;
  state.product = new Image();
  state.productMask = null;
  state.productCanSampleMask = true;
  draw();
  loadProductImageAttempt(src, removePreviewBg, loadNonce, !isLocalCanvasSafeSource(src));
}

function loadProductImageAttempt(src, removePreviewBg, loadNonce, useAnonymous) {
  const image = new Image();
  if (useAnonymous) image.crossOrigin = "anonymous";
  image.onload = () => {
    if (loadNonce !== state.productLoadNonce) return;
    state.product = image;
    state.productCanSampleMask = useAnonymous || isLocalCanvasSafeSource(src);
    state.productMask = removePreviewBg ? createProductMaskSource(image) : image;
    if (state.logo) resetLogoQuad();
    draw();
  };
  image.onerror = () => {
    if (loadNonce !== state.productLoadNonce) return;
    if (useAnonymous) {
      loadProductImageAttempt(src, removePreviewBg, loadNonce, false);
      return;
    }
    console.warn("Nao foi possivel carregar a imagem do produto:", src);
  };
  image.src = src;
}

function createProductMaskSource(image) {
  const productCanvas = document.createElement("canvas");
  productCanvas.width = image.width;
  productCanvas.height = image.height;
  const productCtx = productCanvas.getContext("2d");
  try {
    productCtx.drawImage(image, 0, 0);

    const imageData = productCtx.getImageData(0, 0, productCanvas.width, productCanvas.height);
    const data = imageData.data;
    const background = estimateBackgroundColor(data);
    removeEdgeBackgroundFromMask(imageData, productCanvas.width, productCanvas.height, background);
    productCtx.putImageData(imageData, 0, 0);
    return productCanvas;
  } catch (error) {
    state.productCanSampleMask = false;
    console.warn("Mascara do produto indisponivel; usando area segura.", error);
    return image;
  }
}

function isLocalCanvasSafeSource(src) {
  return src.startsWith("data:") || src.startsWith("blob:") || !/^https?:\/\//i.test(src);
}

function estimateBackgroundColor(data) {
  const samplePoints = [0, 4, 8, data.length - 4, data.length - 8, data.length - 12];
  const colors = samplePoints.map((index) => ({
    red: data[index],
    green: data[index + 1],
    blue: data[index + 2],
  }));
  return {
    red: Math.round(colors.reduce((sum, color) => sum + color.red, 0) / colors.length),
    green: Math.round(colors.reduce((sum, color) => sum + color.green, 0) / colors.length),
    blue: Math.round(colors.reduce((sum, color) => sum + color.blue, 0) / colors.length),
  };
}

function colorDistance(redA, greenA, blueA, redB, greenB, blueB) {
  return Math.sqrt((redA - redB) ** 2 + (greenA - greenB) ** 2 + (blueA - blueB) ** 2);
}

function lerpPoint(start, end, amount) {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getQuadCenter(quad = state.logoQuad) {
  const points = Object.values(quad);
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function getRotateHandlePoint(quad = state.logoQuad) {
  const top = lerpPoint(quad.tl, quad.tr, 0.5);
  const center = getQuadCenter(quad);
  const vector = { x: top.x - center.x, y: top.y - center.y };
  const length = Math.max(Math.hypot(vector.x, vector.y), 1);
  return {
    x: top.x + (vector.x / length) * 42,
    y: top.y + (vector.y / length) * 42,
  };
}

function getResizeHandlePoint(quad = state.logoQuad) {
  const center = getQuadCenter(quad);
  const corner = quad.br;
  const vector = { x: corner.x - center.x, y: corner.y - center.y };
  const length = Math.max(Math.hypot(vector.x, vector.y), 1);
  return {
    x: corner.x + (vector.x / length) * 36,
    y: corner.y + (vector.y / length) * 36,
  };
}

function cloneQuad(quad = state.logoQuad) {
  if (!quad) return null;
  return Object.fromEntries(Object.entries(quad).map(([key, point]) => [key, { ...point }]));
}

function scaleQuadFromCenter(quad, center, factor) {
  return Object.fromEntries(
    Object.entries(quad).map(([key, point]) => [
      key,
      {
        x: center.x + (point.x - center.x) * factor,
        y: center.y + (point.y - center.y) * factor,
      },
    ]),
  );
}

function rotateQuadAroundCenter(quad, center, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return Object.fromEntries(
    Object.entries(quad).map(([key, point]) => {
      const x = point.x - center.x;
      const y = point.y - center.y;
      return [
        key,
        {
          x: center.x + x * cosine - y * sine,
          y: center.y + x * sine + y * cosine,
        },
      ];
    }),
  );
}

function normalizeRect(rect) {
  const x = Math.min(rect.x, rect.x + rect.width);
  const y = Math.min(rect.y, rect.y + rect.height);
  return {
    x,
    y,
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  };
}

function cloneCleanup(cleanup) {
  if (!cleanup) return null;
  if (cleanup.type === "lasso") {
    return {
      ...cleanup,
      points: cleanup.points.map((point) => ({ ...point })),
    };
  }
  return { ...cleanup };
}

function readCleanupSettings() {
  return {
    intensity: Number(cleanupIntensityControl.value),
    opacity: Number(cleanupOpacityControl.value),
    feather: Number(cleanupFeatherControl.value),
    blur: Number(cleanupBlurControl.value),
  };
}

function syncCleanupSettingsFromControls() {
  state.cleanupSettings = readCleanupSettings();
  draw();
}

function createUndoSnapshot() {
  return {
    logoX: state.logoX,
    logoY: state.logoY,
    scale: state.scale,
    rotation: state.rotation,
    opacity: state.opacity,
    bend: state.bend,
    logoColorMode: state.logoColorMode,
    logoColor: state.logoColor,
    technique: state.technique,
    removeBackground: state.removeBackground,
    logoCutout: state.logoCutout,
    cleanupSettings: { ...state.cleanupSettings },
    productCleanups: state.productCleanups.map(cloneCleanup),
    logoQuad: cloneQuad(),
    logoSelected: state.logoSelected,
  };
}

function pushUndoSnapshot(snapshot = createUndoSnapshot(), compareWithCurrent = true) {
  if (!snapshot) return;
  if (compareWithCurrent) {
    const current = createUndoSnapshot();
    if (JSON.stringify(snapshot) === JSON.stringify(current)) return;
  }
  state.undoStack.push(snapshot);
  if (state.undoStack.length > 40) state.undoStack.shift();
}

function beginUndo(label) {
  if (state.pendingHistory?.label === label) return;
  state.pendingHistory = { label, snapshot: createUndoSnapshot() };
}

function commitUndo(label) {
  if (!state.pendingHistory || (label && state.pendingHistory.label !== label)) return;
  pushUndoSnapshot(state.pendingHistory.snapshot);
  state.pendingHistory = null;
}

function cancelUndo(label) {
  if (!state.pendingHistory || (label && state.pendingHistory.label !== label)) return;
  state.pendingHistory = null;
}

function pushControlUndo(key) {
  if (state.controlHistoryKey === key) return;
  state.controlHistoryKey = key;
  pushUndoSnapshot(createUndoSnapshot(), false);
}

function endControlUndo(key) {
  if (!key || state.controlHistoryKey === key) state.controlHistoryKey = null;
}

function undoLastChange() {
  const snapshot = state.undoStack.pop();
  if (!snapshot) return false;
  state.pendingHistory = null;
  state.controlHistoryKey = null;
  restoreUndoSnapshot(snapshot);
  draw();
  return true;
}

function restoreUndoSnapshot(snapshot) {
  state.logoX = snapshot.logoX;
  state.logoY = snapshot.logoY;
  state.scale = snapshot.scale;
  state.rotation = snapshot.rotation;
  state.opacity = snapshot.opacity;
  state.bend = snapshot.bend;
  state.logoColorMode = snapshot.logoColorMode;
  state.logoColor = snapshot.logoColor;
  state.technique = snapshot.technique;
  state.removeBackground = snapshot.removeBackground;
  state.logoCutout = snapshot.logoCutout ?? Number(logoCutoutControl.value);
  state.cleanupSettings = snapshot.cleanupSettings ? { ...snapshot.cleanupSettings } : readCleanupSettings();
  state.productCleanups = snapshot.productCleanups.map(cloneCleanup);
  state.cleanupDraft = null;
  state.cleanupStart = null;
  state.logoQuad = snapshot.logoQuad ? cloneQuad(snapshot.logoQuad) : null;
  state.logoSelected = snapshot.logoSelected ?? true;
  state.activeHandle = null;
  state.handleStart = null;
  state.isDragging = false;

  syncAllControls();
  syncColorSwatches();
  drawColorWheel();
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  updateContrastAlert();
}

function syncAllControls() {
  xControl.value = Math.round(state.logoX);
  yControl.value = Math.round(state.logoY);
  scaleControl.value = Math.round(state.scale * 100);
  rotationControl.value = Math.round(state.rotation);
  opacityControl.value = Math.round(state.opacity * 100);
  bendControl.value = Math.round(state.bend * 100);
  logoColorMode.value = state.logoColorMode;
  techniqueControl.value = state.technique;
  removeBgToggle.checked = state.removeBackground;
  logoCutoutControl.value = Math.round(state.logoCutout);
  cleanupIntensityControl.value = Math.round(state.cleanupSettings.intensity);
  cleanupOpacityControl.value = Math.round(state.cleanupSettings.opacity);
  cleanupFeatherControl.value = Math.round(state.cleanupSettings.feather);
  cleanupBlurControl.value = Math.round(state.cleanupSettings.blur);
}

function loadLogo(src, file) {
  const image = new Image();
  image.onload = () => {
    state.logoOriginal = image;
    state.logoFile = file || null;
    state.logo = processLogoImage(image);
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
    state.logoSelected = false;
    resetLogoQuad();
    syncPositionControls();
    emptyState.classList.add("is-hidden");
    qualityHint.textContent = getQualityMessage(image, file);
    updateContrastAlert();
    updateExperienceSummary();
    draw();
  };
  image.src = src;
}

function updateExperienceSummary() {
  const product = state.selectedProduct;
  const techniqueLabel = techniqueLabelForValue(state.technique);

  if (product) {
    if (currentProductName) currentProductName.textContent = product.name || "Produto selecionado";
    if (currentProductMeta) {
      currentProductMeta.textContent = [product.code, product.color || "Cor a definir", product.supplierName || "Catalogo"]
        .filter(Boolean)
        .join(" | ");
    }
    if (previewProductName) previewProductName.textContent = product.name || "Produto selecionado";
    if (previewProductCode) previewProductCode.textContent = product.code || "Sem codigo";
    if (previewSupplier) previewSupplier.textContent = product.supplierName || product.sourceSupplier || "Catalogo";
    if (liveProductThumb) liveProductThumb.src = product.src || "./assets/elo-logo.png";
    if (liveProductTitle) liveProductTitle.textContent = product.name || "Produto selecionado";
    if (liveProductDetails) {
      liveProductDetails.textContent = [product.code, product.color || "Cor a definir", product.supplierName || "Catalogo"]
        .filter(Boolean)
        .join(" | ");
    }
  } else {
    if (currentProductName) currentProductName.textContent = "Imagem propria do produto";
    if (currentProductMeta) currentProductMeta.textContent = "Use uma foto manual e aplique o logo sobre ela.";
    if (previewProductName) previewProductName.textContent = "Imagem propria do produto";
    if (previewProductCode) previewProductCode.textContent = "Manual";
    if (previewSupplier) previewSupplier.textContent = "Upload proprio";
    if (liveProductThumb) liveProductThumb.src = "./assets/elo-logo.png";
    if (liveProductTitle) liveProductTitle.textContent = "Imagem propria do produto";
    if (liveProductDetails) liveProductDetails.textContent = "Ajuste livre sobre a foto enviada.";
  }

  if (currentLogoName) currentLogoName.textContent = state.logoFile?.name || (state.logo ? "Logo carregado" : "Nenhum logo enviado");
  if (currentLogoMeta) {
    currentLogoMeta.textContent = state.logo
      ? "Clique no logo para mover, girar e ajustar a aplicacao."
      : "Envie PNG, JPG ou SVG para comecar a aplicar.";
  }

  if (currentTechniqueName) currentTechniqueName.textContent = techniqueLabel;
  if (currentTechniqueMeta) {
    currentTechniqueMeta.textContent = state.logo
      ? "A combinacao de cor e tecnica atualiza a previa em tempo real."
      : "Escolha a tecnica para orientar a simulacao comercial.";
  }
}

function techniqueLabelForValue(value) {
  const labels = {
    laser: "Laser",
    silk: "Serigrafia",
    uv: "UV digital",
    tampo: "Tampografia",
    bordado: "Bordado",
    "baixo-relevo": "Baixo-relevo",
  };
  return labels[value] || "Laser";
}

function processLogoImage(image) {
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = image.width;
  logoCanvas.height = image.height;
  const logoCtx = logoCanvas.getContext("2d");
  logoCtx.drawImage(image, 0, 0);

  if (state.removeBackground) {
    const imageData = logoCtx.getImageData(0, 0, logoCanvas.width, logoCanvas.height);
    const shouldPreservePng = state.logoFile?.type === "image/png" && hasUsefulTransparency(imageData.data);
    const removalProfile = analyzeBackgroundRemoval(imageData, logoCanvas.width, logoCanvas.height);
    if (!shouldPreservePng && state.logoCutout > 0) {
      const backgroundCleanup = removeSolidBackgroundConnectedToEdges(imageData, logoCanvas.width, logoCanvas.height, removalProfile);
      trimResidualBackgroundHalo(
        imageData,
        logoCanvas.width,
        logoCanvas.height,
        backgroundCleanup.background,
        backgroundCleanup.tolerance,
        removalProfile,
      );
    }
    logoCtx.putImageData(imageData, 0, 0);
  }

  let processedCanvas = logoCanvas;
  try {
    const finalImageData = logoCtx.getImageData(0, 0, logoCanvas.width, logoCanvas.height);
    state.logoHasTransparency = hasUsefulTransparency(finalImageData.data);
    if (state.removeBackground || state.logoHasTransparency) {
      processedCanvas = cropCanvasToVisibleBounds(logoCanvas);
      const croppedCtx = processedCanvas.getContext("2d");
      const croppedData = croppedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      state.logoHasTransparency = hasUsefulTransparency(croppedData.data);
    }
  } catch {
    state.logoHasTransparency = false;
  }

  return processedCanvas;
}

function hasUsefulTransparency(data) {
  let transparentPixels = 0;
  const totalPixels = data.length / 4;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 245) transparentPixels += 1;
  }
  return transparentPixels > totalPixels * 0.01;
}

function removeSolidBackgroundConnectedToEdges(imageData, width, height, profile = {}) {
  const data = imageData.data;
  const background = estimateLogoEdgeBackground(data, width, height);
  const tolerance = Math.max(18, state.logoCutout * (profile.aggressive ? 1.55 : 1.35));
  const visited = new Uint8Array(width * height);
  const queue = [];
  const protectionRadius = profile.aggressive ? 0 : getLogoContentProtectionRadius(width, height);

  const tryAdd = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) return;
    const dataIndex = pixelIndex * 4;
    if (!isBackgroundLikePixel(data, dataIndex, background, tolerance)) return;
    if (protectionRadius > 0 && hasNearbyLogoContent(data, width, height, x, y, protectionRadius)) return;
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    tryAdd(x, 0);
    tryAdd(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    tryAdd(0, y);
    tryAdd(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    tryAdd(x + 1, y);
    tryAdd(x - 1, y);
    tryAdd(x, y + 1);
    tryAdd(x, y - 1);
  }

  let cleared = 0;
  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    data[pixelIndex * 4 + 3] = 0;
    cleared += 1;
  }

  return { background, tolerance, cleared };
}

function trimResidualBackgroundHalo(imageData, width, height, background, baseTolerance, profile = {}) {
  const data = imageData.data;
  const haloTolerance = baseTolerance + (profile.aggressive ? 28 : 18);
  const passes = Math.round(clamp(state.logoCutout / 28, 1, profile.aggressive ? 4 : 3));

  for (let pass = 0; pass < passes; pass += 1) {
    const snapshot = new Uint8ClampedArray(data);
    let changed = 0;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        const index = pixelIndex * 4;
        const alpha = snapshot[index + 3];
        if (alpha <= 0) continue;

        const distance = colorDistance(
          snapshot[index],
          snapshot[index + 1],
          snapshot[index + 2],
          background.red,
          background.green,
          background.blue,
        );
        if (distance > haloTolerance) continue;

        const transparentNeighbors = countTransparentNeighbors(snapshot, width, height, x, y);
        if (!transparentNeighbors) continue;

        const strongBackgroundMatch = distance <= baseTolerance * 0.72;
        const aggressiveTrim = strongBackgroundMatch || transparentNeighbors >= (profile.aggressive ? 4 : 5);
        data[index + 3] = aggressiveTrim ? 0 : Math.min(data[index + 3], profile.aggressive ? 42 : 76);
        changed += 1;
      }
    }

    if (!changed) break;
  }
}

function countTransparentNeighbors(data, width, height, x, y) {
  let transparentCount = 0;
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) continue;
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
      const index = (nextY * width + nextX) * 4;
      if (data[index + 3] <= 18) transparentCount += 1;
    }
  }
  return transparentCount;
}

function analyzeBackgroundRemoval(imageData, width, height) {
  const data = imageData.data;
  const buckets = new Set();
  const step = Math.max(1, Math.floor(Math.min(width, height) / 42));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 200) continue;
      const bucket =
        `${Math.round(data[index] / 24)}-${Math.round(data[index + 1] / 24)}-${Math.round(data[index + 2] / 24)}`;
      buckets.add(bucket);
      if (buckets.size > 48) return { aggressive: true };
    }
  }

  return { aggressive: buckets.size > 24 };
}

function cropCanvasToVisibleBounds(sourceCanvas) {
  const sourceCtx = sourceCanvas.getContext("2d");
  const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const data = imageData.data;
  let minX = sourceCanvas.width;
  let minY = sourceCanvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const index = (y * sourceCanvas.width + x) * 4;
      if (data[index + 3] <= 12) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return sourceCanvas;

  const padding = Math.max(2, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.01));
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropRight = Math.min(sourceCanvas.width, maxX + padding + 1);
  const cropBottom = Math.min(sourceCanvas.height, maxY + padding + 1);
  const cropWidth = Math.max(1, cropRight - cropX);
  const cropHeight = Math.max(1, cropBottom - cropY);

  if (cropWidth === sourceCanvas.width && cropHeight === sourceCanvas.height) return sourceCanvas;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext("2d");
  croppedCtx.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return croppedCanvas;
}

function normalizeCatalogPayload(payload) {
  const records = expandCatalogPayload(payload);
  return records
    .map((record, index) => normalizeCatalogRecord(record, index))
    .filter(Boolean)
    .sort((left, right) => {
      const nameCompare = left.name.localeCompare(right.name, "pt-BR");
      if (nameCompare !== 0) return nameCompare;
      return left.code.localeCompare(right.code, "pt-BR");
    });
}

function expandCatalogPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.produtos)) return payload.produtos.flatMap(expandAsiaApiProduct);
  return [];
}

function expandAsiaApiProduct(product) {
  const variations = Array.isArray(product?.variacoes) && product.variacoes.length ? product.variacoes : [null];
  return variations.map((variation) => ({
    fornecedorId: "asia",
    supplierName: "Asia Import",
    CodigoComposto: variation?.referencia || product?.referencia || "",
    CodigoAmigavel: product?.referencia || "",
    CodigoXbz: product?.referencia || "",
    Nome: variation?.nome || product?.nome || "",
    Descricao: product?.descricao || "",
    SiteLink: product?.link || product?.url || "",
    ImageLink: variation?.imagem || product?.imagem || "",
    CorWebPrincipal:
      variation?.atributos?.cor?.value || variation?.atributos?.cor?.name || firstObjectValue(product?.cores) || "",
    QuantidadeDisponivel: Number(variation?.qtd_estoque ?? 0),
    Ncm: variation?.ncm || product?.propriedades?.ncm || "",
    PrecoVenda: Number(variation?.preco ?? product?.preco ?? 0),
    category: firstObjectValue(product?.categorias) || "",
    dimensions:
      product?.propriedades?.["dimensao-produto"] ||
      product?.propriedades?.["dimensão-produto"] ||
      product?.propriedades?.["dimensao do produto"] ||
      "",
  }));
}

function normalizeCatalogRecord(record, index) {
  if (!record || typeof record !== "object") return null;

  if (record.code && record.name && record.src) {
    const category = resolveCatalogCategory(record.category, [record.name, record.description, ...(record.searchTerms || [])].join(" "));
    return {
      ...record,
      category,
      id:
        record.id ||
        buildCatalogId(record.sourceSupplier || record.supplierName || "catalogo", record.code, record.supplierCode, index),
      sourceSupplier: record.sourceSupplier || record.supplierName || "",
      supplierName: record.supplierName || humanizeSupplier(record.sourceSupplier || ""),
      supplierCode: record.supplierCode || "",
      searchTerms: buildCatalogSearchTerms(record, record),
      safeArea: sanitizeSafeArea(record.safeArea, category),
    };
  }

  const sourceSupplier = cleanCatalogText(record.sourceSupplier || record.fornecedorId || record.supplierId || "");
  const code = cleanCatalogText(
    record.code || record.CodigoComposto || record.CodigoAmigavel || record.CodigoXbz || record.referencia || record.codigo,
  );
  const name = cleanCatalogText(record.name || record.Nome || record.nome);
  const src = cleanCatalogText(record.src || record.ImageLink || record.sourceImage || record.image || record.imagem);

  if (!code || !name || !src) return null;

  const description = cleanCatalogText(record.description || record.Descricao || record.descricao);
  const category = resolveCatalogCategory(
    cleanCatalogText(record.category || record.WebTipo || record.WebSubTipo || firstObjectValue(record.categorias)),
    `${name} ${description}`,
  );
  const techniques = normalizeCatalogTechniques(record.techniques, `${name} ${description}`);

  return {
    id: buildCatalogId(sourceSupplier, code, record.CodigoXbz || record.CodigoAmigavel || record.referencia, index),
    code,
    name,
    category,
    src,
    sourceUrl: cleanCatalogText(record.sourceUrl || record.SiteLink || record.url),
    sourceImage: cleanCatalogText(record.sourceImage || record.ImageLink || record.image || record.imagem),
    sourceSupplier,
    supplierName: cleanCatalogText(record.supplierName) || humanizeSupplier(sourceSupplier),
    supplierCode: cleanCatalogText(record.supplierCode || record.CodigoXbz || record.CodigoAmigavel || record.referencia),
    color: cleanCatalogText(record.color || record.CorWebPrincipal || record.cor || record.corPrincipal) || "A definir",
    techniques,
    dimensions: cleanCatalogText(record.dimensions) || buildCatalogDimensions(record) || "A definir",
    area: cleanCatalogText(record.area) || defaultCatalogArea(category),
    minimumQuantity: cleanCatalogText(record.minimumQuantity || record.quantidadeMinima) || "A definir",
    removePreviewBg: record.removePreviewBg !== false,
    safeArea: sanitizeSafeArea(record.safeArea, category),
    searchTerms: buildCatalogSearchTerms(
      {
        code,
        name,
        category,
        supplierName: cleanCatalogText(record.supplierName) || humanizeSupplier(sourceSupplier),
        supplierCode: cleanCatalogText(record.supplierCode || record.CodigoXbz || record.CodigoAmigavel || record.referencia),
        color: cleanCatalogText(record.color || record.CorWebPrincipal || record.cor || record.corPrincipal),
        techniques,
        sourceSupplier,
      },
      record,
    ),
  };
}

function removeEdgeBackgroundFromMask(imageData, width, height, background) {
  const data = imageData.data;
  const tolerance = 22;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const tryAdd = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) return;
    const dataIndex = pixelIndex * 4;
    const alpha = data[dataIndex + 3];
    if (alpha <= 0) return;
    const distance = colorDistance(
      data[dataIndex],
      data[dataIndex + 1],
      data[dataIndex + 2],
      background.red,
      background.green,
      background.blue,
    );
    const brightBackground = data[dataIndex] > 244 && data[dataIndex + 1] > 244 && data[dataIndex + 2] > 244;
    if (distance > tolerance && !brightBackground) return;
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    tryAdd(x, 0);
    tryAdd(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    tryAdd(0, y);
    tryAdd(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    tryAdd(x + 1, y);
    tryAdd(x - 1, y);
    tryAdd(x, y + 1);
    tryAdd(x, y - 1);
  }

  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    data[pixelIndex * 4 + 3] = 0;
  }
}

function buildCatalogId(sourceSupplier, code, supplierCode, index) {
  return [sourceSupplier || "catalogo", code || "sem-codigo", supplierCode || index].filter(Boolean).join(":");
}

function buildCatalogSearchTerms(product, record) {
  return [
    product.code,
    product.name,
    product.category,
    product.color,
    product.supplierCode,
    product.supplierName,
    product.sourceSupplier,
    ...(Array.isArray(product.techniques) ? product.techniques : []),
    record?.CodigoXbz,
    record?.CodigoAmigavel,
    record?.CodigoComposto,
    record?.Nome,
    record?.Descricao,
    record?.WebTipo,
    record?.WebSubTipo,
    ...Object.values(record?.categorias || {}),
  ]
    .map((value) => cleanCatalogText(value))
    .filter(Boolean);
}

function sanitizeSafeArea(area, category) {
  const fallback = defaultCatalogSafeArea(category);
  if (!area || typeof area !== "object") return fallback;
  const x = Number(area.x);
  const y = Number(area.y);
  const width = Number(area.width);
  const height = Number(area.height);
  if (![x, y, width, height].every(Number.isFinite)) return fallback;
  return { x, y, width, height };
}

function defaultCatalogSafeArea(category) {
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

function defaultCatalogArea(category) {
  const labels = {
    Canetas: "Corpo da caneta",
    Squeezes: "Área frontal do squeeze",
    Canecas: "Área frontal da caneca",
    Cadernos: "Capa frontal",
    Sacolas: "Painel frontal da sacola",
    Mochilas: "Bolso ou painel frontal",
    "Mouse Pads": "Área plana do mouse pad",
    Churrasco: "Face principal do produto",
  };
  return labels[category] || "Área sugerida no produto";
}

function inferCatalogCategory(text) {
  const value = normalizeText(text);
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

function resolveCatalogCategory(explicitCategory, fallbackText = "") {
  const cleaned = cleanCatalogText(explicitCategory);
  const normalized = normalizeText(cleaned);
  const inferred = inferCatalogCategory(`${cleaned} ${fallbackText}`);
  if (!cleaned) return inferred;
  if (normalized === "outros" || normalized === "sem categoria") return inferred;
  return cleaned;
}

function normalizeCatalogTechniques(value, fallbackText = "") {
  if (Array.isArray(value) && value.length) return value;
  const haystack = normalizeText(`${cleanCatalogText(value)} ${fallbackText}`);
  const matches = [
    ["Laser", "laser"],
    ["Serigrafia", "serigrafia"],
    ["Tampografia", "tampografia"],
    ["UV digital", "uv"],
    ["Sublimacao", "sublim"],
    ["Transfer", "transfer"],
    ["Bordado", "bordado"],
    ["Baixo-relevo", "baixo relevo"],
  ]
    .filter(([, needle]) => haystack.includes(needle))
    .map(([label]) => label);
  return matches.length ? [...new Set(matches)] : ["A definir"];
}

function buildCatalogDimensions(record) {
  if (record?.propriedades?.["dimensao-produto"]) return cleanCatalogText(record.propriedades["dimensao-produto"]);
  if (record?.propriedades?.["dimensão-produto"]) return cleanCatalogText(record.propriedades["dimensão-produto"]);

  const dimensions = [
    ["Alt.", record?.Altura],
    ["Larg.", record?.Largura],
    ["Prof.", record?.Profundidade],
    ["Comp.", record?.Comprimento],
  ]
    .map(([label, value]) => [label, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([label, value]) => `${label} ${String(value).replace(".", ",")} cm`);

  return dimensions.join(" | ");
}

function humanizeSupplier(value) {
  const labels = {
    xbz: "XBZ",
    asia: "Asia Import",
    spotgifts: "Spot Gifts",
  };
  const normalized = cleanCatalogText(value).toLowerCase();
  return labels[normalized] || cleanCatalogText(value).toUpperCase();
}

function firstObjectValue(value) {
  if (!value || typeof value !== "object") return "";
  return Object.values(value).find(Boolean) || "";
}

function cleanCatalogText(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function getLogoContentProtectionRadius(width, height) {
  return Math.round(clamp(Math.min(width, height) * 0.08, 18, 64));
}

function estimateLogoEdgeBackground(data, width, height) {
  const reds = [];
  const greens = [];
  const blues = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 80));
  const addSample = (x, y) => {
    const index = (y * width + x) * 4;
    if (data[index + 3] <= 10) return;
    reds.push(data[index]);
    greens.push(data[index + 1]);
    blues.push(data[index + 2]);
  };

  for (let x = 0; x < width; x += step) {
    addSample(x, 0);
    addSample(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    addSample(0, y);
    addSample(width - 1, y);
  }

  if (!reds.length) return { red: 255, green: 255, blue: 255 };
  return {
    red: median(reds),
    green: median(greens),
    blue: median(blues),
  };
}

function isBackgroundLikePixel(data, index, background, tolerance) {
  const alpha = data[index + 3];
  if (alpha <= 0) return false;
  return colorDistance(data[index], data[index + 1], data[index + 2], background.red, background.green, background.blue) <= tolerance;
}

function hasNearbyLogoContent(data, width, height, x, y, radius) {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 2) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 2) {
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
      const index = (nextY * width + nextX) * 4;
      if (isLogoContentPixel(data, index)) return true;
    }
  }
  return false;
}

function isLogoContentPixel(data, index) {
  const alpha = data[index + 3];
  if (alpha <= 10) return false;
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const saturation = max - min;
  const lightness = (red + green + blue) / 3;
  return lightness < 226 || saturation > 24;
}

function draw() {
  renderScene(ctx, true);
  if (finePreviewCtx) renderScene(finePreviewCtx, false);
}

function renderScene(targetCtx, includeSelection) {
  targetCtx.clearRect(0, 0, canvas.width, canvas.height);
  drawCanvasBackground(targetCtx);
  drawProduct(targetCtx);
  drawProductCleanups(targetCtx, includeSelection);

  if (state.logo) {
    const size = getLogoSize();
    drawLogoClippedToProduct(targetCtx, size.width, size.height, includeSelection);
    if (includeSelection && state.logoSelected) drawSelection(targetCtx, size.width, size.height);
  }

  drawSimulationNotice(targetCtx);
}

function drawCanvasBackground(targetCtx) {
  const gradient = targetCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#f3f7f5");
  targetCtx.fillStyle = gradient;
  targetCtx.fillRect(0, 0, canvas.width, canvas.height);

  targetCtx.fillStyle = "#17201c";
  targetCtx.font = "800 28px Inter, system-ui, sans-serif";
  targetCtx.fillText("Elo Preview", 46, 58);
  targetCtx.fillStyle = "#68746f";
  targetCtx.font = "600 16px Inter, system-ui, sans-serif";
  targetCtx.fillText(getProductTitle(), 46, 86);
}

function drawProduct(targetCtx) {
  if (!state.product || (!state.product.width && !state.product.naturalWidth)) return;
  const placement = getProductPlacement();
  targetCtx.drawImage(state.product, placement.x, placement.y, placement.width, placement.height);
}

function drawProductCleanups(targetCtx, includeSelection) {
  [...state.productCleanups, state.cleanupDraft].filter(Boolean).forEach((cleanup) => {
    hideLogoArea(targetCtx, cleanup);
    if (includeSelection && cleanup === state.cleanupDraft) drawCleanupDraft(targetCtx, cleanup);
  });
}

function hideLogoArea(targetCtx, cleanup) {
  const normalized = getCleanupBounds(cleanup, 8);
  if (normalized.width < 4 || normalized.height < 4) return;

  const imageData = targetCtx.getImageData(0, 0, canvas.width, canvas.height);
  const original = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const rectX = Math.max(1, Math.floor(normalized.x));
  const rectY = Math.max(1, Math.floor(normalized.y));
  const rectWidth = Math.min(canvas.width - rectX - 2, Math.ceil(normalized.width));
  const rectHeight = Math.min(canvas.height - rectY - 2, Math.ceil(normalized.height));
  const settings = state.cleanupSettings;
  const intensityAmount = clamp(settings.intensity / 100, 0.01, 1);
  const opacityAmount = clamp(settings.opacity / 100, 0.01, 1);
  const featherAmount = clamp(settings.feather / 100, 0.01, 1);
  const blurAmount = clamp(settings.blur / 100, 0.01, 1);
  const mask = cleanup.type === "lasso" ? createLassoMask(cleanup) : null;
  const feather = Math.max(2, Math.min(32, Math.round(2 + featherAmount * 30)));
  const blurRadius = Math.max(2, Math.min(24, Math.round(2 + blurAmount * 20)));
  const sampleRadius = Math.max(10, Math.min(44, Math.round(12 + blurAmount * 32)));
  const fill = estimateCleanupFill(original, canvas.width, canvas.height, rectX, rectY, rectWidth, rectHeight);
  const patch = createInpaintPatch(original, mask, canvas.width, canvas.height, rectX, rectY, rectWidth, rectHeight, sampleRadius);
  softenPatch(patch, rectWidth, rectHeight, blurRadius);

  for (let row = 0; row < rectHeight; row += 1) {
    for (let col = 0; col < rectWidth; col += 1) {
      const index = ((rectY + row) * canvas.width + rectX + col) * 4;
      const maskCover = mask ? mask[index + 3] / 255 : 1;
      if (maskCover <= 0) continue;
      const edgeDistance = Math.min(col, row, rectWidth - 1 - col, rectHeight - 1 - row);
      const rectCover = 0.2 + smoothStep(Math.min(1, edgeDistance / feather)) * 0.8;
      const edgeCover = cleanup.type === "lasso" ? smoothStep(maskCover) : rectCover;
      const cover = clamp(opacityAmount * (0.35 + intensityAmount * 0.65) * edgeCover, 0, 1);
      const patchIndex = (row * rectWidth + col) * 4;
      const textureMix = 0.72 + intensityAmount * 0.24;
      const cleanedRed = patch[patchIndex] * textureMix + fill.red * (1 - textureMix);
      const cleanedGreen = patch[patchIndex + 1] * textureMix + fill.green * (1 - textureMix);
      const cleanedBlue = patch[patchIndex + 2] * textureMix + fill.blue * (1 - textureMix);
      data[index] = Math.round(original[index] * (1 - cover) + cleanedRed * cover);
      data[index + 1] = Math.round(original[index + 1] * (1 - cover) + cleanedGreen * cover);
      data[index + 2] = Math.round(original[index + 2] * (1 - cover) + cleanedBlue * cover);
      data[index + 3] = original[index + 3];
    }
  }

  targetCtx.putImageData(imageData, 0, 0);
}

function getCleanupBounds(cleanup, padding = 0) {
  if (cleanup.type !== "lasso") return expandRect(normalizeRect(cleanup), padding);
  const points = cleanup.points || [];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  if (!xs.length || !ys.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.max(0, Math.min(...xs) - padding);
  const y = Math.max(0, Math.min(...ys) - padding);
  const right = Math.min(canvas.width, Math.max(...xs) + padding);
  const bottom = Math.min(canvas.height, Math.max(...ys) + padding);
  return { x, y, width: right - x, height: bottom - y };
}

function createLassoMask(cleanup) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");
  drawLassoPath(maskCtx, cleanup.points);
  maskCtx.fillStyle = "#000";
  maskCtx.fill();
  const feather = Math.max(2, Math.round(2 + (state.cleanupSettings.feather / 100) * 30));
  for (let step = feather; step >= 1; step -= 1) {
    drawLassoPath(maskCtx, cleanup.points);
    maskCtx.strokeStyle = `rgba(0,0,0,${(step / feather) * 0.45})`;
    maskCtx.lineWidth = step * 2;
    maskCtx.stroke();
  }
  return maskCtx.getImageData(0, 0, canvas.width, canvas.height).data;
}

function createInpaintPatch(original, mask, width, height, rectX, rectY, rectWidth, rectHeight, sampleRadius) {
  const patch = new Uint8ClampedArray(rectWidth * rectHeight * 4);
  const fallback = estimateCleanupFill(original, width, height, rectX, rectY, rectWidth, rectHeight);

  for (let row = 0; row < rectHeight; row += 1) {
    for (let col = 0; col < rectWidth; col += 1) {
      const x = rectX + col;
      const y = rectY + row;
      const patchIndex = (row * rectWidth + col) * 4;
      const sampled = sampleOutsideSelection(original, mask, width, height, x, y, sampleRadius, fallback);
      patch[patchIndex] = sampled.red;
      patch[patchIndex + 1] = sampled.green;
      patch[patchIndex + 2] = sampled.blue;
      patch[patchIndex + 3] = 255;
    }
  }

  return patch;
}

function sampleOutsideSelection(original, mask, width, height, x, y, radius, fallback) {
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -0.7, y: -0.7 },
    { x: 0.7, y: -0.7 },
    { x: -0.7, y: 0.7 },
    { x: 0.7, y: 0.7 },
  ];
  const samples = [];

  directions.forEach((direction) => {
    for (let step = 3; step <= radius; step += 3) {
      const sampleX = Math.round(x + direction.x * step);
      const sampleY = Math.round(y + direction.y * step);
      if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
      const index = (sampleY * width + sampleX) * 4;
      if (original[index + 3] < 20) continue;
      if (mask && mask[index + 3] > 18) continue;
      const red = original[index];
      const green = original[index + 1];
      const blue = original[index + 2];
      if (red > 248 && green > 248 && blue > 248) continue;
      samples.push({ red, green, blue, weight: 1 / Math.max(step, 1) });
      break;
    }
  });

  if (!samples.length) return fallback;

  let red = 0;
  let green = 0;
  let blue = 0;
  let totalWeight = 0;
  samples.forEach((sample) => {
    red += sample.red * sample.weight;
    green += sample.green * sample.weight;
    blue += sample.blue * sample.weight;
    totalWeight += sample.weight;
  });

  return {
    red: clampColor(red / totalWeight),
    green: clampColor(green / totalWeight),
    blue: clampColor(blue / totalWeight),
  };
}

function softenPatch(patch, width, height, radius) {
  const passes = Math.max(1, Math.min(6, Math.round(radius / 4)));
  for (let pass = 0; pass < passes; pass += 1) {
    const copy = new Uint8ClampedArray(patch);
    for (let row = 1; row < height - 1; row += 1) {
      for (let col = 1; col < width - 1; col += 1) {
        const index = (row * width + col) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          patch[index + channel] = Math.round(
            copy[index + channel] * 0.42 +
              (copy[index - 4 + channel] + copy[index + 4 + channel] + copy[index - width * 4 + channel] + copy[index + width * 4 + channel]) *
                0.145,
          );
        }
      }
    }
  }
}

function expandRect(rect, padding) {
  return {
    x: Math.max(0, rect.x - padding),
    y: Math.max(0, rect.y - padding),
    width: Math.min(canvas.width - Math.max(0, rect.x - padding), rect.width + padding * 2),
    height: Math.min(canvas.height - Math.max(0, rect.y - padding), rect.height + padding * 2),
  };
}

function estimateCleanupFill(data, width, height, rectX, rectY, rectWidth, rectHeight) {
  const reds = [];
  const greens = [];
  const blues = [];
  const padding = 16;
  const outerX = Math.max(0, rectX - padding);
  const outerY = Math.max(0, rectY - padding);
  const outerRight = Math.min(width - 1, rectX + rectWidth + padding);
  const outerBottom = Math.min(height - 1, rectY + rectHeight + padding);
  const rectRight = rectX + rectWidth - 1;
  const rectBottom = rectY + rectHeight - 1;

  for (let y = outerY; y <= outerBottom; y += 2) {
    for (let x = outerX; x <= outerRight; x += 2) {
      const inside = x >= rectX && x <= rectRight && y >= rectY && y <= rectBottom;
      if (inside) continue;
      const closeToRect = x >= rectX - padding && x <= rectRight + padding && y >= rectY - padding && y <= rectBottom + padding;
      if (!closeToRect) continue;
      const index = (y * width + x) * 4;
      if (data[index + 3] < 20) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const plainWhiteBackground = red > 248 && green > 248 && blue > 248;
      if (plainWhiteBackground) continue;
      reds.push(red);
      greens.push(green);
      blues.push(blue);
    }
  }

  if (!reds.length) return { red: 242, green: 246, blue: 244 };
  return {
    red: median(reds),
    green: median(greens),
    blue: median(blues),
  };
}

function diffuseCleanupPatch(data, original, width, height, rectX, rectY, rectWidth, rectHeight) {
  const passes = Math.max(22, Math.min(80, Math.round(Math.max(rectWidth, rectHeight) * 0.7)));
  for (let pass = 0; pass < passes; pass += 1) {
    const copy = new Uint8ClampedArray(data);
    for (let row = 1; row < rectHeight - 1; row += 1) {
      for (let col = 1; col < rectWidth - 1; col += 1) {
        const x = rectX + col;
        const y = rectY + row;
        const index = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const average =
            copy[index - 4 + channel] +
            copy[index + 4 + channel] +
            copy[index - width * 4 + channel] +
            copy[index + width * 4 + channel];
          data[index + channel] = Math.round(average / 4);
        }
        data[index + 3] = original[index + 3];
      }
    }
  }
}

function averagePatchPixel(data, width, height, centerX, centerY, radius) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y += 2) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x += 2) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 20) continue;
      red += data[index];
      green += data[index + 1];
      blue += data[index + 2];
      count += 1;
    }
  }
  if (!count) return { red: 242, green: 246, blue: 244 };
  return { red: red / count, green: green / count, blue: blue / count };
}

function featherCleanupPatch(data, original, width, rectX, rectY, rectWidth, rectHeight) {
  const feather = Math.max(5, Math.min(16, Math.round(Math.min(rectWidth, rectHeight) * 0.18)));
  for (let row = 0; row < rectHeight; row += 1) {
    for (let col = 0; col < rectWidth; col += 1) {
      const edgeDistance = Math.min(col, row, rectWidth - 1 - col, rectHeight - 1 - row);
      const amount = smoothStep(Math.min(1, edgeDistance / feather));
      const cover = 0.68 + amount * 0.32;
      const index = ((rectY + row) * width + rectX + col) * 4;
      data[index] = Math.round(original[index] * (1 - cover) + data[index] * cover);
      data[index + 1] = Math.round(original[index + 1] * (1 - cover) + data[index + 1] * cover);
      data[index + 2] = Math.round(original[index + 2] * (1 - cover) + data[index + 2] * cover);
    }
  }
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function drawCleanupDraft(targetCtx, cleanup) {
  targetCtx.save();
  targetCtx.strokeStyle = "rgba(13, 122, 99, 0.9)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  if (cleanup.type === "lasso") {
    drawLassoPath(targetCtx, cleanup.points);
    targetCtx.stroke();
  } else {
    const normalized = normalizeRect(cleanup);
    targetCtx.strokeRect(normalized.x, normalized.y, normalized.width, normalized.height);
  }
  targetCtx.restore();
}

function drawLassoPath(targetCtx, points = []) {
  if (!points.length) return;
  targetCtx.beginPath();
  targetCtx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => targetCtx.lineTo(point.x, point.y));
  if (points.length > 2) targetCtx.closePath();
}

function getLassoPointDistance() {
  return Math.max(2, Math.round(10 - state.cleanupSettings.feather / 16));
}

function isValidCleanup(cleanup) {
  if (cleanup.type !== "lasso") {
    const rect = normalizeRect(cleanup);
    return rect.width > 12 && rect.height > 12;
  }
  const points = cleanup.points || [];
  if (points.length < 8) return false;
  return Math.abs(polygonArea(points)) > 140;
}

function polygonArea(points) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function autoHideExistingPhotoLogo() {
  if (!state.product || (!state.product.width && !state.product.naturalWidth)) return false;
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tempCtx = temp.getContext("2d");
  drawCanvasBackground(tempCtx);
  drawProduct(tempCtx);

  const placement = getProductPlacement();
  const imageData = tempCtx.getImageData(0, 0, temp.width, temp.height);
  const data = imageData.data;
  const startX = Math.floor(placement.x + placement.width * 0.12);
  const endX = Math.ceil(placement.x + placement.width * 0.88);
  const startY = Math.floor(placement.y + placement.height * 0.28);
  const endY = Math.ceil(placement.y + placement.height * 0.86);
  const step = 3;
  const gridWidth = Math.ceil((endX - startX) / step);
  const gridHeight = Math.ceil((endY - startY) / step);
  const candidates = new Uint8Array(gridWidth * gridHeight);

  for (let gy = 0; gy < gridHeight; gy += 1) {
    for (let gx = 0; gx < gridWidth; gx += 1) {
      const x = startX + gx * step;
      const y = startY + gy * step;
      const index = (y * temp.width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha < 20) continue;
      const brightLogoPixel = red > 185 && green > 185 && blue > 185;
      if (!brightLogoPixel || !hasColoredNeighborhood(data, temp.width, temp.height, x, y)) continue;
      candidates[gy * gridWidth + gx] = 1;
    }
  }

  const component = findBestLogoComponent(candidates, gridWidth, gridHeight, startX, startY, step, placement);
  if (!component) return false;

  const padding = 18;
  const rect = normalizeRect({
    x: component.minX - padding,
    y: component.minY - padding,
    width: component.maxX - component.minX + padding * 2,
    height: component.maxY - component.minY + padding * 2,
  });

  if (rect.width < 18 || rect.height < 12 || rect.width > placement.width * 0.75 || rect.height > placement.height * 0.45) {
    return false;
  }

  state.productCleanups.push(rect);
  draw();
  return true;
}

function findBestLogoComponent(candidates, gridWidth, gridHeight, startX, startY, step, placement) {
  const visited = new Uint8Array(candidates.length);
  let best = null;
  const queue = [];

  for (let y = 0; y < gridHeight; y += 1) {
    for (let x = 0; x < gridWidth; x += 1) {
      const startIndex = y * gridWidth + x;
      if (!candidates[startIndex] || visited[startIndex]) continue;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      queue.length = 0;
      queue.push(startIndex);
      visited[startIndex] = 1;

      while (queue.length) {
        const index = queue.shift();
        const gx = index % gridWidth;
        const gy = Math.floor(index / gridWidth);
        count += 1;
        minX = Math.min(minX, gx);
        maxX = Math.max(maxX, gx);
        minY = Math.min(minY, gy);
        maxY = Math.max(maxY, gy);

        [
          [gx - 1, gy],
          [gx + 1, gy],
          [gx, gy - 1],
          [gx, gy + 1],
        ].forEach(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) return;
          const nextIndex = ny * gridWidth + nx;
          if (!candidates[nextIndex] || visited[nextIndex]) return;
          visited[nextIndex] = 1;
          queue.push(nextIndex);
        });
      }

      const component = {
        count,
        minX: startX + minX * step,
        minY: startY + minY * step,
        maxX: startX + maxX * step,
        maxY: startY + maxY * step,
      };
      const width = component.maxX - component.minX;
      const height = component.maxY - component.minY;
      const plausible =
        count >= 4 &&
        width >= 8 &&
        height >= 6 &&
        width <= placement.width * 0.38 &&
        height <= placement.height * 0.22;
      if (!plausible) continue;
      if (!best || count > best.count) best = component;
    }
  }

  return best;
}

function hasColoredNeighborhood(data, width, height, x, y) {
  let colored = 0;
  let checked = 0;
  for (let row = Math.max(0, y - 16); row <= Math.min(height - 1, y + 16); row += 4) {
    for (let col = Math.max(0, x - 16); col <= Math.min(width - 1, x + 16); col += 4) {
      const index = (row * width + col) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha < 20) continue;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightBackground = red > 235 && green > 235 && blue > 235;
      if (saturation > 0.22 && !brightBackground && max > 70) colored += 1;
      checked += 1;
    }
  }
  return checked > 0 && colored / checked > 0.08;
}

function getProductPlacement() {
  const frame = getProductFrame();
  const size = getContainSize(state.product, frame.width, frame.height);
  return {
    x: frame.x + (frame.width - size.width) / 2,
    y: frame.y + (frame.height - size.height) / 2,
    width: size.width,
    height: size.height,
  };
}

function getLogoConstraintRect() {
  const placement = getProductPlacement();
  const insetX = Math.max(6, placement.width * 0.015);
  const insetY = Math.max(6, placement.height * 0.015);
  return {
    x: placement.x + insetX,
    y: placement.y + insetY,
    width: Math.max(40, placement.width - insetX * 2),
    height: Math.max(40, placement.height - insetY * 2),
  };
}

function getProductFrame() {
  return { x: 90, y: 128, width: 1020, height: 498 };
}

function getContainSize(image, targetWidth, targetHeight) {
  const imageRatio = image.width / image.height;
  const targetRatio = targetWidth / targetHeight;
  if (imageRatio > targetRatio) return { width: targetWidth, height: targetWidth / imageRatio };
  return { width: targetHeight * imageRatio, height: targetHeight };
}

function drawSafeArea(targetCtx, includeSelection) {
  const product = state.selectedProduct;
  if (!includeSelection || !product?.safeArea) return;
  const area = product.safeArea;
  targetCtx.save();
  targetCtx.strokeStyle = "rgba(13, 122, 99, 0.45)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([9, 7]);
  targetCtx.strokeRect(area.x, area.y, area.width, area.height);
  targetCtx.fillStyle = "rgba(13, 122, 99, 0.07)";
  targetCtx.fillRect(area.x, area.y, area.width, area.height);
  targetCtx.restore();
}

function drawLogo(targetCtx, width, height) {
  const temp = document.createElement("canvas");
  const tempCtx = temp.getContext("2d");
  const padding = Math.ceil(height * 0.45);
  temp.width = Math.ceil(width);
  temp.height = Math.ceil(height + padding * 2);

  tempCtx.clearRect(0, 0, temp.width, temp.height);
  tempCtx.drawImage(state.logo, 0, padding, width, height);
  applyLogoColor(tempCtx, temp.width, temp.height);

  targetCtx.save();
  targetCtx.translate(state.logoX, state.logoY);
  targetCtx.rotate((state.rotation * Math.PI) / 180);
  targetCtx.globalAlpha = state.opacity;
  applyTechniqueStyle(targetCtx);

  const columns = Math.max(80, Math.ceil(width));
  const sliceWidth = temp.width / columns;
  for (let index = 0; index < columns; index += 1) {
    const progress = index / (columns - 1 || 1);
    const centered = progress * 2 - 1;
    const curve = Math.sqrt(Math.max(0, 1 - centered * centered));
    const wrapScale = 1 - state.bend * 0.34 * Math.abs(centered);
    const yOffset = state.bend * height * 0.16 * (1 - curve);
    const destHeight = temp.height * wrapScale;
    const x = -width / 2 + index * (width / columns);
    targetCtx.drawImage(
      temp,
      index * sliceWidth,
      0,
      sliceWidth + 1,
      temp.height,
      x,
      -destHeight / 2 + yOffset,
      width / columns + 1,
      destHeight,
    );
  }
  targetCtx.restore();

  drawTechniqueHighlight(targetCtx, width, height);
}

function drawLogoClippedToProduct(targetCtx, width, height, includeSelection = false) {
  if (!shouldClipLogoToProduct()) {
    if (false && state.logoQuad) drawWarpedLogo(targetCtx, width, height);
    else drawLogo(targetCtx, width, height);
    return;
  }

  const logoLayer = document.createElement("canvas");
  logoLayer.width = canvas.width;
  logoLayer.height = canvas.height;
  const logoCtx = logoLayer.getContext("2d");

  if (false && state.logoQuad) {
    drawWarpedLogo(logoCtx, width, height);
  } else {
    drawLogo(logoCtx, width, height);
  }

  logoCtx.save();
  logoCtx.globalCompositeOperation = "destination-in";
  logoCtx.drawImage(createProductMask(), 0, 0);
  logoCtx.restore();

  targetCtx.drawImage(logoLayer, 0, 0);
  if (includeSelection && false && state.logoSelected && state.logoQuad) drawWarpHandles(targetCtx);
}

function shouldClipLogoToProduct() {
  return state.removeBackground || state.logoHasTransparency;
}

function drawWarpedLogo(targetCtx, width, height) {
  const source = createProcessedLogoCanvas(width, height);
  const quad = state.logoQuad;
  const rows = Math.max(28, Math.ceil(height / 5));

  targetCtx.save();
  targetCtx.globalAlpha = state.opacity;
  applyTechniqueStyle(targetCtx);

  for (let row = 0; row < rows; row += 1) {
    const topT = row / rows;
    const bottomT = (row + 1) / rows;
    const leftTop = lerpPoint(quad.tl, quad.bl, topT);
    const rightTop = lerpPoint(quad.tr, quad.br, topT);
    const leftBottom = lerpPoint(quad.tl, quad.bl, bottomT);
    const rightBottom = lerpPoint(quad.tr, quad.br, bottomT);
    const destTopWidth = distance(leftTop, rightTop);
    const destBottomWidth = distance(leftBottom, rightBottom);
    const destWidth = Math.max(destTopWidth, destBottomWidth);
    const destHeight = Math.max(distance(leftTop, leftBottom), distance(rightTop, rightBottom), 1);
    const angle = Math.atan2(rightTop.y - leftTop.y, rightTop.x - leftTop.x);
    const scaleY = destHeight / (height / rows);

    targetCtx.save();
    targetCtx.translate(leftTop.x, leftTop.y);
    targetCtx.rotate(angle);
    targetCtx.transform(1, 0, 0, scaleY, 0, 0);
    targetCtx.drawImage(
      source,
      0,
      row * (height / rows),
      width,
      height / rows + 1,
      0,
      0,
      destWidth,
      height / rows + 1,
    );
    targetCtx.restore();
  }

  targetCtx.restore();
}

function createProcessedLogoCanvas(width, height) {
  const temp = document.createElement("canvas");
  const tempCtx = temp.getContext("2d");
  temp.width = Math.ceil(width);
  temp.height = Math.ceil(height);
  tempCtx.drawImage(state.logo, 0, 0, width, height);
  applyLogoColor(tempCtx, temp.width, temp.height);
  return temp;
}

function createProductMask() {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");

  if (!state.product || (!state.product.width && !state.product.naturalWidth)) return maskCanvas;
  if (state.productCanSampleMask === false) return createSafeAreaMask();

  const placement = getProductPlacement();
  maskCtx.drawImage(state.productMask || state.product, placement.x, placement.y, placement.width, placement.height);

  try {
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;
    let visiblePixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      const backgroundLike = alpha < 20;
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = backgroundLike ? 0 : 255;
      if (!backgroundLike) visiblePixels += 1;
    }
    maskCtx.putImageData(imageData, 0, 0);

    if (visiblePixels < 1200) return createSafeAreaMask();
    return maskCanvas;
  } catch (error) {
    state.productCanSampleMask = false;
    console.warn("Leitura da mascara bloqueada; usando area segura.", error);
    return createSafeAreaMask();
  }
}

function createSafeAreaMask() {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");
  const area = state.selectedProduct?.safeArea || getProductFrame();
  maskCtx.fillStyle = "#ffffff";
  maskCtx.fillRect(area.x, area.y, area.width, area.height);
  return maskCanvas;
}

function applyTechniqueStyle(targetCtx) {
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.filter = "none";
}

function drawTechniqueHighlight(targetCtx, width, height) {
  if (state.logoColorMode === "original") return;
  if (!["laser", "uv", "baixo-relevo"].includes(state.technique)) return;
  targetCtx.save();
  targetCtx.translate(state.logoX, state.logoY);
  targetCtx.rotate((state.rotation * Math.PI) / 180);
  targetCtx.globalAlpha = state.technique === "uv" ? 0.16 : 0.24;
  targetCtx.globalCompositeOperation = "screen";
  const shine = targetCtx.createLinearGradient(-width / 2, 0, width / 2, 0);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.48, "rgba(255,255,255,0.52)");
  shine.addColorStop(0.62, "rgba(255,255,255,0.08)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  targetCtx.fillStyle = shine;
  targetCtx.fillRect(-width / 2, -height * 0.7, width, height * 1.4);
  targetCtx.restore();
}

function drawSelection(targetCtx, width, height) {
  targetCtx.save();
  targetCtx.translate(state.logoX, state.logoY);
  targetCtx.rotate((state.rotation * Math.PI) / 180);
  targetCtx.strokeStyle = "rgba(17, 130, 104, 0.9)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([7, 5]);
  targetCtx.strokeRect(-width / 2, -height / 2, width, height);
  targetCtx.setLineDash([]);

  const rotateY = -height / 2 - 34;
  targetCtx.strokeStyle = "#1677c8";
  targetCtx.beginPath();
  targetCtx.moveTo(0, -height / 2);
  targetCtx.lineTo(0, rotateY);
  targetCtx.stroke();

  drawHandleDot(targetCtx, 0, rotateY, "#1677c8", "circle");
  drawHandleDot(targetCtx, width / 2, height / 2, "#0d7a63", "square");
  targetCtx.restore();
}

function drawHandleDot(targetCtx, x, y, color, shape) {
  targetCtx.fillStyle = "#ffffff";
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 3;
  targetCtx.beginPath();
  if (shape === "square") {
    targetCtx.rect(x - 9, y - 9, 18, 18);
  } else {
    targetCtx.arc(x, y, 9, 0, Math.PI * 2);
  }
  targetCtx.fill();
  targetCtx.stroke();
}

function drawWarpHandles(targetCtx) {
  const quad = state.logoQuad;
  if (!quad) return;
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.filter = "none";
  targetCtx.globalAlpha = 1;
  targetCtx.strokeStyle = "rgba(201, 162, 39, 0.95)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  targetCtx.beginPath();
  targetCtx.moveTo(quad.tl.x, quad.tl.y);
  targetCtx.lineTo(quad.tr.x, quad.tr.y);
  targetCtx.lineTo(quad.br.x, quad.br.y);
  targetCtx.lineTo(quad.bl.x, quad.bl.y);
  targetCtx.closePath();
  targetCtx.stroke();

  Object.values(quad).forEach((point) => {
    targetCtx.fillStyle = "#ffffff";
    targetCtx.strokeStyle = "#c9a227";
    targetCtx.lineWidth = 3;
    targetCtx.beginPath();
    targetCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();
  });

  const center = getQuadCenter(quad);
  const rotatePoint = getRotateHandlePoint(quad);
  const resizePoint = getResizeHandlePoint(quad);

  targetCtx.setLineDash([]);
  targetCtx.strokeStyle = "#1677c8";
  targetCtx.lineWidth = 2;
  targetCtx.beginPath();
  targetCtx.moveTo(center.x, center.y);
  targetCtx.lineTo(rotatePoint.x, rotatePoint.y);
  targetCtx.stroke();

  targetCtx.fillStyle = "#ffffff";
  targetCtx.strokeStyle = "#1677c8";
  targetCtx.beginPath();
  targetCtx.arc(rotatePoint.x, rotatePoint.y, 9, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.stroke();

  targetCtx.fillStyle = "#ffffff";
  targetCtx.strokeStyle = "#0d7a63";
  targetCtx.lineWidth = 3;
  targetCtx.beginPath();
  targetCtx.moveTo(quad.br.x, quad.br.y);
  targetCtx.lineTo(resizePoint.x, resizePoint.y);
  targetCtx.stroke();

  targetCtx.fillStyle = "#ffffff";
  targetCtx.beginPath();
  targetCtx.rect(resizePoint.x - 9, resizePoint.y - 9, 18, 18);
  targetCtx.fill();
  targetCtx.stroke();
  targetCtx.restore();
}

function drawSimulationNotice(targetCtx) {
  targetCtx.fillStyle = "#f4f7f5";
  targetCtx.fillRect(0, 680, canvas.width, 80);
  targetCtx.fillStyle = "#68746f";
  targetCtx.font = "700 17px Inter, system-ui, sans-serif";
  targetCtx.fillText("Simulação visual. Produção sujeita à análise técnica, área real de gravação e viabilidade do produto.", 46, 724);
}

function getLogoSize() {
  const width = Math.max(12, canvas.width * state.scale);
  const height = width * (state.logo.height / state.logo.width);
  return { width, height };
}

function buildLogoQuadFromState() {
  if (!state.logo) return null;
  const size = getLogoSize();
  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;
  const points = [
    { key: "tl", x: -halfWidth, y: -halfHeight },
    { key: "tr", x: halfWidth, y: -halfHeight },
    { key: "br", x: halfWidth, y: halfHeight },
    { key: "bl", x: -halfWidth, y: halfHeight },
  ];
  const angle = (state.rotation * Math.PI) / 180;
  return Object.fromEntries(
    points.map((point) => [
      point.key,
      {
        x: state.logoX + point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: state.logoY + point.x * Math.sin(angle) + point.y * Math.cos(angle),
      },
    ]),
  );
}

function getQuadBounds(quad = state.logoQuad) {
  if (!quad) return null;
  const points = Object.values(quad);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function constrainLogoToProduct() {
  if (!state.logo) return;

  const rect = getLogoConstraintRect();
  if (!rect.width || !rect.height) return;

  state.logoQuad = buildLogoQuadFromState();
  let bounds = getQuadBounds();
  if (!bounds) return;

  if (bounds.width > rect.width || bounds.height > rect.height) {
    const fitFactor = Math.min(rect.width / bounds.width, rect.height / bounds.height, 1);
    state.scale = Math.max(0.01, state.scale * fitFactor * 0.98);
    scaleControl.value = Math.round(state.scale * 100);
    state.logoQuad = buildLogoQuadFromState();
    bounds = getQuadBounds();
  }

  let shiftX = 0;
  let shiftY = 0;
  if (bounds.left < rect.x) shiftX = rect.x - bounds.left;
  else if (bounds.right > rect.x + rect.width) shiftX = rect.x + rect.width - bounds.right;

  if (bounds.top < rect.y) shiftY = rect.y - bounds.top;
  else if (bounds.bottom > rect.y + rect.height) shiftY = rect.y + rect.height - bounds.bottom;

  state.logoX += shiftX;
  state.logoY += shiftY;
  xControl.value = Math.round(state.logoX);
  yControl.value = Math.round(state.logoY);
  state.logoQuad = buildLogoQuadFromState();
}

function resetLogoSettings() {
  beginUndo("reset-settings");
  state.logoX = canvas.width * 0.5;
  state.logoY = canvas.height * 0.52;
  state.scale = 0.28;
  state.rotation = -8;
  state.opacity = 0.92;
  state.bend = 0;
  state.logoColorMode = "original";
  state.removeBackground = false;
  state.logoCutout = 24;
  state.logoSelected = true;
  resetLogoQuad();
  syncAllControls();
  syncColorSwatches();
  drawColorWheel();
  commitUndo("reset-settings");
  updateContrastAlert();
  draw();
}

function resetLogoQuad() {
  if (!state.logo) return;
  state.logoQuad = buildLogoQuadFromState();
  constrainLogoToProduct();
}

function applyLogoColor(targetCtx, width, height) {
  const color = getLogoColor();
  if (!color) return;
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-in";
  targetCtx.fillStyle = color;
  targetCtx.fillRect(0, 0, width, height);
  targetCtx.restore();
}

function getLogoColor() {
  if (state.logoColorMode === "original") return null;
  if (state.logoColorMode === "custom") return state.logoColor;
  return state.logoColorMode;
}

function exportImage() {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  renderScene(finalCanvas.getContext("2d"), false);

  const link = document.createElement("a");
  link.download = `elo-preview-${state.selectedProduct?.code || "produto"}.png`;
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
  draw();
}

function openApprovalSheet(options = {}) {
  const { autoPrint = false } = options;
  const mockup = document.createElement("canvas");
  mockup.width = canvas.width;
  mockup.height = canvas.height;
  renderScene(mockup.getContext("2d"), false);
  const dataUrl = mockup.toDataURL("image/png");
  const product = state.selectedProduct || {};
  const date = new Date().toLocaleDateString("pt-BR");
  const reference = `OP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const exportCode = sanitizeFilenamePart(product.code || "manual");
  const client = valueOf("#clientName");
  const company = valueOf("#companyName");
  const quantity = valueOf("#quantity");
  const sample = quantity ? `${quantity} unidade${quantity === "1" ? "" : "s"}` : reference;

  const sheet = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Amostra Simples Elo Brindes</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 26px; color: #1d211f; font-family: Arial, Helvetica, sans-serif; background: #eef3f0; }
          .toolbar { max-width: 960px; margin: 0 auto 14px; display: flex; justify-content: flex-end; gap: 10px; }
          .toolbar button { border: 0; border-radius: 6px; padding: 11px 16px; color: #fff; background: #ff5a18; font: 700 14px Arial, sans-serif; cursor: pointer; }
          .toolbar .secondary { color: #17201c; background: #dfe8e3; }
          .sheet { max-width: 960px; min-height: 1080px; margin: 0 auto; overflow: hidden; border: 1px solid #f05a22; background: #fff; }
          .hero { position: relative; height: 250px; overflow: hidden; color: #fff; background: #ff5a18; text-align: center; }
          .hero::before,
          .hero::after { content: ""; position: absolute; inset: -70px auto auto -40px; width: 310px; height: 360px; border-radius: 44px; background: rgba(255, 204, 176, 0.55); transform: rotate(30deg); }
          .hero::after { inset: -120px -80px auto auto; width: 430px; height: 420px; transform: rotate(-38deg); background: rgba(255, 187, 151, 0.5); }
          .hero .stripe { position: absolute; width: 120px; height: 340px; top: -85px; left: 57%; border-radius: 18px; background: rgba(255,255,255,0.34); transform: rotate(28deg); }
          .hero .stripe.two { left: 76%; top: -65px; height: 300px; transform: rotate(38deg); }
          .brand { position: relative; z-index: 1; padding-top: 42px; font-size: 30px; font-weight: 400; letter-spacing: -1px; }
          .brand strong { font-weight: 800; }
          .title { position: relative; z-index: 1; margin-top: 32px; font-size: 62px; line-height: 0.9; letter-spacing: -2px; text-transform: uppercase; }
          .title strong { font-weight: 950; transform: scaleX(0.82); display: inline-block; transform-origin: right center; }
          .title span { font-weight: 300; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 48px; padding: 22px 20px 10px; }
          .info .wide { grid-column: span 1; }
          .info-bottom { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 46px; padding: 0 20px 18px; }
          .sample-field { min-height: 48px; padding: 8px 13px; color: #fff; background: #ff5a18; font-size: 16px; line-height: 1.2; }
          .sample-field strong { font-weight: 400; }
          .sample-field span { font-weight: 800; }
          .mockup { min-height: 570px; padding: 26px 34px 18px; display: grid; place-items: center; }
          .mockup img { display: block; max-width: 100%; max-height: 540px; object-fit: contain; }
          .meta { display: flex; justify-content: space-between; gap: 20px; padding: 15px 20px; color: #67736d; font-size: 12px; font-weight: 700; border-top: 1px solid #f0f0f0; }
          .notice { padding: 14px 20px 20px; color: #68746f; font-size: 12px; line-height: 1.35; font-weight: 700; }
          @media print {
            body { padding: 0; background: #fff; }
            .toolbar { display: none; }
            .sheet { width: 100%; max-width: none; min-height: 100vh; border: 0; }
          }
        </style>
      </head>
      <body>
        <nav class="toolbar">
          <button class="secondary" type="button" onclick="window.history.back()">Voltar ao editor</button>
          <button class="secondary" type="button" onclick="window.close()">Fechar</button>
          <button type="button" onclick="window.print()">Salvar PDF / Imprimir</button>
        </nav>
        <article class="sheet">
          <header class="hero">
            <span class="stripe"></span>
            <span class="stripe two"></span>
            <div class="brand"><strong>elo</strong> brindes</div>
            <div class="title"><strong>Amostra</strong> <span>Simples</span></div>
          </header>
          <section class="info">
            ${sampleField("Cliente", client || company || "A definir")}
            ${sampleField("Amostra", sample)}
          </section>
          <section class="info-bottom">
            ${sampleField("Produto", product.name || "Imagem própria")}
            ${sampleField("Cor", product.color || colorLabel() || "A definir")}
            ${sampleField("Cód.", product.code || "Manual")}
            ${sampleField("Tipo de gravação", techniqueLabelForValue(state.technique))}
          </section>
          <section class="mockup">
            <img src="${dataUrl}" alt="Mockup Elo Preview" />
          </section>
          <section class="meta">
            <span>${escapeHtml(date)}</span>
            <span>${escapeHtml(reference)}</span>
            <span>${escapeHtml(valueOf("#consultant") || "Elo Brindes")}</span>
          </section>
          <section class="notice">
            Observações: ${escapeHtml(valueOf("#notes") || "Simulação visual para aprovação comercial.")}<br>
            Produção sujeita à análise técnica, arquivo original, área real de gravação, técnica escolhida e viabilidade do produto.
          </section>
        </article>
        ${autoPrint ? '<script>window.addEventListener("load", () => window.setTimeout(() => window.print(), 280));</script>' : ""}
      </body>
    </html>
  `;

  const sheetKey = `elo-approval-sheet:${Date.now()}:${exportCode}`;

  try {
    localStorage.setItem(sheetKey, sheet);
  } catch (error) {
    downloadApprovalSheetHtml(sheet, `elo-amostra-${exportCode}.html`);
    window.alert("Nao foi possivel preparar a ficha no navegador. Baixamos o arquivo HTML para voce abrir manualmente.");
    return;
  }

  const sheetViewerUrl = new URL(`approval-sheet.html?sheet=${encodeURIComponent(sheetKey)}`, window.location.href).toString();
  const openInCurrentTab = () => window.location.assign(sheetViewerUrl);

  try {
    const sheetWindow = window.open(sheetViewerUrl, "_blank");
    if (sheetWindow) {
      sheetWindow.focus();
      return;
    }
  } catch (error) {
    console.warn("Nao foi possivel abrir a ficha em nova aba.", error);
  }

  openInCurrentTab();
}

function sheetField(label, value) {
  return `<div class="field"><strong>${escapeHtml(label)}</strong>${escapeHtml(value || "A definir")}</div>`;
}

function sampleField(label, value) {
  return `<div class="sample-field"><strong>${escapeHtml(label)}:</strong> <span>${escapeHtml(value || "A definir")}</span></div>`;
}

function valueOf(selector) {
  return document.querySelector(selector).value.trim();
}

function downloadApprovalSheetHtml(content, filename) {
  const file = new Blob([content], { type: "text/html;charset=utf-8" });
  const fileUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
}

function sanitizeFilenamePart(value) {
  return String(value || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getProductTitle() {
  if (!state.selectedProduct) return "Produto personalizado";
  return `${state.selectedProduct.code} | ${state.selectedProduct.name}`;
}

function getQualityMessage(image, file) {
  if (file?.type?.includes("svg")) return "Arquivo vetorial detectado. Melhor opção para produção.";
  if (image.width < 500 || image.height < 220) return "Atenção: logo com baixa resolução para produção. Peça vetor quando possível.";
  return "Logo carregado. Ajuste posição, cor e técnica para a prévia comercial.";
}

function updateContrastAlert() {
  const productText = normalizeText(`${state.selectedProduct?.color || ""} ${state.selectedProduct?.name || ""}`);
  const logoColor = getLogoColor();
  let message = "";
  if (productText.includes("preto") && (!logoColor || logoColor === "#111111")) {
    message = "Logo escuro em produto escuro: sugerir branco, prata ou dourado.";
  }
  if ((productText.includes("branco") || productText.includes("branca")) && logoColor === "#ffffff") {
    message = "Logo claro em produto claro: sugerir preto ou cor de alto contraste.";
  }
  if (state.technique === "laser" && state.logoColorMode === "original") {
    message = "Laser não reproduz cor original com fidelidade. Use prata, dourado ou baixo contraste para educar a aprovação.";
  }
  contrastAlert.textContent = message;
  contrastAlert.classList.toggle("is-visible", Boolean(message));
}

function colorLabel() {
  const labels = {
    original: "Original",
    "#111111": "Preto",
    "#ffffff": "Branco",
    "#c9a227": "Dourado",
    "#a8b0b8": "Prata",
    custom: state.logoColor,
  };
  return labels[state.logoColorMode] || state.logoColorMode;
}

function setCustomLogoColor(color, shouldPushUndo = true) {
  const normalized = normalizeHexColor(color);
  if (!normalized) return;
  if (shouldPushUndo) pushControlUndo("logo-color");
  state.logoColor = normalized;
  state.logoColorMode = "custom";
  logoColorMode.value = "custom";
  syncColorSwatches();
  drawColorWheel();
  updateContrastAlert();
  draw();
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();
  const expanded = text.replace(/^#([0-9a-f]{3})$/i, (_, hex) => `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`);
  return /^#[0-9a-f]{6}$/i.test(expanded) ? expanded.toLowerCase() : null;
}

function syncColorSwatches() {
  colorSwatches?.querySelectorAll("[data-color]").forEach((button) => {
    button.classList.toggle("is-active", normalizeHexColor(button.dataset.color) === normalizeHexColor(state.logoColor));
  });
}

function drawColorWheel() {
  if (!logoColorWheel) return;
  const wheelCtx = logoColorWheel.getContext("2d");
  const size = logoColorWheel.width;
  const radius = size / 2;
  const imageData = wheelCtx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - radius;
      const dy = y - radius;
      const distanceFromCenter = Math.hypot(dx, dy);
      const index = (y * size + x) * 4;
      if (distanceFromCenter > radius - 1) {
        data[index + 3] = 0;
        continue;
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const saturation = Math.min(1, distanceFromCenter / radius);
      const lightness = 1 - saturation * 0.5;
      const color = hslToRgb(hue, saturation, lightness);
      data[index] = color.red;
      data[index + 1] = color.green;
      data[index + 2] = color.blue;
      data[index + 3] = 255;
    }
  }

  wheelCtx.putImageData(imageData, 0, 0);
  drawColorWheelIndicator(wheelCtx, size);
  if (logoColorPreview) logoColorPreview.style.background = state.logoColor;
}

function drawColorWheelIndicator(wheelCtx, size) {
  const color = hexToRgb(state.logoColor);
  if (!color) return;
  const hsl = rgbToHsl(color.red, color.green, color.blue);
  const radius = size / 2;
  const distanceFromCenter = hsl.saturation * radius;
  const angle = (hsl.hue * Math.PI) / 180;
  const x = radius + Math.cos(angle) * distanceFromCenter;
  const y = radius + Math.sin(angle) * distanceFromCenter;

  wheelCtx.save();
  wheelCtx.strokeStyle = "#ffffff";
  wheelCtx.lineWidth = 4;
  wheelCtx.beginPath();
  wheelCtx.arc(x, y, 8, 0, Math.PI * 2);
  wheelCtx.stroke();
  wheelCtx.strokeStyle = "rgba(22, 31, 27, 0.55)";
  wheelCtx.lineWidth = 2;
  wheelCtx.stroke();
  wheelCtx.restore();
}

function colorFromWheelEvent(event) {
  const rect = logoColorWheel.getBoundingClientRect();
  const size = logoColorWheel.width;
  const scale = size / rect.width;
  const x = (event.clientX - rect.left) * scale;
  const y = (event.clientY - rect.top) * scale;
  const radius = size / 2;
  const dx = x - radius;
  const dy = y - radius;
  const distanceFromCenter = Math.min(Math.hypot(dx, dy), radius);
  const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const saturation = distanceFromCenter / radius;
  const lightness = 1 - saturation * 0.5;
  return rgbToHex(hslToRgb(hue, saturation, lightness));
}

function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (segment >= 0 && segment < 1) [red, green, blue] = [chroma, x, 0];
  else if (segment < 2) [red, green, blue] = [x, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, x];
  else if (segment < 4) [red, green, blue] = [0, x, chroma];
  else if (segment < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];
  const match = lightness - chroma / 2;
  return {
    red: clampColor((red + match) * 255),
    green: clampColor((green + match) * 255),
    blue: clampColor((blue + match) * 255),
  };
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation, lightness };
}

function hexToRgb(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return null;
  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ red, green, blue }) {
  return `#${[red, green, blue].map((value) => clampColor(value).toString(16).padStart(2, "0")).join("")}`;
}

function techniqueLabel(value) {
  const labels = {
    laser: "Laser",
    silk: "Serigrafia",
    uv: "UV digital",
    tampo: "Tampografia",
    bordado: "Bordado",
    "baixo-relevo": "Baixo-relevo",
  };
  return labels[value] || value;
}

function techniqueToValue(label) {
  const normalized = normalizeText(label);
  if (normalized.includes("uv")) return "uv";
  if (normalized.includes("seri") || normalized.includes("silk")) return "silk";
  if (normalized.includes("tampo")) return "tampo";
  if (normalized.includes("bordado")) return "bordado";
  if (normalized.includes("baixo")) return "baixo-relevo";
  return "laser";
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function handlePointerDown(event) {
  const point = canvasPoint(event);
  if (state.cleanupMode) {
    beginUndo("cleanup");
    state.cleanupStart = point;
    state.cleanupDraft = {
      type: "lasso",
      points: [point],
    };
    canvas.setPointerCapture(event.pointerId);
    draw();
    return;
  }
  if (!state.logo) return;
  const handle = getHandleAtPoint(point);
  if (handle) {
    beginUndo("logo-transform");
    state.logoSelected = true;
    state.activeHandle = handle;
    const center = { x: state.logoX, y: state.logoY };
    state.handleStart = {
      center,
      quad: cloneQuad(),
      scale: state.scale,
      rotation: state.rotation,
      distance: Math.max(distance(point, center), 1),
      angle: Math.atan2(point.y - center.y, point.x - center.x),
    };
    state.isDragging = false;
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  if (!isPointInsideLogo(point)) {
    state.logoSelected = false;
    state.isDragging = false;
    state.activeHandle = null;
    state.handleStart = null;
    draw();
    return;
  }
  beginUndo("logo-transform");
  state.logoSelected = true;
  state.isDragging = true;
  state.dragOffsetX = point.x - state.logoX;
  state.dragOffsetY = point.y - state.logoY;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (state.cleanupMode && state.cleanupDraft && state.cleanupStart) {
    const point = canvasPoint(event);
    const points = state.cleanupDraft.points;
    const lastPoint = points[points.length - 1];
    const minPointDistance = getLassoPointDistance();
    if (distance(point, lastPoint) >= minPointDistance) {
      points.push(point);
    }
    draw();
    return;
  }
  if (state.activeHandle && state.logoQuad) {
    const point = canvasPoint(event);
    if (state.activeHandle.type === "corner") {
      state.logoQuad[state.activeHandle.key] = point;
    }
    if ((state.activeHandle.type === "resize" || state.activeHandle.type === "resize-simple") && state.handleStart) {
      const factor = Math.max(0.05, distance(point, state.handleStart.center) / state.handleStart.distance);
      state.scale = clamp(state.handleStart.scale * factor, 0.01, 0.9);
      scaleControl.value = Math.round(state.scale * 100);
      resetLogoQuad();
    }
    if ((state.activeHandle.type === "rotate" || state.activeHandle.type === "rotate-simple") && state.handleStart) {
      const angle = Math.atan2(point.y - state.handleStart.center.y, point.x - state.handleStart.center.x);
      const delta = angle - state.handleStart.angle;
      state.rotation = Math.round((((state.handleStart.rotation + (delta * 180) / Math.PI) % 360) + 360) % 360);
      if (state.rotation > 180) state.rotation -= 360;
      rotationControl.value = state.rotation;
      resetLogoQuad();
    }
    syncPositionControls();
    draw();
    return;
  }
  if (!state.isDragging) return;
  const point = canvasPoint(event);
  state.logoX = point.x - state.dragOffsetX;
  state.logoY = point.y - state.dragOffsetY;
  constrainLogoToProduct();
  syncPositionControls();
  draw();
}

function handlePointerUp(event) {
  if (state.cleanupMode && state.cleanupDraft) {
    const cleanup = cloneCleanup(state.cleanupDraft);
    if (isValidCleanup(cleanup)) {
      state.productCleanups.push(cleanup);
      commitUndo("cleanup");
    } else {
      cancelUndo("cleanup");
    }
    state.cleanupDraft = null;
    state.cleanupStart = null;
    draw();
  }
  if (state.activeHandle || state.isDragging) commitUndo("logo-transform");
  state.isDragging = false;
  state.activeHandle = null;
  state.handleStart = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

function readFileAsDataUrl(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result, file);
  reader.readAsDataURL(file);
}

function syncPositionControls() {
  xControl.value = Math.round(state.logoX);
  yControl.value = Math.round(state.logoY);
}

function getHandleAtPoint(point) {
  if (!state.logoSelected || !state.logo) return null;
  const simpleHandles = getSimpleLogoHandles();
  if (distance(point, simpleHandles.rotate) <= 20) return { type: "rotate-simple" };
  if (distance(point, simpleHandles.resize) <= 22) return { type: "resize-simple" };
  return null;
}

function getSimpleLogoHandles() {
  const size = getLogoSize();
  const angle = (state.rotation * Math.PI) / 180;
  return {
    rotate: rotateLocalPoint(0, -size.height / 2 - 34, angle),
    resize: rotateLocalPoint(size.width / 2, size.height / 2, angle),
  };
}

function rotateLocalPoint(localX, localY, angle) {
  return {
    x: state.logoX + localX * Math.cos(angle) - localY * Math.sin(angle),
    y: state.logoY + localX * Math.sin(angle) + localY * Math.cos(angle),
  };
}

function isPointInsideLogo(point) {
  if (!state.logoQuad) return false;
  const { tl, tr, br, bl } = state.logoQuad;
  return isPointInTriangle(point, tl, tr, br) || isPointInTriangle(point, tl, br, bl);
}

function isPointInTriangle(point, a, b, c) {
  const area = triangleSign(point, a, b);
  const area2 = triangleSign(point, b, c);
  const area3 = triangleSign(point, c, a);
  const hasNegative = area < 0 || area2 < 0 || area3 < 0;
  const hasPositive = area > 0 || area2 > 0 || area3 > 0;
  return !(hasNegative && hasPositive);
}

function triangleSign(a, b, c) {
  return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
}

function moveLogoQuad(deltaX, deltaY) {
  if (!state.logoQuad) return;
  Object.values(state.logoQuad).forEach((point) => {
    point.x += deltaX;
    point.y += deltaY;
  });
}

function updateLogoCenterFromQuad() {
  if (!state.logoQuad) return;
  const points = Object.values(state.logoQuad);
  state.logoX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  state.logoY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

productGrid.addEventListener("click", (event) => {
  const option = event.target.closest("[data-product-id]");
  if (!option) return;
  const product = state.products.find((item) => item.id === option.dataset.productId);
  if (product) selectProduct(product);
});

productUpload.addEventListener("change", (event) => {
  readFileAsDataUrl(event.target.files[0], (src) => {
    state.undoStack = [];
    document.querySelectorAll(".product-option").forEach((item) => item.classList.remove("is-active"));
    state.selectedProduct = null;
    state.productCleanups = [];
    state.cleanupDraft = null;
    updateExperienceSummary();
    loadProductImage(src, true);
  });
});

hidePhotoLogoBtn.addEventListener("click", () => {
  state.cleanupMode = !state.cleanupMode;
  hidePhotoLogoBtn.classList.toggle("is-active", state.cleanupMode);
  cleanupHint.textContent = state.cleanupMode
    ? "Modo ativo: contorne o logo antigo e solte para aplicar."
    : "Ative e contorne o logo antigo com o mouse.";
  canvas.style.cursor = state.cleanupMode ? "crosshair" : "";
});

[cleanupIntensityControl, cleanupOpacityControl, cleanupFeatherControl, cleanupBlurControl].forEach((control) => {
  control.addEventListener("input", () => {
    syncCleanupSettingsFromControls();
    cleanupHint.textContent = "Ajuste fino aplicado. Use Intensidade, Opacidade, Borda e Desfoque para naturalizar.";
  });
});

autoHidePhotoLogoBtn.addEventListener("click", () => {
  beginUndo("cleanup-auto");
  const found = autoHideExistingPhotoLogo();
  if (found) commitUndo("cleanup-auto");
  else cancelUndo("cleanup-auto");
  cleanupHint.textContent = found
    ? "Logo provável ocultado automaticamente. Use Limpar ocultações se precisar refazer."
    : "Não encontrei um logo óbvio. Use o laço e contorne manualmente.";
});

clearPhotoLogoBtn.addEventListener("click", () => {
  beginUndo("cleanup-clear");
  state.productCleanups = [];
  state.cleanupDraft = null;
  commitUndo("cleanup-clear");
  draw();
});

productSearch.addEventListener("input", () => {
  state.visibleProductCount = 80;
  renderProducts();
});

quickCats.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  quickCats.querySelectorAll("[data-category]").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  state.activeCategory = button.dataset.category;
  state.visibleProductCount = 80;
  renderProducts();
});

loadMoreProductsBtn.addEventListener("click", () => {
  state.visibleProductCount += 80;
  renderProducts();
});

logoUpload.addEventListener("change", (event) => {
  state.undoStack = [];
  readFileAsDataUrl(event.target.files[0], loadLogo);
});

removeBgToggle.addEventListener("change", () => {
  beginUndo("remove-background");
  state.removeBackground = removeBgToggle.checked;
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  commitUndo("remove-background");
  draw();
});

logoCutoutControl.addEventListener("input", () => {
  pushControlUndo("logo-cutout");
  state.logoCutout = Number(logoCutoutControl.value);
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  draw();
});

logoCutoutControl.addEventListener("change", () => endControlUndo("logo-cutout"));

xControl.addEventListener("input", () => {
  pushControlUndo("x");
  state.logoX = Number(xControl.value);
  constrainLogoToProduct();
  draw();
});

yControl.addEventListener("input", () => {
  pushControlUndo("y");
  state.logoY = Number(yControl.value);
  constrainLogoToProduct();
  draw();
});

scaleControl.addEventListener("input", () => {
  pushControlUndo("scale");
  state.scale = Number(scaleControl.value) / 100;
  resetLogoQuad();
  draw();
});

rotationControl.addEventListener("input", () => {
  pushControlUndo("rotation");
  state.rotation = Number(rotationControl.value);
  resetLogoQuad();
  draw();
});

opacityControl.addEventListener("input", () => {
  pushControlUndo("opacity");
  state.opacity = Number(opacityControl.value) / 100;
  draw();
});

bendControl.addEventListener("input", () => {
  pushControlUndo("bend");
  state.bend = Number(bendControl.value) / 100;
  draw();
});

resetSettingsBtn.addEventListener("click", resetLogoSettings);

logoColorMode.addEventListener("change", () => {
  beginUndo("logo-color-mode");
  state.logoColorMode = logoColorMode.value;
  if (state.logoColorMode !== "original" && state.logoColorMode !== "custom") {
    state.logoColor = state.logoColorMode;
  }
  syncColorSwatches();
  drawColorWheel();
  updateContrastAlert();
  commitUndo("logo-color-mode");
  draw();
});

logoColorWheel.addEventListener("pointerdown", (event) => {
  pushControlUndo("logo-color");
  logoColorWheel.setPointerCapture(event.pointerId);
  setCustomLogoColor(colorFromWheelEvent(event), false);
});

logoColorWheel.addEventListener("pointermove", (event) => {
  if (!logoColorWheel.hasPointerCapture(event.pointerId)) return;
  setCustomLogoColor(colorFromWheelEvent(event), false);
});

["pointerup", "pointercancel"].forEach((eventName) => {
  logoColorWheel.addEventListener(eventName, (event) => {
    if (logoColorWheel.hasPointerCapture(event.pointerId)) logoColorWheel.releasePointerCapture(event.pointerId);
    endControlUndo("logo-color");
  });
});

colorSwatches.addEventListener("click", (event) => {
  const button = event.target.closest("[data-color]");
  if (!button) return;
  setCustomLogoColor(button.dataset.color);
  endControlUndo("logo-color");
});

techniqueControl.addEventListener("change", () => {
  beginUndo("technique");
  state.technique = techniqueControl.value;
  updateContrastAlert();
  updateExperienceSummary();
  commitUndo("technique");
  draw();
});

[xControl, yControl, scaleControl, rotationControl, opacityControl, bendControl].forEach((control) => {
  control.addEventListener("change", () => endControlUndo());
  control.addEventListener("blur", () => endControlUndo());
});

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
canvas.addEventListener(
  "wheel",
  (event) => {
    if (!state.logo) return;
    event.preventDefault();
    beginUndo("wheel");
    if (event.shiftKey) {
      state.rotation = clamp(state.rotation + (event.deltaY > 0 ? 4 : -4), -180, 180);
      rotationControl.value = state.rotation;
    } else {
      state.scale = clamp(state.scale + (event.deltaY > 0 ? -0.015 : 0.015), 0.01, 0.9);
      scaleControl.value = Math.round(state.scale * 100);
    }
    resetLogoQuad();
    commitUndo("wheel");
    draw();
  },
  { passive: false },
);

downloadBtn.addEventListener("click", exportImage);
approvalBtn.addEventListener("click", openApprovalSheet);
printSheetBtn.addEventListener("click", () => openApprovalSheet());
downloadSheetBtn.addEventListener("click", () => openApprovalSheet({ autoPrint: true }));

document.addEventListener("keydown", (event) => {
  const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
  if (!isUndo) return;
  const editable = event.target.closest?.("input, textarea, select");
  if (editable && editable.type !== "range" && editable.type !== "color") return;
  event.preventDefault();
  undoLastChange();
});
