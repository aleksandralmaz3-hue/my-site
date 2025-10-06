const API_BASE = "https://68e3a1098e14f4523dae1d54.mockapi.io/";
const ADS_PATH = "ads"; // ✅ без /api/v1/

function buildUrl(path, params = {}) {
  const u = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      u.searchParams.set(k, v);
    }
  });
  u.searchParams.set("_", Date.now());
  return u;
}

async function loadAds(params = {}) {
  const url = buildUrl(ADS_PATH, {
    sortBy: "createdAt",
    order: "desc",
    ...params,
  });
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Load ads failed " + r.status);
  return await r.json();
}

async function createAd(ad) {
  const url = buildUrl(ADS_PATH);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!r.ok) throw new Error("Create ad failed " + r.status);
  return await r.json();
}

window.ADS_API = { loadAds, createAd };
