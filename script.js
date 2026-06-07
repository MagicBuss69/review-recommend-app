/*
  BiteBuddy — script.js (JavaScript = the actions / behavior)
  Right now the "read the reviews" brain isn't built yet, so when you click
  "Find out!" we show a friendly message. We'll wire up the real review-reading later.
*/

// Grab the parts of the page we need to work with
const input = document.getElementById("link-input");
const button = document.getElementById("find-btn");
const message = document.getElementById("result-message");

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
  recommendCard.innerHTML = "🐾 Forky is picking...";

  setTimeout(function () {
    // Pick a random place that isn't the same as last time
    let i = Math.floor(Math.random() * landskronaPlaces.length);
    if (i === lastPick) i = (i + 1) % landskronaPlaces.length;
    lastPick = i;
    const place = landskronaPlaces[i];

    // Remember the pick so the results page ("See details") shows this place
    localStorage.setItem("bitebuddy-search", place.name);

    // Show Forky's pick as a little card with a button to see details
    recommendCard.innerHTML =
      '<div class="pick-emoji">' + place.emoji + '</div>' +
      '<div class="pick-title">Forky picks: <strong>' + place.name + '</strong></div>' +
      '<div class="pick-food">' + place.food + '</div>' +
      '<a href="results.html" class="btn-primary big-btn">See details 🔍</a>';
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
