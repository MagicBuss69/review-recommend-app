/*
  BiteBuddy — script.js (JavaScript = the actions / behavior)
*/

// ============================================================
// 🚀 LAUNCH MODE — smoke test to see if real people want this
// Paste your Google Form URL below. The "Find out!" button
// will send visitors there instead of doing a search.
// Set it back to "" when you're ready to launch for real.
// ============================================================
const EARLY_ACCESS_URL = "";

// Grab the parts of the page we need to work with
const input = document.getElementById("link-input");
const button = document.getElementById("find-btn");
const message = document.getElementById("result-message");


/* ===== SEARCH HISTORY ("Recent") =====
   Saves the places you searched, WITH the time, so you can jump back with one tap
   instead of typing it all again. */
const recent = document.getElementById("recent");

// Save a place into the history: newest first, no duplicates, keep only the latest 6.
function addToHistory(name) {
  let hist = bbParse("bitebuddy-history", []);
  // drop any older copy of the same name, so it jumps back to the top
  hist = hist.filter(function (item) { return item && item.name && item.name.toLowerCase() !== name.toLowerCase(); });
  hist.unshift({ name: name, time: Date.now() });   // add to the front with the current time
  hist = hist.slice(0, 6);                            // keep the list short
  localStorage.setItem("bitebuddy-history", JSON.stringify(hist));
}

// Turn a saved time into friendly text like "just now" or "2h ago" (the time mechanic!).
function timeAgo(ms) {
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return sv ? "nyss" : "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + (sv ? " min sedan" : "m ago");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + (sv ? " tim sedan" : "h ago");
  return Math.floor(hours / 24) + (sv ? " dgr sedan" : "d ago");
}

// Draw the recent list and make each item tappable to reopen that result.
function renderHistory() {
  if (!recent) return;
  const hist = bbParse("bitebuddy-history", []);
  if (hist.length === 0) { recent.innerHTML = ""; return; }
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";

  let html = '<div class="recent-title">🕘 ' + (sv ? "Senaste" : "Recent") + '</div><div class="recent-list">';
  hist.forEach(function (item) {
    if (!item || !item.name) return;
    html += '<button class="recent-chip" data-name="' + escapeHtml(item.name) + '">' +
            escapeHtml(item.name) + ' <span class="recent-time">' + timeAgo(item.time) + '</span></button>';
  });
  html += '</div>';
  recent.innerHTML = html;

  // clicking a recent item jumps straight to its result
  recent.querySelectorAll(".recent-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      localStorage.setItem("bitebuddy-search", chip.dataset.name);
      window.location.href = "results.html";
    });
  });
}
renderHistory();   // show the recent list when the page opens


// Switch the page into launch mode if EARLY_ACCESS_URL is set
if (EARLY_ACCESS_URL) {
  // Remove data-i18n so lang.js doesn't overwrite these back
  button.removeAttribute("data-i18n");
  input.removeAttribute("data-i18n-placeholder");

  button.textContent = "Get early access →";
  input.placeholder = "BiteBuddy is launching soon 🐾";

  // Hide everything that isn't the hero search box
  // (nav links, recommendations, how it works, feedback — not ready for public yet)
  var hide = [
    ".nav a", ".nav select",           // nav links + language picker
    ".location-bar", "#loc-history",   // location bar
    "#suggestions", "#result-message", // search helpers
    "#recos", ".or-divider",           // recommendations
    ".reco-buttons", "#recommend-card",// "decide for me" buttons
    "#recent",                         // recent searches
    "#how", ".feedback",               // how it works + feedback box
  ];
  hide.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.style.display = "none";
    });
  });
}

// What happens when the button is clicked
button.addEventListener("click", function () {
  // LAUNCH MODE: send visitors to the Google Form instead of searching
  if (EARLY_ACCESS_URL) {
    window.location.href = EARLY_ACCESS_URL;
    return;
  }

  const link = input.value.trim();   // the text the user typed

  if (link === "") {
    message.textContent = "🐾 Type a restaurant name first, then let Forky sniff it out!";
    return;
  }

  // Remember what they searched so the results page can show it.
  localStorage.setItem("bitebuddy-search", link);
  addToHistory(link);

  message.innerHTML = '<span class="spinner"></span> 🐾 Forky is sniffing out the reviews...';
  setTimeout(function () {
    window.location.href = "results.html";
  }, 900);
});

// Bonus: let people press the Enter key instead of clicking
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    button.click();
  }
});


/* ===== LAZY SEARCH (autocomplete, like Google) =====
   As you type, show matching real places. Picking one fixes any misspelling. */
const suggestionsEl = document.getElementById("suggestions");
let suggestTimer;

function goToPlace(name) {
  localStorage.setItem("bitebuddy-search", name);
  addToHistory(name);
  window.location.href = "results.html";
}

if (suggestionsEl && typeof searchSuggestions === "function") {
  input.addEventListener("input", function () {
    clearTimeout(suggestTimer);
    const q = input.value.trim();
    if (q.length < 2) { suggestionsEl.innerHTML = ""; return; }

    // wait until the user pauses typing (so we don't spam the search)
    suggestTimer = setTimeout(function () {
      searchSuggestions(q).then(function (list) {
        suggestionsEl.innerHTML = "";
        list.forEach(function (s) {
          const item = document.createElement("div");
          item.className = "suggestion";
          item.innerHTML = "🍽️ <strong>" + escapeHtml(s.name) + "</strong>" +
            (s.area ? ' <span class="sugg-area">' + escapeHtml(s.area) + "</span>" : "");
          item.addEventListener("click", function () {
            input.value = s.name;
            suggestionsEl.innerHTML = "";
            goToPlace(s.name);
          });
          suggestionsEl.appendChild(item);
        });
      });
    }, 350);
  });

  // hide the suggestions when you click elsewhere
  document.addEventListener("click", function (e) {
    if (e.target !== input && !suggestionsEl.contains(e.target)) suggestionsEl.innerHTML = "";
  });
}


/* ===== "RECOMMEND ME A PLACE" BUTTON =====
   For people who don't want to type a name — Forky just picks one!
   Demo version: picks from a small list of real Landskrona restaurants.
   The real version would use your location + a map to find places near you. */
const recommendBtn = document.getElementById("recommend-btn");
const recommendCard = document.getElementById("recommend-card");

// Location — TYPE any city, pick a suggestion, or tap 📍 for your real location.
// We save the choice so it's remembered next time.
const locationInput = document.getElementById("location-input");
const nearMeBtn = document.getElementById("near-me-btn");
const locSv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";

// restore the saved location into the box
const savedLoc = localStorage.getItem("bitebuddy-location");
if (savedLoc === "near") {
  if (localStorage.getItem("bitebuddy-geo")) locationInput.value = locSv ? "📍 Nära mig" : "📍 Near me";
} else if (savedLoc) {
  locationInput.value = savedLoc;
}

const locClear = document.getElementById("loc-clear");

// is this value a real city (not blank / not "near me")?
function isRealCity(v) { return v && !/near|nära|📍/i.test(v); }

// show the ✕ only when there's text to clear
function toggleClear() {
  if (locClear) locClear.style.display = locationInput.value.trim() ? "block" : "none";
}

// ===== 🕘 LOCATION HISTORY (remember cities you've used) =====
function addLocHistory(loc) {
  const v = (loc || "").trim();
  if (!isRealCity(v)) return;                       // skip blank / near-me
  let h = bbParse("bitebuddy-loc-history", []);
  h = h.filter(function (x) { return x.toLowerCase() !== v.toLowerCase(); });  // no duplicates
  h.unshift(v);                                     // newest first
  h = h.slice(0, 6);                                // keep it short
  localStorage.setItem("bitebuddy-loc-history", JSON.stringify(h));
}
function renderLocHistory() {
  const el = document.getElementById("loc-history");
  if (!el) return;
  const h = bbParse("bitebuddy-loc-history", []);
  if (!h.length) { el.innerHTML = ""; return; }
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  let html = '<span class="loc-history-title">' + (sv ? "🕘 Senaste:" : "🕘 Recent:") + "</span>";
  h.forEach(function (c) {
    const safe = escapeHtml(c);
    html += '<span class="loc-chip"><button class="loc-go" data-loc="' + safe + '">' + safe +
            '</button><span class="loc-x" data-loc="' + safe + '" title="Remove">✕</span></span>';
  });
  el.innerHTML = html;
  // tap a city → use it
  el.querySelectorAll(".loc-go").forEach(function (b) {
    b.addEventListener("click", function () {
      const v = b.dataset.loc;
      locationInput.value = v;
      localStorage.setItem("bitebuddy-location", v);
      localStorage.removeItem("bitebuddy-geo");      // a city, not GPS
      addLocHistory(v);                              // bump it to the front
      toggleClear();
      renderLocHistory();
      loadRecos();                                   // refresh recommendations
    });
  });
  // ✕ on a chip → remove just that city from history
  el.querySelectorAll(".loc-x").forEach(function (x) {
    x.addEventListener("click", function () {
      const v = x.dataset.loc;
      let list = bbParse("bitebuddy-loc-history", []);
      list = list.filter(function (c) { return c.toLowerCase() !== v.toLowerCase(); });
      localStorage.setItem("bitebuddy-loc-history", JSON.stringify(list));
      renderLocHistory();
    });
  });
}

// save whatever the user types
locationInput.addEventListener("change", function () {
  const v = locationInput.value.trim();
  localStorage.setItem("bitebuddy-location", v || "near");
  if (isRealCity(v)) {
    localStorage.removeItem("bitebuddy-geo");   // typing a real city clears old GPS
    addLocHistory(v);
    renderLocHistory();
  }
  loadRecos();   // refresh the recommendation list for the new location
});
locationInput.addEventListener("input", toggleClear);   // show/hide the ✕ as you type

// ✕ button → clear what you wrote
if (locClear) {
  locClear.addEventListener("click", function () {
    locationInput.value = "";
    localStorage.setItem("bitebuddy-location", "near");
    localStorage.removeItem("bitebuddy-geo");
    toggleClear();
    locationInput.focus();
  });
}

toggleClear();          // set the ✕ correctly on load
renderLocHistory();     // show recent cities on load

// 📍 "Near me" — ask the browser for the real location (always OPTIONAL, never required).
if (nearMeBtn) {
  nearMeBtn.addEventListener("click", function () {
    if (!navigator.geolocation) {
      alert(locSv ? "Din webbläsare kan inte dela plats — skriv en stad. 🐾" : "Your browser can't share location — type a city instead. 🐾");
      return;
    }
    nearMeBtn.textContent = "⏳";
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        localStorage.setItem("bitebuddy-geo", JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }));
        localStorage.setItem("bitebuddy-location", "near");
        locationInput.value = locSv ? "📍 Nära mig" : "📍 Near me";
        nearMeBtn.textContent = "📍";
        loadRecos();   // refresh recommendations for your real location
      },
      function () {
        nearMeBtn.textContent = "📍";
        alert(locSv ? "Kunde inte hämta din plats — skriv en stad istället. 🐾" : "Couldn't get your location — type a city instead. 🐾");
      },
      { timeout: 8000 }
    );
  });
}

// A few real Landskrona spots for the demo
const landskronaPlaces = [
  { name: "Mister York", food: "American smash burgers, loaded fries & milkshakes", emoji: "🍔" },
  { name: "Restaurang Basilika", food: "Thai & pan-Asian favourites", emoji: "🍜" },
  { name: "Mythos", food: "Greek classics", emoji: "🥙" },
  { name: "Idas by the Sea", food: "Fresh seafood by the water", emoji: "🦞" },
  { name: "Restaurang Don Pedro", food: "Pizza & cosy bar food", emoji: "🍕" },
  { name: "Okaasan", food: "Japanese sushi", emoji: "🍣" },
];

// Pick a fitting emoji from a place's cuisine (for REAL places that have no emoji).
function cuisineEmoji(food) {
  const f = (food || "").toLowerCase();
  if (/pizza|italian/.test(f)) return "🍕";
  if (/burger|american/.test(f)) return "🍔";
  if (/sushi|japan/.test(f)) return "🍣";
  if (/thai|asian|chinese|noodle|vietnam/.test(f)) return "🍜";
  if (/greek|kebab|turkish|falafel/.test(f)) return "🥙";
  if (/seafood|fish/.test(f)) return "🦞";
  if (/coffee|cafe|bakery|fika|dessert/.test(f)) return "☕";
  if (/taco|mexican|burrito/.test(f)) return "🌮";
  if (/indian|curry/.test(f)) return "🍛";
  return "🍴";
}

let lastPickName = ""; // remember the last pick so we don't repeat it twice in a row

recommendBtn.addEventListener("click", async function () {
  const loc = locationInput.value.trim();
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";

  recommendCard.innerHTML = '<span class="spinner"></span> ' +
    (sv ? "🐾 Forky väljer…" : "🐾 Forky is picking…");

  // Try REAL nearby places first (works in any city); fall back to the built-in list.
  let pool = [];
  if (typeof nearbyFoodPlaces === "function") {
    try { pool = await nearbyFoodPlaces(loc); } catch (e) { pool = []; }
  }
  // If the live lookup failed, only fall back to the built-in list for Landskrona/near
  // (it's a REAL Landskrona list). For other cities we DON'T fake it — we ask to retry,
  // so Forky never shows a Landskrona place when you picked Malmö. 🛡️
  if (!pool || pool.length < 3) {
    const lc = loc.toLowerCase();
    const nearish = lc === "" || /near|nära|📍/.test(lc);
    const hasGeo = !!localStorage.getItem("bitebuddy-geo");
    // only the built-in Landskrona list is REAL → use it just for Landskrona / near-without-GPS
    if (lc === "landskrona" || (nearish && !hasGeo)) {
      pool = landskronaPlaces;
    } else {
      const where = nearish ? (sv ? "din plats" : "your area") : loc;
      recommendCard.innerHTML = sv
        ? "😅 Forky kunde inte nå matkartan för <strong>" + where + "</strong> just nu — försök igen om en stund!"
        : "😅 Forky couldn't reach the food map for <strong>" + where + "</strong> right now — try again in a moment!";
      return;
    }
  }

  // Pick a random place that isn't the same as last time.
  let pick = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (pool.length > 1 && pick.name === lastPickName && guard < 8) {
    pick = pool[Math.floor(Math.random() * pool.length)];
    guard++;
  }
  lastPickName = pick.name;

  const emoji = pick.emoji || cuisineEmoji(pick.food);
  const foodLine = pick.food ? '<div class="pick-food">' + escapeHtml(pick.food) + "</div>" : "";

  // Remember the pick so the results page ("See details") shows this place.
  localStorage.setItem("bitebuddy-search", pick.name);
  addToHistory(pick.name);

  recommendCard.innerHTML =
    '<div class="pick-emoji">' + emoji + "</div>" +
    '<div class="pick-title">' + (sv ? "Forky väljer: " : "Forky picks: ") + "<strong>" + escapeHtml(pick.name) + "</strong></div>" +
    foodLine +
    '<a href="results.html" class="btn-primary big-btn">' + (sv ? "Se detaljer 🔍" : "See details 🔍") + "</a>";

  renderHistory();   // refresh the Recent list to show the new pick
});


/* ===== 💚 "SUITS MY TASTE" — recommend a nearby place that matches foods you like ===== */
// Many "near me" places only carry a CUISINE word (like "italian"), not the dish you typed
// (like "pizza"). This little dictionary bridges that gap: a food → the cuisine words that
// usually serve it. So liking "pizza" still matches a place tagged "italian". 🍕→🇮🇹
const FOOD_TO_CUISINE = {
  pizza: ["italian", "pizza"],
  pasta: ["italian"],
  sushi: ["japanese", "sushi"],
  ramen: ["japanese", "noodle"],
  burger: ["american", "burger", "fast_food", "fast food"],
  burgers: ["american", "burger", "fast_food", "fast food"],
  taco: ["mexican"],
  tacos: ["mexican"],
  burrito: ["mexican"],
  curry: ["indian", "thai"],
  kebab: ["turkish", "kebab"],
  falafel: ["middle eastern", "lebanese", "arab"],
  noodles: ["chinese", "thai", "japanese", "noodle"],
  dumplings: ["chinese"],
  "dim sum": ["chinese"],
  pho: ["vietnamese"],
  pad: ["thai"],
  thai: ["thai"],
  steak: ["steak_house", "steak", "american"],
  bbq: ["barbecue", "american"],
  seafood: ["seafood", "fish"],
  fish: ["seafood", "fish"],
  vegan: ["vegan", "vegetarian"],
  vegetarian: ["vegetarian", "vegan"],
  coffee: ["cafe", "coffee_shop"],
  cake: ["cafe", "bakery", "dessert"],
  pastry: ["bakery", "cafe"],
  "ice cream": ["ice_cream", "dessert"],
};

// Build every word we should look for when someone likes/dislikes a food: the food
// itself PLUS its cuisine synonyms from the dictionary above.
function foodSearchWords(food) {
  const f = (food || "").toLowerCase().trim();
  if (!f) return [];
  const words = [f];
  const extra = FOOD_TO_CUISINE[f];
  if (extra) extra.forEach(function (w) { words.push(w); });
  return words;
}

// score a place: +2 for each liked food it mentions (dish OR matching cuisine),
// -3 for each disliked one.
function tasteScore(place, likes, dislikes) {
  const hay = ((place.food || "") + " " + (place.name || "")).toLowerCase();
  let score = 0, matched = null;
  likes.forEach(function (f) {
    if (foodSearchWords(f).some(function (w) { return hay.indexOf(w) >= 0; })) {
      score += 2;
      if (!matched) matched = f;
    }
  });
  dislikes.forEach(function (f) {
    if (foodSearchWords(f).some(function (w) { return hay.indexOf(w) >= 0; })) score -= 3;
  });
  return { score: score, matched: matched };
}

const tasteBtn = document.getElementById("taste-btn");
if (tasteBtn) tasteBtn.addEventListener("click", async function () {
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  const likes = bbParse("bitebuddy-likes", []);
  const dislikes = bbParse("bitebuddy-dislikes", []);

  // need to know your tastes first
  if (!likes.length) {
    recommendCard.innerHTML = sv
      ? "💚 Lägg till mat du gillar på din <a href='profile.html'>Profil</a> först, så väljer Forky åt dig!"
      : "💚 Add foods you like on your <a href='profile.html'>Profile</a> first, then Forky can pick for you!";
    return;
  }

  const loc = locationInput.value.trim();
  recommendCard.innerHTML = '<span class="spinner"></span> ' + (sv ? "🐾 Forky letar efter din smak…" : "🐾 Forky is matching your taste…");

  // get nearby places (same engine as the random button)
  let pool = [];
  if (typeof nearbyFoodPlaces === "function") {
    try { pool = await nearbyFoodPlaces(loc); } catch (e) { pool = []; }
  }
  if (!pool || pool.length < 3) {
    const lc = loc.toLowerCase();
    const nearish = lc === "" || /near|nära|📍/.test(lc);
    const hasGeo = !!localStorage.getItem("bitebuddy-geo");
    if (lc === "landskrona" || (nearish && !hasGeo)) {
      pool = landskronaPlaces;
    } else {
      const where = nearish ? (sv ? "din plats" : "your area") : loc;
      recommendCard.innerHTML = sv
        ? "😅 Forky kunde inte nå matkartan för <strong>" + where + "</strong> just nu — försök igen!"
        : "😅 Forky couldn't reach the food map for <strong>" + where + "</strong> right now — try again!";
      return;
    }
  }

  // score every place, best first; pick (a little randomly) among the best matches
  const scored = pool.map(function (p) { const t = tasteScore(p, likes, dislikes); return { p: p, score: t.score, matched: t.matched }; });
  scored.sort(function (a, b) { return b.score - a.score; });
  const topScore = scored[0].score;

  let chosen;
  if (topScore > 0) {
    const top = scored.filter(function (s) { return s.score === topScore; });
    chosen = top[Math.floor(Math.random() * top.length)];
  } else {
    // nothing matched a food you like → at least avoid your dislikes
    const ok = scored.filter(function (s) { return s.score >= 0; });
    const pickFrom = ok.length ? ok : scored;
    chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  }

  const place = chosen.p;
  const emoji = place.emoji || cuisineEmoji(place.food);
  const matchSafe = escapeHtml(chosen.matched);
  const why = chosen.matched
    ? (sv ? "💚 För att du gillar <strong>" + matchSafe + "</strong>" : "💚 Because you like <strong>" + matchSafe + "</strong>")
    : (sv ? "💚 Vald för din smak (inget perfekt matchade — men inget du ogillar!)" : "💚 Picked for your taste (no perfect match nearby — but nothing you dislike!)");

  localStorage.setItem("bitebuddy-search", place.name);
  addToHistory(place.name);

  recommendCard.innerHTML =
    '<div class="pick-emoji">' + emoji + "</div>" +
    '<div class="pick-title">' + (sv ? "För dig: " : "For you: ") + "<strong>" + escapeHtml(place.name) + "</strong></div>" +
    '<div class="pick-food">' + why + "</div>" +
    (place.food ? '<div class="pick-food">' + escapeHtml(place.food) + "</div>" : "") +
    '<a href="results.html" class="btn-primary big-btn">' + (sv ? "Se detaljer 🔍" : "See details 🔍") + "</a>";

  renderHistory();
});


/* ===== ✨ RECOMMENDED RESTAURANTS LIST (real picks for your location) ===== */
async function loadRecos() {
  const listEl = document.getElementById("recos-list");
  const subEl = document.getElementById("recos-sub");
  if (!listEl) return;
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  const loc = (localStorage.getItem("bitebuddy-location") || "").trim();
  const likes = bbParse("bitebuddy-likes", []);
  const dislikes = bbParse("bitebuddy-dislikes", []);

  // Only show "Recommended for you" when Forky can give a meaningful list:
  // a real CITY was chosen, OR you have saved tastes. On "near me" (or no location)
  // without tastes there's nothing personal to show → keep it hidden.
  const recosEl = document.getElementById("recos");
  const hasRealCity = isRealCity(loc);
  const hasTastes = likes.length > 0 || dislikes.length > 0;
  if (!hasRealCity && !hasTastes) {
    if (recosEl) recosEl.style.display = "none";   // stay hidden until we know something
    return;
  }
  if (recosEl) recosEl.style.display = "";         // pops back up once we do

  if (subEl) subEl.textContent = "";
  listEl.innerHTML = '<div class="loading-row"><span class="spinner"></span> ' +
    (sv ? "Forky letar efter bra ställen…" : "Forky is finding good spots…") + "</div>";

  // get nearby places (nearbyFoodPlaces now caches internally, shared with the buttons)
  let pool = [];
  if (typeof nearbyFoodPlaces === "function") { try { pool = await nearbyFoodPlaces(loc); } catch (e) { pool = []; } }

  // fallback (only honest for Landskrona / near-without-GPS)
  if (!pool || !pool.length) {
    const lc = loc.toLowerCase();
    const nearish = lc === "" || /near|nära|📍/.test(lc);
    const hasGeo = !!localStorage.getItem("bitebuddy-geo");
    if (lc === "landskrona" || (nearish && !hasGeo)) pool = landskronaPlaces;
    else { listEl.innerHTML = '<p class="recos-empty">' + (sv ? "Inga rekommendationer just nu — prova en stad eller 📍." : "No recommendations right now — try a city or 📍.") + "</p>"; return; }
  }

  // score by your taste, best first
  const scored = pool.map(function (p) { const t = tasteScore(p, likes, dislikes); return { p: p, s: t.score, m: t.matched }; });
  scored.sort(function (a, b) { return b.s - a.s; });
  const top = scored.slice(0, 6);

  const where = (loc && !/near|nära|📍/i.test(loc)) ? loc : (sv ? "nära dig" : "near you");
  // only claim "matched to your taste" when something in the list actually matched
  const anyMatched = top.some(function (item) { return item.m; });
  if (subEl) subEl.textContent = (likes.length && anyMatched ? (sv ? "Matchat till din smak · " : "Matched to your taste · ") : "") + (sv ? "i " : "in ") + where + " 🍴";

  listEl.innerHTML = "";
  top.forEach(function (item) {
    const place = item.p;
    const emoji = place.emoji || cuisineEmoji(place.food);
    const btn = document.createElement("button");
    btn.className = "reco-item";
    btn.innerHTML = '<span class="reco-emoji">' + emoji + "</span>" +
      '<span class="reco-info"><span class="reco-name">' + (item.m ? "💚 " : "") + escapeHtml(place.name) + "</span>" +
      (place.food ? '<span class="reco-food">' + escapeHtml(place.food) + "</span>" : "") + "</span>" +
      '<span class="reco-go">→</span>';
    btn.addEventListener("click", function () { goToPlace(place.name); });
    listEl.appendChild(btn);
  });
}
loadRecos();   // show the list when the homepage opens


/* ===== FEEDBACK BOX ===== */
const feedbackInput = document.getElementById("feedback-input");
const feedbackBtn = document.getElementById("feedback-btn");
const feedbackMessage = document.getElementById("feedback-message");

feedbackBtn.addEventListener("click", function () {
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  const text = feedbackInput.value.trim();

  if (text === "") {
    feedbackMessage.textContent = sv ? "🐾 Skriv något först!" : "🐾 Type something first, then Forky will catch it!";
    return;
  }

  // Save it so you can read it later in the Admin Panel.
  const saved = bbParse("bitebuddy-feedback", []);
  saved.push({ text: text, time: Date.now() });
  localStorage.setItem("bitebuddy-feedback", JSON.stringify(saved));

  feedbackMessage.textContent = sv ? "🐾 Tack! Forky fångade din idé. 💚" : "🐾 Thanks! Forky caught your idea. 💚";
  feedbackInput.value = "";
});


/* ===== 📲 SHARE BITEBUDDY — native share sheet on phones, copy-link on computers ===== */
const shareBtn = document.getElementById("share-btn");
const shareMsg = document.getElementById("share-msg");
if (shareBtn) {
  shareBtn.addEventListener("click", async function () {
    const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
    const url = "https://magicbuss69.github.io/review-recommend-app/";
    const text = sv
      ? "Kolla in BiteBuddy 🐾 — den läser recensionerna åt dig och föreslår vad du ska beställa!"
      : "Check out BiteBuddy 🐾 — it reads the reviews for you and tells you what to order!";
    try {
      if (navigator.share) {
        await navigator.share({ title: "BiteBuddy", text: text, url: url }); // phone Share sheet
      } else {
        await navigator.clipboard.writeText(url);                            // computer: copy link
        if (shareMsg) shareMsg.textContent = sv ? "🔗 Länk kopierad! Klistra in och dela. 💙" : "🔗 Link copied! Paste it anywhere to share. 💙";
      }
    } catch (e) {
      if (shareMsg) shareMsg.textContent = sv ? "🔗 Dela den här länken: " + url : "🔗 Share this link: " + url;
    }
  });
}
