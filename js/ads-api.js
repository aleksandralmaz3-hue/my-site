const API_BASE = "https://68e3a1098e14f4523dae1d54.mockapi.io/";

// было: buildUrl("ads", {...})
async function loadAds(params = {}) {
  const url = buildUrl("api/v1/ads", {
    sortBy: "createdAt",
    order: "desc",
    ...params,
  });
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Load ads failed " + r.status);
  return await r.json();
}

// было: buildUrl("ads")
async function createAd(ad) {
  const url = buildUrl("api/v1/ads");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!r.ok) throw new Error("Create ad failed " + r.status);
  return await r.json();
}
