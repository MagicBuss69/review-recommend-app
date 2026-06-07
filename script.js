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
    message.textContent = "🐾 Paste a restaurant link first, then let Forky sniff it out!";
    return;
  }

  // Remember what they searched (name OR link) so the results page can show it.
  localStorage.setItem("bitebuddy-search", link);
  addToHistory(link);   // also add it to the "Recent" list

  // Let the user know Forky is "thinking", then go to the results page.
  message.textContent = "🐾 Forky is sniffing out the reviews...";
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


/* ===== "RECOMMEND ME A PLACE" BUTTON =====
   For people who don't want to paste a link — Forky just picks one!
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

let lastPick = -1; // remember the last pick so we don't repeat it twice in a row

recommendBtn.addEventListener("click", function () {
  // Respect the chosen location. BiteBuddy is only live in Landskrona so far!
  const loc = locationSelect.value;
  if (loc !== "near" && loc !== "Landskrona") {
    recommendCard.innerHTML =
      '🚧 BiteBuddy is launching in <strong>Landskrona</strong> first — ' +
      '<strong>' + loc + '</strong> is coming soon! 🐾';
    return;
  }

  recommendCard.innerHTML = "🐾 Forky is picking...";

  setTimeout(function () {
    // Pick a random place that isn't the same as last time
    let i = Math.floor(Math.random() * landskronaPlaces.length);
    if (i === lastPick) i = (i + 1) % landskronaPlaces.length;
    lastPick = i;
    const place = landskronaPlaces[i];

    // Remember the pick so the results page ("See details") shows this place
    localStorage.setItem("bitebuddy-search", place.name);
    addToHistory(place.name);   // add the pick to "Recent" too

    // Show Forky's pick as a little card with a button to see details
    recommendCard.innerHTML =
      '<div class="pick-emoji">' + place.emoji + '</div>' +
      '<div class="pick-title">Forky picks: <strong>' + place.name + '</strong></div>' +
      '<div class="pick-food">' + place.food + '</div>' +
      '<a href="results.html" class="btn-primary big-btn">See details 🔍</a>';

    renderHistory();   // refresh the Recent list to show the new pick
  }, 700);
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
