const stationSelect = document.getElementById('station-select');
const bikeCount = document.getElementById('bike-count');
const dockCount = document.getElementById('dock-count');
const stationStatus = document.getElementById('station-status');
const stationName = document.getElementById('station-name');
const stationMeta = document.getElementById('station-meta');

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    const stations = await response.json();

    stationSelect.innerHTML = '';

    if (!Array.isArray(stations) || stations.length === 0) {
      stationSelect.innerHTML = '<option value="">Aucune station disponible</option>';
      return;
    }

    stations.forEach((station) => {
      const option = document.createElement('option');
      option.value = station.id;
      option.textContent = station.name;
      stationSelect.appendChild(option);
    });

    stationSelect.value = stations[0].id;
    loadStationDetails(stations[0].id);
  } catch (error) {
    stationSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    console.error('Unable to load stations:', error);
  }
}

async function loadStationDetails(stationId) {
  try {
    const response = await fetch(`/api/stations/${stationId}`);
    const station = await response.json();

    if (!station) {
      return;
    }

    const bikes = station.bikes_available ?? 0;
    const docks = station.docks_available ?? 0;
    const status = station.status || 'open';

    bikeCount.textContent = bikes;
    dockCount.textContent = docks;
    stationStatus.textContent = status;
    stationName.textContent = station.name || 'Station';
    stationMeta.textContent = `ID: ${station.id} • ${bikes} vélos disponibles • ${docks} places libres`;
  } catch (error) {
    console.error('Unable to load station details:', error);
  }
}

stationSelect.addEventListener('change', (event) => {
  const selectedStationId = event.target.value;
  if (selectedStationId) {
    loadStationDetails(selectedStationId);
  }
});

loadStations();
