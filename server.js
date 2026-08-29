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
  const stationId = rawStation.station_id ?? rawStation.id ?? rawStation.stationId ?? rawStation.name;
  const bikesAvailable = Number(
    rawStation.bikes_available ??
    rawStation.num_bikes_available ??
    rawStation.available_bikes ??
    rawStation.nb_bikes_available ??
    0
  );
  const ebikesAvailable = Number(
    rawStation.ebikes_available ??
    rawStation.num_ebikes_available ??
    rawStation.available_e_bikes ??
    rawStation.nb_ebikes_available ??
    0
  );

  return {
    id: stationId,
    name: rawStation.name || rawStation.station_name || 'Station inconnue',
    bikes_available: bikesAvailable,
    ebikes_available: ebikesAvailable,
    regular_bikes_available: Math.max(0, bikesAvailable - ebikesAvailable),
    docks_available:
      rawStation.docks_available ??
      rawStation.num_docks_available ??
      rawStation.available_docks ??
      rawStation.nb_docks_available ??
      0,
    status:
      rawStation.status ||
      (rawStation.is_installed === 0 ? 'closed' : rawStation.is_renting === 0 ? 'out_of_service' : 'open') ||
      rawStation.state ||
      'open',
    latitude: rawStation.latitude ?? rawStation.lat ?? null,
    longitude: rawStation.longitude ?? rawStation.lon ?? rawStation.lng ?? null
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

    const rootResponse = await axios.get(apiUrl, {
      headers,
      timeout: 10000
    });

    const rootData = rootResponse.data || {};
    const feedList =
      rootData?.data?.en?.feeds ||
      rootData?.data?.fr?.feeds ||
      rootData?.feeds ||
      [];

    if (Array.isArray(feedList) && feedList.length > 0) {
      const stationInformationFeed = feedList.find((feed) => feed.name === 'station_information');
      const stationStatusFeed = feedList.find((feed) => feed.name === 'station_status');

      if (stationInformationFeed && stationStatusFeed) {
        const [stationInformationResponse, stationStatusResponse] = await Promise.all([
          axios.get(stationInformationFeed.url, { headers, timeout: 10000 }),
          axios.get(stationStatusFeed.url, { headers, timeout: 10000 })
        ]);

        const stationInfo = stationInformationResponse.data?.data?.stations || [];
        const stationStatus = stationStatusResponse.data?.data?.stations || [];

        const infoById = new Map();
        stationInfo.forEach((station) => {
          infoById.set(String(station.station_id), station);
        });

        const statusById = new Map();
        stationStatus.forEach((station) => {
          statusById.set(String(station.station_id), station);
        });

        const mergedStations = Array.from(new Set([
          ...infoById.keys(),
          ...statusById.keys()
        ])).map((stationId) => {
          const base = infoById.get(stationId) || {};
          const status = statusById.get(stationId) || {};

          const merged = {
            ...base,
            ...status,
            station_id: stationId,
            id: stationId,
            name: base.name || status.name || `Station ${stationId}`,
            latitude: base.lat ?? base.latitude ?? status.lat ?? status.latitude ?? null,
            longitude: base.lon ?? base.longitude ?? status.lon ?? status.longitude ?? null,
            bikes_available: Number(status.num_bikes_available ?? base.bikes_available ?? 0),
            docks_available: Number(status.num_docks_available ?? base.docks_available ?? 0),
            status:
              status.is_installed === 0
                ? 'closed'
                : status.is_renting === 0
                  ? 'out_of_service'
                  : 'open'
          };

          return normalizeStation(merged);
        });

        return mergedStations;
      }
    }

    const payload = rootData;
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
