// === БАЗА (без окончания /ads) ===
const API_BASE = "https://68e3a1098e14f4523dae1d54.mockapi.io/";

// Универсальный конструктор URL
function buildUrl(path, params = {}) {
  const u = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      u.searchParams.set(k, v);
    }
  });
  u.searchParams.set("_", Date.now()); // анти-кэш
  return u;
}

// Вспомогательная: запрос с фоллбэком /ads → /api/v1/ads
async function fetchWithFallback(path, options = {}) {
  const tries = [path, "api/v1/" + path.replace(/^\/?/, "")];
  let lastErr;
  for (const p of tries) {
    try {
      const url = buildUrl(p);
      const r = await fetch(url, { cache: "no-store", ...options });
      if (r.ok) return r;
      // если 404 — пробуем второй путь
      if (r.status !== 404) throw new Error("HTTP " + r.status);
      lastErr = new Error("HTTP 404");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Request failed");
}

async function loadAds(params = {}) {
  // добавляем сортировку
  const query = new URLSearchParams({ sortBy: "createdAt", order: "desc", ...params }).toString();
  const path = "ads" + (query ? "?" + query : "");
  const r = await fetchWithFallback(path);
  return await r.json();
}

async function createAd(ad) {
  const opts = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  };
  const r = await fetchWithFallback("ads", opts);
  return await r.json();
}

window.ADS_API = { loadAds, createAd };
