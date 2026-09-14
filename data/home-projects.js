// Content for the new home page (new-home.html).
//
// Hand-edited, unlike data/projects-data.js (which is regenerated from Notion
// on every build). Everything the grid shows comes from here, so adding a
// screenshot or a link never needs a change to the HTML, CSS or script.
//
// PRODUCT DESIGN CARDS carry NO visible text. `title` is used only as the
// accessible name of the card's link ("Open Mosaico") for screen readers.
// The GRAPHIC DESIGN card is the exception: it shows its label, title,
// description and call to action.
//
// HOW TO FILL IT IN
//
//   · Links: set `href`. While it is null the card keeps its arrow and hover,
//     but does not navigate. Existing pages you may want to point to are
//     noted next to each project.
//   · Images: drop a file at the `src` path and it appears. A path that does
//     not exist yet renders a quiet empty shape of the right proportions.
//   · Your own interface or interactive component: add a
//     <template data-nh-card="<id>"> to new-home.html (see the note at the
//     bottom of that file). It replaces the screenshots for that card.
//
// SIZES — the grid has 12 columns
//
//   lead-wide    beside the introduction, at the top — as tall as its content
//   lead-below   beside the introduction, under `lead-wide`, taking the rest
//                of the introduction's height
//   large        7 columns, below the introduction
//   medium       5 columns, below the introduction
//
//   The two `lead` cards sit in the 7 columns beside the introduction, one
//   above the other. Everything after them runs the full width of the page.
//   The graphic design card is always `medium`, so pair it with a `large`
//   project to close the last row.
//
// FRAMES — how screenshots are laid out inside a card
//
//   canvas | phones | browser | stack | custom (content comes from a <template>)
//
// tone   the card's background colour; null uses the standard card grey
// media  list of { src, alt, ratio }; ratio is the expected width:height

window.homeProjects = {
    projects: [
        {
            // Interactive play-drawing prototype. Its markup is the
            // <template data-nh-card="ludis"> in new-home.html and its
            // behaviour is scripts/ludis-play.js — so no `media` here.
            // Only the arrow opens the case page; the rest of the card is
            // for drawing.
            id: "ludis",
            title: "LUDIS",
            href: "case-ludis-lp.html",
            linkArea: "arrow",
            fit: "content",
            size: "lead-wide",
            frame: "custom",
            tone: null,
            media: []
        },
        {
            id: "mosaico",
            title: "Mosaico",
            href: null,          // existing page: case-mosaico-lp.html
            size: "lead-below",
            frame: "canvas",
            tone: null,          // null = the standard card grey
            media: [
                { src: "imagesProjects/mosaico-case/diagram-final.png", alt: "", ratio: "4:3" }
            ]
        },
        {
            id: "hpp",
            title: "Hospital Pequeno Príncipe landing pages",
            href: null,          // existing page: project.html?project=hpp-landing
            size: "large",
            frame: "stack",
            tone: null,
            media: [
                // Front window. Cropped from imagesProjects/hpp-landing/4.jpg.
                { src: "imagesProjects/home-previews/hpp-landing-verao.jpg", alt: "", ratio: "3:2" },
                // The two windows behind it — other landing pages from the collection.
                { src: "imagesProjects/hpp-landing/preview-02.jpg", alt: "", ratio: "3:2" },
                { src: "imagesProjects/hpp-landing/preview-03.jpg", alt: "", ratio: "3:2" }
            ]
        },
        {
            id: "imb",
            title: "IMB website redesign",
            href: null,
            size: "medium",
            frame: "browser",
            tone: null,
            media: [
                { src: "imagesProjects/imb/home.jpg", alt: "", ratio: "3:2" }
            ]
        },
        {
            id: "nommu",
            title: "NOMMU",
            href: null,
            size: "large",
            frame: "phones",
            tone: null,
            media: [
                { src: "imagesProjects/nommu/screen-01.png", alt: "", ratio: "9:19.5" },
                { src: "imagesProjects/nommu/screen-02.png", alt: "", ratio: "9:19.5" },
                { src: "imagesProjects/nommu/screen-03.png", alt: "", ratio: "9:19.5" }
            ]
        }
    ],

    // The graphic design card — visual + text. It closes the last row of the
    // grid, beside the last `large` project.
    graphicDesign: {
        id: "graphic-design",
        label: ["Archive", "Visual communication"],
        title: "Graphic Design",
        description: "Campaigns, editorial and social media for health, education and consumer brands.",
        cta: "View collection",
        href: "design-grafico.html",
        tone: null,
        media: [
            { src: "imagesProjects/home-previews/gd-hpp-campaign.jpg", alt: "" },
            { src: "imagesProjects/home-previews/gd-hpp-social.jpg", alt: "" },
            { src: "imagesProjects/home-previews/gd-dia.jpg", alt: "" },
            { src: "imagesProjects/home-previews/gd-solar.jpg", alt: "" }
        ]
    },

    // PHOTOS in the introduction card — the draggable stack under the text.
    // Five photos, top of the stack first. Set `src` to a file path (for
    // example "assets/about/photo-01.jpg") and `alt` to a short description.
    // While `src` is null the card shows an empty landscape placeholder.
    // Best at a 3:2 landscape crop, around 1200 × 800 px.
    introPhotos: [
        { src: "assets/about/1.jpeg", alt: "" },
        { src: "assets/about/2.jpeg", alt: "" },
        { src: "assets/about/3.jpeg", alt: "" },
        { src: "assets/about/4.jpeg", alt: "" },
        { src: "assets/about/5.jpeg", alt: "" },
        { src: "assets/about/6.jpeg", alt: "" }
    ],

    // Links shown in Contact. null = not shown.
    links: {
        linkedin: null,   // TODO: profile URL
        behance: null,    // TODO: profile URL
        instagram: null   // TODO: profile URL, if it should be listed at all
    }
};
