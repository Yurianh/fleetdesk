---
name: page-brief
description: Build the SEO brief for one target keyword on fleetdesk.fr — decide optimise-or-create first. Use when asked to rank for a keyword, optimise a page, or before creating any new page.
---

# Page brief

The most expensive SEO mistake is writing a page we already had. Two pages
fighting for one query both sit 7th and 8th, when one would have been 3rd.

## 1. Optimise or create — decide before anything else

From the Search Console export (`Requêtes.csv`, `Pages.csv`; ask the user to
export filtered on the exact query if needed):

- a page already gets **clicks** for it → **optimise** that page;
- a page gets **impressions but few clicks** → it is somewhere in the top 20 →
  **optimise** it;
- nothing → **create**.

Also check the site for pages that *target* the keyword without ranking yet:
`grep -ril "<keyword>" marketing/src` and the `title:` of every guide. Known
overlaps on this site: the homepage and `/logiciel-gestion-de-flotte` both say
« logiciel de gestion de flotte … pour PME »; `/secteurs/btp` already says
« BTP et artisans ».

**If an existing URL already has clicks or impressions for the keyword, stop
any plan to create a new page.**

## 2. Secondary keywords

Take what ranks 1st for the keyword and list the other queries that same URL
ranks for (ChatSEO if connected; otherwise Google Suggest variations and our
own `Requêtes.csv`). Google already treats them as one page: target them all
with one URL.

## 3. Title and description

- The title is the page's identity card. Primary keyword first; one more word
  can cover a second pattern (« … pour PME et artisans »).
- Keep it under ~60 characters **including** the ` · FleetDesk` suffix the
  layout adds, so it does not truncate.
- Pixels left over buy the click: « essai gratuit 14 j », « sans carte », a
  number.
- The meta description barely moves ranking. Its job is to sell the click.

## 4. What the top 3 share

List the sections the top 3 all have (price, how it works, screenshots, FAQ…)
and **one thing none of them has** that we can honestly add: the demo video,
a calculator, a « quelle formule pour ma flotte » quiz, real screenshots, the
founder's own fleet experience (RK Transports).

## 5. Save

`marketing/briefs/<keyword-slug>.md`: decision (create / optimise + URL),
primary and secondary keywords, title, description, sections, the one extra.
**Do not edit the site in this skill.**
