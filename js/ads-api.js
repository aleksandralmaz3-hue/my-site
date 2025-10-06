async function loadAds() {
  const url = "https://68e3a1098e14f4523dae1d54.mockapi.io/ads?_=" + Date.now(); // только рабочий путь + анти-кэш
  const r = await fetch(url, {
    cache: "no-store",
    mode: "cors",
    headers: { accept: "application/json" },
  });
  console.log("GET", url, "→", r.status);
  if (!r.ok) throw new Error("Load ads failed " + r.status);
  return await r.json();
}
