// PUBLIC production config — safe to commit. NO secret keys here.
// Everything sensitive (Maps key, Gemini key, unlimited code) lives on the
// Cloudflare Worker. The browser only ever talks to the Worker.
if (!window.BITEBUDDY_CONFIG) {
  window.BITEBUDDY_CONFIG = { geminiKey: "", googleMapsKey: "", proxyUrl: "", adminEmail: "" };
}
window.BITEBUDDY_CONFIG.proxyUrl = "https://bitebuddy-proxy.bitebuddy.workers.dev";
