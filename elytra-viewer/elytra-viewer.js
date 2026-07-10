const elytras = [
  { id: 'birthday', name: 'birthday elytra' },
  { id: 'christmas', name: 'christmas elytra' },
  { id: 'day_of_the_dead', name: 'day of the dead elytra' },
  { id: 'easter', name: 'easter elytra' },
  { id: 'halloween', name: 'halloween elytra' },
  { id: 'hanukkah', name: 'hanukkah elytra' },
  { id: 'new_year', name: 'new year elytra' },
  { id: 'valentine', name: 'valentine elytra' },
  { id: '2011', name: 'minecon 2011 elytra' },
  { id: '2012', name: 'minecon 2012 elytra' },
  { id: '2013', name: 'minecon 2013 elytra' },
  { id: '2015', name: 'minecon 2015 elytra' },
  { id: '2016', name: 'minecon 2016 elytra' },
  { id: '2019', name: 'minecon 2019 elytra' },
  { id: 'mojang', name: 'mojang elytra' },
  { id: 'old_mojang', name: 'old mojang elytra' },
  { id: 'bug_tracker', name: 'bug tracker elytra' },
  { id: 'cobalt', name: 'cobalt elytra' },
  { id: 'map_maker', name: 'map maker elytra' },
  { id: 'pancake', name: 'pancake elytra' },
  { id: 'scrolls', name: 'scrolls elytra' },
  { id: 'translator', name: 'crowdin translator elytra' },
  { id: 'bacon', name: 'bacon elytra' },
  { id: 'danny_bstyles', name: 'danny bstyles elytra' },
  { id: 'julian_clark', name: 'julian clark elytra' },
  { id: 'millionth_customer', name: 'millionth customer elytra' },
  { id: 'mr_messiah', name: 'mr. messiah elytra' },
  { id: 'prismarine', name: 'prismarine elytra' },
  { id: 'turtle', name: 'turtle elytra' },
  { id: 'golem', name: 'iron golem elytra' },
  { id: 'hammer', name: 'hammer elytra' },
  { id: 'hero', name: 'hero elytra' },
  { id: 'royal', name: 'royal elytra' },
  { id: 'sinister', name: 'sinister elytra' },
  { id: 'bat', name: 'bat wings' },
  { id: 'bee', name: 'bee wings' },
  { id: 'chicken', name: 'chicken wings' },
  { id: 'dragon', name: 'dragon wings' },
  { id: 'phantom', name: 'phantom wings' },
  { id: 'vex', name: 'vex wings' },
];

function render(query) {
  const gallery = document.getElementById('gallery');
  const lower = query.toLowerCase();

  gallery.innerHTML = elytras
    .filter(e => e.name.toLowerCase().includes(lower) || e.id.toLowerCase().includes(lower))
    .map(e => `
      <div class="elytra-card">
        <img src="textures/${e.id}.png" alt="${e.name}" loading="lazy" />
        <span class="card-name">${e.name}</span>
      </div>
    `).join('');
}

function init() {
  const searchInput = document.getElementById('searchInput');

  function update() {
    render(searchInput.value);
  }

  searchInput.addEventListener('input', update);
  render('');
}

document.addEventListener('DOMContentLoaded', init);
