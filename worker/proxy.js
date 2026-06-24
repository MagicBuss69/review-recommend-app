/*
  BiteBuddy Proxy — Cloudflare Worker
  ===================================
  Keeps BOTH keys secret on the server and does the work for the browser:
    • /place      → searches Google Places (server-side, so no referrer block)
    • /photo      → streams a Google place photo (so the key isn't in the image URL)
    • /summarize  → turns reviews into an honest AI summary (Gemini)
    • /waiter     → chats as "Tony" the waiter about a place (Gemini)
    • /verify     → checks the secret "unlimited" code (from the profile page)

  Rate-limits each visitor to 3 AI summaries per day (resets daily).
  The unlimited code removes that limit for whoever knows it.

  SECRETS (set once with wrangler):
    wrangler secret put GEMINI_KEY     ← the Gemini API key
    wrangler secret put MAPS_KEY       ← the Google Maps/Places API key
    wrangler secret put UNLOCK_CODE    ← your secret "unlimited" code
*/

const DAILY_LIMIT = 3;

// 🌍 GLOBAL "NO SURPRISES" CAPS — the most AI calls the WHOLE app will make in one
// day, across EVERYONE combined. Once a cap is hit, Forky stops calling the paid AI
// for everyone until tomorrow (saved/cached answers still work fine). This is your
// app-level money wall. Cached hits do NOT count — they cost nothing.
// Raise these only if your Google Cloud budget is comfortable with it.
const GLOBAL_SUMMARY_LIMIT = 250; // total AI review-summaries per day, all users
const GLOBAL_WAITER_LIMIT = 400;  // total Tony chat replies per day, all users

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
      const cityIn = (body.city || "").trim();

      // a cache key from the REQUEST, so every visitor shares popular lookups
      const ckey = "nearby:v1:" + (cityIn
        ? "city:" + cityIn.toLowerCase()
        : "geo:" + Number(lat).toFixed(3) + "," + Number(lon).toFixed(3));

      // 0) already looked this up recently? hand back the saved list INSTANTLY.
      //    (Also rescues us when the map services are briefly down.)
      try {
        const hit = await env.BB_KV.get(ckey);
        if (hit) return json(JSON.parse(hit), 200, origin);
      } catch (e) {}

      // 1) no coords? turn the city name into coordinates (Nominatim needs an app User-Agent)
      if (!lat || !lon) {
        const city = cityIn || "Landskrona";
        const geoUrl = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
          encodeURIComponent(city + ", Sweden");
        try {
          const gctrl = new AbortController();
          const gtimer = setTimeout(() => gctrl.abort(), 8000);
          const gres = await fetch(geoUrl, {
            headers: { "User-Agent": "BiteBuddy/1.0 (restaurant recommender)", "Accept": "application/json" },
            signal: gctrl.signal,
          }).finally(() => clearTimeout(gtimer));
          if (gres.ok) {
            const g = await gres.json();
            if (g && g.length) { lat = g[0].lat; lon = g[0].lon; }
          }
        } catch (e) { /* fall through → empty list */ }
        if (!lat || !lon) return json({ places: [] }, 200, origin);
      }

      // 2) ask ALL Overpass servers AT ONCE and use whichever answers first (fast + reliable)
      const oquery = "[out:json][timeout:20];" +
        '(node["amenity"~"^(restaurant|cafe|fast_food)$"]["name"](around:3000,' + lat + "," + lon + "););out 80;";
      const OVERPASS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter",
      ];
      function askOverpass(endpoint) {
        // hard 10s timeout per server — without this, a server that accepts the
        // connection but never replies would make Promise.any wait forever.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        return fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": "BiteBuddy/1.0 (restaurant recommender)",
          },
          body: "data=" + encodeURIComponent(oquery),
          signal: ctrl.signal,
        })
          .then((r) => { if (!r.ok) throw new Error(endpoint + " " + r.status); return r.json(); })
          .finally(() => clearTimeout(timer));
      }
      let odata = null;
      try { odata = await Promise.any(OVERPASS.map(askOverpass)); }
      catch (e) { /* every server failed */ }
      if (!odata) return json({ places: [], lat: lat, lon: lon }, 200, origin);

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

      const result = { places: places, lat: lat, lon: lon };
      // 4) save it for a day so the next person (and you) gets it instantly
      if (places.length) {
        try { await env.BB_KV.put(ckey, JSON.stringify(result), { expirationTtl: 86400 }); } catch (e) {}
      }
      return json(result, 200, origin);
    }

    // Is this visitor using the secret unlimited code? (lives ONLY here on the server)
    const unlimited = env.UNLOCK_CODE && body.unlockCode === env.UNLOCK_CODE;

    // ── /verify — just checks if a code is correct (used by the profile page) ──
    if (path.endsWith("/verify")) {
      return json({ valid: !!unlimited }, 200, origin);
    }

    // ── /waiter — chat as "Tony", a friendly waiter for the place you searched ──
    // The browser sends the question + what we honestly KNOW about the place;
    // Gemini answers in character. The secret key never leaves this server.
    if (path.endsWith("/waiter")) {
      const question = (body.question || "").trim();
      if (!question) return json({ error: "no_question" }, 400, origin);

      const placeName = body.placeName || "this restaurant";
      const city = body.city || "";
      const ctx = (body.context || "").slice(0, 4000); // cap so one request can't be huge

      // A friendly daily cap on chat messages, so the free quota isn't drained
      // (the unlimited code skips it). Tony gets his OWN counter, separate from
      // the review summaries, so chatting doesn't eat your summary allowance.
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const today = new Date().toISOString().split("T")[0];
      const wKey = "waiter:" + ip + ":" + today;
      const wCount = parseInt((await env.BB_KV.get(wKey)) || "0");
      const WAITER_LIMIT = 20;
      if (!unlimited && wCount >= WAITER_LIMIT) {
        return json({
          error: "daily_limit",
          message: "Tony has chatted a lot today — come back tomorrow! 🐾",
        }, 429, origin);
      }

      // 🌍 Global cap (money safety for EVERYONE combined) — applies to all visitors.
      const gwKey = "global:waiter:" + today;
      const gwCount = parseInt((await env.BB_KV.get(gwKey)) || "0");
      if (gwCount >= GLOBAL_WAITER_LIMIT) {
        return json({
          error: "global_limit",
          message: "Tony's had a LOT of chats today — he's having a rest. Come back tomorrow! 🐾",
        }, 429, origin);
      }

      const language = body.lang === "sv" ? "Swedish" : "English";
      const persona =
        "You are Tony, a warm, friendly waiter at " + placeName +
        (city ? " in " + city : "") + ". " +
        "Answer guests briefly (1-3 sentences), like a real waiter. " +
        "Always reply in " + language + ". " +
        (ctx
          ? "Here is what we ACTUALLY know about the place — base your answers ONLY on this, " +
            "and never invent dishes, prices, or facts:\n" + ctx + "\n"
          : "You don't have the menu or reviews yet, so don't invent specifics — if asked a " +
            "detail you don't know, say so honestly and suggest checking the menu. ") +
        "If you don't know a detail, say so honestly.";

      const waiterBody = {
        system_instruction: { parts: [{ text: persona }] },
        contents: [{ parts: [{ text: question }] }],
      };

      // Gemini sometimes replies 503 ("overloaded") or 429 ("too busy") for a moment.
      // Be stubborn for Tony: try the main model a couple of times with a short pause,
      // and if it's STILL overloaded, fall back to a second model that usually has
      // spare capacity. Only a real (non-busy) error or a success stops the loop.
      const WAITER_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
      let waiterRes;
      tryModels:
      for (const model of WAITER_MODELS) {
        const mUrl = "https://generativelanguage.googleapis.com/v1beta/models/" +
          model + ":generateContent?key=" + env.GEMINI_KEY;
        for (let attempt = 0; attempt < 2; attempt++) {
          waiterRes = await fetch(mUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(waiterBody),
          });
          if (waiterRes.ok) break tryModels;                              // got an answer 🎉
          if (waiterRes.status !== 503 && waiterRes.status !== 429) break tryModels; // real error
          if (attempt < 1) await new Promise((r) => setTimeout(r, 1000)); // busy → wait, retry
        }
        // still busy after retries → fall through to the next backup model
      }

      if (!waiterRes.ok) {
        return json({ error: "gemini_error", status: waiterRes.status }, 502, origin);
      }

      const waiterData = await waiterRes.json();
      let reply = "";
      try { reply = waiterData.candidates[0].content.parts[0].text; } catch (e) { reply = ""; }
      if (!reply) return json({ error: "empty" }, 502, origin);

      // count this real AI call toward the global daily cap (for everyone)
      try { await env.BB_KV.put(gwKey, String(gwCount + 1), { expirationTtl: 90000 }); } catch (e) {}

      if (!unlimited) {
        await env.BB_KV.put(wKey, String(wCount + 1), { expirationTtl: 90000 });
      }
      return json({ reply: reply }, 200, origin);
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

    // ⚡ SHARED CACHE — the speed win. If ANYONE already summarised this place
    // recently, hand back the saved answer INSTANTLY: no Gemini call, no 2-second
    // wait, and it does NOT use up this visitor's daily limit. The first person to
    // view a place pays the wait; everyone after gets it immediately. (Caching first,
    // exactly like the strategy notes say. 🚀)
    const sumKey = "sum:v1:" + (lang === "sv" ? "sv" : "en") + ":" +
      placeName.toLowerCase().trim().replace(/\s+/g, " ");
    try {
      const hit = await env.BB_KV.get(sumKey);
      if (hit) {
        const obj = JSON.parse(hit);
        return json({
          ...obj,
          _fromCache: true,
          _searchesLeft: unlimited ? "∞" : DAILY_LIMIT - count,
          _unlimited: unlimited,
        }, 200, origin);
      }
    } catch (e) { /* cache miss or bad value → just do it fresh below */ }

    if (!unlimited && count >= DAILY_LIMIT) {
      return json({
        error: "daily_limit",
        limit: DAILY_LIMIT,
        message: "You've used your 3 free AI summaries for today — come back tomorrow! 🐾",
      }, 429, origin);
    }

    // 🌍 Global cap (money safety for EVERYONE combined). Applies to all visitors,
    // even the unlimited code — this is the wall that prevents surprise bills.
    const gSumKey = "global:sum:" + today;
    const gSumCount = parseInt((await env.BB_KV.get(gSumKey)) || "0");
    if (gSumCount >= GLOBAL_SUMMARY_LIMIT) {
      return json({
        error: "global_limit",
        message: "BiteBuddy is super popular today — Forky's AI is taking a little rest. Try again tomorrow! 🐾",
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

    // Be stubborn when Gemini is momentarily busy (429/503): retry the main model,
    // then fall back to a second model — same trick that made Tony reliable.
    const SUMMARY_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let geminiRes;
    trySumModels:
    for (const model of SUMMARY_MODELS) {
      const gUrl = "https://generativelanguage.googleapis.com/v1beta/models/" +
        model + ":generateContent?key=" + env.GEMINI_KEY;
      for (let attempt = 0; attempt < 2; attempt++) {
        geminiRes = await fetch(gUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });
        if (geminiRes.ok) break trySumModels;                                   // got it 🎉
        if (geminiRes.status !== 503 && geminiRes.status !== 429) break trySumModels; // real error
        if (attempt < 1) await new Promise((r) => setTimeout(r, 1000));         // busy → wait, retry
      }
      // still busy after retries → try the next backup model
    }

    if (!geminiRes.ok) {
      return json({ error: "gemini_error", status: geminiRes.status }, 502, origin);
    }

    const geminiData = await geminiRes.json();
    const result = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // Save into the shared cache for a week so the NEXT visitor to this place gets
    // it instantly (reviews don't change fast). This is what makes popular places
    // feel snappy for everyone — and saves the Gemini quota.
    try {
      await env.BB_KV.put(sumKey, JSON.stringify(result), { expirationTtl: 604800 });
    } catch (e) { /* caching is a bonus — never fail the request over it */ }

    // count this real AI call toward the global daily cap (for everyone)
    try { await env.BB_KV.put(gSumKey, String(gSumCount + 1), { expirationTtl: 90000 }); } catch (e) {}

    if (!unlimited) {
      await env.BB_KV.put(rateKey, String(count + 1), { expirationTtl: 90000 });
    }

    return json(
      { ...result, _searchesLeft: unlimited ? "∞" : DAILY_LIMIT - count - 1, _unlimited: unlimited },
      200, origin
    );
  },
};
