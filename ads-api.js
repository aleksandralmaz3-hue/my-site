const API = "https://68e3a1098e14f4523dae1d54.mockapi.io/ads";
const LS_KEY = "ads";

async function loadAds(params = {}) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  url.searchParams.set("sortBy", "createdAt");
  url.searchParams.set("order", "desc");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Load ads failed: " + r.status);
  const data = await r.json();

  localStorage.setItem(LS_KEY, JSON.stringify(data));
  if (typeof renderAds === "function") renderAds();
  else location.reload();

  return data;
}

async function createAd(ad) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!r.ok) throw new Error("Create ad failed: " + r.status);

  const created = await r.json();
  const curr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  curr.unshift(created);
  localStorage.setItem(LS_KEY, JSON.stringify(curr));

  return created;
}

// Загружаем объявления при старте и при возврате на вкладку
document.addEventListener("DOMContentLoaded", () => loadAds());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadAds();
});

window.ADS_API = { loadAds, createAd };
