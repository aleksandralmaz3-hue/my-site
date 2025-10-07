const API = "https://68e3a1098e14f4523dae1d54.mockapi.io/ads";

async function loadAds(params = {}) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  url.searchParams.set("sortBy", "createdAt");
  url.searchParams.set("order", "desc");

  const r = await fetch(url);
  if (!r.ok) throw new Error("Load ads failed");
  return await r.json();
}

async function createAd(ad) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!r.ok) throw new Error("Create ad failed");
  return await r.json();
}

window.ADS_API = { loadAds, createAd };
