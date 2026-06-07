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

// Location picker — choose "near me" or a specific city (great when travelling!).
// We save the choice so it's remembered next time.
const locationSelect = document.getElementById("location-select");
const savedLoc = localStorage.getItem("bitebuddy-location");
if (savedLoc) locationSelect.value = savedLoc;
locationSelect.addEventListener("change", function () {
  localStorage.setItem("bitebuddy-location", locationSelect.value);
});

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
  const loc = locationSelect.value;
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
    if (loc === "near" || loc === "Landskrona") {
      pool = landskronaPlaces;
    } else {
      recommendCard.innerHTML = sv
        ? "😅 Forky kunde inte nå matkartan för <strong>" + loc + "</strong> just nu — försök igen om en stund!"
        : "😅 Forky couldn't reach the food map for <strong>" + loc + "</strong> right now — try again in a moment!";
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
  const text = feedbackInput.value.trim();

  if (text === "") {
    feedbackMessage.textContent = "🐾 Type something first, then Forky will catch it!";
    return;
  }

  // Save the feedback in the browser's own little memory (localStorage), so it isn't
  // lost. Later, with a server, we can send these straight to you instead.
  const saved = JSON.parse(localStorage.getItem("bitebuddy-feedback") || "[]");
  saved.push(text);
  localStorage.setItem("bitebuddy-feedback", JSON.stringify(saved));

  // Thank them and clear the box
  feedbackMessage.textContent = "🐾 Thanks! Forky caught your idea. 💚";
  feedbackInput.value = "";
});
