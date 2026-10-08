---
name: pattern-drip
description: Publish the next page of a keyword pattern on fleetdesk.fr — one page per run. Use for scheduled runs, or when asked to scale a pattern or duplicate a page.
---

# Pattern drip

Once one page in a pattern is right, the next ones are the same page — but
forty published in an afternoon screams automation on a young domain. One page
per run, on a schedule.

## Steps

1. Open `marketing/keywords.md`. Take the next keyword of a pattern that has
   **no URL yet**, highest business value first (then highest volume where
   known).
2. Run `page-brief` on it. If the decision is « optimise », **stop**, flag it
   in the run summary, and do not create a page.
3. Start from the pattern's **reference page** (for the sector pattern: the
   best-performing `/secteurs/*` page in Search Console). Replace everything
   specific: the trade's real obligations, vehicle types, documents, costs,
   examples, FAQ. **A page that only swaps the sector name does not ship.**
4. Run `ship-page`. In its diff gate, compare against the reference page too:
   anything the reference has that the new page lost gets restored or
   justified.
5. **One page per run. Never more.**

## Cadence

FleetDesk's domain is a few months old. Start at **one page a week**, not one
a day; move to more only once new pages enter the top 20 within a month of
publication (check with `weekly-seo`).
