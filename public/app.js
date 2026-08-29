const stationSelect = document.getElementById('station-select');
const stationSearch = document.getElementById('station-search');
const bikeCount = document.getElementById('bike-count');
const ebikeCount = document.getElementById('ebike-count');
const regularBikeCount = document.getElementById('regular-bike-count');
const stationStatus = document.getElementById('station-status');
const stationName = document.getElementById('station-name');
const stationMeta = document.getElementById('station-meta');
const favoriteToggle = document.getElementById('favorite-toggle');
const favoriteList = document.getElementById('favorite-list');

let allStations = [];
let favorites = JSON.parse(localStorage.getItem('bixtrak-favorites') || '[]');

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
}

function renderStationOptions(filteredStations = allStations) {
  stationSelect.innerHTML = '<option value="">Choisir une station</option>';

  if (!Array.isArray(filteredStations) || filteredStations.length === 0) {
    stationSelect.innerHTML = '<option value="">Aucune station trouvée</option>';
    updateFavoriteButton('');
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
    const ebikes = Number(station.ebikes_available ?? station.num_ebikes_available ?? 0);
    const regularBikes = Number(
      station.regular_bikes_available ?? Math.max(0, bikes - ebikes)
    );
    const status = station.status || 'open';

    bikeCount.textContent = bikes;
    ebikeCount.textContent = ebikes;
    regularBikeCount.textContent = regularBikes;
    stationStatus.textContent = status;
    stationName.textContent = station.name || 'Station';
    stationMeta.textContent = `ID: ${station.id} • ${bikes} vélos disponibles • ${ebikes} électriques • ${regularBikes} réguliers`;
    updateFavoriteButton(station.id);
  } catch (error) {
    console.error('Unable to load station details:', error);
  }
}

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

stationSelect.addEventListener('change', (event) => {
  const selectedStationId = event.target.value;
  if (selectedStationId) {
    loadStationDetails(selectedStationId);
  }
});

favoriteToggle.addEventListener('click', () => {
  if (stationSelect.value) {
    toggleFavorite(stationSelect.value);
  }
});

renderFavorites();
loadStations();
