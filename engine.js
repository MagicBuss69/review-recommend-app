/*
  BiteBuddy — engine.js
  The "brain" that fetches REAL restaurant info from Google and summarises it HONESTLY.
  Two keys are used (both from config.js):
    - googleMapsKey → fetches the real place + real reviews from Google
    - geminiKey     → turns those real reviews into an honest good/bad summary
  The golden rule: the AI only ever summarises reviews we actually fetched — it never
  invents anything. No keys → the page is honest about having no real data yet.
*/

// ---- read the keys from config.js (return null if empty/missing) ----
function getGeminiKey() {
  return (window.BITEBUDDY_CONFIG && window.BITEBUDDY_CONFIG.geminiKey) || null;
}
function getGoogleMapsKey() {
  return (window.BITEBUDDY_CONFIG && window.BITEBUDDY_CONFIG.googleMapsKey) || null;
}

/*
  STEP 1 — fetch the REAL place from Google Maps (Places API "New").
  Returns: { found:true, name, rating, count, address, reviews:[texts] }
        or { found:false }   (place not found)
        or null              (no Maps key set)
  Note: from a plain browser this may hit a CORS wall — if so, this is the part that
  later runs on a small server. The code is ready either way.
*/
async function fetchPlace(placeName) {
  const key = getGoogleMapsKey();
  if (!key) return null;

  // Aim the search at the right town (use the chosen location, else Landskrona).
  const loc = localStorage.getItem("bitebuddy-location");
  const query = placeName + ((loc && loc !== "near") ? ", " + loc : ", Landskrona");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      // only ask for the fields we need (keeps it cheap + fast)
      // "places.photos" → real photos 📸 ; "places.location" → map coordinates 🗺️
      "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.reviews,places.formattedAddress,places.photos,places.location",
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) throw new Error("Google Places status " + res.status);

  const data = await res.json();
  if (!data.places || data.places.length === 0) return { found: false };

  const p = data.places[0];
  const reviews = (p.reviews || [])
    .map(function (r) { return r.text && r.text.text ? r.text.text : ""; })
    .filter(Boolean);

  // 📸 Turn Google's photo "tickets" into real image links.
  // Each photo has a "name" (the ticket). We swap it for the actual picture at
  // the Places photo address. maxWidthPx=600 keeps the images small & fast.
  // We take up to 4 photos to fill the photo strip on the results page.
  const photos = (p.photos || [])
    .slice(0, 4)
    .map(function (ph) {
      return "https://places.googleapis.com/v1/" + ph.name +
             "/media?maxWidthPx=600&key=" + key;
    });

  return {
    found: true,
    name: p.displayName ? p.displayName.text : placeName,
    rating: p.rating || null,
    count: p.userRatingCount || 0,
    address: p.formattedAddress || "",
    reviews: reviews,
    photos: photos,   // 📸 real pictures of the place (empty if Google had none)
    // 🗺️ coordinates → lets the results page draw a map (using the free OSM embed)
    lat: p.location ? p.location.latitude : null,
    lon: p.location ? p.location.longitude : null,
  };
}

/*
  STEP 2 — ask Gemini to summarise ONLY those real reviews (grounded = no inventing).
  Returns { summary, good:[...], bad:[...] } or null if there's no Gemini key.
*/
async function summarizeReviews(placeName, reviews) {
  const key = getGeminiKey();
  if (!key) return null;

  const model = "gemini-2.0-flash"; // if this errors, try "gemini-1.5-flash"
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;

  // reply in the language the USER picked on the site (not the reviews' language)
  const lang = (localStorage.getItem("bitebuddy-lang") || "en") === "sv" ? "Swedish" : "English";

  const rules =
    "You summarise restaurant reviews HONESTLY. Use ONLY the reviews provided — " +
    "never invent dishes, prices, or facts. If something is not mentioned, do not claim it. " +
    "Also pick the top dishes that reviewers actually PRAISE (the things to order). " +
    "Only include a dish if a review really mentions it. If none are named, use an empty list. " +
    "Reply ONLY as JSON in this shape: " +
    '{"summary":"one friendly sentence","good":["short point"],"bad":["short point"],' +
    '"dishes":["dish name"],"drinks":["drink name"],' +
    '"meal":{"main":"","side":"","drink":"","dessert":""}}. ' +
    "List at most 4 dishes, most-loved first. " +
    "For 'meal', suggest ONE full meal using ONLY items reviewers actually mention: the best " +
    "main dish, plus a side, a drink and a dessert IF mentioned. Leave any field an empty " +
    'string "" when reviewers do not mention it — NEVER invent menu items. ' +
    "Always reply in " + lang + ", even if the reviews are in another language.";

  const reviewText = reviews.map(function (r, i) { return (i + 1) + ". " + r; }).join("\n");
  const prompt = "Restaurant: " + placeName + "\nReviews:\n" + reviewText;

  const body = {
    system_instruction: { parts: [{ text: rules }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Gemini status " + res.status);

  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/*
  💬 SUMMARISE FEEDBACK — the AI reads a user's message and boils it down to one line,
  plus a type (idea / bug / praise / other) and a mood. Used by the feedback box so YOU
  get a quick, clear read of what people said. Returns null if there's no Gemini key.
*/
async function summarizeFeedback(text) {
  const key = getGeminiKey();
  if (!key) return null;

  const model = "gemini-2.0-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;

  const rules =
    "You read short user feedback for a food app called BiteBuddy. Reply ONLY as JSON: " +
    '{"summary":"one short friendly sentence","type":"idea|bug|praise|other","mood":"😀|😐|😕"}. ' +
    "Keep the summary under 15 words.";

  const body = {
    system_instruction: { parts: [{ text: rules }] },
    contents: [{ parts: [{ text: text }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Gemini status " + res.status);

  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/*
  FREE place lookup via OpenStreetMap (Nominatim) — no key, no credit card! 🆓
  Gives the real place + basic info (address, cuisine, website, hours).
  ❗ It has NO reviews — for those we use the users' own notes (below).
  Returns { found:true, name, address, cuisine, website, hours, source } or { found:false }.
*/
// one OpenStreetMap search, with an 8s timeout so it can never hang forever
async function osmSearch(q) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2" +
    "&addressdetails=1&namedetails=1&extratags=1&limit=1&q=" + encodeURIComponent(q);
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 8000);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) throw new Error("OpenStreetMap status " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPlaceOSM(placeName) {
  const loc = localStorage.getItem("bitebuddy-location");
  const city = (loc && loc !== "near") ? loc : "Landskrona";

  // Try several ways to find it before giving up (more bulletproof).
  let data = await osmSearch(placeName + ", " + city + ", Sweden");
  if (!data || data.length === 0) data = await osmSearch(placeName + ", Sweden");
  if (!data || data.length === 0) data = await osmSearch(placeName);
  if (!data || data.length === 0) return { found: false };

  const p = data[0];
  const tags = p.extratags || {};
  const name = (p.namedetails && p.namedetails.name) ||
               (p.display_name ? p.display_name.split(",")[0] : placeName);

  return {
    found: true,
    name: name,
    address: p.display_name || "",
    cuisine: tags.cuisine || null,
    website: tags.website || null,
    menu: tags["website:menu"] || null,
    hours: tags.opening_hours || null,
    phone: tags.phone || tags["contact:phone"] || null,
    takeaway: tags.takeaway || null,
    vegetarian: tags["diet:vegetarian"] || null,
    vegan: tags["diet:vegan"] || null,
    outdoor: tags.outdoor_seating || null,
    lat: p.lat || null,
    lon: p.lon || null,
    source: "OpenStreetMap",
  };
}

/*
  🎲 NEARBY FOOD PLACES — powers the "Recommend me a place" button.
  Finds REAL restaurants/cafés near a city, so the random pick works in ANY city
  (not just a hard-coded list). Two free steps, no key needed:
    1. Geocode the city → its coordinates (Nominatim / OpenStreetMap).
    2. Ask Overpass for food spots around that point (~3 km).
  Returns a list of { name, food }. If anything fails it returns [] — the caller then
  falls back to a small built-in list, so the button NEVER breaks.
*/
// Did the user choose "Near me" (in any language / form) rather than type a city?
function bbIsNear(loc) {
  const s = (loc || "").toLowerCase().trim();
  return s === "" || s === "near" || s.indexOf("near me") >= 0 || s.indexOf("nära") >= 0 || s.indexOf("📍") >= 0;
}
// Their real location, saved by the 📍 button (or null if they never shared it).
function bbGetGeo() {
  try { return JSON.parse(localStorage.getItem("bitebuddy-geo") || "null"); } catch (e) { return null; }
}

async function nearbyFoodPlaces(loc) {
  try {
    // 1) work out WHERE to look:
    let lat, lon;
    const geo = bbGetGeo();
    if (bbIsNear(loc) && geo && geo.lat) {
      lat = geo.lat; lon = geo.lon;                 // real "near me" coordinates 📍
    } else {
      const city = bbIsNear(loc) ? "Landskrona" : loc;   // a typed city (or default)
      let g = await osmSearch(city + ", Sweden");
      if (!g || !g.length) g = await osmSearch(city); // try without the country too
      if (!g || !g.length) return [];
      lat = g[0].lat; lon = g[0].lon;
    }

    // 2) ask Overpass for nearby restaurants, cafés & fast food (with their coordinates)
    const query =
      "[out:json][timeout:10];" +
      '(node["amenity"~"^(restaurant|cafe|fast_food)$"]["name"](around:3000,' + lat + "," + lon + "););" +
      "out 80;";
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 9000);
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        signal: ctrl.signal,
      });
      if (!res.ok) return [];
      const data = await res.json();
      const seen = {};
      return (data.elements || [])
        .map(function (e) {
          const t = e.tags || {};
          // keep lat/lon too → the Explore map uses them to drop pins 📍
          return { name: t.name, food: t.cuisine ? t.cuisine.replace(/[_;]/g, " ") : null, lat: e.lat, lon: e.lon };
        })
        .filter(function (p) {
          if (!p.name) return false;
          const k = p.name.toLowerCase();
          if (seen[k]) return false;       // drop duplicates
          seen[k] = true;
          return true;
        });
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    return [];   // any hiccup → let the caller use its fallback list
  }
}

/*
  🔥 WEEKLY STREAK helpers (shared). A streak counts the WEEKS in a row you use
  BiteBuddy — friendlier than a daily streak (nobody tries a restaurant every day).
*/
function bbWeekKey(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = d.getUTCDay() || 7;                 // Monday=1 … Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - day);         // nearest Thursday = ISO week anchor
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + "-W" + weekNo;
}
// Mark "I used BiteBuddy this week" (call when a real place is searched).
function bbMarkActiveWeek() {
  const wk = bbWeekKey(new Date());
  let arr;
  try { arr = JSON.parse(localStorage.getItem("bitebuddy-active-weeks") || "[]"); } catch (e) { arr = []; }
  if (arr.indexOf(wk) === -1) { arr.push(wk); localStorage.setItem("bitebuddy-active-weeks", JSON.stringify(arr)); }
}

/*
  The users' own notes for a place = our FREE "reviews".
  Notes are saved as { place, text } so each place only shows ITS own notes.
*/
function getUserNotes(placeName) {
  const all = JSON.parse(localStorage.getItem("bitebuddy-notes") || "[]");
  return all
    .filter(function (n) {
      return n && typeof n === "object" && n.place && placeName &&
             n.place.toLowerCase() === placeName.toLowerCase();
    })
    .map(function (n) { return n.text; });
}

/*
  ===== SIMPLE CACHE (the "reuse" feature) =====
  Saves a place's info the first time, then reuses it next time instead of fetching
  again. This makes repeat lookups instant AND saves Google calls (= saves money).
  This is the SIMPLE level (browser-only). The BIG win — one fetch helping ALL users —
  comes later with the shared cache on the Raspberry Pi server.
*/
function cacheGet(key) {
  try {
    const raw = localStorage.getItem("bitebuddy-cache:" + key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const ageDays = (Date.now() - obj.time) / (1000 * 60 * 60 * 24);
    if (ageDays > 7) return null;          // expire after a week to stay fresh
    return obj.data;
  } catch (e) { return null; }
}
function cacheSet(key, data) {
  try {
    localStorage.setItem("bitebuddy-cache:" + key, JSON.stringify({ time: Date.now(), data: data }));
  } catch (e) { /* storage full or blocked — just skip caching */ }
}

/*
  Look up a place WITH caching. First checks the saved copy; only calls the internet
  if we don't already have a fresh one. Uses Google if a Maps key is set, else free OSM.
*/
async function lookupPlace(placeName) {
  const loc = localStorage.getItem("bitebuddy-location") || "near";
  const useGoogle = !!getGoogleMapsKey();
  const key = (useGoogle ? "g:" : "o:") + loc + ":" + placeName.toLowerCase();

  const cached = cacheGet(key);
  if (cached) { cached._fromCache = true; return cached; }   // ⚡ reuse — no internet call!

  const place = useGoogle ? await fetchPlace(placeName) : await fetchPlaceOSM(placeName);
  if (place && place.found) cacheSet(key, place);            // remember it for next time
  return place;
}

/*
  LAZY SEARCH / autocomplete — like Google's "did you mean as you type".
  Returns up to 5 matching places for the text typed so far. OpenStreetMap matches
  loosely, so even a half-typed or misspelled name surfaces the real place to pick.
*/
async function searchSuggestions(text) {
  const q = (text || "").trim();
  if (q.length < 2) return [];

  const loc = localStorage.getItem("bitebuddy-location");
  const city = (loc && loc !== "near") ? loc : "Landskrona";

  // Photon is a FREE OpenStreetMap search engine built for type-ahead (handles partial
  // words & misspellings). We filter to food places so suggestions are restaurants/cafés.
  const foodTags =
    "&osm_tag=amenity:restaurant&osm_tag=amenity:cafe&osm_tag=amenity:fast_food" +
    "&osm_tag=amenity:bar&osm_tag=amenity:pub&osm_tag=amenity:bakery";
  const url = "https://photon.komoot.io/api/?limit=6&lang=en" + foodTags +
    "&q=" + encodeURIComponent(q + " " + city);

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const seen = {};
    return (data.features || []).map(function (f) {
      const p = f.properties || {};
      const area = [p.city, p.street].filter(Boolean).join(", ");
      return { name: p.name || "", area: area };
    }).filter(function (s) {
      if (!s.name || seen[s.name.toLowerCase()]) return false;  // drop blanks & duplicates
      seen[s.name.toLowerCase()] = true;
      return true;
    });
  } catch (e) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/*
  Rough check: does this look like a real place name, or just random gibberish?
  Used to politely DECLINE nonsense (e.g. "asdfgh") instead of treating it as a place.
  Kept lenient so it never rejects a real (even foreign) name by mistake.
*/
function looksLikeGibberish(text) {
  const t = (text || "").trim().toLowerCase();
  const letters = t.replace(/[^a-zåäöéè]/g, "");
  if (letters.length < 2) return true;                       // too short to be a name
  const vowels = (letters.match(/[aeiouyåäöéè]/g) || []).length;
  if (letters.length >= 4 && vowels / letters.length < 0.18) return true; // almost no vowels
  if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(t)) return true;     // long run of consonants
  return false;
}
