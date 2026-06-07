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
      "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.reviews,places.formattedAddress",
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

  return {
    found: true,
    name: p.displayName ? p.displayName.text : placeName,
    rating: p.rating || null,
    count: p.userRatingCount || 0,
    address: p.formattedAddress || "",
    reviews: reviews,
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

  const rules =
    "You summarise restaurant reviews HONESTLY. Use ONLY the reviews provided — " +
    "never invent dishes, prices, or facts. If something is not mentioned, do not claim it. " +
    "Reply ONLY as JSON in this shape: " +
    '{"summary":"one friendly sentence","good":["short point","short point"],"bad":["short point"]}. ' +
    "Reply in the same language as the reviews.";

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
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2" +
    "&limit=5&namedetails=1&addressdetails=1&q=" + encodeURIComponent(q + ", " + city + ", Sweden");

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 6000);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const seen = {};
    return (data || []).map(function (p) {
      const name = (p.namedetails && p.namedetails.name) ||
                   (p.display_name ? p.display_name.split(",")[0] : "");
      const area = p.display_name ? p.display_name.split(",").slice(1, 3).join(",").trim() : "";
      return { name: name, area: area };
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
