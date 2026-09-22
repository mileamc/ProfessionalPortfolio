# NOMMU — case content

## Header format (applies to this case and retroactively to case-ludis.html and case-mosaico.html)

Title + subtitle/tagline directly below it, then a divider line, then a
two-column layout: left column stacks short metadata labels (MY ROLE,
TEAM, TOOLS, TIMELINE) each with its value beneath; right column holds
labeled text blocks (DESCRIPTION, CONTEXT). No hero image or phone
mockup sits inside this header block — any hero image goes in its own
section directly below it.

## Hero

**Title:** NOMMU
**Subtitle:** A gastronomic memory journal built on people you trust

**MY ROLE** — Product & UX Designer
**TEAM** — Pedro Gradowski, Pedro Gulin, Fernando Tramontina
**TOOLS** — Figma, Claude Code
**TIMELINE** — 2026

**DESCRIPTION**
A digital journal for gastronomic memories, built for travelers and food lovers who want to save, rate, and share dining experiences with people they actually know.

**CONTEXT**
General social networks were never built to centralize gastronomic reviews. As niche, decentralized micro-networks — Substack, Medium, Foursquare — grew, an opportunity emerged: a space built specifically for food memories, where trust comes from friends, not from anonymous authority.

Hero image: `nommu.jpg`

---

## The product

In the app, users navigate a feed of restaurant reviews centered on friends rather than public recommendations. They can interact with posts, save them into folders and lists, and write their own reviews — with photos, prices, ratings, and custom tags (who they were with, the type of cuisine, and so on). Together, reviews and lists build a personal profile: a private, individualized record of dining memories.

---

## My role and the team

I'm the only designer on a four-person team, working alongside three developers. Every product and UX decision passed through me, but nothing shipped without the team validating it against what was actually buildable — every design choice had to hold up on a technical-feasibility standpoint, not just a design one.

---

## Who it's for

Image: `persona.png` — Lara, 21, Curitiba. Wants to travel and explore new experiences without overspending, and shares everything online. Budget-conscious, values authenticity and word-of-mouth over polished recommendations.

---

## The key decision: rebuilding the feed around trust

Before designing screens, we ran an interest survey with 47 respondents to validate the concept. The clearest signal: 100% of them wanted to know where their close friends had been eating and what they recommended.

That single number reshaped the feed. The original version surfaced recommended pages — the kind of curated, authority-driven content you'd see on a general platform. We rebuilt it to foreground friends' reviews first.

[PULL QUOTE / HIGHLIGHT BOX — visually set apart, larger type or boxed, not run into the paragraph]
"Trust, in NOMMU, doesn't come from being an established reviewer or influencer — it comes from being someone the user actually knows."

[STAT CALLOUT — large number treatment, same pattern as LUDIS's "8 / 20 / 3" stat row]
100% of 47 respondents wanted to see where friends had eaten and what they recommended.

Images:
- `Captura_de_Tela_2025-09-09_as_15.51.32.png` — primary: 47 responses, 100% "yes". Place this chart directly beside or behind the stat callout above, not as a separate unrelated figure.
- `Captura_de_Tela_2025-09-09_as_15.52.17.png` — secondary/supporting: 63.8% "definitely interested" in a travel + food community. Smaller, secondary treatment — not equal visual weight to the primary stat.

---

## Testing the concept, not just usability

Once we had a non-interactive prototype, we ran an informal in-person test with 3 people. The goal wasn't formal usability measurement — it was checking whether people connected with the concept and the core functionalities before investing further.

One outcome came directly out of that session: the team collectively landed on automating tags into search filters. Instead of users manually filtering their saved memories, any tag they create on a review automatically becomes a filter on their own profile.

[HIGHLIGHT — bold or set on its own line, not buried in the paragraph above]
Turning a clunky manual step into something that happens for free.

Images:
- `b9d04a5a-df78-4134-b9d3-8dca84c3d227.png` — process shot: sketchbook page with "TAGS" annotated by hand
- `TEEELA.png` — before/after of the profile screen, showing the tag badges added
- `itens.png` — close-up crop of the tag pill component ("viajante profissional", "Mestre do Hashi")

---

## Craft: building on Material 3

Screens were built on an adapted Material 3 library — both its component set and its navigation structure — rather than a custom system from scratch. We adopted a 3-column grid specifically for scalability, anticipating how the interface needed to grow as more content types (folders, lists, profiles) were added.

(No image mapped yet — optional, add a Material 3 kit / grid reference screenshot if available later.)

---

## Visual identity, now in motion

Screens have moved from wireframe to high fidelity, and NOMMU's visual identity is currently being implemented directly into them — brand and interface converging in the same pass rather than being handled as separate phases.

(No image mapped yet — optional, add once brand exploration assets exist.)

---

## The solution in practice

Login & feed → new post → profile: a 3-screen walkthrough.

Image: `tudin.png` (single image containing all 3 screens — split/crop if the layout needs individual frames)

---

## Every screen that shipped

Image: `all2.png` — full screen grid/gallery, same pattern as the LUDIS case's "every screen that shipped" section.

---

## What's next

The immediate priorities are finishing validation on the interactive prototype and documenting the design system, so decisions made so far (the feed logic, the tag-filter automation, the grid) are captured for the team going forward.

---

## Where this stands

NOMMU hasn't launched yet, so there's no usage data — but the process already produced two concrete product decisions.

[STAT ROW — large-number treatment, same visual pattern as LUDIS's "8 new teams / 20 active users / 3 paid campaigns" row]
- 47 — survey respondents who validated the friends-first feed
- 3 — in-person testers who surfaced the tag-filter automation
- 2 — product decisions shipped directly from evidence

[HIGHLIGHT / CLOSING LINE — set apart from the paragraph, this is the case's final takeaway, treat it like LUDIS's closing reflection]
Both came directly from evidence, not assumption.
