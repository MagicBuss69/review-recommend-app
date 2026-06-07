/*
  BiteBuddy — auth.js (the "are you logged in?" helper, shared by every page)

  It does three jobs:
   1. Right away (while the page is still loading) it marks the page as "logged in"
      or "guest" by adding a class to <html>. The CSS then shows/hides the right nav
      links with NO flicker. (Links with data-auth="in" show only when logged in;
      data-auth="out" show only when logged out.)
   2. Makes any "Log out" link (data-action="logout") actually log you out.
   3. Protects private pages: a page with <body data-requires-auth> sends you to the
      sign-up page if you're not logged in — so the Profile "disappears" when you have
      no account, just like a real app. 🔐

  Note: this runs in the <head> on purpose, BEFORE the page draws, so the nav never
  flashes the wrong buttons.
*/
(function () {
  var loggedIn = localStorage.getItem("bitebuddy-loggedin") === "yes";

  // 1) tag the page so the CSS can show the correct links instantly (no flicker)
  document.documentElement.classList.add(loggedIn ? "is-auth" : "is-guest");

  // run the rest once the page's body exists
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // 3) protect private pages — no account? off to sign up you go.
    if (document.body.getAttribute("data-requires-auth") !== null && !loggedIn) {
      window.location.replace("signup.html");
      return;
    }

    // 2) wire every "Log out" button
    document.querySelectorAll('[data-action="logout"]').forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("bitebuddy-loggedin");   // keep your tastes; just sign out
        window.location.href = "index.html";
      });
    });

    // 4) show your chosen profile picture inside the nav "Profile" button 🖼️
    //    (a Google photo URL, an emoji, or Forky by default)
    const av = localStorage.getItem("bitebuddy-avatar") || "forky";
    document.querySelectorAll("[data-nav-avatar]").forEach(function (el) {
      el.textContent = "";
      if (/^https?:\/\//.test(av)) {                  // a Google profile photo
        const im = document.createElement("img"); im.src = av; im.alt = ""; el.appendChild(im);
      } else if (av !== "forky") {                    // an emoji avatar
        el.textContent = av;
      } else {                                        // default: Forky
        const im = document.createElement("img"); im.src = "logo.svg"; im.alt = ""; el.appendChild(im);
      }
    });
  });
})();
