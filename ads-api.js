const LS_KEY = "ads"; // ключ хранилища
const API = "https://68e3a1098e14f4523dae1d54.mockapi.io/ads";

async function loadAds(params = {}) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  url.searchParams.set("sortBy", "createdAt");
  url.searchParams.set("order", "desc");
  const r = await fetch(url, { cache: "no-store" }); // без кэша на телефоне
  if (!r.ok) throw new Error("Load ads failed: " + r.status);
  const data = await r.json();
  localStorage.setItem(LS_KEY, JSON.stringify(data)); // ← положили в localStorage
  // твой renderAds() читает localStorage при загрузке страницы, поэтому перерисуем:
  location.reload();
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
  // сразу добавим в localStorage, чтобы запись появилась и без перезагрузки:
  const curr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  curr.unshift(created);
  localStorage.setItem(LS_KEY, JSON.stringify(curr));
  return created;
}

// АВТОСТАРТ: если хранилище пусто — тянем с MockAPI
if (!localStorage.getItem(LS_KEY)) {
  loadAds();
}

window.ADS_API = { loadAds, createAd };
