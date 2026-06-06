# 🐾 BiteBuddy — Website Plan

How the website should **work** and **look**. (Planning — no code yet.)

## 🛤️ How it works (the user journey)

1. 🏠 Visitor lands on the **homepage** → sees Forky, instantly gets it.
2. 📋 Pastes a restaurant link → clicks **"Find out!"**.
3. 🤔 Forky "thinks" (a cute loading moment).
4. 📝 Sees the **review summary for FREE** (good points / bad points).
5. 💚 To unlock the **personal pick** (+ save favorites), they **sign up** and add
   their food **likes/dislikes** — the reward for joining.
6. 🔁 Logged-in users can check more places and save favorites.

### The "taste-first" rule (decided 2026-06-06)

Show value BEFORE asking for commitment. Free review summary first → sign-up + tastes
unlock the personal pick. This lowers the "wall" so more first-timers stick around
(remember: the real risk is **too few users**, not too many).

## ⚙️ Behind the scenes (simple version — built later, in steps)

When "Find out!" is clicked, BiteBuddy:
1. 🔗 Reads the link → looks up the place using an **official API** (the legal way —
   no scraping Google/Yelp).
2. 📚 Gets the reviews.
3. 🤖 AI reads them → writes a short, honest summary.
4. 💚 Compares to the user's likes/dislikes → makes the personal score.

## 📄 Pages we'll need

- **Homepage** — Forky + tagline + paste-link box + "how it works" 3 steps.
- **Results page** — the review summary + (for members) the personal pick + business health.
- **Sign up / Log in** — quick and friendly.
- **My Tastes** — where members set foods they like / dislike.
- **(Later)** About / How it works, Favorites.

## 🎨 How it looks (rough sketches)

### Homepage
```
+--------------------------------------------------+
|  🐾 BiteBuddy                    How it works ☰  |
|                  ( Forky logo )                  |
|                   BiteBuddy                      |
|        Your buddy who knows where to eat.        |
|     +--------------------------------------+     |
|     |  paste a restaurant link here...     |     |
|     +--------------------------------------+     |
|               [   Find out! 🔍  ]                |
|   1️⃣ Paste link   2️⃣ Forky reads   3️⃣ Get pick! |
+--------------------------------------------------+
```

### Results page  (personal pick is the BIGGEST thing — decided 2026-06-06)
```
+--------------------------------------------------+
|  🐾 BiteBuddy                       New search 🔍 |
|   Joe's Pizza   ⭐⭐⭐⭐☆  4.2  (320 reviews)     |
|--------------------------------------------------|
|  💚 FOR YOU: 9/10            <- biggest, on top  |
|  "You love pasta — they're famous for it!        |
|   You dislike seafood, so skip the shrimp."      |
|--------------------------------------------------|
|  📝 What people say                              |
|   👍 Great pasta, cozy, friendly staff           |
|   👎 Slow on weekends, small portions            |
|--------------------------------------------------|
|  💰 Business health: Looking good 📈             |
|   Busy + lots of recent reviews, rating rising   |
+--------------------------------------------------+
```

## ✅ Decisions locked (2026-06-06)
- **Results top:** the personal pick ("FOR YOU") is the star.
- **Flow:** taste-first compromise (free summary → sign-up + tastes unlock personal pick).
- **Look:** Friendly & Fun, blue + green, Forky everywhere.
