/*
  BiteBuddy Proxy — Cloudflare Worker
  ===================================
  Keeps BOTH keys secret on the server and does the work for the browser:
    • /place      → searches Google Places (server-side, so no referrer block)
    • /photo      → streams a Google place photo (so the key isn't in the image URL)
    • /summarize  → turns reviews into an honest AI summary (Gemini)
    • /verify     → checks the secret "unlimited" code (from the profile page)

  Rate-limits each visitor to 3 AI summaries per day (resets daily).
  The unlimited code removes that limit for whoever knows it.

  SECRETS (set once with wrangler):
    wrangler secret put GEMINI_KEY     ← the Gemini API key
    wrangler secret put MAPS_KEY       ← the Google Maps/Places API key
    wrangler secret put UNLOCK_CODE    ← your secret "unlimited" code
*/

const DAILY_LIMIT = 3;

// Only accept browser requests from these sites (blocks strangers from using your keys)
const ALLOWED_ORIGINS = [
  "https://magicbuss69.github.io",
  "http://localhost:8080",
  "http://localhost:3000",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight (browser sends this before a real POST)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── /photo — stream a place photo (loaded by <img>, so no Origin/CORS check) ──
    // The browser asks for /photo?name=places/XXX/photos/YYY and we fetch the real
    // image from Google using the secret key, then hand back just the picture.
    if (path.endsWith("/photo")) {
      const name = url.searchParams.get("name");
      if (!name) return new Response("Missing photo name", { status: 400 });
      const photoUrl = "https://places.googleapis.com/v1/" + name +
        "/media?maxWidthPx=600&key=" + env.MAPS_KEY;
      const img = await fetch(photoUrl);
      return new Response(img.body, {
        status: img.status,
        headers: {
          "Content-Type": img.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Everything below is POST only
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    // ── Parse the request body ──────────────────────────────────────────────
    let body;
    try { body = await request.json(); }
    catch (e) { return new Response("Bad request body", { status: 400 }); }

    // ── /place — search Google Places on the server (no referrer block) ──────
    if (path.endsWith("/place")) {
      const query = body.query;
      if (!query) return json({ error: "no_query" }, 400, origin);

      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.MAPS_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.rating,places.userRatingCount,places.reviews," +
            "places.formattedAddress,places.photos,places.location,places.websiteUri",
        },
        body: JSON.stringify({ textQuery: query }),
      });

      if (!res.ok) {
        const txt = await res.text();
        return json({ error: "places_error", status: res.status, detail: txt.slice(0, 300) }, 502, origin);
      }

      const data = await res.json();
      if (!data.places || data.places.length === 0) return json({ found: false }, 200, origin);

      const p = data.places[0];
      const reviews = (p.reviews || [])
        .map((r) => (r.text && r.text.text ? r.text.text : ""))
        .filter(Boolean);

      // photo URLs point back at THIS worker's /photo so the key stays hidden
      const photos = (p.photos || []).slice(0, 4).map(
        (ph) => url.origin + "/photo?name=" + encodeURIComponent(ph.name)
      );

      return json({
        found: true,
        name: p.displayName ? p.displayName.text : query,
        rating: p.rating || null,
        count: p.userRatingCount || 0,
        address: p.formattedAddress || "",
        reviews: reviews,
        photos: photos,
        lat: p.location ? p.location.latitude : null,
        lon: p.location ? p.location.longitude : null,
        website: p.websiteUri || null,
      }, 200, origin);
    }

    // ── /nearby — find food places near a city or coords (server-side, reliable) ──
    // The free map services (Nominatim/Overpass) often BLOCK direct browser calls
    // (403/CORS). Doing it here, server-to-server with a proper app name, just works.
    if (path.endsWith("/nearby")) {
      let lat = body.lat, lon = body.lon;

      // 1) no coords? turn the city name into coordinates (Nominatim needs an app User-Agent)
      if (!lat || !lon) {
        const city = body.city || "Landskrona";
        const geoUrl = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
          encodeURIComponent(city + ", Sweden");
        try {
          const gres = await fetch(geoUrl, {
            headers: { "User-Agent": "BiteBuddy/1.0 (restaurant recommender)", "Accept": "application/json" },
          });
          if (gres.ok) {
            const g = await gres.json();
            if (g && g.length) { lat = g[0].lat; lon = g[0].lon; }
          }
        } catch (e) { /* fall through → empty list */ }
        if (!lat || !lon) return json({ places: [] }, 200, origin);
      }

      // 2) ask Overpass for nearby restaurants/cafés/fast food (try each server in turn)
      const oquery = "[out:json][timeout:20];" +
        '(node["amenity"~"^(restaurant|cafe|fast_food)$"]["name"](around:3000,' + lat + "," + lon + "););out 80;";
      const OVERPASS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter",
      ];
      let odata = null;
      const debug = [];
      for (let i = 0; i < OVERPASS.length && !odata; i++) {
        try {
          const r = await fetch(OVERPASS[i], {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json",
              "User-Agent": "BiteBuddy/1.0 (restaurant recommender)",
            },
            body: "data=" + encodeURIComponent(oquery),
          });
          debug.push(OVERPASS[i].replace("https://", "") + " → " + r.status);
          if (r.ok) odata = await r.json();
        } catch (e) { debug.push(OVERPASS[i].replace("https://", "") + " → ERR " + (e.message || e)); }
      }
      if (!odata) return json({ places: [], lat: lat, lon: lon, _debug: debug }, 200, origin);

      // 3) drop non-eateries (libraries, gyms…) and duplicates, then return a clean list
      const notFood = /\b(kulturhus|arena|bibliotek|museum|skola|förskola|gymnasium|kyrka|mosk|gym|sjukhus|vårdcentral|apotek|station|simhall|ishall|idrottsplats|fritidsgård|teater|biograf|rådhus|kommun)\b/i;
      const seen = {};
      const places = (odata.elements || [])
        .map((e) => {
          const t = e.tags || {};
          return { name: t.name, food: t.cuisine ? t.cuisine.replace(/[_;]/g, " ") : null, lat: e.lat, lon: e.lon };
        })
        .filter((p) => {
          if (!p.name || notFood.test(p.name)) return false;
          const k = p.name.toLowerCase();
          if (seen[k]) return false;
          seen[k] = true;
          return true;
        });

      return json({ places: places, lat: lat, lon: lon }, 200, origin);
    }

    // Is this visitor using the secret unlimited code? (lives ONLY here on the server)
    const unlimited = env.UNLOCK_CODE && body.unlockCode === env.UNLOCK_CODE;

    // ── /verify — just checks if a code is correct (used by the profile page) ──
    if (path.endsWith("/verify")) {
      return json({ valid: !!unlimited }, 200, origin);
    }

    // ── /summarize ──────────────────────────────────────────────────────────
    const { placeName, reviews, lang } = body;
    if (!placeName || !Array.isArray(reviews) || reviews.length === 0) {
      return new Response("Missing placeName or reviews", { status: 400 });
    }

    // Rate limiting (skipped for unlimited-code users)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const today = new Date().toISOString().split("T")[0];
    const rateKey = "bb:" + ip + ":" + today;
    const count = parseInt((await env.BB_KV.get(rateKey)) || "0");

    if (!unlimited && count >= DAILY_LIMIT) {
      return json({
        error: "daily_limit",
        limit: DAILY_LIMIT,
        message: "You've used your 3 free AI summaries for today — come back tomorrow! 🐾",
      }, 429, origin);
    }

    const language = lang === "sv" ? "Swedish" : "English";
    const rules =
      "You summarise restaurant reviews HONESTLY. Use ONLY the reviews provided — " +
      "never invent dishes, prices, or facts. If something is not mentioned, do not claim it. " +
      "Also pick the top dishes that reviewers actually PRAISE (the things to order). " +
      "Only include a dish if a review really mentions it. If none are named, use an empty list. " +
      "Reply ONLY as JSON in this shape: " +
      '{"summary":"one friendly sentence","good":["short point"],"bad":["short point"],' +
      '"dishes":["dish name"],"drinks":["drink name"],' +
      '"meal":{"main":"","side":"","drink":"","dessert":"","note":""}}. ' +
      "List at most 4 dishes, most-loved first, and be SPECIFIC with names " +
      "(e.g. 'double smash burger', not just 'burger'). " +
      "For 'meal', suggest ONE full meal using ONLY items reviewers actually mention. " +
      'Leave any field an empty string "" when reviewers do not mention it — NEVER invent items. ' +
      "Always reply in " + language + ", even if the reviews are in another language.";

    const reviewText = reviews.map((r, i) => (i + 1) + ". " + r).join("\n");
    const geminiBody = {
      system_instruction: { parts: [{ text: rules }] },
      contents: [{ parts: [{ text: "Restaurant: " + placeName + "\nReviews:\n" + reviewText }] }],
      generationConfig: { responseMimeType: "application/json" },
    };

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      env.GEMINI_KEY;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      return json({ error: "gemini_error", status: geminiRes.status }, 502, origin);
    }

    const geminiData = await geminiRes.json();
    const result = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    if (!unlimited) {
      await env.BB_KV.put(rateKey, String(count + 1), { expirationTtl: 90000 });
    }

    return json(
      { ...result, _searchesLeft: unlimited ? "∞" : DAILY_LIMIT - count - 1, _unlimited: unlimited },
      200, origin
    );
  },
};
