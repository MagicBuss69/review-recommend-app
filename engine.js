/*
  BiteBuddy — engine.js
  The "brain" that turns REAL reviews into an honest summary — WITHOUT making things up.
  The trick: we only ever ask the AI to summarize reviews we GIVE it, and we tell it
  "use only these, invent nothing." That's how we stop hallucination.
*/

// Get the Gemini key from config.js (returns null if it's empty / missing).
function getGeminiKey() {
  return (window.BITEBUDDY_CONFIG && window.BITEBUDDY_CONFIG.geminiKey) || null;
}

/*
  STEP 1 — get the reviews for a place.
  FOR NOW: returns sample reviews so we can test the brain.
  LATER (brother session): this will call the Google Maps / Places API to fetch the
  REAL reviews automatically (needs the Maps key + a server for launch).
*/
async function getReviews(placeName) {
  // TODO: replace with a real Google Places API call.
  return [
    "Best smash burger I've had in Landskrona! Crispy edges and super juicy.",
    "Loaded fries were amazing and the milkshake was thick and tasty.",
    "Got a bit busy at lunch so we waited about 15 minutes, but it was worth it.",
    "Nice that they had a vegetarian option, though I wish there were more choices.",
    "Friendly staff and quick service on a weekday evening.",
  ];
}

/*
  STEP 2 — ask Gemini to summarize ONLY those real reviews.
  Returns an object: { summary: "...", good: ["..."], bad: ["..."] }
  Returns null if there's no key (so the page keeps its demo content).
*/
async function summarizeReviews(placeName, reviews) {
  const key = getGeminiKey();
  if (!key) return null;

  const model = "gemini-2.0-flash"; // if this ever errors, try "gemini-1.5-flash"
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;

  // The rules that keep the AI honest (no inventing!).
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
    generationConfig: { responseMimeType: "application/json" }, // ask Gemini for clean JSON
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("status " + res.status);

  const data = await res.json();
  const textOut = data.candidates[0].content.parts[0].text;
  return JSON.parse(textOut); // turn the JSON text into a real object
}
