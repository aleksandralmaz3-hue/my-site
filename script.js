// === ЕДИНАЯ МЕХАНИКА ВЫПАДАШЕК (сверху открыта только одна) ===
(() => {
  const ready = () => {
    const scope = document.querySelector(".filters");
    if (!scope) return;
    const items = Array.from(scope.querySelectorAll("details.dd"));
    items.forEach((dd) => {
      dd.addEventListener("toggle", () => {
        if (!dd.open) return;
        items.forEach((o) => o !== dd && (o.open = false));
      });
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest(".filters details.dd")) return;
      items.forEach((d) => (d.open = false));
    });
  };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", ready)
    : ready();
})();

// === СОСТОЯНИЕ ФИЛЬТРОВ ===
const state = { city: "", category: "", deal: "", phone: "" };
const TTL_DAYS = 6;
const MS_DAY = 24 * 60 * 60 * 1000;

function updateSidebarLock() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const boxes = Array.from(sidebar.querySelectorAll('input[type="checkbox"]'));

  const hasTopChoice =
    !!state.city ||
    !!state.category ||
    !!state.deal ||
    digits(state.phone).length >= 3; // телефон считаем с 3 цифр

  boxes.forEach((b) => (b.disabled = !hasTopChoice));
  sidebar.classList.toggle("is-locked", !hasTopChoice);
}

// === УТИЛЫ ===
const digits = (s) => (s || "").replace(/\D+/g, "").trim();
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .trim();

// === ПЛЕЙСХОЛДЕР ДЛЯ ПУСТОГО СПИСКА ===
function ensureEmptyStub() {
  const list = document.getElementById("list");
  if (!list) return null;
  let el = document.getElementById("empty-stub");
  if (!el) {
    el = document.createElement("div");
    el.id = "empty-stub";
    el.className = "empty";
    el.textContent = "Ничего не найдено по выбранным фильтрам.";
    el.style.display = "none";
    list.appendChild(el);
  }
  return el;
}
// === РЕНДЕР ЛЕНТЫ (принимает данные из API, иначе из localStorage) ===
function renderAds(data) {
  const list = document.getElementById("list");
  if (!list) return;

  const ads = Array.isArray(data)
    ? data
    : JSON.parse(localStorage.getItem("ads") || "[]");

  const now = Date.now();
  const valid = [];

  // TTL и валидация
  for (const ad of ads) {
    if (!ad) continue;
    const okTitle = ad.title && String(ad.title).trim() !== "";
    const okPhone = ad.phone && String(ad.phone).trim() !== "";
    if (!okTitle || !okPhone) continue;

    let createdAt = Number(ad.createdAt);
    if (!createdAt) {
      createdAt = now;
      ad.createdAt = createdAt;
    }

    const age = now - createdAt;
    if (age < TTL_DAYS * MS_DAY) valid.push(ad);
  }

  if (valid.length === 0) {
    list.innerHTML =
      '<div class="empty">Объявлений пока нет. Нажми «Подать объявление».</div>';
    ensureEmptyStub();
    applyFilters();
    return;
  }

  list.innerHTML = valid
    .map((ad) => {
      const dealText =
        typeof ad.deal === "string"
          ? ad.deal
          : ad.deal?.label || ad.deal?.value || "";
      const dealNorm = norm(dealText);
      const showPrice =
        (dealNorm === "продам" || dealNorm === "продажа") &&
        ad.price &&
        String(ad.price).trim() !== "";

      const createdAt = Number(ad.createdAt) || now;

      const createdDayStart = new Date(createdAt);
      createdDayStart.setHours(0, 0, 0, 0);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let daysPassed = Math.floor((todayStart - createdDayStart) / MS_DAY);
      if (daysPassed < 0) daysPassed = 0;

      const daysLeft = Math.max(1, TTL_DAYS - daysPassed);

      return `
      <article class="card"
        data-city="${norm(ad.city)}"
        data-category="${norm(ad.category)}"
        data-deal="${dealNorm}"
        data-phone="${digits(ad.phone)}"
      >
        <header class="card__head">
          <h3 class="card__title">${ad.title}</h3>
          <div class="card__price">${showPrice ? ad.price + " грн." : ""}</div>
        </header>
        <div class="card__meta">
          <span>${ad.city || ""}</span> ·
          <span>${dealText || ""}</span> ·
          <span>${ad.category || ""}</span> ·
          <span>${ad.phone || ""}</span>
        </div>
        <p class="card__desc">${ad.description || ad.desc || ""}</p>
        <div class="card__badge" aria-label="Срок публикации">Осталось ${daysLeft} дн.</div>
      </article>`;
    })
    .join("");

  ensureEmptyStub();
  applyFilters();
}

// === ЕДИНАЯ ФУНКЦИЯ ФИЛЬТРА ===
function applyFilters() {
  const list = document.getElementById("list");
  if (!list) return;
  const cards = Array.from(list.querySelectorAll(".card"));
  const phoneQuery = digits(state.phone);
  let shown = 0;

  cards.forEach((card) => {
    const c = card.getAttribute("data-city") || "";
    const k = card.getAttribute("data-category") || "";
    const d = card.getAttribute("data-deal") || ""; // NEW ← сделка
    const p = card.getAttribute("data-phone") || "";

    const okCity = !state.city || c === norm(state.city);
    const okCat = !state.category || k === norm(state.category);
    const okDeal = !state.deal || d === norm(state.deal); // NEW ← проверка сделки
    const okPhone = phoneQuery.length >= 3 ? p.includes(phoneQuery) : true;
    const on = okCity && okCat && okDeal && okPhone; // добавили okDeal
    card.style.display = on ? "" : "none";
    if (on) shown++;
  });

  const stub = ensureEmptyStub();
  if (stub) stub.style.display = shown === 0 ? "" : "none";

  // управление блокировкой левой панели
  updateSidebarLock();
}
// === Блокировка нижней левой панели до выбора любого верхнего фильтра ===
(() => {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const boxes = Array.from(sidebar.querySelectorAll('input[type="checkbox"]'));
  const hasTopChoice =
    !!state.city ||
    !!state.category ||
    !!state.deal ||
    digits(state.phone).length >= 3; // телефон — с 3 цифр

  // Вкл/выкл возможность ставить галки
  boxes.forEach((b) => (b.disabled = !hasTopChoice));

  // Визуальная блокировка панели (курсор/прозрачность)
  sidebar.classList.toggle("is-locked", !hasTopChoice);
})();

// === ФИЛЬТР ПО ТЕЛЕФОНУ (верхняя выпадашка) ===
(() => {
  const dd = document.getElementById("phone-dd");
  const form = document.getElementById("phone-form");
  const input = document.getElementById("phone");
  const btnSearch = document.getElementById("phone-search");
  const btnClear = document.getElementById("phone-clear");
  if (!dd || !input) return;

  const update = () => {
    state.phone = input.value || "";
    applyFilters();
  };

  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(update, 200);
  });

  // Enter в поле — как «Найти»
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      update();
      dd.removeAttribute("open");
    }
  });

  // Кнопка «Найти»
  btnSearch?.addEventListener("click", () => {
    update();
    dd.removeAttribute("open");
  });

  // Кнопка «Сброс»
  btnClear?.addEventListener("click", () => {
    input.value = "";
    update();
  });

  // Submit формы (на случай, если браузер всё-таки отправит)
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    update();
    dd.removeAttribute("open");
  });

  // Клик снаружи — закрыть выпадашку
  document.addEventListener("click", (e) => {
    if (dd.hasAttribute("open") && !dd.contains(e.target))
      dd.removeAttribute("open");
  });
})();

// === ФИЛЬТР ПО ГОРОДУ (верхняя выпадашка + кнопки .city-btn[data-city]) ===
(() => {
  const dd = document.getElementById("city-dd");
  const summary = document.getElementById("city-summary");
  const btns = dd?.querySelectorAll(".city-btn");
  const btnClear = document.getElementById("city-clear");
  if (!dd || !summary || !btns) return;

  const setActive = (btn) => {
    btns.forEach((b) => b.classList.toggle("is-active", b === btn));
  };

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const city = (btn.getAttribute("data-city") || "").trim();
      state.city = city;
      setActive(btn);
      summary.textContent = city || "Місто";
      applyFilters();
      dd.removeAttribute("open");
    });
  });

  btnClear?.addEventListener("click", () => {
    state.city = "";
    setActive(null);
    summary.textContent = "Місто";
    applyFilters();
    dd.removeAttribute("open");
  });

  document.addEventListener("click", (e) => {
    if (dd.hasAttribute("open") && !dd.contains(e.target))
      dd.removeAttribute("open");
  });
})();

// === ФИЛЬТР ПО КАТЕГОРИИ (сайдбар: чекбоксы как «радио») ===
(() => {
  const root = document.getElementById("side-category");
  if (!root) return;
  const boxes = Array.from(root.querySelectorAll('input[type="checkbox"]'));
  if (boxes.length === 0) return;

  boxes.forEach((box) => {
    box.addEventListener("change", (e) => {
      if (e.target.checked) {
        boxes.forEach((b) => b !== e.target && (b.checked = false));
        const label = e.target.closest("label");
        state.category = (label?.textContent || "").trim();
      } else {
        state.category = "";
      }
      applyFilters();
    });
  });
})();

// === РЕЖИМ САЙДБАРА (активный верхний фильтр прячем в сайдбаре) ===
(() => {
  const sideCity = document.getElementById("side-city");
  const sideCat = document.getElementById("side-category");
  const sideDeal = document.getElementById("side-deal");

  function setSidebarMode(mode) {
    if (sideCity) sideCity.hidden = false;
    if (sideCat) sideCat.hidden = false;
    if (sideDeal) sideDeal.hidden = false;
    if (mode === "city" && sideCity) sideCity.hidden = true;
    if (mode === "category" && sideCat) sideCat.hidden = true;
    if (mode === "deal" && sideDeal) sideDeal.hidden = true;
  }

  const topDD = Array.from(document.querySelectorAll(".filters details.dd"));
  topDD.forEach((dd) => {
    const title = dd.querySelector("summary")?.textContent.trim();
    let type = null;
    if (title === "Город") type = "city";
    if (title === "Все категории") type = "category";
    if (title === "Тип сделки") type = "deal";
    if (!type) return;
    dd.addEventListener("toggle", () => dd.open && setSidebarMode(type));
  });

  setSidebarMode("city"); // старт
})();

// === ФИЛЬТР ПО ТИПУ СДЕЛКИ (сайдбар) ===
(() => {
  const root = document.getElementById("side-deal");
  if (!root) return;
  const boxes = Array.from(root.querySelectorAll('input[type="checkbox"]'));
  if (boxes.length === 0) return;

  boxes.forEach((box) => {
    box.addEventListener("change", (e) => {
      if (e.target.checked) {
        boxes.forEach((b) => b !== e.target && (b.checked = false));
        const label = e.target.closest("label");
        state.deal = (label?.textContent || "").trim(); // Купля/Продажа/Отдам/Возьму в дар
      } else {
        state.deal = "";
      }
      applyFilters();
    });
  });
})();

// === ФИЛЬТР ПО КАТЕГОРИИ (верхняя выпадашка "Все категории") ===
(() => {
  const topDDs = Array.from(document.querySelectorAll(".filters details.dd"));
  const dd = topDDs.find(
    (d) => d.querySelector("summary")?.textContent.trim() === "Все категории"
  );
  if (!dd) return;
  const btns = dd.querySelectorAll(".dd__item");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.textContent.trim(); // один выбор
      applyFilters();
      dd.removeAttribute("open");
    });
  });
})();
// === ВЕРХНИЕ ВЫПАДАШКИ: "Все категории" и "Тип сделки" (единый набор) ===
(() => {
  const findTop = (label) =>
    Array.from(document.querySelectorAll(".filters details.dd")).find(
      (d) => d.querySelector("summary")?.textContent.trim() === label
    );
  const setSummaryText = (dd, text, fallback) => {
    const s = dd?.querySelector("summary");
    if (s) s.textContent = text && text.trim() ? text.trim() : fallback;
  };

  // Сайдбар-чекбоксы для синхронизации
  const sideCat = document.getElementById("side-category");
  const sideDeal = document.getElementById("side-deal");
  const catBoxes = sideCat
    ? Array.from(sideCat.querySelectorAll('input[type="checkbox"]'))
    : [];
  const dealBoxes = sideDeal
    ? Array.from(sideDeal.querySelectorAll('input[type="checkbox"]'))
    : [];

  const ddCat = findTop("Все категории");
  const ddDeal = findTop("Тип сделки");

  // Top ► Sidebar
  if (ddCat) {
    ddCat.querySelectorAll(".dd__item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.textContent.trim();
        state.category = name;
        catBoxes.forEach((b) => {
          const txt = (b.closest("label")?.textContent || "").trim();
          b.checked = txt === name;
        });
        setSummaryText(ddCat, name, "Все категории");
        applyFilters();
        ddCat.removeAttribute("open");
      });
    });
  }

  if (ddDeal) {
    ddDeal.querySelectorAll(".dd__item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.textContent.trim(); // Купля/Продажа/Отдам/Возьму в дар
        state.deal = name;
        dealBoxes.forEach((b) => {
          const txt = (b.closest("label")?.textContent || "").trim();
          b.checked = txt === name;
        });
        setSummaryText(ddDeal, name, "Тип сделки");
        applyFilters();
        ddDeal.removeAttribute("open");
      });
    });
  }

  // Sidebar ► Top (отметили чекбокс — подпись вверху обновилась)
  const syncFromSidebar = () => {
    if (ddCat) {
      const c = catBoxes.find((b) => b.checked);
      const label = c ? (c.closest("label")?.textContent || "").trim() : "";
      setSummaryText(ddCat, label, "Все категории");
    }
    if (ddDeal) {
      const d = dealBoxes.find((b) => b.checked);
      const label = d ? (d.closest("label")?.textContent || "").trim() : "";
      setSummaryText(ddDeal, label, "Тип сделки");
    }
  };
  catBoxes.forEach((b) => b.addEventListener("change", syncFromSidebar));
  dealBoxes.forEach((b) => b.addEventListener("change", syncFromSidebar));
  syncFromSidebar();
})();

// === Город (сайдбар): чипы и чекбоксы ===
(() => {
  const chipsRoot = document.getElementById("side-city"); // чипы-кнопки
  const listRoot = document.getElementById("side-city-list"); // чекбоксы
  const topSummary = document.getElementById("city-summary");

  // Чипы — один клик = выбор города
  chipsRoot?.querySelectorAll("[data-city]")?.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.city = (btn.getAttribute("data-city") || "").trim();
      if (topSummary) topSummary.textContent = state.city || "Місто";
      applyFilters();
    });
  });

  // Чекбоксы — как радио (один выбран)
  if (listRoot) {
    const boxes = Array.from(
      listRoot.querySelectorAll('input[type="checkbox"]')
    );
    boxes.forEach((box) => {
      box.addEventListener("change", (e) => {
        if (e.target.checked) {
          boxes.forEach((b) => b !== e.target && (b.checked = false));
          const label = e.target.closest("label");
          const name = (label?.textContent || "").trim();
          state.city = name === "Все города" ? "" : name;
        } else {
          state.city = "";
        }
        if (topSummary) topSummary.textContent = state.city || "Місто";
        applyFilters();
      });
    });
  }
})();

// === Контекст боковой панели в зависимости от открытого верхнего блока ===
(() => {
  const ddList = Array.from(document.querySelectorAll(".filters details.dd"));
  const sideCityChips = document.getElementById("side-city"); // чипы Город
  const sideCityList = document.getElementById("side-city-list"); // чекбоксы Город
  const sideCategory = document.getElementById("side-category"); // чекбоксы Категории
  const sideDeal = document.getElementById("side-deal"); // чекбоксы Тип сделки

  const ALL_SIDES = [sideCityChips, sideCityList, sideCategory, sideDeal];

  const showOnly = (...els) => {
    ALL_SIDES.forEach((el) => el && el.classList.add("hidden"));
    els.forEach((el) => el && el.classList.remove("hidden"));
  };

  const setSidebarContext = (label) => {
    label = (label || "").trim();
    // Город (верх): в сайдбаре показываем "Все категории" + "Тип сделки"
    if (label === "Город") {
      showOnly(sideCategory, sideDeal);
      return;
    }
    // Все категории (верх): в сайдбаре "Город" (ОДИН блок — чекбоксы) + "Тип сделки"
    if (label === "Все категории") {
      showOnly(sideCityList, sideDeal); // скрываем чипы города
      return;
    }
    // Тип сделки (верх): в сайдбаре "Город" (чекбоксы) + "Все категории"
    if (label === "Тип сделки") {
      showOnly(sideCityList, sideCategory); // скрываем чипы города
      return;
    }
    // По номеру телефона (верх): по умолчанию "Город" (чекбоксы) + "Все категории" + "Тип сделки"
    if (label === "По номеру телефона") {
      showOnly(sideCityList, sideCategory, sideDeal);
      return;
    }
  };

  // Переключаем при открытии любого верхнего details
  ddList.forEach((dd) => {
    const summary = dd.querySelector("summary");
    dd.addEventListener("toggle", () => {
      if (dd.open && summary) setSidebarContext(summary.textContent);
    });
  });

  // Инициализация (состояние по умолчанию — все закрыты, включим полный набор)
  setSidebarContext("По номеру телефона");
})();

// === КНОПКА "ЛЕНТА": безопасный сброс ===
(() => {
  const btn = document.getElementById("feed-reset");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    resetFeedState(); // только безопасный сброс, сайдбар не трогаем
  });
})();

// Автозакрытие "Город" при любой прокрутке (wheel / touchmove)
(() => {
  const dd = document.getElementById("city-dd"); // есть в index.html
  if (!dd) return;
  const close = () => dd.removeAttribute("open");
  document.addEventListener("wheel", close, { passive: true }); // мышь
  document.addEventListener("touchmove", close, { passive: true }); // тач
})();

// === Закрывать "Город" при любом взаимодействии с правой колонкой ===
(() => {
  const dd = document.getElementById("city-dd"); // выпадашка "Город" (есть в index.html)
  const right = document.querySelector(".main__right"); // правая колонка со списком (есть в index.html)
  const list = document.getElementById("list"); // сам скроллируемый список

  if (!dd || !right) return;

  const closeIfOpen = () => {
    if (dd.hasAttribute("open")) dd.removeAttribute("open");
  };

  // 1) Любой клик/тап/захват полосы прокрутки в правой колонке — закрыть выпадашку
  ["pointerdown", "mousedown", "touchstart"].forEach((ev) => {
    right.addEventListener(ev, closeIfOpen, { capture: true });
  });

  // 2) Навели курсор в правую колонку — закроем, чтобы колесо сразу скроллило
  right.addEventListener("mouseenter", closeIfOpen);

  // 3) Клавиатурная навигация (Tab) внутри списка — тоже закрыть
  list?.addEventListener("focusin", closeIfOpen);
})();
// Безопасный сброс "Лента": НЕ перерисовываем левую панель.
function resetFeedState() {
  // 0) Обнулить состояние
  state.city = "";
  state.category = "";
  state.deal = "";
  state.phone = "";

  // 1) Закрыть все выпадашки
  document
    .querySelectorAll("details.dd[open]")
    .forEach((d) => d.removeAttribute("open"));

  // 2) Очистить поле телефона
  const phone = document.getElementById("phone");
  if (phone) phone.value = "";

  // 3) Снять active-классы у чипов города
  document
    .querySelectorAll(".city-btn.is-active, .chip[data-city].is-active")
    .forEach((b) => b.classList.remove("is-active"));

  // 4) Вернуть подписи в summary
  const citySummary = document.getElementById("city-summary");
  if (citySummary) citySummary.textContent = "Город";
  document.querySelectorAll(".filters details.dd > summary").forEach((s) => {
    const t = s.textContent.trim();
    if (t.includes("Катег")) s.textContent = "Все категории";
    if (t.includes("Тип сделки")) s.textContent = "Тип угоди";
    if (t.includes("телефона")) s.textContent = "За номером телефону";
  });

  // 5) Снять ВСЕ галки в левом сайдбаре
  document.querySelectorAll('#sidebar input[type="checkbox"]').forEach((ch) => {
    ch.checked = false;
  });

  // 6) Применить фильтры (покажет всё) и обновить блокировку
  applyFilters();

  // 7) Скролл вверх списка
  document.getElementById("list")?.scrollTo({ top: 0, behavior: "instant" });
}
// === ПЕРЕВОД СТРАНИЦЫ pay.html (RU ⇄ UA) ===
function setPayUIStrings(lang) {
  const t = {
    ru: {
      brand: "Оплата послуги",
      cardTitle: "НОМЕР КАРТКИ",
      help: "Як оплатити послугу:",
      steps: [
        "Для активації оголошення внесіть 3 грн на картку, вказану вище.",
        "Підтвердьте оплату кнопкою «Оплачено».",
        "Поверніться до оголошення кнопкою «Назад».",
        "Коли кнопка «Оплачено» засвітиться зеленим — ваше оголошення готове до публікації.",
      ],
      payBtn: "Оплатить",
      backBtn: "Назад",
    },
    uk: {
      brand: "Оплата послуги",
      cardTitle: "НОМЕР КАРТКИ",
      help: "Як оплатити послугу (3 грн):",
      steps: [
        "Для активації оголошення внесіть 3 грн на картку, вказану вище.",
        "Підтвердьте оплату кнопкою «Оплачено».",
        "Поверніться до оголошення кнопкою «Назад».",
        "Коли кнопка «Оплачено» засвітиться зеленим — ваше оголошення готове до публікації.",
      ],
      payBtn: "Сплатити",
      backBtn: "Назад",
    },
  }[lang === "uk" ? "uk" : "ru"];

  document.querySelector(".brand__name")?.replaceChildren(t.brand);
  document.getElementById("payTitle")?.replaceChildren(t.cardTitle);
  document.querySelector(".pay__help strong")?.replaceChildren(t.help);

  const steps = document.querySelectorAll(".pay__list li");
  steps.forEach((li, i) => (li.textContent = t.steps[i] || ""));

  document.getElementById("paidBtn")?.replaceChildren(t.payBtn);
  document.querySelector(".pay__row a")?.replaceChildren(t.backBtn);
}

// Автоприменение перевода на странице оплаты
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("body .pay")) {
    // проверка: мы на pay.html
    const savedLang = localStorage.getItem("inputLang") || "ru";
    setPayUIStrings(savedLang);
  }
});

// === ПЕРЕВОД СТРАНИЦЫ index.html (RU ⇄ UA) ===
function setIndexUIStrings(lang) {
  const t = {
    ru: {
      brand: "Продай-ка!",
      feed: "Стрічка",
      create: "Подати оголошення",
      phoneSearch: "За номером телефону",
      city: "Місто",
      deal: "Тип угоди",
      find: "Найти",
      reset: "Сброс",
      allCities: "Все города",
      category: "Категория",
      services: "Услуги",
      createPay: "Оплата",
      createPaid: "Оплачено",
    },
    uk: {
      brand: "Продай-ка!",
      feed: "Стрічка",
      create: "Подати оголошення",
      phoneSearch: "За номером телефону",
      city: "Місто",
      deal: "Тип угоди",
      find: "Знайти",
      reset: "Скидання",
      allCities: "Всі міста",
      category: "Категорія",
      services: "Послуги",
      createPay: "Оплата",
      createPaid: "Оплачено",
    },
  }[lang === "uk" ? "uk" : "ru"];

  // Шапка
  document.querySelector(".brand span:last-child")?.replaceChildren(t.brand);
  document.getElementById("feed-reset")?.replaceChildren(t.feed);
  document.querySelector(".nav .btn")?.replaceChildren(t.create);

  // Фильтры сверху
  document.querySelector("#phone-dd summary")?.replaceChildren(t.phoneSearch);
  document.getElementById("city-summary")?.replaceChildren(t.city);

  // ВАЖНО: меняем только summary «Тип сделки», а не первый попавшийся summary
  document.querySelectorAll(".filters details.dd > summary").forEach((s) => {
    const txt = (s.textContent || "").trim();
    if (txt === "Тип сделки" || txt === "Тип угоди") {
      s.replaceChildren(t.deal);
    }
  });

  // Кнопки в фильтрах
  document.getElementById("phone-search")?.replaceChildren(t.find);
  document.getElementById("phone-clear")?.replaceChildren(t.reset);
  document.getElementById("city-clear")?.replaceChildren(t.allCities);

  // Сайдбар
  document.querySelector("#side-city h3")?.replaceChildren(t.city);
  document.querySelector("#side-city-list h3")?.replaceChildren(t.city);
  document.querySelector("#side-category h3")?.replaceChildren(t.category);
  document.querySelector("#side-deal h3")?.replaceChildren(t.deal);
}

// Автоприменение перевода на главной
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("list")) {
    // проверка: мы на index.html
    const savedLang = localStorage.getItem("inputLang") || "ru";
    setIndexUIStrings(savedLang);
  }
});
