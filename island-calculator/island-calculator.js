/* =============================================
   Island Calculator — Logic
   Defaults loaded from config.json
   ============================================= */

// ---------- Module state (populated from config) ----------
let CONFIG = null;
let BLOCK_TYPES = [];
let BLOCK_LABELS = {};
let ISLAND_PRESETS = {};
let valueInputs = {};

let rowCounter = 0;

// ---------- Breakdown constants ----------
const CHEST_SLOTS = 54;
const SHULKER_SLOTS = 27;
const STACK_SIZE = 64;
const DC_CAPACITY = STACK_SIZE * SHULKER_SLOTS * CHEST_SLOTS; // 93,312
const SHULKER_CAPACITY = STACK_SIZE * SHULKER_SLOTS;          // 1,728

// ---------- Breakdown helpers ----------
const breakdownBlocks = (amount) => {
  let remaining = amount;
  const doubleChests = Math.floor(remaining / DC_CAPACITY);
  remaining -= doubleChests * DC_CAPACITY;
  const shulkers = Math.floor(remaining / SHULKER_CAPACITY);
  remaining -= shulkers * SHULKER_CAPACITY;
  const stacks = Math.floor(remaining / STACK_SIZE);
  remaining -= stacks * STACK_SIZE;
  return { doubleChests, shulkers, stacks, remainder: remaining };
};

const blocksFromBreakdown = (doubleChests, shulkers, stacks, remainder) => {
  return doubleChests * DC_CAPACITY + shulkers * SHULKER_CAPACITY + stacks * STACK_SIZE + remainder;
};

// ---------- Formatting ----------
const formatNumber = (value) => {
  const str = Math.floor(value).toString();
  const parts = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  return parts.join(" ");
};

// ---------- Settings ----------
const getBlockValues = () => {
  const values = {};
  for (const type of BLOCK_TYPES) {
    const raw = parseFloat(valueInputs[type].value);
    values[type] = !isNaN(raw) && raw >= 0 ? raw : 0;
  }
  return values;
};

// ---------- Island size helpers ----------
const parseIslandSize = (presetKey, customW, customH, customD) => {
  if (presetKey === "custom") {
    const w = parseInt(customW, 10) || 0;
    const h = parseInt(customH, 10) || 0;
    const d = parseInt(customD, 10) || 0;
    return { w, h, d, volume: w * h * d };
  }
  const preset = ISLAND_PRESETS[presetKey];
  if (!preset) return { w: 0, h: 0, d: 0, volume: 0 };
  return { ...preset, volume: preset.w * preset.h * preset.d };
};

// ---------- Per-row calculation ----------
const calculateRow = (blocksPlaced, blockType, blockValues) => {
  const count = parseInt(blocksPlaced, 10) || 0;
  const value = blockValues[blockType] || 0;
  return {
    blocks: count,
    islandLevel: count * value,
  };
};

// ---------- Row DOM creation ----------
const createRow = () => {
  const id = rowCounter++;

  // Generate preset dropdown options from config
  const presetOptions = CONFIG.islandCalculator.islandPresets
    .map((p) => `<option value="${p.key}">${p.label}</option>`)
    .join("");

  const cd = CONFIG.islandCalculator.customDimensions;

  const row = document.createElement("div");
  row.className = "calc-row";
  row.dataset.rowId = id;

  row.innerHTML = `
    <button class="row-remove-btn" data-row="${id}" title="Удалить строку">✕</button>
    <div class="row-field">
      <label>Размер острова:</label>
      <select class="island-size-select" data-row="${id}">
        ${presetOptions}
        <option value="custom">Свой</option>
      </select>
    </div>
    <div class="row-field custom-dims hidden" data-row="${id}">
      <input type="number" class="dim-input dim-w" placeholder="Ш" min="0" value="${cd.defaultW}" data-row="${id}" />
      <span>×</span>
      <input type="number" class="dim-input dim-h" placeholder="В" min="0" value="${cd.defaultH}" data-row="${id}" />
      <span>×</span>
      <input type="number" class="dim-input dim-d" placeholder="Г" min="0" value="${cd.defaultD}" data-row="${id}" />
    </div>
    <div class="row-field">
      <label>Тип блока:</label>
      <img class="block-icon block-icon-row" src="" alt="" data-row="${id}">
      <select class="block-type-select" data-row="${id}">
        ${BLOCK_TYPES.map((t) => `<option value="${t}">${BLOCK_LABELS[t]}</option>`).join("")}
      </select>
    </div>
    <div class="row-field row-breakdown">
      <span class="breakdown-group">
        <label>Д. сундуков:</label>
        <input type="number" class="breakdown-input dc-input" placeholder="0" min="0" value="0" data-row="${id}" />
      </span>
      <span class="breakdown-group">
        <label>Шалкеров:</label>
        <input type="number" class="breakdown-input shulker-input" placeholder="0" min="0" value="0" data-row="${id}" />
      </span>
      <span class="breakdown-group">
        <label>Стаков:</label>
        <input type="number" class="breakdown-input stack-input" placeholder="0" min="0" value="0" data-row="${id}" />
      </span>
      <span class="breakdown-group">
        <label>Ост.:</label>
        <input type="number" class="breakdown-input remainder-input" placeholder="0" min="0" max="63" value="0" data-row="${id}" />
      </span>
    </div>
    <div class="row-result">
      → Уровень острова: <strong class="row-level-result" data-row="${id}">0</strong>
    </div>
  `;

  // Wire events
  const sizeSelect = row.querySelector(".island-size-select");
  const customDims = row.querySelector(".custom-dims");
  const dimW = row.querySelector(".dim-w");
  const dimH = row.querySelector(".dim-h");
  const dimD = row.querySelector(".dim-d");
  const blockSelect = row.querySelector(".block-type-select");
  const blockIcon = row.querySelector(".block-icon-row");
  const dcInput = row.querySelector(".dc-input");
  const shulkerInput = row.querySelector(".shulker-input");
  const stackInput = row.querySelector(".stack-input");
  const remainderInput = row.querySelector(".remainder-input");
  const removeBtn = row.querySelector(".row-remove-btn");

  // Update row block icon when selection changes
  const updateBlockIcon = (type) => {
    const data = CONFIG.islandCalculator.blockTypes[type];
    if (data) {
      blockIcon.src = data.icon;
      blockIcon.alt = data.label;
    }
  };
  updateBlockIcon(blockSelect.value);

  const onBreakdownChange = () => updateRow(id);
  const onSizeChange = () => {
    const isCustom = sizeSelect.value === "custom";
    customDims.classList.toggle("hidden", !isCustom);

    // Auto-fill breakdown from island volume
    const { volume } = parseIslandSize(
      sizeSelect.value,
      dimW.value,
      dimH.value,
      dimD.value
    );
    if (volume > 0) {
      const b = breakdownBlocks(volume);
      dcInput.value = b.doubleChests;
      shulkerInput.value = b.shulkers;
      stackInput.value = b.stacks;
      remainderInput.value = b.remainder;
    }
    updateRow(id);
  };

  sizeSelect.addEventListener("change", onSizeChange);
  dimW.addEventListener("input", onSizeChange);
  dimH.addEventListener("input", onSizeChange);
  dimD.addEventListener("input", onSizeChange);
  blockSelect.addEventListener("change", () => {
    updateBlockIcon(blockSelect.value);
    onBreakdownChange();
  });
  dcInput.addEventListener("input", onBreakdownChange);
  shulkerInput.addEventListener("input", onBreakdownChange);
  stackInput.addEventListener("input", onBreakdownChange);
  remainderInput.addEventListener("input", onBreakdownChange);
  removeBtn.addEventListener("click", () => removeRow(id));

  // Store DOM refs on the row element for quick access
  row._refs = { sizeSelect, customDims, dimW, dimH, dimD, blockSelect, dcInput, shulkerInput, stackInput, remainderInput, removeBtn };

  return row;
};

// ---------- Row update ----------
const updateRow = (rowId) => {
  const row = document.querySelector(`.calc-row[data-row-id="${rowId}"]`);
  if (!row) return;

  const refs = row._refs;
  const resultEl = row.querySelector(".row-level-result");

  const totalBlocks = blocksFromBreakdown(
    parseInt(refs.dcInput.value, 10) || 0,
    parseInt(refs.shulkerInput.value, 10) || 0,
    parseInt(refs.stackInput.value, 10) || 0,
    parseInt(refs.remainderInput.value, 10) || 0
  );
  const blockType = refs.blockSelect.value;
  const blockValues = getBlockValues();

  const { blocks, islandLevel } = calculateRow(totalBlocks, blockType, blockValues);

  resultEl.textContent = islandLevel > 0 ? formatNumber(islandLevel) : "0";

  updateTotal();
};

// ---------- Remove row ----------
const removeRow = (rowId) => {
  const row = document.querySelector(`.calc-row[data-row-id="${rowId}"]`);
  if (!row) return;

  const allRows = document.querySelectorAll(".calc-row");
  if (allRows.length <= 1) return;

  row.remove();
  updateTotal();
};

// ---------- Add row ----------
const addRow = () => {
  const row = createRow();
  document.getElementById("rowsContainer").appendChild(row);

  // Trigger size change to auto-fill blocks from island volume + calculate
  row._refs.sizeSelect.dispatchEvent(new Event("change"));
};

// ---------- Total calculation ----------
const updateTotal = () => {
  const totalStatsEl = document.getElementById("totalStats");
  const rows = document.querySelectorAll(".calc-row");
  let totalBlocks = 0;
  let totalIslandLevel = 0;

  for (const row of rows) {
    const refs = row._refs;
    if (!refs) continue;
    const blocks = blocksFromBreakdown(
      parseInt(refs.dcInput.value, 10) || 0,
      parseInt(refs.shulkerInput.value, 10) || 0,
      parseInt(refs.stackInput.value, 10) || 0,
      parseInt(refs.remainderInput.value, 10) || 0
    );
    const blockType = refs.blockSelect.value;
    const blockValues = getBlockValues();
    const { islandLevel } = calculateRow(blocks, blockType, blockValues);
    totalBlocks += blocks;
    totalIslandLevel += islandLevel;
  }

  totalStatsEl.textContent =
    `Всего блоков: ${formatNumber(totalBlocks)}\nВсего уровень острова: ${formatNumber(totalIslandLevel)}`;
};

// ---------- Recalculate all (triggered by settings change) ----------
const recalculateAll = () => {
  const rows = document.querySelectorAll(".calc-row");
  for (const row of rows) {
    const id = parseInt(row.dataset.rowId, 10);
    updateRow(id);
  }
};

// ---------- Build settings UI from config ----------
const buildSettings = () => {
  const container = document.getElementById("blockValuesContainer");

  for (const [key, data] of Object.entries(CONFIG.islandCalculator.blockTypes)) {
    const label = document.createElement("label");
    label.innerHTML = `<img class="block-icon" src="${data.icon}" alt=""> ${data.label}: <input id="value-${key}" type="number" value="${data.value}" step="0.01" min="0" />`;
    container.appendChild(label);

    const input = label.querySelector("input");
    valueInputs[key] = input;
    input.addEventListener("input", recalculateAll);
  }
};

// ---------- Initialise from config ----------
const init = () => {
  // Build lookup data from config
  BLOCK_TYPES = Object.keys(CONFIG.islandCalculator.blockTypes);
  for (const key of BLOCK_TYPES) {
    BLOCK_LABELS[key] = CONFIG.islandCalculator.blockTypes[key].label;
  }
  for (const preset of CONFIG.islandCalculator.islandPresets) {
    ISLAND_PRESETS[preset.key] = { w: preset.w, h: preset.h, d: preset.d };
  }

  // Build settings inputs
  buildSettings();

  // Add first row
  addRow();
};

// ---------- Load config and start ----------
fetch("../config.json")
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then((config) => {
    CONFIG = config;
    init();
  })
  .catch((err) => {
    console.error("Failed to load config.json:", err);
    document.body.innerHTML = `
      <p style="color:#f87171;padding:2rem;text-align:center;font-family:sans-serif;">
        Ошибка загрузки config.json — проверьте консоль
      </p>`;
  });
