const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4236;

const sampleStations = [
  {
    id: 'station-1',
    name: 'Place des Arts',
    bikes_available: 12,
    docks_available: 7,
    status: 'open',
    latitude: 45.5017,
    longitude: -73.5673
  },
  {
    id: 'station-2',
    name: 'McGill / Rue de la Montagne',
    bikes_available: 8,
    docks_available: 11,
    status: 'open',
    latitude: 45.5031,
    longitude: -73.5737
  },
  {
    id: 'station-3',
    name: 'Parc du Mont-Royal',
    bikes_available: 4,
    docks_available: 18,
    status: 'open',
    latitude: 45.5244,
    longitude: -73.5873
  }
];

function normalizeStation(rawStation) {
  return {
    id: rawStation.id || rawStation.station_id || rawStation.stationId || rawStation.name,
    name: rawStation.name || rawStation.station_name || 'Station inconnue',
    bikes_available:
      rawStation.bikes_available ??
      rawStation.available_bikes ??
      rawStation.nb_bikes_available ??
      0,
    docks_available:
      rawStation.docks_available ??
      rawStation.available_docks ??
      rawStation.nb_docks_available ??
      0,
    status: rawStation.status || rawStation.state || 'open',
    latitude: rawStation.latitude || rawStation.lat || null,
    longitude: rawStation.longitude || rawStation.lon || rawStation.lng || null
  };
}

async function getStationsFromApi() {
  const apiUrl = process.env.BIXI_API_URL;

  if (!apiUrl) {
    return sampleStations;
  }

  try {
    const headers = {};

    if (process.env.BIXI_API_TOKEN) {
      headers.Authorization = `Bearer ${process.env.BIXI_API_TOKEN}`;
    }

    const response = await axios.get(apiUrl, {
      headers,
      timeout: 10000
    });

    const payload = response.data;
    const stations = Array.isArray(payload)
      ? payload
      : payload.stations || payload.data || [];

    return stations.map(normalizeStation);
  } catch (error) {
    console.error('Unable to fetch from Bixi API, using sample data instead:', error.message);
    return sampleStations;
  }
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/stations', async (_req, res) => {
  const stations = await getStationsFromApi();
  res.json(stations);
});

app.get('/api/stations/:id', async (req, res) => {
  const stations = await getStationsFromApi();
  const station = stations.find(
    (item) => String(item.id) === String(req.params.id)
  );

  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }

  res.json(station);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`BixTrak is running at http://localhost:${PORT}`);
});
