const stationSelect = document.getElementById('station-select');
const stationSearch = document.getElementById('station-search');
const stationList = document.getElementById('station-list');
const dockCount = document.getElementById('dock-count');
const ebikeCount = document.getElementById('ebike-count');
const regularBikeCount = document.getElementById('regular-bike-count');
const stationStatus = document.getElementById('station-status');
const stationName = document.getElementById('station-name');
const stationMeta = document.getElementById('station-meta');
const favoriteToggle = document.getElementById('favorite-toggle');
const favoriteList = document.getElementById('favorite-list');
const themeToggle = document.getElementById('theme-toggle');
const navSearch = document.getElementById('nav-search');
const navItems = document.querySelectorAll('.nav-item');
const stationsSheet = document.getElementById('stations-sheet');
const sheetBackdrop = document.getElementById('sheet-backdrop');
const closeStations = document.getElementById('close-stations');

let allStations = [];
let favorites = [];

try {
  const storedFavorites = JSON.parse(localStorage.getItem('bixtrak-favorites') || '[]');
  favorites = Array.isArray(storedFavorites) ? storedFavorites : [];
} catch (error) {
  favorites = [];
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('theme-light', !isDark);
  document.body.classList.toggle('theme-dark', isDark);
  if (themeToggle) {
    themeToggle.innerHTML = isDark
      ? `
        <svg class="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 2.75a.8.8 0 0 1 .8.8V4.5a.8.8 0 0 1-1.6 0v-1a.8.8 0 0 1 .8-.75Zm0 16.5a.8.8 0 0 1 .8.8v1a.8.8 0 0 1-1.6 0v-1a.8.8 0 0 1 .8-.8Zm9.25-8.25a.8.8 0 0 1 0 1.6h-1a.8.8 0 0 1 0-1.6h1Zm-16.5 0a.8.8 0 0 1 0 1.6h-1a.8.8 0 0 1 0-1.6h1Zm13.27-4.52a.8.8 0 0 1 1.13 0l.7.7a.8.8 0 1 1-1.13 1.13l-.7-.7a.8.8 0 0 1 0-1.13Zm-10.04 10.04a.8.8 0 0 1 1.13 0l.7.7a.8.8 0 0 1-1.13 1.13l-.7-.7a.8.8 0 0 1 0-1.13Zm0-10.04a.8.8 0 0 1 0 1.13l-.7.7A.8.8 0 0 1 3.88 7.9l.7-.7a.8.8 0 0 1 1.13 0Zm10.04 10.04a.8.8 0 0 1 0 1.13l-.7.7a.8.8 0 0 1-1.13-1.13l.7-.7a.8.8 0 0 1 1.13 0ZM12 7.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Z" />
        </svg>`
      : `
        <svg class="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.2 14.55A7.5 7.5 0 0 1 9.45 3.8a.9.9 0 0 0-1.1-1.1A9.5 9.5 0 1 0 21.3 15.65a.9.9 0 0 0-1.1-1.1Z" />
        </svg>`;
    themeToggle.setAttribute('aria-label', isDark ? 'Activer le mode jour' : 'Activer le mode sombre');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('bixtrak-theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('theme-light') ? 'dark' : 'light';
  localStorage.setItem('bixtrak-theme', nextTheme);
  applyTheme(nextTheme);
}

function normalizeFavorites() {
  favorites = Array.from(new Set(favorites.map(String)));
  localStorage.setItem('bixtrak-favorites', JSON.stringify(favorites));
}

function isFavorite(stationId) {
  return favorites.includes(String(stationId));
}

function saveFavorites() {
  normalizeFavorites();
}

function updateFavoriteButton(stationId) {
  if (!favoriteToggle) {
    return;
  }

  if (!stationId) {
    favoriteToggle.disabled = true;
    favoriteToggle.textContent = 'Ajouter aux favoris';
    return;
  }

  favoriteToggle.disabled = false;
  favoriteToggle.textContent = isFavorite(stationId)
    ? 'Retirer des favoris'
    : 'Ajouter aux favoris';
}

function renderFavorites() {
  if (!favoriteList) {
    return;
  }

  favoriteList.innerHTML = '';

  if (!favorites.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Aucun favori pour le moment.';
    favoriteList.appendChild(emptyItem);
    return;
  }

  const stationMap = new Map(allStations.map((station) => [String(station.id), station]));

  favorites.forEach((favoriteId) => {
    const station = stationMap.get(String(favoriteId));
    const item = document.createElement('li');
    item.className = 'favorite-item';

    const stationButton = document.createElement('button');
    stationButton.type = 'button';
    stationButton.className = 'favorite-name';
    stationButton.textContent = station ? station.name : `Station ${favoriteId}`;
    stationButton.addEventListener('click', () => {
      stationSelect.value = String(favoriteId);
      loadStationDetails(String(favoriteId));
      setActiveNav('home-section');
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'favorite-remove';
    removeButton.textContent = '×';
    removeButton.setAttribute('aria-label', `Retirer ${station ? station.name : favoriteId} des favoris`);
    removeButton.addEventListener('click', () => toggleFavorite(String(favoriteId)));

    item.appendChild(stationButton);
    item.appendChild(removeButton);
    favoriteList.appendChild(item);
  });
}

function setActiveNav(targetId) {
  navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.target === targetId));

  const favoritesSection = document.getElementById('favorites-section');
  const homeSection = document.getElementById('home-section');
  if (favoritesSection) {
    favoritesSection.classList.toggle('is-visible', targetId === 'favorites-section');
  }
  if (homeSection) {
    homeSection.classList.toggle('is-hidden', targetId === 'favorites-section');
  }
}

function closeStationsSheet() {
  if (!stationsSheet || !sheetBackdrop) {
    return;
  }

  stationsSheet.classList.remove('is-open');
  stationsSheet.setAttribute('aria-hidden', 'true');
  sheetBackdrop.hidden = true;
  document.body.classList.remove('sheet-open');
}

function openStationsSheet() {
  if (!stationsSheet || !sheetBackdrop) {
    return;
  }

  stationsSheet.classList.add('is-open');
  stationsSheet.setAttribute('aria-hidden', 'false');
  sheetBackdrop.hidden = false;
  document.body.classList.add('sheet-open');
  window.setTimeout(() => stationSearch.focus(), 250);
}

function renderStationList(filteredStations = allStations) {
  if (!stationList) {
    return;
  }

  stationList.innerHTML = '';

  if (!Array.isArray(filteredStations) || filteredStations.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Aucune station trouvée.';
    stationList.appendChild(emptyItem);
    return;
  }

  filteredStations.forEach((station) => {
    const item = document.createElement('li');
    item.className = 'station-list-item';
    item.classList.toggle('is-selected', String(station.id) === String(stationSelect.value));

    const stationButton = document.createElement('button');
    stationButton.type = 'button';
    stationButton.className = 'station-select-button';
    stationButton.innerHTML = `<strong>${station.name}</strong><span>ID ${station.id}</span>`;
    stationButton.addEventListener('click', () => {
      stationSelect.value = String(station.id);
      loadStationDetails(String(station.id));
      closeStationsSheet();
      setActiveNav('home-section');
      renderStationList(filteredStations);
    });

    const favoriteButton = document.createElement('button');
    favoriteButton.type = 'button';
    favoriteButton.className = `station-favorite-button${isFavorite(station.id) ? ' is-favorite' : ''}`;
    favoriteButton.textContent = isFavorite(station.id) ? '★' : '☆';
    favoriteButton.setAttribute('aria-label', isFavorite(station.id)
      ? `Retirer ${station.name} des favoris`
      : `Ajouter ${station.name} aux favoris`);
    favoriteButton.addEventListener('click', () => toggleFavorite(String(station.id)));

    item.appendChild(stationButton);
    item.appendChild(favoriteButton);
    stationList.appendChild(item);
  });
}

function toggleFavorite(stationId) {
  const normalizedId = String(stationId);

  if (!normalizedId) {
    return;
  }

  if (isFavorite(normalizedId)) {
    favorites = favorites.filter((id) => String(id) !== normalizedId);
  } else {
    favorites.push(normalizedId);
  }

  saveFavorites();
  renderFavorites();
  updateFavoriteButton(stationSelect.value);
  renderStationList();
}

function renderStationOptions(filteredStations = allStations) {
  stationSelect.innerHTML = '<option value="">Choisir une station</option>';

  if (!Array.isArray(filteredStations) || filteredStations.length === 0) {
    stationSelect.innerHTML = '<option value="">Aucune station trouvée</option>';
    updateFavoriteButton('');
    renderStationList(filteredStations);
    return;
  }

  filteredStations.forEach((station) => {
    const option = document.createElement('option');
    option.value = String(station.id);
    option.textContent = station.name;
    stationSelect.appendChild(option);
  });

  if (!stationSelect.value || !filteredStations.some((station) => String(station.id) === String(stationSelect.value))) {
    stationSelect.value = String(filteredStations[0].id);
  }

  updateFavoriteButton(stationSelect.value);
  renderStationList(filteredStations);
}

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    const stations = await response.json();

    allStations = Array.isArray(stations) ? stations : [];

    if (allStations.length === 0) {
      stationSelect.innerHTML = '<option value="">Aucune station disponible</option>';
      updateFavoriteButton('');
      return;
    }

    const query = stationSearch.value.trim().toLowerCase();
    const filteredStations = query
      ? allStations.filter((station) =>
          String(station.name || '').toLowerCase().includes(query)
        )
      : allStations;

    renderStationOptions(filteredStations);
    loadStationDetails(stationSelect.value);
    renderFavorites();
  } catch (error) {
    stationSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    console.error('Unable to load stations:', error);
  }
}

async function loadStationDetails(stationId) {
  if (!stationId) {
    updateFavoriteButton('');
    return;
  }

  try {
    const response = await fetch(`/api/stations/${stationId}`);
    const station = await response.json();

    if (!station) {
      updateFavoriteButton('');
      return;
    }

    const bikes = Number(station.bikes_available ?? 0);
    const docks = Number(station.docks_available ?? 0);
    const ebikes = Number(station.ebikes_available ?? station.num_ebikes_available ?? 0);
    const regularBikes = Number(
      station.regular_bikes_available ?? Math.max(0, bikes - ebikes)
    );
    const status = station.status || 'open';
    const statusLabel = status === 'open' ? 'Ouvert' : status === 'closed' ? 'Fermé' : 'Indisponible';

    dockCount.textContent = docks;
    ebikeCount.textContent = ebikes;
    regularBikeCount.textContent = regularBikes;
    stationStatus.textContent = `Statut : ${statusLabel}`;
    stationStatus.dataset.status = status === 'open' ? 'open' : status === 'closed' ? 'closed' : 'unknown';
    stationName.textContent = station.name || 'Station';
    stationMeta.textContent = `ID: ${station.id} • ${bikes} vélos disponibles • ${ebikes} électriques • ${regularBikes} réguliers`;
    updateFavoriteButton(station.id);
  } catch (error) {
    console.error('Unable to load station details:', error);
  }
}

if (stationSearch) {
  stationSearch.addEventListener('input', () => {
  const query = stationSearch.value.trim().toLowerCase();
  const filteredStations = query
    ? allStations.filter((station) =>
        String(station.name || '').toLowerCase().includes(query)
      )
    : allStations;

  renderStationOptions(filteredStations);

  if (stationSelect.value) {
    loadStationDetails(stationSelect.value);
  }
  });
}

if (stationSelect) {
  stationSelect.addEventListener('change', (event) => {
  const selectedStationId = event.target.value;
  if (selectedStationId) {
    loadStationDetails(selectedStationId);
  }
  });
}

if (favoriteToggle) {
  favoriteToggle.addEventListener('click', () => {
    if (stationSelect && stationSelect.value) {
      toggleFavorite(stationSelect.value);
    }
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

navItems.forEach((navItem) => {
  navItem.addEventListener('click', () => {
    const target = document.getElementById(navItem.dataset.target);
    if (navItem.dataset.target === 'stations-section') {
      setActiveNav('stations-section');
      openStationsSheet();
      return;
    }

    if (target) {
      setActiveNav(navItem.dataset.target);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

if (navSearch) {
  navSearch.addEventListener('click', () => {
    setActiveNav('stations-section');
    openStationsSheet();
  });
}

if (closeStations) {
  closeStations.addEventListener('click', closeStationsSheet);
}

if (sheetBackdrop) {
  sheetBackdrop.addEventListener('click', closeStationsSheet);
}

initTheme();
renderFavorites();
renderStationList();
loadStations();
