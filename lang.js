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
    "nav.explore": "🗺️ Explore",
    "nav.guide": "📖 Guide",
    "nav.admin": "🛠️ Admin",
    "nav.profile": "Profile",
    "explore.title": "🗺️ Explore nearby",
    "explore.sub": "Tap a pin to see the place — then open Forky's review.",
    "explore.showbtn": "Show places 🍴",
    "admin.title": "🛠️ Admin Panel",
    "admin.sub": "Feedback people have sent to Forky.",
    "admin.note": "ℹ️ For now this shows feedback saved on THIS device. With a server later, it'll gather everyone's.",
    "admin.clear": "🗑️ Clear all feedback",
    "guide.title": "📖 BiteBuddy Guide",
    "guide.sub": "How to earn gems and unlock badges!",
    "guide.gemstitle": "💎 How to earn gems",
    "guide.gemsintro": "Gems are points you earn by using BiteBuddy. Spend them in the shops on your profile! 🎨",
    "guide.badgestitle": "🏅 All badges",
    "guide.badgesintro": "A ✅ means you've earned it. Keep going to unlock them all!",
    "guide.toprofile": "🐾 Go to my profile",
    "guide.signup": "🐾 Make an account to start earning",
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
    "loc.placeholder": "Type a city, or tap 📍",
    "search.placeholder": "Type a restaurant name...",
    "search.btn": "Find out! 🔍",
    "or": "or",
    "recommend.btn": "🎲 Recommend me a place",
    "how.title": "How it works",
    "how.1.title": "Type a restaurant's name",
    "how.1.text": "Just type the name of a restaurant or café — that's it!",
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
    "results.ordertitle": "🍴 What to order",
    "results.ordersub": "The dishes people rave about 👇",
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
    "waiter.chip1": "What's good?",
    "waiter.chip2": "Vegetarian?",
    "waiter.chip3": "Prices?",
    "waiter.chip4": "Busy times?",

    /* profile page */
    "profile.banner": "🌱 Your profile grows as you use BiteBuddy — earn points and badges by trying places and adding notes!",
    "profile.handle": "🍴 Member since June 2026",
    "profile.points": "💎 Gems",
    "profile.streak": "🔥 Week streak",
    "profile.notes": "✍️ Notes written",
    "profile.places": "🍽️ Places tried",
    "profile.savedtitle": "⭐ Saved places",
    "profile.savedhint": "Tap the heart on any result to save it here for later.",
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
    "profile.streaktitle": "🔥 Weekly streak",
    "profile.streakhint": "Use BiteBuddy at least once a week to keep your streak — no daily pressure!",
    "profile.shoptitle": "🎨 Banner shop",
    "profile.shophint": "Spend gems to UNLOCK banners. Once unlocked, switch between them freely! 💎",
    "profile.avatartitle": "🖼️ Profile picture shop",
    "profile.avatarhint": "Spend gems to unlock fun profile pictures, then pick your favorite!",
    "profile.exclusivetitle": "👑 Exclusive: Top 10 banner",
    "profile.exclusivehint": "Can't be bought with points — only the leaderboard's best win it each month!",
    "profile.lockedpill": "🔒 Reach Top 10 to unlock",

    /* sign up / log in page */
    "signup.banner": "👀 Demo accounts are saved just in this browser for now — real accounts come later (with a server). 🐾",
    "signup.title": "Join BiteBuddy 🐾",
    "signup.sub": "Make a free account to save your tastes and picks.",
    "signup.google": "Continue with Google",
    "signup.or": "or",
    "signup.name": "Your name",
    "signup.namePh": "e.g. Magic",
    "signup.email": "Email",
    "signup.emailPh": "you@example.com",
    "signup.password": "Password",
    "signup.passwordPh": "Make a password",
    "signup.create": "Create my account 🐾",
    "signup.toggleprompt": "Already have an account?",
    "signup.togglelink": "Log in",
    "signup.note": "🔒 We'll never share your info. This is a safe demo — nothing leaves your device yet.",
    "login.title": "Welcome back 🐾",
    "login.sub": "Log in to see your tastes and picks.",
    "login.btn": "Log in 🍴",
    "login.passwordPh": "Your password",
    "login.toggleprompt": "New here?",
    "login.togglelink": "Create an account",

    /* about / privacy page */
    "nav.about": "About",
    "about.title": "About BiteBuddy 🐾",
    "about.sub": "The friendly buddy who reads the reviews so you don't have to.",
    "about.whattitle": "🍴 What is BiteBuddy?",
    "about.what": "Type a restaurant's name and Forky reads its reviews, sums up the good and the not-so-good, and gives you a pick made for YOUR taste. Less scrolling, more eating.",
    "about.maketitle": "👦 Who made it?",
    "about.make": "BiteBuddy is built by Magic — a 13-year-old from Landskrona, Sweden — learning to code by building something real. It starts in Landskrona and grows from there.",
    "about.privtitle": "🔒 Your privacy",
    "about.priv1": "Everything you add — your tastes, notes, and recent searches — is saved ONLY in your own browser. Not on a server, not anywhere we can see.",
    "about.priv2": "We don't track you, show ads, or sell your data. Full stop.",
    "about.priv3": "When real accounts arrive later, this page will be updated with a full privacy policy, set up with an adult.",
    "about.contacttitle": "💬 Got ideas?",
    "about.contact": "Forky loves feedback! Use the idea box on the home page to tell us what you'd love to see.",
    "about.backbtn": "🏠 Back to home",
  },

  sv: {
    /* shared / navigation */
    "nav.how": "Så funkar det",
    "nav.explore": "🗺️ Utforska",
    "nav.guide": "📖 Guide",
    "nav.admin": "🛠️ Admin",
    "nav.profile": "Profil",
    "explore.title": "🗺️ Utforska i närheten",
    "explore.sub": "Tryck på en nål för att se stället — öppna sedan Forkys recension.",
    "explore.showbtn": "Visa ställen 🍴",
    "admin.title": "🛠️ Adminpanel",
    "admin.sub": "Feedback som folk har skickat till Forky.",
    "admin.note": "ℹ️ Just nu visas feedback som sparats på DEN HÄR enheten. Med en server senare samlas allas.",
    "admin.clear": "🗑️ Rensa all feedback",
    "guide.title": "📖 BiteBuddy-guide",
    "guide.sub": "Så tjänar du gems och låser upp märken!",
    "guide.gemstitle": "💎 Så tjänar du gems",
    "guide.gemsintro": "Gems är poäng du tjänar genom att använda BiteBuddy. Spendera dem i butikerna på din profil! 🎨",
    "guide.badgestitle": "🏅 Alla märken",
    "guide.badgesintro": "Ett ✅ betyder att du tjänat det. Fortsätt för att låsa upp alla!",
    "guide.toprofile": "🐾 Gå till min profil",
    "guide.signup": "🐾 Skapa ett konto för att börja tjäna",
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
    "loc.placeholder": "Skriv en stad, eller tryck 📍",
    "search.placeholder": "Skriv ett restaurangnamn...",
    "search.btn": "Ta reda på det! 🔍",
    "or": "eller",
    "recommend.btn": "🎲 Rekommendera ett ställe",
    "how.title": "Så funkar det",
    "how.1.title": "Skriv restaurangens namn",
    "how.1.text": "Skriv bara namnet på en restaurang eller ett kafé — så är det klart!",
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
    "results.ordertitle": "🍴 Vad du ska beställa",
    "results.ordersub": "Rätterna folk hyllar 👇",
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
    "waiter.chip1": "Vad är gott?",
    "waiter.chip2": "Vegetariskt?",
    "waiter.chip3": "Priser?",
    "waiter.chip4": "Rusningstider?",

    /* profile page */
    "profile.banner": "🌱 Din profil växer när du använder BiteBuddy — tjäna poäng och märken genom att testa ställen och lägga till anteckningar!",
    "profile.handle": "🍴 Medlem sedan juni 2026",
    "profile.points": "💎 Gems",
    "profile.streak": "🔥 Veckostreak",
    "profile.notes": "✍️ Anteckningar",
    "profile.places": "🍽️ Ställen testade",
    "profile.savedtitle": "⭐ Sparade ställen",
    "profile.savedhint": "Tryck på hjärtat på ett resultat för att spara det här till senare.",
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
    "profile.streaktitle": "🔥 Veckostreak",
    "profile.streakhint": "Använd BiteBuddy minst en gång i veckan för att hålla din streak — ingen daglig press!",
    "profile.shoptitle": "🎨 Bannerbutik",
    "profile.shophint": "Spendera gems för att LÅSA UPP banners. När de är upplåsta kan du byta fritt! 💎",
    "profile.avatartitle": "🖼️ Profilbildsbutik",
    "profile.avatarhint": "Spendera gems för att låsa upp roliga profilbilder, välj sedan din favorit!",
    "profile.exclusivetitle": "👑 Exklusivt: Topp 10-banner",
    "profile.exclusivehint": "Kan inte köpas med poäng — bara topplistans bästa vinner den varje månad!",
    "profile.lockedpill": "🔒 Nå Topp 10 för att låsa upp",

    /* sign up / log in page */
    "signup.banner": "👀 Demokonton sparas bara i den här webbläsaren just nu — riktiga konton kommer senare (med en server). 🐾",
    "signup.title": "Gå med i BiteBuddy 🐾",
    "signup.sub": "Skapa ett gratis konto för att spara dina smaker och val.",
    "signup.google": "Fortsätt med Google",
    "signup.or": "eller",
    "signup.name": "Ditt namn",
    "signup.namePh": "t.ex. Magic",
    "signup.email": "E-post",
    "signup.emailPh": "du@exempel.com",
    "signup.password": "Lösenord",
    "signup.passwordPh": "Skapa ett lösenord",
    "signup.create": "Skapa mitt konto 🐾",
    "signup.toggleprompt": "Har du redan ett konto?",
    "signup.togglelink": "Logga in",
    "signup.note": "🔒 Vi delar aldrig dina uppgifter. Detta är en säker demo — inget lämnar din enhet än.",
    "login.title": "Välkommen tillbaka 🐾",
    "login.sub": "Logga in för att se dina smaker och val.",
    "login.btn": "Logga in 🍴",
    "login.passwordPh": "Ditt lösenord",
    "login.toggleprompt": "Ny här?",
    "login.togglelink": "Skapa ett konto",

    /* about / privacy page */
    "nav.about": "Om",
    "about.title": "Om BiteBuddy 🐾",
    "about.sub": "Kompisen som läser recensionerna så att du slipper.",
    "about.whattitle": "🍴 Vad är BiteBuddy?",
    "about.what": "Skriv en restaurangs namn så läser Forky dess recensioner, sammanfattar det bra och det mindre bra, och ger dig ett val gjort för DIN smak. Mindre skrollande, mer ätande.",
    "about.maketitle": "👦 Vem gjorde den?",
    "about.make": "BiteBuddy är byggd av Magic — en 13-åring från Landskrona, Sverige — som lär sig koda genom att bygga något på riktigt. Den börjar i Landskrona och växer därifrån.",
    "about.privtitle": "🔒 Din integritet",
    "about.priv1": "Allt du lägger till — dina smaker, anteckningar och senaste sökningar — sparas ENDAST i din egen webbläsare. Inte på en server, inte någonstans vi kan se.",
    "about.priv2": "Vi spårar dig inte, visar inga annonser och säljer inte dina uppgifter. Punkt.",
    "about.priv3": "När riktiga konton kommer senare uppdateras den här sidan med en fullständig integritetspolicy, upprättad med en vuxen.",
    "about.contacttitle": "💬 Har du idéer?",
    "about.contact": "Forky älskar feedback! Använd idé-rutan på startsidan för att berätta vad du vill se.",
    "about.backbtn": "🏠 Tillbaka till start",
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
