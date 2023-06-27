const count = () => {
  const inputsContainer = document.getElementById("inputsContainer");
  let allSponges = 0;

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

    let spongesString = "";
    sponges
      .toString()
      .split(/(?=(?:\d{3})+$)/)
      .forEach((el) => {
        spongesString += el + " ";
      });

    return `Количество: ${spongesString}. Сумма: ${price}\n
Двойных сундуков: ${doubleChests}, шалкеров: ${shulkers}, стаков: ${stacks}, остаток: ${amount}`;
  };

  const inputs = inputsContainer.children;
  for (let i = 0; i < inputs.length; i++) {
    const lvl = parseInt(inputs[i].value);

    if (!lvl || lvl < 200) {
      inputsContainer.removeChild(inputs[i]);
      continue;
    }

    const sponges = Math.floor(
      (4.5 * (lvl * lvl) - 162.5 * lvl + 2220) / 149720
    );

    allSponges += sponges;

    alert(transfer(sponges));
  }

  alert(transfer(allSponges));
};

const addInput = () => {
  const inputsContainer = document.getElementById("inputsContainer");
  let input = document.createElement("input");
  input.placeholder = "Уровень";
  inputsContainer.appendChild(input);
};
