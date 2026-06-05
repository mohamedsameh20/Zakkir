// Zakkir map picker — bundled Leaflet + OSM tiles. Click to drop a pin, then
// "Use this location" writes lat/lng + locationName back to chrome.storage and
// tells the background to refresh prayer times.

const api = globalThis.chrome || globalThis.browser;
const base = api?.runtime?.getURL ? api.runtime.getURL("vendor/") : "vendor/";

// Point Leaflet's default icon at our bundled images.
L.Icon.Default.mergeOptions({
  iconUrl: base + "marker-icon.png",
  iconRetinaUrl: base + "marker-icon-2x.png",
  shadowUrl: base + "marker-shadow.png",
});

const url = new URL(location.href);
const startLat = parseFloat(url.searchParams.get("lat"));
const startLng = parseFloat(url.searchParams.get("lng"));
const hasStart = Number.isFinite(startLat) && Number.isFinite(startLng);
const initLat = hasStart ? startLat : 30.0444;
const initLng = hasStart ? startLng : 31.2357;

const map = L.map("map").setView([initLat, initLng], hasStart ? 10 : 4);
// CARTO Voyager tiles — permissive on referrer (OSM volunteer servers block
// extension origins with a 403 "Access blocked" tile).
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '© OpenStreetMap contributors © CARTO',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

let picked = { lat: initLat, lng: initLng };
let marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);

const info = document.getElementById("info");
const useBtn = document.getElementById("useBtn");
const search = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");

function setPick(lat, lng, fly = false) {
  picked = { lat, lng };
  marker.setLatLng([lat, lng]);
  if (fly) map.setView([lat, lng], Math.max(map.getZoom(), 10));
  info.textContent = `Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

map.on("click", (e) => setPick(e.latlng.lat, e.latlng.lng));
marker.on("dragend", () => {
  const ll = marker.getLatLng();
  setPick(ll.lat, ll.lng);
});

async function doSearch() {
  const q = search.value.trim();
  if (!q) return;
  searchBtn.disabled = true;
  searchBtn.textContent = "…";
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (j[0]) {
      setPick(parseFloat(j[0].lat), parseFloat(j[0].lon), true);
    } else {
      info.textContent = "No matches — try a different search.";
    }
  } catch {
    info.textContent = "Search failed. Check your connection.";
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "Search";
  }
}
searchBtn.addEventListener("click", doSearch);
search.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

useBtn.addEventListener("click", async () => {
  useBtn.disabled = true;
  useBtn.textContent = "Saving…";
  let name = "";
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${picked.lat}&lon=${picked.lng}&zoom=10`);
    const j = await r.json();
    const a = j.address || {};
    name = a.city || a.town || a.village || a.county || a.state || (j.display_name || "").split(",")[0] || "";
  } catch { /* fine — fall back to coords */ }

  await new Promise((res) => api.storage.local.set({
    lat: picked.lat,
    lng: picked.lng,
    useCoords: true,
    locationName: name,
    locationSource: "map",
    locationTab: "map",
    prayerCache: null,
  }, res));

  try { api.runtime.sendMessage({ type: "refresh" }); } catch {}
  window.close();
});

// Initial label
info.textContent = hasStart
  ? `Selected: ${initLat.toFixed(4)}, ${initLng.toFixed(4)} — drag the pin or click anywhere.`
  : `Click anywhere on the map to pick your location.`;
