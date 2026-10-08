---
name: weekly-seo
description: Weekly SEO review of fleetdesk.fr from a Search Console export — what moved, what to push, what to leave alone. Use every Monday, or when asked how SEO is going.
---

# Weekly SEO review

## Input

Ask the user for two Search Console exports (Performance → Export): the last
28 days, and the 28 days before (Compare → export, or two date ranges). If
the ChatSEO MCP is connected, ask it instead:
« Compare my last 28 days to the previous 28. Which pages gained impressions,
which lost clicks, and which keywords entered the top 10? »

## Read

1. **Impressions jumped on a page** → it just entered the top 10–20. Queue it
   for `page-brief`: top 10 → top 3 is the cheapest win there is.
2. **Edited in the last 60 days** (`git log -1 --format=%cs -- <file>`) →
   mark **wait**. Do not touch it. Google delays the effect of changes; a dip
   after an edit is normal, and reverting in a panic teaches it nothing.
3. **Edited 90+ days ago, good brief, still outside the top 3** → candidate
   for authority work (see `geo-rankings` and section below), not for another
   rewrite.
4. **Non-brand vs brand**: report non-brand impressions and clicks separately.
   Brand clicks (« fleetdesk », « fleet desk ») measure notoriety, not SEO.

## Output

`marketing/reviews/<YYYY-MM-DD>.md`:
- the numbers, non-brand separated from brand;
- what entered the top 20, what fell out;
- the « wait » list;
- **5 actions, ranked by business value, not by traffic.**

## Authority, honestly

Links are earned, not bought: directories where buyers compare tools
(Capterra, GetApp, Appvizer), sites FleetDesk is genuinely connected to,
partners (accountants, garages, fleet insurers), press, podcasts, the demo
video on YouTube. Google's spam policies treat buying links for ranking as
link spam; do not recommend it.
