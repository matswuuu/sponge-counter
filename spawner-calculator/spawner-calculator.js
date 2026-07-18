/* =============================================
   Spawner Calculator — Logic
   Defaults loaded from config.json
   ============================================= */

let CONFIG = null;
let FRAGMENT_TYPES = [];
let SPAWNERS = [];

let customFragmentCounter = 0;
let customSpawnerCounter = 0;

const fragmentLabelInputs = {};
const fragmentElements = {};
const spawnerMoneyInputs = {};
const spawnerFragmentInputs = {};
const spawnerElements = {};

let quantityRemainder = 0;
let suppressSync = false;

// ---------- Breakdown constants ----------
const CHEST_SLOTS = 54;
const SHULKER_SLOTS = 27;
const STACK_SIZE = 64;
const DC_CAPACITY = STACK_SIZE * SHULKER_SLOTS * CHEST_SLOTS;
const SHULKER_CAPACITY = STACK_SIZE * SHULKER_SLOTS;

// ---------- Breakdown helpers ----------
const breakdownFragments = (amount) => {
  let remaining = Math.floor(amount);
  const doubleChests = Math.floor(remaining / DC_CAPACITY);
  remaining -= doubleChests * DC_CAPACITY;
  const shulkers = Math.floor(remaining / SHULKER_CAPACITY);
  remaining -= shulkers * SHULKER_CAPACITY;
  const stacks = Math.floor(remaining / STACK_SIZE);
  remaining -= stacks * STACK_SIZE;
  return { doubleChests, shulkers, stacks, remainder: remaining };
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

// ---------- Get current data from inputs ----------
const getFragmentTypes = () => {
  return FRAGMENT_TYPES.map((ft) => ({
    key: ft.key,
    label: fragmentLabelInputs[ft.key]?.value || ft.label,
  }));
};

const getSpawners = () => {
  return SPAWNERS.map((sp) => {
    const fragments = {};
    for (const ft of FRAGMENT_TYPES) {
      const val = parseInt(spawnerFragmentInputs[sp.key]?.[ft.key]?.value, 10);
      fragments[ft.key] = !isNaN(val) && val >= 0 ? val : 0;
    }
    const moneyRaw = parseInt(spawnerMoneyInputs[sp.key]?.value, 10);
    return {
      key: sp.key,
      label: sp.label,
      money: !isNaN(moneyRaw) && moneyRaw >= 0 ? moneyRaw : 0,
      fragments,
    };
  });
};

// ---------- Fragment type DOM ----------
const createFragmentTypeElement = (ft) => {
  const wrapper = document.createElement("div");
  wrapper.className = "fragment-type-item";
  wrapper.dataset.key = ft.key;

  const input = document.createElement("input");
  input.type = "text";
  input.value = ft.label;
  input.style.width = "200px";

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.title = "Удалить тип осколка";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => removeFragmentType(ft.key));

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);

  fragmentLabelInputs[ft.key] = input;
  fragmentElements[ft.key] = wrapper;

  input.addEventListener("input", () => {
    updateSpawnerSelectOptions();
    updateSpawnerPresetLabels();
    recalculate();
  });

  return wrapper;
};

const buildFragmentTypeSettings = () => {
  const container = document.getElementById("fragmentTypesContainer");
  container.innerHTML = "";
  for (const ft of FRAGMENT_TYPES) {
    container.appendChild(createFragmentTypeElement(ft));
  }
};

const addFragmentType = () => {
  customFragmentCounter++;
  const key = `custom_${customFragmentCounter}`;
  const ft = { key, label: `Осколок ${customFragmentCounter}` };
  FRAGMENT_TYPES.push(ft);

  const container = document.getElementById("fragmentTypesContainer");
  container.appendChild(createFragmentTypeElement(ft));

  for (const sp of SPAWNERS) {
    addFragmentInputToSpawner(sp.key, ft.key, 0);
  }

  updateSpawnerSelectOptions();
  recalculate();
};

const removeFragmentType = (key) => {
  if (FRAGMENT_TYPES.length <= 1) return;

  FRAGMENT_TYPES = FRAGMENT_TYPES.filter((ft) => ft.key !== key);

  const el = fragmentElements[key];
  if (el) el.remove();
  delete fragmentElements[key];
  delete fragmentLabelInputs[key];

  for (const sp of SPAWNERS) {
    if (spawnerFragmentInputs[sp.key]?.[key]) {
      spawnerFragmentInputs[sp.key][key].remove();
      const label = spawnerElements[sp.key]?.fragmentLabels?.[key];
      if (label) label.remove();
      delete spawnerFragmentInputs[sp.key][key];
      delete spawnerElements[sp.key]?.fragmentLabels?.[key];
    }
  }

  updateSpawnerSelectOptions();
  recalculate();
};

// ---------- Spawner DOM ----------
const createSpawnerPresetRow = (sp) => {
  const row = document.createElement("div");
  row.className = "spawner-preset-row";
  row.dataset.key = sp.key;

  const header = document.createElement("div");
  header.className = "spawner-header";

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn row-remove-btn";
  removeBtn.title = "Удалить спавнер";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => removeSpawner(sp.key));

  const label = document.createElement("input");
  label.type = "text";
  label.value = sp.label;
  label.className = "spawner-name-input";

  const moneyInput = document.createElement("input");
  moneyInput.type = "number";
  moneyInput.min = "0";
  moneyInput.value = sp.money;
  moneyInput.placeholder = "Деньги";

  header.appendChild(removeBtn);
  header.appendChild(label);
  header.appendChild(moneyInput);

  const fragmentsContainer = document.createElement("div");
  fragmentsContainer.className = "spawner-fragments";

  row.appendChild(header);
  row.appendChild(fragmentsContainer);

  spawnerMoneyInputs[sp.key] = moneyInput;
  moneyInput.addEventListener("input", recalculate);

  spawnerElements[sp.key] = { row, label, fragmentLabels: {} };
  spawnerFragmentInputs[sp.key] = {};

  label.addEventListener("input", () => {
    updateSpawnerSelectOptions();
    recalculate();
  });

  for (const ft of FRAGMENT_TYPES) {
    addFragmentInputToSpawner(sp.key, ft.key, sp.fragments?.[ft.key] || 0, fragmentsContainer);
  }

  return row;
};

const addFragmentInputToSpawner = (spKey, fragKey, value, container) => {
  const target = container || spawnerElements[spKey]?.row.querySelector(".spawner-fragments");
  if (!target) return;

  const fragRow = document.createElement("div");
  fragRow.className = "spawner-fragment-row";

  const fragLabel = document.createElement("span");
  fragLabel.className = "preset-field-label";
  const ft = FRAGMENT_TYPES.find((f) => f.key === fragKey);
  fragLabel.textContent = ft?.label || fragKey;

  const fragInput = document.createElement("input");
  fragInput.type = "number";
  fragInput.min = "0";
  fragInput.value = value;

  fragRow.appendChild(fragLabel);
  fragRow.appendChild(fragInput);
  target.appendChild(fragRow);

  spawnerFragmentInputs[spKey][fragKey] = fragInput;
  if (!spawnerElements[spKey]) spawnerElements[spKey] = { fragmentLabels: {} };
  spawnerElements[spKey].fragmentLabels[fragKey] = fragLabel;

  fragInput.addEventListener("input", recalculate);
};

const buildSpawnerPresets = () => {
  const container = document.getElementById("spawnerPresetsContainer");
  container.innerHTML = "";
  for (const sp of SPAWNERS) {
    container.appendChild(createSpawnerPresetRow(sp));
  }
};

const rebuildAllSpawnerRows = () => {
  const container = document.getElementById("spawnerPresetsContainer");
  container.innerHTML = "";

  spawnerMoneyInputs.length = 0;
  for (const sp of SPAWNERS) {
    const spData = SPAWNERS.find((s) => s.key === sp.key);
    container.appendChild(createSpawnerPresetRow(spData));
  }
};

const addSpawner = () => {
  customSpawnerCounter++;
  const key = `custom_spawner_${customSpawnerCounter}`;
  const sp = { key, label: `Спавнер ${customSpawnerCounter}`, money: 0, fragments: {} };
  SPAWNERS.push(sp);

  const container = document.getElementById("spawnerPresetsContainer");
  container.appendChild(createSpawnerPresetRow(sp));

  const select = document.getElementById("spawnerSelect");
  const option = document.createElement("option");
  option.value = key;
  option.textContent = sp.label;
  select.appendChild(option);

  recalculate();
};

const removeSpawner = (key) => {
  if (SPAWNERS.length <= 1) return;

  SPAWNERS = SPAWNERS.filter((sp) => sp.key !== key);

  const el = spawnerElements[key]?.row;
  if (el) el.remove();
  delete spawnerElements[key];
  delete spawnerMoneyInputs[key];
  delete spawnerFragmentInputs[key];

  const select = document.getElementById("spawnerSelect");
  for (const opt of [...select.options]) {
    if (opt.value === key) {
      opt.remove();
      break;
    }
  }

  if (select.value === key && select.options.length > 0) {
    select.value = select.options[0].value;
  }

  recalculate();
};

// ---------- Spawner select ----------
const buildSpawnerSelect = () => {
  const select = document.getElementById("spawnerSelect");
  for (const sp of SPAWNERS) {
    const option = document.createElement("option");
    option.value = sp.key;
    option.textContent = sp.label;
    select.appendChild(option);
  }
};

const updateSpawnerSelectOptions = () => {
  const select = document.getElementById("spawnerSelect");
  const spawners = getSpawners();
  for (let i = 0; i < select.options.length; i++) {
    select.options[i].textContent = spawners[i]?.label || "";
  }
};

const updateSpawnerPresetLabels = () => {
  const fragmentTypes = getFragmentTypes();
  for (const sp of SPAWNERS) {
    const elements = spawnerElements[sp.key];
    if (!elements) continue;
    for (const ft of fragmentTypes) {
      const label = elements.fragmentLabels?.[ft.key];
      if (label) label.textContent = ft.label;
    }
  }
};

// ---------- Quantity breakdown sync ----------
const onQuantityChange = () => {
  if (suppressSync) return;
  suppressSync = true;

  const quantityInput = document.getElementById("quantityInput");
  const dcInput = document.getElementById("dcInput");
  const shulkerInput = document.getElementById("shulkerInput");
  const stackInput = document.getElementById("stackInput");

  const qty = parseInt(quantityInput.value, 10) || 0;
  const b = breakdownFragments(qty);

  dcInput.value = b.doubleChests || "";
  shulkerInput.value = b.shulkers || "";
  stackInput.value = b.stacks || "";
  quantityRemainder = b.remainder;

  suppressSync = false;
  recalculate();
};

const onBreakdownChange = () => {
  if (suppressSync) return;
  suppressSync = true;

  const quantityInput = document.getElementById("quantityInput");
  const dcInput = document.getElementById("dcInput");
  const shulkerInput = document.getElementById("shulkerInput");
  const stackInput = document.getElementById("stackInput");

  const dc = parseInt(dcInput.value, 10) || 0;
  const shulkers = parseInt(shulkerInput.value, 10) || 0;
  const stacks = parseInt(stackInput.value, 10) || 0;

  const total = dc * DC_CAPACITY + shulkers * SHULKER_CAPACITY + stacks * STACK_SIZE + quantityRemainder;
  quantityInput.value = total || "";

  suppressSync = false;
  recalculate();
};

// ---------- Calculate and display results ----------
const recalculate = () => {
  const container = document.getElementById("resultsContainer");
  const select = document.getElementById("spawnerSelect");
  const quantityInput = document.getElementById("quantityInput");

  const spawners = getSpawners();
  const fragmentTypes = getFragmentTypes();
  const selectedKey = select.value;
  const quantity = parseInt(quantityInput.value, 10) || 0;

  if (quantity <= 0 || !selectedKey) {
    container.innerHTML = '<p class="result-placeholder">Выберите спавнер и количество</p>';
    return;
  }

  const spawner = spawners.find((s) => s.key === selectedKey);
  if (!spawner) {
    container.innerHTML = '<p class="result-placeholder">Спавнер не найден</p>';
    return;
  }

  const totalMoney = spawner.money * quantity;
  let html = "";

  html += `<div class="result-block">`;
  html += `<div class="result-label">Деньги:</div>`;
  html += `<div class="result-value">${formatNumber(totalMoney)}</div>`;
  html += `</div>`;

  for (const ft of fragmentTypes) {
    const perUnit = spawner.fragments[ft.key] || 0;
    if (perUnit <= 0) continue;

    const totalFragments = perUnit * quantity;
    const b = breakdownFragments(totalFragments);

    html += `<div class="result-block">`;
    html += `<div class="result-label">${ft.label}:</div>`;
    html += `<div class="result-value">${formatNumber(totalFragments)} шт.</div>`;
    html += `<div class="result-breakdown">`;
    html += `Д. сундуков шалкеров: ${formatNumber(b.doubleChests)}, `;
    html += `шалкеров: ${formatNumber(b.shulkers)}, `;
    html += `стаков: ${formatNumber(b.stacks)}, `;
    html += `остаток: ${b.remainder}`;
    html += `</div>`;
    html += `</div>`;
  }

  container.innerHTML = html;
};

// ---------- Initialise from config ----------
const init = () => {
  FRAGMENT_TYPES = CONFIG.spawnerCalculator.fragmentTypes;
  SPAWNERS = CONFIG.spawnerCalculator.spawners;

  buildFragmentTypeSettings();
  buildSpawnerPresets();
  buildSpawnerSelect();

   document.getElementById("spawnerSelect").addEventListener("change", recalculate);
  document.getElementById("quantityInput").addEventListener("input", onQuantityChange);
  document.getElementById("dcInput").addEventListener("input", onBreakdownChange);
  document.getElementById("shulkerInput").addEventListener("input", onBreakdownChange);
  document.getElementById("stackInput").addEventListener("input", onBreakdownChange);
  document.getElementById("addFragmentTypeBtn").addEventListener("click", addFragmentType);
  document.getElementById("addSpawnerBtn").addEventListener("click", addSpawner);

  recalculate();
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
