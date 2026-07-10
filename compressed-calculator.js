const CHEST_SLOTS = 54;
const SHULKER_SLOTS = 27;
const STACK_SIZE = 64;
const DC_CAPACITY = STACK_SIZE * SHULKER_SLOTS * CHEST_SLOTS;
const SHULKER_CAPACITY = STACK_SIZE * SHULKER_SLOTS;

const formatNumber = (value) => {
  const str = Math.floor(value).toString();
  const parts = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  return parts.join(" ");
};

const breakdown = (amount) => {
  let remaining = amount;
  const doubleChests = Math.floor(remaining / DC_CAPACITY);
  remaining -= doubleChests * DC_CAPACITY;
  const shulkers = Math.floor(remaining / SHULKER_CAPACITY);
  remaining -= shulkers * SHULKER_CAPACITY;
  const stacks = Math.floor(remaining / STACK_SIZE);
  remaining -= stacks * STACK_SIZE;
  return { doubleChests, shulkers, stacks, remainder: remaining };
};

const formatBreakdown = (b) =>
  `Двойных сундуков: ${b.doubleChests}, шалкеров: ${b.shulkers}, стаков: ${b.stacks}, остаток: ${b.remainder}`;

const countInput = document.getElementById("countInput");
const tierSelect = document.getElementById("tierSelect");
const resultsBody = document.getElementById("resultsBody");

const MAX_TIER = 10;

for (let t = 1; t <= MAX_TIER; t++) {
  const opt = document.createElement("option");
  opt.value = t;
  opt.textContent = `x${t}`;
  tierSelect.appendChild(opt);
}
tierSelect.value = 1;

const calculate = () => {
  const count = parseInt(countInput.value, 10) || 0;
  const tier = parseInt(tierSelect.value, 10);

  resultsBody.innerHTML = "";

  if (count <= 0) return;

  let amount = count;

  for (let t = tier; t >= 1; t--) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="tier-label">x${t}</td>
      <td class="tier-count">${formatNumber(amount)}</td>
    `;
    resultsBody.appendChild(tr);
    amount *= 9;
  }

  const b = breakdown(amount);
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="tier-label">Обычные</td>
    <td class="tier-count">${formatNumber(amount)}<br><span class="breakdown-text">${formatBreakdown(b)}</span></td>
  `;
  resultsBody.appendChild(tr);
};

countInput.addEventListener("input", calculate);
tierSelect.addEventListener("change", calculate);
