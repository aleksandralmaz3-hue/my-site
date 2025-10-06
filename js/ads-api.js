const API = "https://68e3a1098e14f4523dae1d54.mockapi.io";

async function loadAds(params = {}) {
  const url = new URL(API + "/ads");
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  url.searchParams.set("sortBy", "createdAt");
  url.searchParams.set("order", "desc");
  url.searchParams.set("_", Date.now()); // анти-кэш

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Load ads failed");
  return await r.json();
}

async function createAd(ad) {
  const r = await fetch(API + "/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!r.ok) throw new Error("Create ad failed");
  return await r.json();
}

window.ADS_API = { loadAds, createAd };

