/*
  BiteBuddy — script.js (JavaScript = the actions / behavior)
  Right now the "read the reviews" brain isn't built yet, so when you click
  "Find out!" we show a friendly message. We'll wire up the real review-reading later.
*/

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
  let hist = JSON.parse(localStorage.getItem("bitebuddy-history") || "[]");
  // drop any older copy of the same name, so it jumps back to the top
  hist = hist.filter(function (item) { return item.name.toLowerCase() !== name.toLowerCase(); });
  hist.unshift({ name: name, time: Date.now() });   // add to the front with the current time
  hist = hist.slice(0, 6);                            // keep the list short
  localStorage.setItem("bitebuddy-history", JSON.stringify(hist));
}

// Turn a saved time into friendly text like "just now" or "2h ago" (the time mechanic!).
function timeAgo(ms) {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

// Draw the recent list and make each item tappable to reopen that result.
function renderHistory() {
  if (!recent) return;
  const hist = JSON.parse(localStorage.getItem("bitebuddy-history") || "[]");
  if (hist.length === 0) { recent.innerHTML = ""; return; }

  let html = '<div class="recent-title">🕘 Recent</div><div class="recent-list">';
  hist.forEach(function (item) {
    html += '<button class="recent-chip" data-name="' + item.name.replace(/"/g, "&quot;") + '">' +
            item.name + ' <span class="recent-time">' + timeAgo(item.time) + '</span></button>';
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


// What happens when the button is clicked
button.addEventListener("click", function () {
  const link = input.value.trim();   // the text the user typed

  if (link === "") {
    // They clicked without pasting anything
    message.textContent = "🐾 Type a restaurant name first, then let Forky sniff it out!";
    return;
  }

  // Remember what they searched (name OR link) so the results page can show it.
  localStorage.setItem("bitebuddy-search", link);
  addToHistory(link);   // also add it to the "Recent" list

  // Let the user know Forky is "thinking" (with a spinner), then go to results.
  message.innerHTML = '<span class="spinner"></span> 🐾 Forky is sniffing out the reviews...';
  setTimeout(function () {
    window.location.href = "results.html";
  }, 900); // a short, friendly pause so it feels like Forky is working
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
          item.innerHTML = "🍽️ <strong>" + s.name + "</strong>" +
            (s.area ? ' <span class="sugg-area">' + s.area + "</span>" : "");
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
  let h = JSON.parse(localStorage.getItem("bitebuddy-loc-history") || "[]");
  h = h.filter(function (x) { return x.toLowerCase() !== v.toLowerCase(); });  // no duplicates
  h.unshift(v);                                     // newest first
  h = h.slice(0, 6);                                // keep it short
  localStorage.setItem("bitebuddy-loc-history", JSON.stringify(h));
}
function renderLocHistory() {
  const el = document.getElementById("loc-history");
  if (!el) return;
  const h = JSON.parse(localStorage.getItem("bitebuddy-loc-history") || "[]");
  if (!h.length) { el.innerHTML = ""; return; }
  const sv = (localStorage.getItem("bitebuddy-lang") || "en") === "sv";
  let html = '<span class="loc-history-title">' + (sv ? "🕘 Senaste:" : "🕘 Recent:") + "</span>";
  h.forEach(function (c) {
    const safe = c.replace(/"/g, "&quot;");
    html += '<span class="loc-chip"><button class="loc-go" data-loc="' + safe + '">' + c +
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
    });
  });
  // ✕ on a chip → remove just that city from history
  el.querySelectorAll(".loc-x").forEach(function (x) {
    x.addEventListener("click", function () {
      const v = x.dataset.loc;
      let list = JSON.parse(localStorage.getItem("bitebuddy-loc-history") || "[]");
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
  const foodLine = pick.food ? '<div class="pick-food">' + pick.food + "</div>" : "";

  // Remember the pick so the results page ("See details") shows this place.
  localStorage.setItem("bitebuddy-search", pick.name);
  addToHistory(pick.name);

  recommendCard.innerHTML =
    '<div class="pick-emoji">' + emoji + "</div>" +
    '<div class="pick-title">' + (sv ? "Forky väljer: " : "Forky picks: ") + "<strong>" + pick.name + "</strong></div>" +
    foodLine +
    '<a href="results.html" class="btn-primary big-btn">' + (sv ? "Se detaljer 🔍" : "See details 🔍") + "</a>";

  renderHistory();   // refresh the Recent list to show the new pick
});


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
  const saved = JSON.parse(localStorage.getItem("bitebuddy-feedback") || "[]");
  saved.push({ text: text, time: Date.now() });
  localStorage.setItem("bitebuddy-feedback", JSON.stringify(saved));

  feedbackMessage.textContent = sv ? "🐾 Tack! Forky fångade din idé. 💚" : "🐾 Thanks! Forky caught your idea. 💚";
  feedbackInput.value = "";
});
