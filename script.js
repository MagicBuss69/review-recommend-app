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

  // Let the user know Forky is "thinking", then go to the results page.
  // (For now the results page shows DEMO data — the real review-reading is added later.)
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
