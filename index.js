/* =============================================
   Sponge Counter — Logic
   Defaults loaded from config.json
   ============================================= */

let CONFIG = null;

const inputsContainer = document.getElementById("box");
const allStatsEl = document.getElementById("all");
const allStatsSection = document.querySelector(".allStatics");

let currentMode = "level"; // "level" | "sponges"

let rowIdCounter = 0;

const getXPFromLevel = (level) => {
    if (level <= 16) return level * level + 6 * level;
    if (level <= 31) return 2.5 * level * level - 40.5 * level + 360;
    return 4.5 * level * level - 162.5 * level + 2220;
};

const getLevelFromXP = (totalXp) => {
    const xp = Math.floor(totalXp);
    if (xp < 394) {
        const n = Math.floor((-6 + Math.sqrt(36 + 4 * xp)) / 2);
        return Math.min(n, 16);
    }
    if (xp < 1628) {
        const discriminant = 40.5 * 40.5 - 4 * 2.5 * (360 - xp);
        return Math.min(Math.floor((40.5 + Math.sqrt(discriminant)) / 5), 31);
    }
    const discriminant = 162.5 * 162.5 - 4 * 4.5 * (2220 - xp);
    return Math.floor((162.5 + Math.sqrt(discriminant)) / 9);
};

const formatNumber = (value) => {
    const str = Math.floor(value).toString();
    const parts = [];
    for (let i = str.length; i > 0; i -= 3) {
        parts.unshift(str.slice(Math.max(0, i - 3), i));
    }
    return parts.join(" ");
};

const xpLevelsInput = document.getElementById("xpLevelsInput");
const moneyInput = document.getElementById("moneyInput");
const islandInput = document.getElementById("islandInput");

const getXpPerSponge = () => {
    const val = parseInt(xpLevelsInput.value, 10);
    return val > 0 ? getXPFromLevel(val) : getXPFromLevel(CONFIG.spongeCounter.xpLevels);
};

const getMoneyPerSponge = () => {
    const val = parseInt(moneyInput.value, 10);
    return val > 0 ? val : CONFIG.spongeCounter.money;
};

const getIslandPerSponge = () => {
    const val = parseInt(islandInput.value, 10);
    return val > 0 ? val : CONFIG.spongeCounter.islandLevel;
};

const breakdownSponges = (amount) => {
    const CHEST_SLOTS = 54;
    const SHULKER_SLOTS = 27;
    const STACK_SIZE = 64;
    const DOUBLE_CHEST_CAPACITY = STACK_SIZE * SHULKER_SLOTS * CHEST_SLOTS;
    const SHULKER_CAPACITY = STACK_SIZE * SHULKER_SLOTS;

    let doubleChests = 0;
    let shulkers = 0;
    let stacks = 0;

    if (amount >= DOUBLE_CHEST_CAPACITY) {
        doubleChests = Math.floor(amount / DOUBLE_CHEST_CAPACITY);
        amount -= doubleChests * DOUBLE_CHEST_CAPACITY;
    }
    if (amount >= SHULKER_CAPACITY) {
        shulkers = Math.floor(amount / SHULKER_CAPACITY);
        amount -= shulkers * SHULKER_CAPACITY;
    }
    if (amount >= STACK_SIZE) {
        stacks = Math.floor(amount / STACK_SIZE);
        amount -= stacks * STACK_SIZE;
    }

    return {doubleChests, shulkers, stacks, remainder: amount};
};

const formatResult = (sponges) => {
    const {doubleChests, shulkers, stacks, remainder} = breakdownSponges(sponges);
    const storageLine =
        `Двойных сундуков: ${doubleChests}, шалкеров: ${shulkers}, стаков: ${stacks}, остаток: ${remainder}`;

    if (currentMode === "level") {
        const totalMoney = sponges * getMoneyPerSponge();
        const isLevel = formatNumber(sponges * getIslandPerSponge());
        return [
            `Количество: ${formatNumber(sponges)}. Сумма: ${formatNumber(totalMoney)}. Уровень острова: ${isLevel}`,
            storageLine,
        ].join("\n");
    }

    // "sponges" mode — show raw XP and XP level
    const rawXp = sponges * getXpPerSponge();
    const level = getLevelFromXP(rawXp);
    return [
        `Количество: ${formatNumber(sponges)}. Raw XP: ${formatNumber(rawXp)}. Уровень: ${level}`,
        storageLine,
    ].join("\n");
};

const defaultResult = () => {
    if (currentMode === "level") {
        return [
            "Количество: 0. Сумма: 0. Уровень острова: 0",
            "Двойных сундуков: 0, шалкеров: 0, стаков: 0, остаток: 0",
        ].join("\n");
    }
    return [
        "Количество: 0. Raw XP: 0. Уровень: 0",
        "Двойных сундуков: 0, шалкеров: 0, стаков: 0, остаток: 0",
    ].join("\n");
};

const spongesFromLevel = (level) => {
    const lvl = parseInt(level, 10);
    if (!lvl || lvl < 0) return 0;
    return Math.floor((4.5 * lvl * lvl - 162.5 * lvl + 2220) / getXpPerSponge());
};

const getSpongesFromInput = (value) => {
    const num = parseInt(value, 10);
    if (!num || num < 0) return 0;
    if (currentMode === "level") {
        return spongesFromLevel(num);
    }
    // "sponges" mode — value is already sponge count
    return num;
};

// ---------- Total recalculation across all rows ----------
const updateTotal = () => {
    let allSponges = 0;
    for (const row of inputsContainer.children) {
        if (!row.classList.contains("calc-row")) continue;
        const inp = row.querySelector("input");
        if (!inp || !inp.value) continue;
        allSponges += getSpongesFromInput(inp.value);
    }
    allStatsEl.textContent = formatResult(allSponges);
};

// ---------- Single row calculation ----------
const count = (row) => {
    const input = row.querySelector("input");
    const text = row.querySelector(".row-level-result");
    if (!input || !text) return;

    const sponges = getSpongesFromInput(input.value);
    text.textContent = formatResult(sponges);

    updateTotal();
};

// ---------- Remove row ----------
const removeRow = (rowId) => {
    const row = document.querySelector(`.calc-row[data-row-id="${rowId}"]`);
    if (!row) return;

    const allRows = inputsContainer.querySelectorAll(".calc-row");
    if (allRows.length <= 1) return;

    row.remove();
    updateTotal();
};

// ---------- Add row ----------
const addInput = () => {
    const id = rowIdCounter++;
    const placeholder = currentMode === "level" ? "Уровень" : "Губок";

    const row = document.createElement("div");
    row.className = "calc-row";
    row.dataset.rowId = id;

    row.innerHTML = `
        <button class="row-remove-btn" data-row="${id}" title="Удалить строку">✕</button>
        <div class="row-field">
            <label><img class="block-icon" src="images/sponge.png" alt=""></label>
            <input type="number" placeholder="${placeholder}" min="0" />
        </div>
        <div class="row-result">
            <span class="row-level-result">${defaultResult().replace(/\n/g, "<br>")}</span>
        </div>
    `;

    const input = row.querySelector("input");
    const text = row.querySelector(".row-level-result");
    const removeBtn = row.querySelector(".row-remove-btn");

    input.addEventListener("input", () => count(row));
    removeBtn.addEventListener("click", () => removeRow(id));

    // Store refs
    row._refs = { input, text, removeBtn };

    inputsContainer.appendChild(row);
};

const recalculateAll = () => {
    for (const row of inputsContainer.children) {
        if (!row.classList.contains("calc-row")) continue;
        count(row);
    }
};

xpLevelsInput.oninput = moneyInput.oninput = islandInput.oninput = () => {
    recalculateAll();
};

// ---------- Mode switching ----------

const switchMode = (mode) => {
    if (mode === currentMode) return;
    currentMode = mode;

    // Update button states
    document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Update section legend
    const legend = allStatsSection?.querySelector("legend");
    if (legend) {
        legend.innerHTML =
            mode === "level"
                ? "<strong>Общая статистика (по уровню)</strong>"
                : "<strong>Общая статистика (по губкам)</strong>";
    }

    // Clear and rebuild rows
    inputsContainer.innerHTML = "";
    rowIdCounter = 0;
    addInput();
    allStatsEl.textContent = defaultResult();
};

// ---------- Initialise from config ----------
const init = () => {
    xpLevelsInput.value = CONFIG.spongeCounter.xpLevels;
    moneyInput.value = CONFIG.spongeCounter.money;
    islandInput.value = CONFIG.spongeCounter.islandLevel;

    addInput();
};

// ---------- Load config and start ----------
fetch("config.json")
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
    });
