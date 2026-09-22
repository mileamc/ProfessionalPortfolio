// work-projects.js — the six projects as the Work page lists them: a square
// photograph, a name, a line about the project, and what it was.
//
// This is what the HOME PAGE shows on a phone. There the prototypes are not
// built at all — they are a pointer's work — and this list stands in their
// place, under the introduction. scripts/mobile-work.js renders it.
//
// work.html carries the same six as written-out markup, because the desktop
// page was built before this file existed. Change a line here and change it
// there too, until the two are joined.
window.workProjects = [
    {
        id: "ludis",
        name: "LUDIS",
        // The one project with a case page. A card with no href keeps its
        // arrow and opens nothing, which is every other card here for now.
        href: "case-ludis.html",
        desc: "A sports management app designed to help teams organize their activities and manage their sports experiences.",
        cover: { src: "assets/capas-work/capa-ludis.jpeg", w: 1024, h: 1024 },
        tags: [
            { key: "product-design", label: "Product Design" },
            { key: "ux-research", label: "UX Research" },
            { key: "wireframing", label: "Wireframing" }
        ]
    },
    {
        id: "mosaico",
        name: "MOSAICO",
        href: "case-mosaico.html",
        desc: "A narrative writing companion designed to guide young learners through the creative process of developing stories.",
        cover: { src: "assets/capas-work/capa-mosaico.jpeg", w: 1024, h: 1024 },
        tags: [
            { key: "lxd", label: "LXD" },
            { key: "ux-research", label: "UX Research" },
            { key: "product-design", label: "Product Design" }
        ]
    },
    {
        id: "imb",
        name: "IMB",
        desc: "A corporate website designed to communicate IMB's services and strengthen its digital presence through a clear and intuitive experience.",
        cover: { src: "assets/capas-work/capa-imb.jpg", w: 1080, h: 1080 },
        tags: [
            { key: "ux-ui", label: "UX/UI" },
            { key: "webdesign", label: "Webdesign" }
        ]
    },
    {
        id: "hpp",
        name: "HPP",
        desc: "A collection of landing pages designed to support external communication and connect audiences with healthcare and institutional initiatives.",
        cover: { src: "assets/capas-work/capa-hpp.jpeg", w: 1024, h: 1024 },
        tags: [
            { key: "ux-ui", label: "UX/UI" },
            { key: "webdesign", label: "Webdesign" },
            // Not a discipline but a credit, and the one tag here that is also
            // on the home, where it keeps the hospital's blue.
            { key: "in-house", label: "Designed in-house — Hospital Pequeno Príncipe" }
        ]
    },
    {
        id: "nommu",
        name: "NOMMU",
        desc: "A social gastronomic diary designed to help people document, evaluate, and share their dining experiences with friends.",
        cover: { src: "assets/capas-work/capa-nommu.jpg", w: 1080, h: 1080 },
        tags: [
            { key: "product-design", label: "Product Design" },
            { key: "ux-ui", label: "UX/UI" },
            { key: "wireframing", label: "Wireframing" }
        ]
    },
    {
        // The archive, which is not a project and so carries no disciplines.
        id: "graphic-design",
        name: "Graphic Design",
        desc: "An archive of visual work across digital and print, exploring communication through typography, imagery, and visual systems.",
        cover: { src: "assets/capas-work/capa-graphic-design.jpg", w: 1080, h: 1080 },
        tags: []
    }
];
