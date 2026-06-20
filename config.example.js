/*
  BiteBuddy — config.example.js  (a TEMPLATE — safe to share)

  HOW TO USE (do this once on your computer):
  1. Make a COPY of this file and name the copy:  config.js
  2. Fill in your real keys in config.js.
  3. Save. The app will use them.

  ⚠️ config.js is in .gitignore — it NEVER goes to GitHub. Never put real keys here.

  TWO MODES:
  ─────────────────────────────────────────────────────────────────────────
  LOCAL DEV   Set geminiKey. The app calls Gemini directly from your computer.
              Leave proxyUrl as "".

  PRODUCTION  Set proxyUrl (your Cloudflare Worker URL) and leave geminiKey as "".
              The Worker holds the Gemini key safely; users get 3 searches/day.
              See worker/proxy.js for deploy instructions.
  ─────────────────────────────────────────────────────────────────────────
*/
window.BITEBUDDY_CONFIG = {
  geminiKey:    "PASTE_YOUR_GEMINI_KEY_HERE",          // local dev only — leave "" in production
  googleMapsKey:"PASTE_YOUR_GOOGLE_MAPS_KEY_HERE",     // starts with AIza... (needs billing)
  proxyUrl:     "",  // e.g. "https://bitebuddy-proxy.yourname.workers.dev" — set this for production
  adminEmail:   "",  // YOUR email — only this account can open the Admin Panel
};
