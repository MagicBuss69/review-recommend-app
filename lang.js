/*
  BiteBuddy — lang.js (the language system: English 🇬🇧 + Svenska 🇸🇪)
  How it works:
   - Every bit of text we want to translate gets a data-i18n="some.key" in the HTML.
   - Below we list what each key says in English (en) and Swedish (sv).
   - When you pick a language, we loop over those elements and swap the words.
   - The choice is saved, so the site stays in your language on EVERY page next time.

  🌍 To add a new language later (e.g. German), copy the "en" block, rename it "de",
  translate each line, and add an <option value="de"> to the menu. That's it!
*/

const translations = {
  en: {
    /* shared / navigation */
    "nav.how": "How it works",
    "nav.profile": "🐾 Profile",
    "nav.login": "Log in",
    "nav.home": "Home",
    "nav.logout": "Log out",
    "nav.newsearch": "New search 🔍",
    "nav.backresult": "Back to result",
    "footer": "🐾 BiteBuddy — made with curiosity by Magic.",

    /* homepage */
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

    /* results page */
    "results.banner": "✨ Demo result with sample data — real reviews coming soon!",
    "results.foryou": "💚 For you",
    "results.waiterbtn": "👨‍🍳 Chat with the AI waiter before you go",
    "results.photonote": "📷 Photo placeholders — real photos arrive with Google later.",
    "results.infotitle": "ℹ️ Good to know",
    "results.saytitle": "📝 What people say",
    "results.say1": "👍 Juicy smash burgers & crispy chicken, friendly staff",
    "results.say2": "👍 Loaded fries and thick milkshakes are a hit 🥤",
    "results.say3": "👎 Can get busy at lunch — short wait sometimes",
    "results.say4": "👎 A few wish there were more veggie choices",
    "results.healthtitle": "💰 Business health",
    "results.healthgood": "Brand new & buzzing 🚀",
    "results.healthtext": "Just opened a couple of months ago, but early reviews are glowing and word is spreading fast.",
    "results.notetitle": "📝 Been here? Add your own note",
    "results.notesub": "Share what YOU thought — it helps other food lovers.",
    "results.noteplaceholder": "Type your own thoughts about this place...",
    "results.notebtn": "Add my note 🐾",
    "results.another": "Check another place 🔍",

    /* AI waiter page */
    "waiter.banner": "✨ Demo waiter — gives sample answers for now. Real AI coming soon!",
    "waiter.title": "👨‍🍳 Tony, your AI waiter",
    "waiter.subtitle": "at Mister York, Landskrona · ask me anything before you visit!",
    "waiter.placeholder": "Ask Tony... (e.g. 'what's good here?')",
    "waiter.askbtn": "Ask 🍽️",
    "waiter.chip1": "Best burger?",
    "waiter.chip2": "Vegetarian?",
    "waiter.chip3": "Milkshakes?",
    "waiter.chip4": "Busy times?",

    /* profile page */
    "profile.banner": "👀 Preview — these points and badges are pretend, just to show the idea!",
    "profile.handle": "🍴 Member since June 2026",
    "profile.points": "💎 Points",
    "profile.streak": "🔥 Week streak",
    "profile.places": "🍽️ Places tried",
    "profile.tastestitle": "🍽️ My tastes",
    "profile.tasteshint": "Add foods you love and foods you avoid — this is what powers your personal \"FOR YOU\" picks! 💚",
    "profile.tasteplaceholder": "Type a food, e.g. burgers...",
    "profile.likebtn": "💚 Like",
    "profile.dislikebtn": "👎 Dislike",
    "profile.ilike": "💚 I like",
    "profile.idislike": "👎 I dislike",
    "profile.badgestitle": "🏅 My badges",
    "profile.badgeshint": "Earn these by trying places, writing helpful tips, and keeping streaks.",
    "badge.taco": "Taco Explorer",
    "badge.pizza": "Pizza Pro",
    "badge.reviewer": "Helpful Reviewer",
    "badge.streak3": "3-Week Streak",
    "badge.sushi": "Sushi Master (locked)",
    "badge.top10": "Top 10 (locked)",
    "profile.milestonestitle": "🎯 Milestones",
    "profile.milestoneshint": "These never disappear — no pressure, just keep going at your own pace!",
    "profile.m1": "Try 25 places",
    "profile.m2": "Write 10 helpful tips",
    "profile.m3": "Earn 2,000 points",
    "profile.shoptitle": "🎨 Customize: banner color",
    "profile.shophint": "Spend points on looks! Click a color to try it on your banner above. 💎",
    "profile.exclusivetitle": "👑 Exclusive: Top 10 banner",
    "profile.exclusivehint": "Can't be bought with points — only the leaderboard's best win it each month!",
    "profile.lockedpill": "🔒 Reach Top 10 to unlock",
  },

  sv: {
    /* shared / navigation */
    "nav.how": "Så funkar det",
    "nav.profile": "🐾 Profil",
    "nav.login": "Logga in",
    "nav.home": "Hem",
    "nav.logout": "Logga ut",
    "nav.newsearch": "Ny sökning 🔍",
    "nav.backresult": "Tillbaka till resultat",
    "footer": "🐾 BiteBuddy — skapad med nyfikenhet av Magic.",

    /* homepage */
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

    /* results page */
    "results.banner": "✨ Demoresultat med exempeldata — riktiga recensioner kommer snart!",
    "results.foryou": "💚 För dig",
    "results.waiterbtn": "👨‍🍳 Chatta med AI-kyparen innan du går",
    "results.photonote": "📷 Platshållare för foton — riktiga foton kommer med Google senare.",
    "results.infotitle": "ℹ️ Bra att veta",
    "results.saytitle": "📝 Vad folk säger",
    "results.say1": "👍 Saftiga smashburgare & krispig kyckling, trevlig personal",
    "results.say2": "👍 Loaded fries och tjocka milkshakes är en hit 🥤",
    "results.say3": "👎 Kan bli fullt vid lunch — ibland kort väntan",
    "results.say4": "👎 Några önskar fler vegetariska val",
    "results.healthtitle": "💰 Företagets hälsa",
    "results.healthgood": "Helt nytt & populärt 🚀",
    "results.healthtext": "Öppnade för ett par månader sedan, men de tidiga recensionerna är lysande och ryktet sprids snabbt.",
    "results.notetitle": "📝 Varit här? Lägg till din egen kommentar",
    "results.notesub": "Dela vad DU tyckte — det hjälper andra matälskare.",
    "results.noteplaceholder": "Skriv dina egna tankar om stället...",
    "results.notebtn": "Lägg till min kommentar 🐾",
    "results.another": "Kolla ett annat ställe 🔍",

    /* AI waiter page */
    "waiter.banner": "✨ Demokypare — ger exempelsvar just nu. Riktig AI kommer snart!",
    "waiter.title": "👨‍🍳 Tony, din AI-kypare",
    "waiter.subtitle": "på Mister York, Landskrona · fråga mig vad som helst innan du besöker!",
    "waiter.placeholder": "Fråga Tony... (t.ex. 'vad är gott här?')",
    "waiter.askbtn": "Fråga 🍽️",
    "waiter.chip1": "Bästa burgaren?",
    "waiter.chip2": "Vegetariskt?",
    "waiter.chip3": "Milkshakes?",
    "waiter.chip4": "Rusningstider?",

    /* profile page */
    "profile.banner": "👀 Förhandsvisning — dessa poäng och märken är på låtsas, bara för att visa idén!",
    "profile.handle": "🍴 Medlem sedan juni 2026",
    "profile.points": "💎 Poäng",
    "profile.streak": "🔥 Veckostreak",
    "profile.places": "🍽️ Ställen testade",
    "profile.tastestitle": "🍽️ Mina smaker",
    "profile.tasteshint": "Lägg till mat du älskar och mat du undviker — det är detta som driver dina personliga \"FÖR DIG\"-val! 💚",
    "profile.tasteplaceholder": "Skriv en maträtt, t.ex. burgare...",
    "profile.likebtn": "💚 Gilla",
    "profile.dislikebtn": "👎 Ogilla",
    "profile.ilike": "💚 Jag gillar",
    "profile.idislike": "👎 Jag ogillar",
    "profile.badgestitle": "🏅 Mina märken",
    "profile.badgeshint": "Tjäna dessa genom att testa ställen, skriva hjälpsamma tips och hålla streaks.",
    "badge.taco": "Taco-utforskare",
    "badge.pizza": "Pizzaproffs",
    "badge.reviewer": "Hjälpsam recensent",
    "badge.streak3": "3-veckorsstreak",
    "badge.sushi": "Sushimästare (låst)",
    "badge.top10": "Topp 10 (låst)",
    "profile.milestonestitle": "🎯 Milstolpar",
    "profile.milestoneshint": "Dessa försvinner aldrig — ingen press, fortsätt bara i din egen takt!",
    "profile.m1": "Testa 25 ställen",
    "profile.m2": "Skriv 10 hjälpsamma tips",
    "profile.m3": "Tjäna 2 000 poäng",
    "profile.shoptitle": "🎨 Anpassa: bannerfärg",
    "profile.shophint": "Spendera poäng på utseende! Klicka på en färg för att testa den på din banner ovan. 💎",
    "profile.exclusivetitle": "👑 Exklusivt: Topp 10-banner",
    "profile.exclusivehint": "Kan inte köpas med poäng — bara topplistans bästa vinner den varje månad!",
    "profile.lockedpill": "🔒 Nå Topp 10 för att låsa upp",
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
