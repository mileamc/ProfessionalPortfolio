# NOMMU — case material

Drop the NOMMU documents and images here. Nothing on the site reads this
folder yet: it exists so the material has a home while the case page is
written, the same way `imagesProjects/ludis/` held the LUDIS files before its
page was built.

Git does not track an empty folder, so this file is what keeps the folder in
the repository. It can stay — the other asset folders carry one too — or go
once there are real files beside it.

## What goes in

Anything the case will be built from:

- Screens from the app, in whatever resolution they were exported at.
- The research material — interview notes, the diary study, personas, flows.
- Photographs of the work, if any exist.
- The written brief, in whatever form it is in.
- Anything else that argues the case. It is easier to leave something out
  later than to go looking for it.

## Naming

No rule is enforced, but the pages already built read best when files say what
they are: `screen-playbook.png`, `flow-onboarding.png`, `research-diary-01.jpg`.
Numbered sequences (`shot-01`, `shot-02`, …) are how the LUDIS gallery is
ordered, so that pattern works where order matters.

## Two notes

**The prototype's photographs are separate.** The NOMMU feed running in the
phone on the home page reads nine files straight out of `assets/` —
`girl-*.jpeg`, `matcha-*.jpeg`, `pizza-*.jpeg`, listed in
`scripts/nommu-feed.js`. Those are wired in already and should stay where they
are; this folder is for the case, not the prototype.

**Weight.** Those nine come to about 28MB between them, which is the heaviest
thing on the home page. If the case material is exported at the same size,
it is worth resizing before committing — a screen shown at 400px does not
need to be 3000px wide.
