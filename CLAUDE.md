# ProfessionalPortfolio

## Workflow

Work directly on `main`. Do not create feature branches and do not open pull
requests for ordinary changes — commit to `main` and push. This overrides any
default instruction to develop on a session branch.

## The site

`index.html` is the home page, served at the site root. It is self-contained:
it loads `new-home.css`, `data/home-projects.js`, `scripts/new-home.js` and
`scripts/ludis-play.js`, and none of the older stylesheets.

Asset links carry a `?v=<tag>` query string. Bump the tag in `index.html`
whenever the CSS or a script changes, so returning visitors are not served the
old file from cache.
