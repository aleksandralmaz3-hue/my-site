// cleanup.js
import fs from "fs";

const DB_FILE = "./db.json";
const TTL_DAYS = 6;
const MS_DAY = 24 * 60 * 60 * 1000;

try {
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const db = JSON.parse(raw);
  const now = Date.now();

  db.ads = (db.ads || []).filter(
    (ad) => now - Number(ad.createdAt) < TTL_DAYS * MS_DAY
  );

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  console.log("Очистка завершена:", new Date().toISOString());
} catch (e) {
  console.error("Ошибка очистки:", e);
}
