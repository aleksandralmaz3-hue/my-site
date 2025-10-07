// === js/ads-api.js ===
// Универсальный загрузчик и синхронизатор объявлений для всех устройств

const API_BASE = "https://68e3a1098e14f4523dae1d54.mockapi.io";
const ADS_URL = API_BASE + "/ads";
const LS_KEY = "ads";

// === Загрузка объявлений из MockAPI ===
async function loadAds(params = {}) {
  try {
    const url = new URL(ADS_URL);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    url.searchParams.set("sortBy", "createdAt");
    url.searchParams.set("order", "desc");

    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Load ads failed: " + r.status);

    const data = await r.json();

    // Сохраняем в localStorage для офлайн-доступа
    localStorage.setItem(LS_KEY, JSON.stringify(data));

    // Если функция рендера есть — сразу перерисуем
    if (typeof window.renderAds === "function") window.renderAds(data);

    return data;
  } catch (err) {
    console.error("Ошибка загрузки объявлений:", err);
    // Если сеть недоступна — попробуем из localStorage
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (typeof window.renderAds === "function") window.renderAds(cached);
    return cached;
  }
}

// === Создание объявления ===
async function createAd(ad) {
  try {
    const r = await fetch(ADS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ad),
    });
    if (!r.ok) throw new Error("Create ad failed: " + r.status);

    const created = await r.json();

    // Добавим в localStorage, чтобы сразу отобразилось
    const curr = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    curr.unshift(created);
    localStorage.setItem(LS_KEY, JSON.stringify(curr));

    return created;
  } catch (err) {
    console.error("Ошибка создания объявления:", err);
  }
}

// === Автоматическая синхронизация ===
// При загрузке страницы и при возврате на вкладку
document.addEventListener("DOMContentLoaded", () => loadAds());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadAds();
});

// === Экспорт ===
window.ADS_API = { loadAds, createAd };
