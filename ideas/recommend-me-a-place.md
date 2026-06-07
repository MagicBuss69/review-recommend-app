# 📍 "Recommend me a place" button

Magic's idea: a button that looks at your location, shows a map, recommends a place near
you, and an AI that learns you over time (Gemini API).

> ⭐ Status: a **demo of the button** is live on the homepage — it picks a random
> Landskrona restaurant. The location + map + AI parts are still future work.

## The pieces

- **The button:** instead of pasting a link, you tap "Recommend me a place" and it just
  suggests one. Easier than pasting links — great for "I'm hungry, decide for me." A fun
  second path next to the paste box.
- **Location:** browser asks "share your location?" → app finds places near you.
  - *Safety:* location is sensitive, and Magic is 13 (COPPA). Always ASK permission,
    never require it, and don't store exact location longer than needed.
- **Map:** show the recommended place(s) on a map (Google Maps / Places API — the same
  official API we'll use for reviews, so it fits).
- **AI that "knows you" over time — the honest version:** we do NOT literally retrain an
  AI (that needs huge computers, data, and money). Instead we **remember the person**:
  save their likes/dislikes/past picks in their profile, then hand that to the AI each
  time ("this user loves spicy, hates seafood — recommend near them"). Feels personal,
  costs little, works today. (Same idea as Claude's memory.)
- **Which AI:** Magic suggested **Gemini API** (Google's AI). Works fine; the brain can
  use any AI. Bonus: pairs naturally with Google Places/Maps. Pick the cheapest/easiest
  when we actually build the brain — not locked in yet.
- **Where it fits the roadmap:** heart of Phase 2 (personal taste) + Phase 5 polish
  (maps). Build the basic review summary first, then this.
