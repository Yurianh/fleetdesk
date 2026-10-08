---
name: ship-page
description: Write or update a fleetdesk.fr marketing page from its brief and publish it safely, behind a diff gate. Use after page-brief, when asked to build, rewrite or publish a page.
---

# Ship page

An agent that can edit the live site can also quietly remove the one thing a
page existed for — a table, a form, a link — with no error and no warning.
This skill has a gate for that. Keep it, even when it feels slow.

## Where things live

- Guides: `marketing/src/content/guides/<slug>.md` (frontmatter schema in
  `marketing/src/content/config.ts`; title, description, heading, intro, faq,
  related, published, updated).
- Sector pages: data in `marketing/src/data/secteurs.js`, template
  `marketing/src/pages/secteurs/[secteur].astro`.
- Other pages: `marketing/src/pages/*.astro`.
- `main` deploys `fleetdesk.fr` automatically. **Never commit page changes to
  `main` directly.**

## Steps

1. Read `marketing/briefs/<keyword-slug>.md`. No brief → run `page-brief`
   first.
2. Write or rewrite the page so it covers every section the top 3 share, plus
   the one extra the brief names. Match the house tone (French, concrete,
   sourced claims, no hype).
3. One H1 containing the primary keyword. Title and description from the
   brief. Set `updated` to today on guides.
4. Structured data that fits the page type (guides already emit Article +
   FAQPage from frontmatter; check before adding a duplicate).
5. **At least 5 internal links TO this page, inside body text** of the most
   related existing pages, with the exact keyword as anchor where it reads
   naturally. Footer and navigation links do not count — every page already
   has those.
6. **DIFF GATE.** Before anything is published, list every element present in
   the old version and missing from the new one: sections, tables, FAQ
   entries, forms, CTAs, images, embeds, internal links (in and out), JSON-LD.
   Show the list to the user. An empty list must be stated as empty, not
   skipped.
7. Run `npm run build` in `marketing/`. It must pass.
8. Commit on a branch named `seo/<slug>` and open a PR. **Publish only after
   the user says yes** — merging the PR is the publication.
