/*
  BiteBuddy AI Proxy — Cloudflare Worker
  =======================================
  Keeps the Gemini key secret on the server.
  Rate-limits each visitor to 3 AI summaries per day (resets at midnight UTC).

  DEPLOY STEPS (brother does this once):
  1. npm install -g wrangler
  2. wrangler login
  3. wrangler kv:namespace create BB_KV   ← copy the id into wrangler.toml
  4. wrangler secret put GEMINI_KEY        ← paste the Gemini API key when asked
  5. wrangler deploy
  6. Copy the Worker URL into BitteBuddy/config.js as proxyUrl
*/

const DAILY_LIMIT = 3;

// Only accept requests from these origins (blocks random people from using your key)
const ALLOWED_ORIGINS = [
  "https://magicbuss69.github.io",
  "http://localhost:8080",
  "http://localhost:3000",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // CORS preflight (browser sends this before the real request)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Block any origin that isn't in the allowed list
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    // ── Parse the request body ─────────────────────────────────────────────
    let body;
    try { body = await request.json(); }
    catch (e) { return new Response("Bad request body", { status: 400 }); }

    // Is this visitor using the secret unlimited code? (set with: wrangler secret put UNLOCK_CODE)
    // The real code lives ONLY here on the server — it's never in the public website code.
    const unlimited = env.UNLOCK_CODE && body.unlockCode === env.UNLOCK_CODE;

    // ── "/verify" — just checks if a code is correct (used by the profile page) ──
    const url = new URL(request.url);
    if (url.pathname.endsWith("/verify")) {
      return new Response(
        JSON.stringify({ valid: !!unlimited }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    const { placeName, reviews, lang } = body;
    if (!placeName || !Array.isArray(reviews) || reviews.length === 0) {
      return new Response("Missing placeName or reviews", { status: 400 });
    }

    // ── Rate limiting (SKIPPED for unlimited-code users) ────────────────────
    // Use the visitor's IP + today's date as the key.
    // expirationTtl of 90000s (~25h) means it auto-resets each day.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const today = new Date().toISOString().split("T")[0]; // e.g. "2026-06-20"
    const rateKey = "bb:" + ip + ":" + today;

    const countRaw = await env.BB_KV.get(rateKey);
    const count = parseInt(countRaw || "0");

    if (!unlimited && count >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "daily_limit",
          limit: DAILY_LIMIT,
          message: "You've used your 3 free AI summaries for today — come back tomorrow! 🐾",
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    // ── Call Gemini (same prompt as engine.js, key stays secret here) ──────
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

    const model = "gemini-2.5-flash";
    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" + model +
      ":generateContent?key=" + env.GEMINI_KEY;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: "gemini_error", status: geminiRes.status }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    const geminiData = await geminiRes.json();
    const result = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // ── Increment the counter (unlimited users don't count toward the daily limit) ──
    if (!unlimited) {
      await env.BB_KV.put(rateKey, String(count + 1), { expirationTtl: 90000 });
    }

    // ── Return the AI result + how many searches the user has left today ───
    return new Response(
      JSON.stringify({ ...result, _searchesLeft: unlimited ? "∞" : DAILY_LIMIT - count - 1, _unlimited: unlimited }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
    );
  },
};
