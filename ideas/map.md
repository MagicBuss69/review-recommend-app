# 🗺️ Map on the website

Magic's idea: have a map on the site, like other food/maps apps.

> 🔗 Related: the [recommend-me-a-place.md](recommend-me-a-place.md) idea also uses a small
> map for its single pick. This file is the *bigger* version — a map you can explore.

## What it could do

- **Pins for places:** show restaurants as little pins/markers on a map.
- **Click a pin → see Forky's summary:** tap a place and get its review summary +
  personal "FOR YOU" pick, right there.
- **"Near me" view:** with the user's permission, center the map on where they are and
  show good spots nearby (great with the 🎲 Recommend-me button).
- **Filter on the map:** later, mix with mood/diet filters — "show only cheap / veggie /
  open now" pins.

## How we'd build it (honest + beginner notes)

- Use the **Google Maps API** — the same Google tools we'll already use for reviews
  (Places API), so they fit together nicely. ✅
- **Cost heads-up:** map services usually have a **free amount each month**, then charge if
  it's used a lot. Fine while small; watch it if the app gets popular. (Ties to the
  caching/costs plan in `../CLAUDE.md`.)
- **Don't reinvent it:** we *embed* Google's map, we don't build a map from scratch — way
  easier and it already works on phones.
- **Safety:** "near me" needs location → always ASK permission, never require it. Magic is
  13 (COPPA). Same rule as the recommend-me idea.

## Where it fits

Phase 5 polish (the roadmap literally lists "maps"). A nice-to-have that makes the app feel
real — build the core review summary + personal pick first.
