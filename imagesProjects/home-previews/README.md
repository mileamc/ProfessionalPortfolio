# New home — preview images

Everything the bento grid on `new-home.html` shows is listed in
`data/home-projects.js`. Drop a file at the path below and it appears; until
then the card shows a quiet empty shape (no text). The browser console lists
the paths still missing on every load.

## Still expected

| Card | Path | Shape | What works best |
| --- | --- | --- | --- |
| Mosaico | `imagesProjects/mosaico-case/diagram-final.png` | 4:3 | The finished, coloured diagram (same file the case page expects) or a product screen of the AI companion |
| Hospital Pequeno Príncipe | `imagesProjects/hpp-landing/preview-02.jpg` | 3:2 | Top of a second landing page, screenshot only — no laptop mockup |
| Hospital Pequeno Príncipe | `imagesProjects/hpp-landing/preview-03.jpg` | 3:2 | Top of a third landing page |
| IMB | `imagesProjects/imb/home.jpg` | 3:2 (taller is fine — it is cropped from the top) | Homepage screenshot, browser viewport only |
| NOMMU | `imagesProjects/nommu/screen-01.png` … `screen-03.png` | 9:19.5 | Three app screens, status bar included, no device frame |

## Already in place

The files in this folder are resized copies made for the home page, so the
grid does not download the 1080px originals:

- `hpp-landing-verao.jpg` — the screen area cropped out of `hpp-landing/4.jpg`
  (the original is a laptop mockup on a green background)
- `gd-*.jpg` — 640px copies of the four graphic design thumbnails

LUDIS uses `ludis-lp/shot-09.png` and `ludis-lp/shot-01.png` directly.

## Tips

- Screenshots without device frames: the page draws the phone and browser
  frames itself, so a mockup inside them doubles up.
- Keep previews under ~200 KB. Around 1000px wide is plenty for landscape
  images; phone screens around 400px wide.
- To use a different file name, change the `src` in `data/home-projects.js`.
