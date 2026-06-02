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
const resetSettingsBtn = document.querySelector("#resetSettingsBtn");
const logoColorMode = document.querySelector("#logoColorMode");
const logoColorWheel = document.querySelector("#logoColorWheel");
const logoColorPreview = document.querySelector("#logoColorPreview");
const colorSwatches = document.querySelector(".color-swatches");
const techniqueControl = document.querySelector("#techniqueControl");
const productGrid = document.querySelector("#productGrid");
const productSearch = document.querySelector("#productSearch");
const productCount = document.querySelector("#productCount");
const quickCats = document.querySelector(".quick-cats");
const contrastAlert = document.querySelector("#contrastAlert");
const qualityHint = document.querySelector("#qualityHint");

const state = {
  product: new Image(),
  productMask: null,
  logo: null,
  logoOriginal: null,
  products: [],
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
  logoSelected: true,
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

async function loadProducts() {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) throw new Error("Nao foi possivel carregar products.json");
    state.products = await response.json();
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
    const haystack = normalizeText(`${product.code} ${product.name} ${product.category} ${product.techniques?.join(" ")}`);
    const matchesTerm = !term || haystack.includes(term);
    const matchesCategory = state.activeCategory === "all" || product.category === state.activeCategory;
    return matchesTerm && matchesCategory;
  });

  productCount.textContent = `${filtered.length} produto${filtered.length === 1 ? "" : "s"}`;
  productGrid.innerHTML = "";

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="hint">Nenhum produto encontrado.</p>';
    return;
  }

  filtered.forEach((product) => {
    const button = document.createElement("button");
    button.className = `product-option${state.selectedProduct?.code === product.code ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.code = product.code;
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
}

function loadProductImage(src, removePreviewBg = false) {
  const image = new Image();
  image.crossOrigin = src.startsWith("data:") || src.startsWith("blob:") ? "" : "anonymous";
  image.onload = () => {
    state.product = image;
    state.productMask = removePreviewBg ? createProductMaskSource(image) : image;
    draw();
  };
  image.src = src;
}

function createProductMaskSource(image) {
  const productCanvas = document.createElement("canvas");
  productCanvas.width = image.width;
  productCanvas.height = image.height;
  const productCtx = productCanvas.getContext("2d");
  productCtx.drawImage(image, 0, 0);

  const imageData = productCtx.getImageData(0, 0, productCanvas.width, productCanvas.height);
  const data = imageData.data;
  const background = estimateBackgroundColor(data);

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const distance = colorDistance(red, green, blue, background.red, background.green, background.blue);
    const veryCloseToBackground = distance < 16;
    const brightFlatBackground = red > 246 && green > 246 && blue > 246 && distance < 26;
    if (veryCloseToBackground || brightFlatBackground) data[index + 3] = 0;
  }
  productCtx.putImageData(imageData, 0, 0);
  return productCanvas;
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
  cleanupIntensityControl.value = Math.round(state.cleanupSettings.intensity);
  cleanupOpacityControl.value = Math.round(state.cleanupSettings.opacity);
  cleanupFeatherControl.value = Math.round(state.cleanupSettings.feather);
  cleanupBlurControl.value = Math.round(state.cleanupSettings.blur);
}

function loadLogo(src, file) {
  const image = new Image();
  image.onload = () => {
    state.logoOriginal = image;
    state.logo = processLogoImage(image);
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
    state.logoSelected = true;
    resetLogoQuad();
    syncPositionControls();
    emptyState.classList.add("is-hidden");
    qualityHint.textContent = getQualityMessage(image, file);
    updateContrastAlert();
    draw();
  };
  image.src = src;
}

function processLogoImage(image) {
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = image.width;
  logoCanvas.height = image.height;
  const logoCtx = logoCanvas.getContext("2d");
  logoCtx.drawImage(image, 0, 0);

  if (state.removeBackground) {
    const imageData = logoCtx.getImageData(0, 0, logoCanvas.width, logoCanvas.height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const nearWhite = red > 224 && green > 224 && blue > 224;
      if (alpha > 0 && nearWhite) data[index + 3] = 0;
    }
    logoCtx.putImageData(imageData, 0, 0);
  }

  return logoCanvas;
}

function draw() {
  renderScene(ctx, true);
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
  const logoLayer = document.createElement("canvas");
  logoLayer.width = canvas.width;
  logoLayer.height = canvas.height;
  const logoCtx = logoLayer.getContext("2d");

  if (state.logoQuad) {
    drawWarpedLogo(logoCtx, width, height);
  } else {
    drawLogo(logoCtx, width, height);
  }

  logoCtx.save();
  logoCtx.globalCompositeOperation = "destination-in";
  logoCtx.drawImage(createProductMask(), 0, 0);
  logoCtx.restore();

  targetCtx.drawImage(logoLayer, 0, 0);
  if (includeSelection && state.logoSelected && state.logoQuad) drawWarpHandles(targetCtx);
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

  const placement = getProductPlacement();
  maskCtx.drawImage(state.productMask || state.product, placement.x, placement.y, placement.width, placement.height);

  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const data = imageData.data;
  let visiblePixels = 0;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
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
  const filters = {
    laser: "contrast(1.22) saturate(0.62) brightness(0.9)",
    silk: "contrast(1.06) saturate(1.08)",
    uv: "contrast(1.08) saturate(1.22)",
    tampo: "contrast(1.02) saturate(0.95)",
    bordado: "contrast(1.12) saturate(0.9)",
    "baixo-relevo": "contrast(1.18) saturate(0.45) brightness(0.86)",
  };
  targetCtx.globalCompositeOperation = state.technique === "uv" || state.technique === "silk" ? "source-over" : "multiply";
  targetCtx.filter = filters[state.technique] || "none";
}

function drawTechniqueHighlight(targetCtx, width, height) {
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
  if (state.logoQuad) return;
  targetCtx.save();
  targetCtx.translate(state.logoX, state.logoY);
  targetCtx.rotate((state.rotation * Math.PI) / 180);
  targetCtx.strokeStyle = "rgba(201, 162, 39, 0.95)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  targetCtx.strokeRect(-width / 2, -height / 2, width, height);
  targetCtx.restore();
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

function resetLogoSettings() {
  beginUndo("reset-settings");
  state.logoX = canvas.width * 0.5;
  state.logoY = canvas.height * 0.52;
  state.scale = 0.28;
  state.rotation = -8;
  state.opacity = 0.92;
  state.bend = 0.28;
  state.logoColorMode = "original";
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
  state.logoQuad = Object.fromEntries(
    points.map((point) => [
      point.key,
      {
        x: state.logoX + point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: state.logoY + point.x * Math.sin(angle) + point.y * Math.cos(angle),
      },
    ]),
  );
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

function openApprovalSheet() {
  const mockup = document.createElement("canvas");
  mockup.width = canvas.width;
  mockup.height = canvas.height;
  renderScene(mockup.getContext("2d"), false);
  const dataUrl = mockup.toDataURL("image/png");
  const product = state.selectedProduct || {};
  const date = new Date().toLocaleDateString("pt-BR");
  const reference = `OP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const sheet = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Ficha de Prévia Visual</title>
        <style>
          body { margin: 0; padding: 28px; color: #17201c; font-family: Arial, sans-serif; background: #eef3f0; }
          .toolbar { max-width: 900px; margin: 0 auto 14px; display: flex; justify-content: flex-end; gap: 10px; }
          .toolbar button { border: 0; border-radius: 6px; padding: 11px 16px; color: #fff; background: #0d7a63; font: 700 14px Arial, sans-serif; cursor: pointer; }
          .toolbar .secondary { color: #17201c; background: #dfe8e3; }
          .sheet { max-width: 900px; margin: 0 auto; border: 1px solid #d9e1dc; background: #fff; }
          header { display: flex; justify-content: space-between; gap: 20px; padding: 24px; border-bottom: 1px solid #d9e1dc; }
          h1 { margin: 0; font-size: 28px; }
          h2 { margin: 4px 0 0; color: #0d7a63; font-size: 15px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border-bottom: 1px solid #d9e1dc; }
          .field { padding: 12px 18px; border-top: 1px solid #edf1ee; }
          .field strong { display: block; color: #68746f; font-size: 12px; text-transform: uppercase; }
          .mockup { padding: 24px; text-align: center; }
          .mockup img { max-width: 100%; border: 1px solid #d9e1dc; }
          .notice { padding: 18px 24px; color: #68746f; background: #f4f7f5; font-size: 13px; font-weight: 700; }
          @media print { body { padding: 0; background: #fff; } .toolbar { display: none; } .sheet { border: 0; } }
        </style>
      </head>
      <body>
        <nav class="toolbar">
          <button class="secondary" type="button" onclick="window.close()">Fechar</button>
          <button type="button" onclick="window.print()">Salvar PDF / Imprimir</button>
        </nav>
        <article class="sheet">
          <header>
            <div>
              <img src="./assets/elo-logo.png" alt="Elo Brindes" style="width: 170px; height: auto; display: block; margin-bottom: 8px;" />
              <h2>Ficha de Prévia Visual</h2>
            </div>
            <div>${date}<br>${reference}</div>
          </header>
          <section class="grid">
            ${sheetField("Cliente", valueOf("#clientName"))}
            ${sheetField("Empresa", valueOf("#companyName"))}
            ${sheetField("Produto", product.name || "Imagem própria")}
            ${sheetField("Código", product.code || "Manual")}
            ${sheetField("Quantidade", valueOf("#quantity"))}
            ${sheetField("Técnica desejada", techniqueLabel(state.technique))}
            ${sheetField("Cor do produto", product.color || "A definir")}
            ${sheetField("Cor do logo", colorLabel())}
            ${sheetField("Área sugerida", product.area || "Área indicada no mockup")}
            ${sheetField("Consultora responsável", valueOf("#consultant"))}
          </section>
          <section class="mockup">
            <h2>Mockup do produto</h2>
            <img src="${dataUrl}" alt="Mockup Elo Preview" />
          </section>
          <section class="notice">
            Observações: ${valueOf("#notes")}<br><br>
            Esta imagem é uma simulação visual para aprovação comercial. A aplicação final da marca passará por análise técnica da equipe Elo Brindes, considerando o arquivo original enviado, a área real de gravação, o tamanho permitido, a técnica escolhida, as limitações do produto e a viabilidade de produção.
          </section>
        </article>
      </body>
    </html>
  `;

  const sheetWindow = window.open("", "_blank");
  sheetWindow.document.write(sheet);
  sheetWindow.document.close();
}

function sheetField(label, value) {
  return `<div class="field"><strong>${escapeHtml(label)}</strong>${escapeHtml(value || "A definir")}</div>`;
}

function valueOf(selector) {
  return document.querySelector(selector).value.trim();
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
    const center = getQuadCenter();
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
    if (state.activeHandle.type === "resize" && state.handleStart) {
      const factor = Math.max(0.05, distance(point, state.handleStart.center) / state.handleStart.distance);
      state.logoQuad = scaleQuadFromCenter(state.handleStart.quad, state.handleStart.center, factor);
      state.scale = clamp(state.handleStart.scale * factor, 0.01, 0.9);
      scaleControl.value = Math.round(state.scale * 100);
    }
    if (state.activeHandle.type === "rotate" && state.handleStart) {
      const angle = Math.atan2(point.y - state.handleStart.center.y, point.x - state.handleStart.center.x);
      const delta = angle - state.handleStart.angle;
      state.logoQuad = rotateQuadAroundCenter(state.handleStart.quad, state.handleStart.center, delta);
      state.rotation = Math.round((((state.handleStart.rotation + (delta * 180) / Math.PI) % 360) + 360) % 360);
      if (state.rotation > 180) state.rotation -= 360;
      rotationControl.value = state.rotation;
    }
    updateLogoCenterFromQuad();
    syncPositionControls();
    draw();
    return;
  }
  if (!state.isDragging) return;
  const point = canvasPoint(event);
  const previousX = state.logoX;
  const previousY = state.logoY;
  state.logoX = point.x - state.dragOffsetX;
  state.logoY = point.y - state.dragOffsetY;
  moveLogoQuad(state.logoX - previousX, state.logoY - previousY);
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
  if (!state.logoSelected || !state.logoQuad) return null;
  const rotatePoint = getRotateHandlePoint();
  const resizePoint = getResizeHandlePoint();
  if (distance(point, rotatePoint) <= 18) return { type: "rotate" };
  if (distance(point, resizePoint) <= 20) return { type: "resize" };
  const corner = Object.entries(state.logoQuad).find(([, handlePoint]) => distance(point, handlePoint) <= 18)?.[0];
  return corner ? { type: "corner", key: corner } : null;
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
  const option = event.target.closest("[data-code]");
  if (!option) return;
  const product = state.products.find((item) => item.code === option.dataset.code);
  if (product) selectProduct(product);
});

productUpload.addEventListener("change", (event) => {
  readFileAsDataUrl(event.target.files[0], (src) => {
    state.undoStack = [];
    document.querySelectorAll(".product-option").forEach((item) => item.classList.remove("is-active"));
    state.selectedProduct = null;
    state.productCleanups = [];
    state.cleanupDraft = null;
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

productSearch.addEventListener("input", renderProducts);

quickCats.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  quickCats.querySelectorAll("[data-category]").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  state.activeCategory = button.dataset.category;
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

xControl.addEventListener("input", () => {
  pushControlUndo("x");
  const previousX = state.logoX;
  state.logoX = Number(xControl.value);
  moveLogoQuad(state.logoX - previousX, 0);
  draw();
});

yControl.addEventListener("input", () => {
  pushControlUndo("y");
  const previousY = state.logoY;
  state.logoY = Number(yControl.value);
  moveLogoQuad(0, state.logoY - previousY);
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
printSheetBtn.addEventListener("click", openApprovalSheet);
downloadSheetBtn.addEventListener("click", openApprovalSheet);

document.addEventListener("keydown", (event) => {
  const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
  if (!isUndo) return;
  const editable = event.target.closest?.("input, textarea, select");
  if (editable && editable.type !== "range" && editable.type !== "color") return;
  event.preventDefault();
  undoLastChange();
});
