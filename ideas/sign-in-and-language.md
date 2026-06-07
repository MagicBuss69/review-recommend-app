# 🔐🌍 Sign-in & Language (site basics)

Two "every real website has these" features, plus one known bug to fix.

---

## 1. Sign in / Sign up (accounts)
Magic's idea: a real sign-in, not just a button.

- **Sign up** = make a new account. **Sign in / log in** = come back to one you already have.
- **Why we need it:** the profile (tastes, points, My Spots, badges) only feels real if it
  *remembers you* on any device. Accounts are what make that possible.
- **🐞 Known bug (to fix):** the **"Log in" button doesn't work yet** — right now it's just
  a placeholder that does nothing when clicked. Real sign-in needs the "brain"
  (a server + database), so this comes when we build that part.
- **Beginner-friendly + safe plan:** instead of storing people's passwords ourselves
  (risky and hard), use a trusted **"Sign in with Google"**-style service. Safer, easier,
  and people trust it.
- **Safety:** Magic is 13, and accounts + kids = privacy laws (COPPA). Ask for as little
  personal info as possible, and a parent/sibling handles the legal/owner side. See CLAUDE.md.
- **Where it fits:** needs the server/brain, so a later phase — but plan it from day one.

## 2. Language tab in the corner 🌍
Magic's idea: a little language menu in the corner, like other websites have.

- **What it is:** a small dropdown (e.g. top-right corner) to switch the site's language —
  start with **English 🇬🇧 + Svenska 🇸🇪**.
- **Why it's smart:** Magic is in **Landskrona, Sweden** — lots of nearby users speak
  Swedish! Offering their language builds trust and reaches more people locally.
- **Honest note on effort:** the *corner menu* is easy to add. The harder part is
  **translating all the text** on every page. Start small: just English + Swedish, add more
  later if people want them.
- **Where:** top corner of the nav bar, on every page (so it's always reachable).

---

> 📌 Status: ideas only (plus the Log in bug noted above). The language menu can be a small
> early win; real sign-in waits for the server/brain. Build the core app first.
