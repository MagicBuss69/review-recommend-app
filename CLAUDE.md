# CLAUDE.md

This file gives Claude Code context about me and the project I'm building.

## About me

- **Name:** Jaroslav
- **Experience level:** New to coding — I don't know how to code yet, so please explain things simply, avoid jargon (or define it when you use it), and walk me through steps one at a time.
- **Interests:** Very curious, love talking to AI, into building things.
- **Favorite color:** Blue (use blue as the main color in any app designs/UI).
- **Lifestyle note:** I don't like sitting for too long — I take breaks to work out or do cardio. Short, focused chunks of work suit me better than long marathons.

## How I'd like Claude to work with me

- Teach as we go — explain *why*, not just *what*.
- Keep instructions in small, doable steps.
- When showing code, add comments so I can learn from it.
- Suggest natural break points (since I like to move around).
- Recommend beginner-friendly tools and the simplest path that works.

## The project (app idea)

An app where you **paste a link** to a restaurant, café, or any workshop/company, and it tells you:

1. **How it's doing on reviews** — summarize and analyze the reviews.
2. **About the finances** — give a read on how the business is doing financially.

### Most important part: food / restaurants

- Focus first on restaurants and food places.
- The app analyzes and **talks about the reviews**.
- The user can enter **foods they like and dislike**.
- Based on that, the app gives a **personalized recommendation** (e.g., what to order, or whether the place fits their taste).

### Decisions made (2026-06-06)

- **Audience:** Everyone / the public (goal: make money + learn).
- **Platform:** A **website** (works on any phone or computer).
- **Most exciting feature:** The **finances insight** (note: hardest to get real data for — be honest about what's possible).
- **Builder:** Jaroslav, age 13, beginner. Brother gave Claude access. Wants to learn and build something real.

### Roadmap (phases — build one at a time)

1. **Food review analysis** — paste a restaurant link → plain-language summary of reviews.
2. **Personal taste** — user adds likes/dislikes → personalized recommendation.
3. **Wider businesses** — cafés, workshops, companies.
4. **Finances insight** — the dream feature; hardest data; tackle once basics work.
5. **Polish & money** — maps, sharing, AI chat, and ways the app could earn.

### Design direction (chosen 2026-06-06)

- **Homepage layout:** "Friendly & Fun" — big friendly logo/mascot + playful tagline up
  top, paste-a-link box below. Warm, approachable, memorable so people return.
- **First-impression rules:** (1) one clear sentence, (2) one obvious button (paste link),
  (3) a feeling of trust (clean, not messy).
- **Color palette (colors chosen for their meaning):**
  - 💙 **Blue = main** (trust, calm) — buttons, logo, brand feel.
  - 💚 **Green = helper** (fresh food, money/finances, "good!"/✅) — scores, good tags.
  - ⚪ White / very light background (clean, friendly).
  - Dark gray text (softer than black).
  - Rule: just 2 main colors + clean background — too many colors looks messy.
- **Still to do:** name the app, then sketch the actual logo.

### Handling Growth & Costs

The real risk early on is **too few users**, not too many — so stay small and cheap first.
Don't build "crowd" machinery before the crowd exists. Worry in this order:

1. **Start:** nobody uses it → build tiny & cheap, show real people.
2. **Some users:** is it useful? → listen, improve, keep costs near $0.
3. **Many users:** *now* handle the crowd with the tools below.

When the crowd does come, the moves are (none built on day 1):

- **Caching** (early): store results for popular places so the same lookup isn't
  re-analyzed for every user → most usage becomes nearly free. Cache comes first.
- **Auto-scaling cloud servers** (mid): server power grows with demand instead of
  crashing; you only pay more during busy hours.
- **Generous free amount** (always): normal users rarely hit a wall.
- **Unlimited paid upgrade** (later): power users hit the free amount and see an
  upgrade offer, not a "stop" wall — they fund the cost they create.

No guarantees: many users / paying superfans aren't promised. The plan wins either way —
staying cheap means low downside if few come, and the growth tools are ready if many do.

### Legal & safety to plan from day one

- **Use official APIs** (e.g. Google Places API) for review data — do NOT scrape sites
  like Google Maps/Yelp; their Terms of Service can get the app shut down.
- **Jaroslav is 13:** a parent/older sibling is the legal "owner" for contracts/payments;
  Jaroslav is the builder. Public app → mind kids' privacy laws (e.g. COPPA).

> Status: Planning phase. No code written yet.
