const inputsContainer = document.getElementById("box");

const count = (input) => {
  const id = parseInt(input.id) + 1;
  const text = document.getElementById(id.toString());

  const transfer = (sponges) => {
    let amount = sponges;
    let stacks = 0;
    let shulkers = 0;
    let doubleChests = 0;

    if (amount >= 64 * 27 * 54) {
      doubleChests += Math.floor(amount / (64 * 27 * 54));
      amount -= doubleChests * 54 * 27 * 64;
    }
    if (amount >= 64 * 27) {
      shulkers += Math.floor(amount / (64 * 27));
      amount -= shulkers * 27 * 64;
    }
    if (amount >= 64) {
      stacks += Math.floor(amount / 64);
      amount -= stacks * 64;
    }

    const str = sponges * 500_000;

    let price = "";
    str
      .toString()
      .split(/(?=(?:\d{3})+$)/)
      .forEach((el) => {
        price += el + " ";
      });

    const splitNumber = (value) => {
      let string = "";
      value
        .toString()
        .split(/(?=(?:\d{3})+$)/)
        .forEach((el) => {
          string += el + " ";
        });
      return string;
    };

    const spongesString = splitNumber(sponges);
    const isLevel = splitNumber(sponges * 50);

    return `Количество: ${spongesString}. Сумма: ${price}. Уровень острова: ${isLevel}\n
Двойных сундуков: ${doubleChests}, шалкеров: ${shulkers}, стаков: ${stacks}, остаток: ${amount}`;
  };

  const sponges = (val) => {
    const lvl = parseInt(val);
    return Math.floor((4.5 * (lvl * lvl) - 162.5 * lvl + 2220) / 149720);
  };

  text.innerText = transfer(sponges(input.value));

  let allSponges = 0;
  for (inp of inputsContainer.children) {
    if (parseInt(inp.id) % 2 !== 0) continue;
    if (!inp.value) continue;

    allSponges += sponges(inp.value);

    document.getElementById("all").innerText = transfer(allSponges);
  }
};

const addInput = () => {
  let input = document.createElement("input");
  input.placeholder = "Уровень";
  input.onkeyup = function () {
    count(input);
  };
  input.id = inputsContainer.children.length.toString();
  input.type = "number";
  input.min = "200";

  let text = document.createElement("p");

  const id = inputsContainer.children.length + 1;
  text.id = id.toString();
  text.style = "display: inline-block";
  text.innerText = `Количество: 0. Сумма: 0. Уровень острова: 0\n
    Двойных сундуков: 0, шалкеров: 0, стаков: 0, остаток: 0`;

  inputsContainer.appendChild(input);
  inputsContainer.appendChild(text);

  inputsContainer.style.height = inputsContainer.offsetHeight + 30 + "%";
};

addInput();
