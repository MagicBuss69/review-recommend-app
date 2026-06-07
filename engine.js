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
