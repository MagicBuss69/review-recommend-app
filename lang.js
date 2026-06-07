/*
  BiteBuddy — lang.js (the language system: English 🇬🇧 + Svenska 🇸🇪)
  How it works:
   - Every bit of text we want to translate gets a data-i18n="some.key" in the HTML.
   - Below we list what each key says in English (en) and Swedish (sv).
   - When you pick a language, we loop over those elements and swap the words.
   - The choice is saved, so the site stays in your language next time.
*/

const translations = {
  en: {
    "nav.how": "How it works",
    "nav.profile": "🐾 Profile",
    "nav.login": "Log in",
    "hero.tagline": "Your buddy who knows where to eat. 🐾",
    "loc.label": "📍 Location:",
    "loc.near": "Near me (closest)",
    "search.placeholder": "Type a restaurant name, or paste a link...",
    "search.btn": "Find out! 🔍",
    "or": "or",
    "recommend.btn": "🎲 Recommend me a place",
    "how.title": "How it works",
    "how.1.title": "Type a name or paste a link",
    "how.1.text": "Just type a restaurant's name — or paste a link if you have one.",
    "how.2.title": "Forky reads the reviews",
    "how.2.text": "Forky reads what everyone says, so you don't have to.",
    "how.3.title": "Get your pick",
    "how.3.text": "A clear summary — plus a recommendation made for you.",
    "feedback.title": "Got an idea for BiteBuddy? 🐾",
    "feedback.sub": "Tell Forky what you'd love to see, or anything on your mind.",
    "feedback.placeholder": "Type your thoughts here...",
    "feedback.btn": "Send to Forky 🐾",
    "footer": "🐾 BiteBuddy — made with curiosity by Magic.",
  },
  sv: {
    "nav.how": "Så funkar det",
    "nav.profile": "🐾 Profil",
    "nav.login": "Logga in",
    "hero.tagline": "Din kompis som vet var man ska äta. 🐾",
    "loc.label": "📍 Plats:",
    "loc.near": "Nära mig (närmast)",
    "search.placeholder": "Skriv ett restaurangnamn, eller klistra in en länk...",
    "search.btn": "Ta reda på det! 🔍",
    "or": "eller",
    "recommend.btn": "🎲 Rekommendera ett ställe",
    "how.title": "Så funkar det",
    "how.1.title": "Skriv ett namn eller klistra in en länk",
    "how.1.text": "Skriv bara restaurangens namn — eller klistra in en länk om du har en.",
    "how.2.title": "Forky läser recensionerna",
    "how.2.text": "Forky läser vad alla säger, så att du slipper.",
    "how.3.title": "Få ditt val",
    "how.3.text": "En tydlig sammanfattning — plus en rekommendation gjord för dig.",
    "feedback.title": "Har du en idé för BiteBuddy? 🐾",
    "feedback.sub": "Berätta för Forky vad du vill se, eller vad som helst.",
    "feedback.placeholder": "Skriv dina tankar här...",
    "feedback.btn": "Skicka till Forky 🐾",
    "footer": "🐾 BiteBuddy — skapad med nyfikenhet av Magic.",
  },
};

// Switch the whole page to a language and remember the choice.
function setLanguage(lang) {
  const dict = translations[lang] || translations.en;

  // Swap normal text (anything with data-i18n="key")
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  // Swap placeholders (the faint text inside input boxes)
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });

  localStorage.setItem("bitebuddy-lang", lang);   // remember it
  document.documentElement.lang = lang;           // set <html lang="...">

  const sel = document.getElementById("lang-select");
  if (sel) sel.value = lang;
}

// When the page is ready, use the saved language (or English by default).
document.addEventListener("DOMContentLoaded", function () {
  const savedLang = localStorage.getItem("bitebuddy-lang") || "en";
  setLanguage(savedLang);

  // Listen for the language menu in the corner.
  const sel = document.getElementById("lang-select");
  if (sel) {
    sel.addEventListener("change", function () { setLanguage(sel.value); });
  }
});
