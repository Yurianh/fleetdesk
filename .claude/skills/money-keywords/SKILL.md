---
name: money-keywords
description: Find the commercial keyword patterns for fleetdesk.fr and write marketing/keywords.md. Use when asked which keywords to target, for an SEO strategy, "where is the money", or before planning new pages.
---

# Money keywords

The only keywords worth the first months are the ones where the searcher
already has the card in hand — they want a tool, not a definition. Think in
**patterns**, not keywords: a keyword gets a page, a pattern gets a machine.

## Sources, in order of trust

1. **Search Console export** — ask the user for the latest export folder
   (Performance → Export → CSV). Read `Requêtes.csv` and `Pages.csv`. This is
   real demand on this site.
2. **Google Suggest** (free, real queries, no volumes):
   ```bash
   curl -s "https://suggestqueries.google.com/complete/search?client=firefox&hl=fr&gl=fr&q=<url-encoded seed>"
   ```
   Seeds: « logiciel gestion de flotte », « logiciel gestion parc automobile »,
   « gestion de flotte » + each sector, « suivi véhicules entreprise ».
   Try the seed alone, then with a modifier word before and after.
3. **ChatSEO MCP**, only if it is connected (`/mcp` lists it): it can return
   volumes and the live SERP. Never assume it is there.

## Intent check

For each candidate, look at what Google ranks on page 1 (WebSearch, or ask the
user to check). Keep the keyword only if the top 3 are **landing, product,
pricing, comparison or category pages**. Drop it if blog posts and definition
boxes dominate — informational traffic is for later.

## Output — `marketing/keywords.md`

One table per pattern:

| Pattern | Keyword | Monthly volume | Page type Google ranks | Our URL |

- **Never invent a volume.** If no source gave it, write `n/a`. A plausible
  number in that column is worse than an empty one.
- `Our URL`: the page that already gets impressions for it (from `Pages.csv`),
  or the page that should own it, or `—` if none exists.
- End with the 3 patterns worth building first, ranked by business value, not
  by traffic.

Patterns already observed for FleetDesk (2026-10-08): `+ gratuit`
(« logiciel gestion de flotte gratuit »), `+ excel`, `+ poids lourds`,
`+ secteur / métier` (artisans, BTP, transport, VTC), `+ open source`.
