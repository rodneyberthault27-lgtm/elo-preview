const canvas = document.querySelector("#mockupCanvas");
const ctx = canvas.getContext("2d");
const emptyState = document.querySelector("#emptyState");
const downloadBtn = document.querySelector("#downloadBtn");
const approvalBtn = document.querySelector("#approvalBtn");
const printSheetBtn = document.querySelector("#printSheetBtn");
const logoUpload = document.querySelector("#logoUpload");
const productUpload = document.querySelector("#productUpload");
const hidePhotoLogoBtn = document.querySelector("#hidePhotoLogoBtn");
const autoHidePhotoLogoBtn = document.querySelector("#autoHidePhotoLogoBtn");
const clearPhotoLogoBtn = document.querySelector("#clearPhotoLogoBtn");
const cleanupHint = document.querySelector("#cleanupHint");
const removeBgToggle = document.querySelector("#removeBgToggle");
const xControl = document.querySelector("#xControl");
const yControl = document.querySelector("#yControl");
const scaleControl = document.querySelector("#scaleControl");
const rotationControl = document.querySelector("#rotationControl");
const opacityControl = document.querySelector("#opacityControl");
const bendControl = document.querySelector("#bendControl");
const logoColorMode = document.querySelector("#logoColorMode");
const logoColorInput = document.querySelector("#logoColorInput");
const logoColorRow = document.querySelector(".color-row");
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
  logoColor: logoColorInput.value,
  technique: techniqueControl.value,
  removeBackground: removeBgToggle.checked,
  cleanupMode: false,
  productCleanups: [],
  cleanupDraft: null,
  cleanupStart: null,
  logoQuad: null,
  activeHandle: null,
  handleStart: null,
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
};

state.product.crossOrigin = "anonymous";
loadProducts();

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

function cloneQuad(quad = state.logoQuad) {
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

function loadLogo(src, file) {
  const image = new Image();
  image.onload = () => {
    state.logoOriginal = image;
    state.logo = processLogoImage(image);
    state.logoX = canvas.width * 0.5;
    state.logoY = canvas.height * 0.52;
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
    if (includeSelection) drawSelection(targetCtx, size.width, size.height);
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
  [...state.productCleanups, state.cleanupDraft].filter(Boolean).forEach((rect) => {
    hideLogoArea(targetCtx, rect);
    if (includeSelection && rect === state.cleanupDraft) drawCleanupDraft(targetCtx, rect);
  });
}

function hideLogoArea(targetCtx, rect) {
  const normalized = normalizeRect(rect);
  if (normalized.width < 4 || normalized.height < 4) return;

  const sample = sampleBorderColor(targetCtx, normalized, 18);
  targetCtx.save();
  targetCtx.fillStyle = sample.fill;
  targetCtx.fillRect(normalized.x, normalized.y, normalized.width, normalized.height);
  targetCtx.globalAlpha = 0.22;
  targetCtx.filter = "blur(10px)";
  targetCtx.drawImage(
    targetCtx.canvas,
    Math.max(0, normalized.x - 18),
    Math.max(0, normalized.y - 18),
    normalized.width + 36,
    normalized.height + 36,
    normalized.x,
    normalized.y,
    normalized.width,
    normalized.height,
  );
  targetCtx.restore();
}

function sampleBorderColor(targetCtx, rect, margin) {
  const x = Math.max(0, Math.floor(rect.x - margin));
  const y = Math.max(0, Math.floor(rect.y - margin));
  const width = Math.min(canvas.width - x, Math.ceil(rect.width + margin * 2));
  const height = Math.min(canvas.height - y, Math.ceil(rect.height + margin * 2));
  const imageData = targetCtx.getImageData(x, y, width, height);
  const data = imageData.data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  let preferredRed = 0;
  let preferredGreen = 0;
  let preferredBlue = 0;
  let preferredCount = 0;

  for (let row = 0; row < height; row += 2) {
    for (let col = 0; col < width; col += 2) {
      const canvasX = x + col;
      const canvasY = y + row;
      const insideRect =
        canvasX >= rect.x && canvasX <= rect.x + rect.width && canvasY >= rect.y && canvasY <= rect.y + rect.height;
      if (insideRect) continue;
      const index = (row * width + col) * 4;
      if (data[index + 3] < 20) continue;
      const pixelRed = data[index];
      const pixelGreen = data[index + 1];
      const pixelBlue = data[index + 2];
      const max = Math.max(pixelRed, pixelGreen, pixelBlue);
      const min = Math.min(pixelRed, pixelGreen, pixelBlue);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const notBackground = !(pixelRed > 235 && pixelGreen > 235 && pixelBlue > 235);
      const notShadow = max > 70;

      red += pixelRed;
      green += pixelGreen;
      blue += pixelBlue;
      count += 1;

      if (saturation > 0.22 && notBackground && notShadow) {
        preferredRed += pixelRed;
        preferredGreen += pixelGreen;
        preferredBlue += pixelBlue;
        preferredCount += 1;
      }
    }
  }

  if (preferredCount) {
    return {
      fill: `rgb(${Math.round(preferredRed / preferredCount)}, ${Math.round(preferredGreen / preferredCount)}, ${Math.round(preferredBlue / preferredCount)})`,
    };
  }
  if (!count) return { fill: "#f3f7f5" };
  return { fill: `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})` };
}

function drawCleanupDraft(targetCtx, rect) {
  const normalized = normalizeRect(rect);
  targetCtx.save();
  targetCtx.strokeStyle = "rgba(13, 122, 99, 0.9)";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 6]);
  targetCtx.strokeRect(normalized.x, normalized.y, normalized.width, normalized.height);
  targetCtx.restore();
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
  if (includeSelection && state.logoQuad) drawWarpHandles(targetCtx);
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
  const resizePoint = quad.br;

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
  targetCtx.rect(resizePoint.x - 8, resizePoint.y - 8, 16, 16);
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
          @media print { body { padding: 0; background: #fff; } .sheet { border: 0; } }
        </style>
      </head>
      <body>
        <article class="sheet">
          <header>
            <div>
              <h1>ELO BRINDES</h1>
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
    custom: logoColorInput.value,
  };
  return labels[state.logoColorMode] || state.logoColorMode;
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
    state.cleanupStart = point;
    state.cleanupDraft = { x: point.x, y: point.y, width: 0, height: 0 };
    canvas.setPointerCapture(event.pointerId);
    draw();
    return;
  }
  if (!state.logo) return;
  const handle = getHandleAtPoint(point);
  if (handle) {
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
  state.isDragging = true;
  state.dragOffsetX = point.x - state.logoX;
  state.dragOffsetY = point.y - state.logoY;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (state.cleanupMode && state.cleanupDraft && state.cleanupStart) {
    const point = canvasPoint(event);
    state.cleanupDraft = {
      x: state.cleanupStart.x,
      y: state.cleanupStart.y,
      width: point.x - state.cleanupStart.x,
      height: point.y - state.cleanupStart.y,
    };
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
    const rect = normalizeRect(state.cleanupDraft);
    if (rect.width > 12 && rect.height > 12) state.productCleanups.push(rect);
    state.cleanupDraft = null;
    state.cleanupStart = null;
    draw();
  }
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
  if (!state.logoQuad) return null;
  const rotatePoint = getRotateHandlePoint();
  if (distance(point, rotatePoint) <= 18) return { type: "rotate" };
  if (distance(point, state.logoQuad.br) <= 18) return { type: "resize" };
  const corner = Object.entries(state.logoQuad).find(([, handlePoint]) => distance(point, handlePoint) <= 18)?.[0];
  return corner ? { type: "corner", key: corner } : null;
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
    ? "Modo ativo: arraste um retângulo sobre o logo antigo."
    : "Ative e arraste sobre o logo antigo do produto.";
  canvas.style.cursor = state.cleanupMode ? "crosshair" : "";
});

autoHidePhotoLogoBtn.addEventListener("click", () => {
  const found = autoHideExistingPhotoLogo();
  cleanupHint.textContent = found
    ? "Logo provável ocultado automaticamente. Use Limpar ocultações se precisar refazer."
    : "Não encontrei um logo óbvio. Use Ocultar logo da foto e arraste manualmente.";
});

clearPhotoLogoBtn.addEventListener("click", () => {
  state.productCleanups = [];
  state.cleanupDraft = null;
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
  readFileAsDataUrl(event.target.files[0], loadLogo);
});

removeBgToggle.addEventListener("change", () => {
  state.removeBackground = removeBgToggle.checked;
  if (state.logoOriginal) state.logo = processLogoImage(state.logoOriginal);
  draw();
});

xControl.addEventListener("input", () => {
  const previousX = state.logoX;
  state.logoX = Number(xControl.value);
  moveLogoQuad(state.logoX - previousX, 0);
  draw();
});

yControl.addEventListener("input", () => {
  const previousY = state.logoY;
  state.logoY = Number(yControl.value);
  moveLogoQuad(0, state.logoY - previousY);
  draw();
});

scaleControl.addEventListener("input", () => {
  state.scale = Number(scaleControl.value) / 100;
  resetLogoQuad();
  draw();
});

rotationControl.addEventListener("input", () => {
  state.rotation = Number(rotationControl.value);
  resetLogoQuad();
  draw();
});

opacityControl.addEventListener("input", () => {
  state.opacity = Number(opacityControl.value) / 100;
  draw();
});

bendControl.addEventListener("input", () => {
  state.bend = Number(bendControl.value) / 100;
  draw();
});

logoColorMode.addEventListener("change", () => {
  state.logoColorMode = logoColorMode.value;
  logoColorRow.classList.toggle("is-visible", state.logoColorMode === "custom");
  updateContrastAlert();
  draw();
});

logoColorInput.addEventListener("input", () => {
  state.logoColor = logoColorInput.value;
  updateContrastAlert();
  draw();
});

techniqueControl.addEventListener("change", () => {
  state.technique = techniqueControl.value;
  updateContrastAlert();
  draw();
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
    if (event.shiftKey) {
      state.rotation = clamp(state.rotation + (event.deltaY > 0 ? 4 : -4), -180, 180);
      rotationControl.value = state.rotation;
    } else {
      state.scale = clamp(state.scale + (event.deltaY > 0 ? -0.015 : 0.015), 0.01, 0.9);
      scaleControl.value = Math.round(state.scale * 100);
    }
    resetLogoQuad();
    draw();
  },
  { passive: false },
);

downloadBtn.addEventListener("click", exportImage);
approvalBtn.addEventListener("click", openApprovalSheet);
printSheetBtn.addEventListener("click", openApprovalSheet);
