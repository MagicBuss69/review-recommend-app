# IDEAS — future features parking lot

A place to drop ideas while the main build continues elsewhere.
Nothing here is being built yet — it's a "remember this for later" list.
We pick from it once the basics (review summary + personal pick) work.

---

## Feature ideas (added 2026-06-06)

### "Recommend me a restaurant" button 📍🗺️ (no link needed)
Jaroslav's idea: a button that looks at your location, shows a map, recommends a
place near you, and an AI that learns you over time (Gemini API).

The pieces:
- **The button:** instead of pasting a link, you tap "Recommend me a place" and it
  just suggests one. Easier than pasting links — great for "I'm hungry, decide for
  me." Could be a fun second path next to the paste box.
- **Location:** browser asks "share your location?" → app finds places near you.
  - *Safety:* location is sensitive, and Jaroslav is 13 (COPPA). Always ASK
    permission, never require it, and don't store exact location longer than needed.
- **Map:** show the recommended place(s) on a map (Google Maps / Places API — the
  same official API we'll use for reviews, so it fits).
- **AI that "knows you" over time — the honest version:** we do NOT literally
  retrain an AI (that needs huge computers, data, and money). Instead we
  **remember the person**: save their likes/dislikes/past picks in their profile,
  then hand that to the AI each time ("this user loves spicy, hates seafood —
  recommend near them"). Feels personal, costs little, works today, we stay in
  control. (Same idea as Claude's memory notebook.)
- **Which AI:** Jaroslav suggested **Gemini API** (Google's AI). Works fine; the
  brain can use any AI. Bonus: pairs naturally with Google Places/Maps. Pick the
  cheapest/easiest when we actually build the brain — not locked in yet.
- **Where it fits the roadmap:** this is the heart of Phase 2 (personal taste) +
  Phase 5 polish (maps). Build the basic review summary first, then this.

---

## Engagement ideas (added 2026-06-06)

Goal of these: give people a reason to come back and keep using BiteBuddy.

### 1. Streaks that DON'T fade 🔥
Jaroslav's idea: like Snapchat streaks, but they never disappear.

- **Why this is interesting:** a normal streak fades on purpose — the fear of
  losing it is what makes people return daily. If it never fades, it becomes more
  like a **total score / collection of milestones** ("you've checked 50 places!")
  than a streak.
- **Fits BiteBuddy because:** never-fading = friendly, no guilt if you miss a day.
  Matches our warm "Friendly & Fun" vibe.
- **Possible plan:** have BOTH —
  - **Milestones (never fade):** badges like "Tried 10 / 50 / 100 restaurants."
  - **Optional streak (can fade):** for people who like the pressure.

- **Streak window = weekly, NOT daily (Jaroslav's idea):** nobody tries a new
  restaurant every day, so a daily streak is impossible to keep and makes people
  quit. Use a longer window — **visit/use within 7 or 10 days to keep the streak.**
  - **Why it works:** a good streak matches how often people NATURALLY do the
    thing — daily for a chat app, weekly for a food app. Winnable = fun, not
    stressful.
  - Could even let the user pick their pace, or grow the window as the streak gets
    longer (forgiving for loyal users).

### 2. Leaderboard 🏆
Rank users so they can compete.

- **Big decision for later:** rank people on WHAT? Whatever we rank becomes the
  thing people do more of. Options:
  - Most restaurants reviewed/looked up.
  - Most *helpful* tips (others vote them up) — rewards quality, not spam.
  - Best taste-match guesses.
- **Safety note:** public leaderboards + a 13-year-old's app = mind kids' privacy
  (let people use nicknames, not real names). See COPPA note in CLAUDE.md.

### 3. Prizes 🎁
Reward top users.

- **Honest cost note:** real prizes cost money and have legal rules (giveaways/
  contests have laws). Anything with money/contracts → a parent/sibling handles it
  (Jaroslav is 13, the builder).
- **Free version first:** digital rewards — badges, titles ("Top Reviewer this
  week"), a spotlight on the homepage. Cheap, safe, still motivating.
- **Real prizes:** only once the app earns money. No promises.

### 4. Points → profile customization 💎 (the "economy")
Jaroslav's idea: earn points, then spend them to customize your profile —
custom banners, badges, colors, etc.

- **Why this is the glue:** the leaderboard/streaks give points, but points need
  something to SPEND on or they get boring. Customization gives points a purpose.
  This earn-and-spend loop is what games call an **"economy."**
- **Why it's perfect for a cheap app:** a banner or badge is just a picture — it
  costs us basically nothing to give, but people love showing off. Motivates users
  WITHOUT costing money (unlike real prizes).
- **How you'd earn points:** reviewing places, helpful tips voted up, keeping a
  streak, hitting milestones.
- **What you'd spend on:** profile banners, badge/avatar styles, name colors,
  maybe a custom title. Some cheap to unlock, some rare/expensive = a goal to grind.
- **Later money idea:** a few extra-fancy cosmetics could be the paid upgrade —
  people fund the app by buying looks, not by paying to use it.

### 5. EXCLUSIVE cosmetics for top contenders 👑 (the "prestige" reward)
Jaroslav's idea: the top people on the leaderboard get custom looks NOBODY else
can get — not buyable with points, only won.

- **Why it's powerful:** if anyone can buy a banner, it's nice but not special.
  A banner you can ONLY get by being #1 = proof you were the best. People compete
  hard for things money can't buy. This is called **exclusivity / prestige.**
- **Make it time-limited:** e.g. a "Top Reviewer — June 2026" badge. People return
  every month to win it or defend it, instead of winning once and leaving.
- **Use tiers so more people feel special:** top 1 / top 10 / top 100 each get
  their own exclusive look — not just a single winner.
- **Safety:** still use nicknames on the public leaderboard (kids' privacy / COPPA).

---

### How these fit the roadmap
These are **Phase 5 (Polish & money)** flavored — engagement/retention tools.
They only matter once people are actually using the app, so: build the core first,
add these when there's a crowd to compete. (See "Handling Growth & Costs" in CLAUDE.md.)
