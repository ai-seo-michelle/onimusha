import { mkdir, rm, writeFile, copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const site = {
  origin: "https://onimusha.site",
  name: "Onimusha Fan Guide",
  gameName: "Onimusha: Way of the Sword",
  releaseDate: "2026-09-04",
  lastmod: "2026-09-04",
};

const gaMeasurementId = "G-W5XG6KYTBP";

const verifiedGuides = [
  {
    title: "Final Boss Guide",
    path: "/guides/final-boss/",
    category: "Boss",
    summary: "Prepare for Yoshitsune and handle the final fight phase by phase.",
  },
  {
    title: "Hidden Treasures Guide",
    path: "/guides/hidden-treasures/",
    category: "Collectibles",
    summary: "Find the five Hidden Treasure chests across Eastern Kyoto.",
  },
  {
    title: "Mask Puzzle Guide",
    path: "/puzzles/mask-puzzle/",
    category: "Puzzle",
    summary: "Use the mask order 3, 4, 1, 2 to open the locked container.",
  },
  {
    title: "Issen Guide",
    path: "/guides/issen/",
    category: "Combat",
    summary: "Learn the attack timing behind Onimusha's signature critical counter.",
  },
];

const primaryHubs = [
  {
    title: "Guides",
    path: "/guides/",
    summary: "Walkthroughs, beginner tips, combat help, and progression support.",
  },
  {
    title: "Bosses",
    path: "/bosses/",
    summary: "Boss strategies, attack patterns, counters, and combat tips.",
  },
  {
    title: "Weapons",
    path: "/weapons/",
    summary: "Weapon locations, abilities, upgrades, and combat uses.",
  },
  {
    title: "Items",
    path: "/items/",
    summary: "Item locations, effects, and where to use them.",
  },
  {
    title: "Puzzles",
    path: "/puzzles/",
    summary: "Puzzle solutions, locations, and step-by-step answers.",
  },
];

const futureAreas = [
  "Quests",
  "Locations",
  "Unlocks",
  "Builds",
  "Skills",
  "Combat",
];

const nav = {
  en: [
    ["Home", "/"],
    ["Guides", "/guides/"],
    ["Bosses", "/bosses/"],
    ["Weapons", "/weapons/"],
    ["Items", "/items/"],
    ["Puzzles", "/puzzles/"],
    ["JA", "/ja/"],
  ],
  ja: [
    ["ホーム", "/ja/"],
    ["ガイド", "/ja/guides/"],
    ["English", "/"],
  ],
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absolute(route) {
  return new URL(route, site.origin).href;
}

function outputPath(route) {
  if (route === "/") return path.join(distDir, "index.html");
  if (route.endsWith(".html")) return path.join(distDir, route.replace(/^\//, ""));
  return path.join(distDir, route.replace(/^\/|\/$/g, ""), "index.html");
}

function pageTitle(title) {
  return `${title} | ${site.gameName} Fan Guide`;
}

function renderHubCards() {
  return primaryHubs.map((hub) => `
    <a class="hub-card" href="${hub.path}">
      <small>Hub</small>
      <span><strong>${esc(hub.title)}</strong>${esc(hub.summary)}</span>
    </a>
  `).join("");
}

function renderFutureTags(extra = []) {
  return [...futureAreas, ...extra].map((area) => `<span class="tag">${esc(area)}</span>`).join("");
}

function renderGuideHighlights() {
  if (verifiedGuides.length === 0) {
    return `
      <section class="section" aria-labelledby="latest-guides">
        <div class="section-heading">
          <h2 id="latest-guides">Latest Guides</h2>
          <p>New guides are being added as players discover the game.</p>
        </div>
      </section>
    `;
  }

  const items = verifiedGuides.slice(0, 6).map((guide) => `
    <a class="hub-card" href="${guide.path}">
      <small>${esc(guide.category)}</small>
      <span><strong>${esc(guide.title)}</strong>${esc(guide.summary)}</span>
    </a>
  `).join("");

  return `
    <section class="section" aria-labelledby="latest-guides">
      <div class="section-heading">
        <h2 id="latest-guides">Latest Guides</h2>
        <p>Freshly verified pages from this fan guide.</p>
      </div>
      <div class="hub-grid">${items}</div>
    </section>
  `;
}

function renderLinkList(links) {
  return `<nav class="link-list" aria-label="Related pages">${links.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join("")}</nav>`;
}

function renderBreadcrumbs(page) {
  if (!page.breadcrumbs || page.breadcrumbs.length <= 1) return "";

  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        ${page.breadcrumbs.map((crumb, index) => {
          const isLast = index === page.breadcrumbs.length - 1;
          return `<li>${isLast ? esc(crumb.label) : `<a href="${crumb.path}">${esc(crumb.label)}</a>`}</li>`;
        }).join("")}
      </ol>
    </nav>
  `;
}

function renderHeader(page) {
  const links = nav[page.lang].map(([label, href]) => {
    const current = page.path === href ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${esc(label)}</a>`;
  }).join("");

  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${page.lang === "ja" ? "/ja/" : "/"}" aria-label="${esc(site.name)}">
          <img class="brand-mark" src="/favicon.svg" width="40" height="40" alt="">
          <span>
            <span class="brand-title">${esc(site.gameName)}</span>
            <span class="brand-subtitle">${page.lang === "ja" ? "非公式 Fan Guide" : "Unofficial Fan Guide"}</span>
          </span>
        </a>
        <nav class="nav" aria-label="${page.lang === "ja" ? "主要ナビゲーション" : "Primary navigation"}">${links}</nav>
      </div>
    </header>
  `;
}

function renderFooter(page) {
  const isJa = page.lang === "ja";
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-links">
          <a href="/">English</a>
          <a href="/ja/">日本語</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
        <p>${isJa
          ? "Onimusha Fan Guide は非公式ファンサイトです。Capcom 公式サイトではなく、Capcom と提携していません。"
          : page.path === "/"
            ? "This is an unofficial fan site and is not affiliated with Capcom."
            : "Onimusha Fan Guide is an unofficial fan site. It is not affiliated with, endorsed by, or operated by Capcom."}</p>
      </div>
    </footer>
  `;
}

function renderJsonLd(page) {
  const pageUrl = absolute(page.path);
  const graph = [
    {
      "@type": page.schemaType || "WebPage",
      "@id": `${pageUrl}#webpage`,
      "url": pageUrl,
      "name": page.h1,
      "headline": page.h1,
      "description": page.description,
      "inLanguage": page.lang,
      "isPartOf": {
        "@id": `${site.origin}/#website`,
      },
      "about": {
        "@type": "VideoGame",
        "name": site.gameName,
        "datePublished": site.releaseDate,
      },
      "publisher": {
        "@type": "Organization",
        "name": site.name,
        "url": site.origin,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      "itemListElement": page.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.label,
        "item": absolute(crumb.path),
      })),
    },
  ];

  if (page.path === "/") {
    graph.unshift({
      "@type": "WebSite",
      "@id": `${site.origin}/#website`,
      "url": site.origin,
      "name": site.name,
      "inLanguage": "en",
      "description": "Unofficial Onimusha: Way of the Sword fan guide and wiki hub.",
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function renderAlternates(page) {
  if (!page.alternates) return "";

  const links = Object.entries(page.alternates)
    .map(([lang, route]) => `<link rel="alternate" hreflang="${lang}" href="${absolute(route)}">`)
    .join("\n");
  const xDefault = page.alternates.en
    ? `\n<link rel="alternate" hreflang="x-default" href="${absolute(page.alternates.en)}">`
    : "";
  return `${links}${xDefault}`;
}

function renderGoogleTag(page) {
  if (page.noindex) return "";

  return `    <script async id="google-analytics-gtag" src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag("js", new Date());
      gtag("config", new URL(document.getElementById("google-analytics-gtag").src).searchParams.get("id"));
    </script>
`;
}

function renderHead(page) {
  const locale = page.lang === "ja" ? "ja_JP" : "en_US";
  const googleTag = renderGoogleTag(page);
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}">
    ${page.noindex ? '<meta name="robots" content="noindex, follow">' : ""}
    <link rel="canonical" href="${absolute(page.path)}">
    ${renderAlternates(page)}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#0b0b0d">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(site.name)}">
    <meta property="og:title" content="${esc(page.title)}">
    <meta property="og:description" content="${esc(page.description)}">
    <meta property="og:url" content="${absolute(page.path)}">
    <meta property="og:locale" content="${locale}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${esc(page.title)}">
    <meta name="twitter:description" content="${esc(page.description)}">
${googleTag}    <link rel="stylesheet" href="/assets/styles.css">
    <script type="application/ld+json">${renderJsonLd(page)}</script>
  `;
}

function renderDocument(page) {
  return `<!doctype html>
<html lang="${page.lang}">
<head>${renderHead(page)}</head>
<body>
  <a class="skip-link" href="#content">${page.lang === "ja" ? "本文へ移動" : "Skip to content"}</a>
  ${renderHeader(page)}
  <main id="content" class="main-inner">
    ${renderBreadcrumbs(page)}
    ${page.body()}
  </main>
  ${renderFooter(page)}
</body>
</html>`;
}

const pages = [
  {
    path: "/",
    lang: "en",
    title: "Onimusha: Way of the Sword Fan Guide | Release-Day Wiki",
    description: "Unofficial Onimusha: Way of the Sword fan guide with release-day hubs for guides, bosses, weapons, items, and puzzles.",
    h1: "Onimusha: Way of the Sword Fan Guide",
    schemaType: "WebPage",
    breadcrumbs: [{ label: "Home", path: "/" }],
    alternates: { en: "/", ja: "/ja/" },
    body: () => `
      <section class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow">Unofficial fan guide / wiki</p>
          <h1>Onimusha: Way of the Sword Fan Guide</h1>
          <p class="lede">Boss strategies, weapons, items, puzzles, locations, and gameplay guides for Onimusha: Way of the Sword.</p>
          <p class="notice">Unofficial fan guide for players exploring the new dark fantasy chapter of Onimusha.</p>
        </div>
        <aside class="release-panel" aria-label="Site status">
          <img class="brand-mark" src="/favicon.svg" width="58" height="58" alt="">
          <dl>
            <div>
              <dt>Game</dt>
              <dd>${site.gameName}</dd>
            </div>
            <div>
              <dt>Release Status</dt>
              <dd>Released September 4, 2026</dd>
            </div>
            <div>
              <dt>Site Type</dt>
              <dd>Unofficial Fan Guide</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section class="section" aria-labelledby="start-here">
        <div class="section-heading">
          <h2 id="start-here">Start Here</h2>
          <p>Choose a section to find strategy help, collectibles, puzzle answers, and combat advice.</p>
        </div>
        <div class="hub-grid">${renderHubCards()}</div>
      </section>

      ${renderGuideHighlights()}
    `,
  },
  {
    path: "/guides/",
    lang: "en",
    title: pageTitle("Guides"),
    description: "Verified Onimusha: Way of the Sword guide hub for launch-day basics, future walkthroughs, combat tips, and progression help.",
    h1: "Onimusha: Way of the Sword Guides",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Guides", path: "/guides/" }],
    alternates: { en: "/guides/", ja: "/ja/guides/" },
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Guide hub</p>
        <h1>Onimusha: Way of the Sword Guides</h1>
        <p class="lede">This hub will collect verified walkthroughs and explainers for the released game. The first version keeps the structure live without inventing strategy pages before they are checked.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>Launch-Day Scope</h2>
          <p class="muted">Use this page as the central guide index. Detailed pages will be added after a guide has confirmed steps, original notes, and a clear reason for players to use it.</p>
          <p class="muted">Planned guide types include beginner routing, combat fundamentals, quest help, unlock notes, and spoiler-conscious progression support.</p>
        </div>
        <div class="panel">
          <h2>Related Hubs</h2>
          ${renderLinkList([
            ["Bosses", "/bosses/"],
            ["Weapons", "/weapons/"],
            ["Items", "/items/"],
            ["Puzzles", "/puzzles/"],
          ])}
        </div>
      </section>
      <section class="section" aria-labelledby="current-guides">
        <div class="section-heading">
          <h2 id="current-guides">Current Guides</h2>
          <p>Focused guides available now.</p>
        </div>
        ${renderLinkList([
          ["Final Boss Guide", "/guides/final-boss/"],
          ["Hidden Treasures Guide", "/guides/hidden-treasures/"],
          ["Issen Guide", "/guides/issen/"],
        ])}
      </section>
    `,
  },
  {
    path: "/guides/final-boss/",
    lang: "en",
    title: pageTitle("Onimusha: Way of the Sword Final Boss Guide"),
    description: "Learn how to beat the Onimusha: Way of the Sword final boss, including preparation, phase tips, Issen timing, and common mistakes.",
    h1: "Onimusha: Way of the Sword Final Boss Guide",
    schemaType: "Article",
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Guides", path: "/guides/" },
      { label: "Final Boss Guide", path: "/guides/final-boss/" },
    ],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Boss guide</p>
        <h1>Onimusha: Way of the Sword Final Boss Guide</h1>
        <p class="lede">The final boss of Onimusha: Way of the Sword is Minamoto no Yoshitsune. This guide focuses on preparation, safe openings, Issen timing, and the three-phase rhythm of the fight without spoiling the full ending.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>Final Boss Overview</h2>
          <p class="muted">Checked boss guides identify Yoshitsune as the last major fight and describe the encounter as a long, demanding three-phase battle. Treat it as an endurance test instead of a burst-damage race.</p>
          <p class="muted">Your goal is to preserve healing, learn which strings are safe to block or parry, drain Yoshitsune's Rikido through defense, and use Issen only when the timing is readable.</p>
        </div>
        <div class="panel">
          <h2>Before the Fight</h2>
          <ul class="rule-list">
            <li><strong>Equip your strongest available weapon and armor.</strong> Do not enter the final stretch with under-upgraded gear if you still have room to improve it.</li>
            <li><strong>Stock recovery items.</strong> Heavy Restoratives are especially valuable because the later phases leave less room for sloppy healing.</li>
            <li><strong>Bring useful consumables.</strong> Amulet of Introspection, Stimulant, Sun-Dried Hozuki, Greater Defense Talisman, and Greater Might Talisman are all named in checked final-boss preparation notes.</li>
            <li><strong>Save your strongest tools.</strong> The safest plan is to keep major healing and Oni Awakening for the late fight instead of spending everything in phase one.</li>
          </ul>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>How to Beat Yoshitsune</h2>
          <ul class="rule-list">
            <li><strong>Phase 1: learn the sword rhythm.</strong> Block or parry the cleaner sword strings, dodge attacks that push you out of position, and avoid using rare consumables just because you took one hit.</li>
            <li><strong>Phase 2: respect the faster pressure.</strong> Yoshitsune becomes harder to reset against, so take shorter punishes and look for red-glowing claw attacks as Issen opportunities only when you can read the timing.</li>
            <li><strong>Phase 3: play for survival first.</strong> Checked final-boss guides report that normal attacks stop being the reliable damage plan here. Use deflects, parries, and purple souls to reach Oni Awakening, then commit damage while awakened.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>Combat Tips</h2>
          <ul class="rule-list">
            <li><strong>Use Issen as a punish, not a guess.</strong> If the timing is unclear, defend or dodge instead of gambling your health bar.</li>
            <li><strong>Do not mash after blocking.</strong> Yoshitsune can punish greedy follow-ups, especially later in the fight.</li>
            <li><strong>Heal after movement, not panic.</strong> Create space first, then use a recovery item when the boss is not already starting another string.</li>
            <li><strong>Practice the counter timing separately.</strong> The <a href="/guides/issen/">Issen Guide</a> explains the basic last-moment attack input if you need a refresher before the final fight.</li>
          </ul>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Common Reasons Players Lose</h2>
          <ul class="rule-list">
            <li><strong>Entering without enough consumables.</strong> The fight is long enough that one bad phase can drain your supplies.</li>
            <li><strong>Forcing Issen on every attack.</strong> Missed counter attempts are often worse than simple defense.</li>
            <li><strong>Spending Oni Awakening too early.</strong> Saving it for the last phase matters because phase three is built around reaching your awakened damage window.</li>
            <li><strong>Overcommitting after a punish.</strong> Take the confirmed hits, then get ready to defend again.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>After the Final Boss</h2>
          <p class="muted">Beating Yoshitsune clears the final encounter and moves the game into its ending sequence. This page avoids listing unverified post-game rewards or exact ending details.</p>
        </div>
      </section>
      <section class="section">
        <div class="panel">
          <h2>FAQ</h2>
          <ul class="rule-list">
            <li><strong>Who is the final boss in Onimusha: Way of the Sword?</strong> The final boss is Minamoto no Yoshitsune.</li>
            <li><strong>How many phases does the final boss have?</strong> Checked final-boss guides describe the fight as having three phases.</li>
            <li><strong>Should I use Issen against Yoshitsune?</strong> Yes, but only when the attack timing is clear. Red-glowing claw attacks are called out as useful counter opportunities in checked guides.</li>
            <li><strong>What should I save for the last phase?</strong> Save major healing, buffs, and Oni Awakening for phase three, where checked guides point players toward awakened damage rather than normal attacks.</li>
          </ul>
        </div>
      </section>
    `,
  },
  {
    path: "/guides/hidden-treasures/",
    lang: "en",
    title: pageTitle("Onimusha Hidden Treasures Locations"),
    description: "Find Onimusha: Way of the Sword Hidden Treasures, including Hidden Treasure No. 1, No. 3, route notes, and location tips.",
    h1: "Onimusha: Way of the Sword Hidden Treasures Guide",
    schemaType: "Article",
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Guides", path: "/guides/" },
      { label: "Hidden Treasures", path: "/guides/hidden-treasures/" },
    ],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Collectibles guide</p>
        <h1>Onimusha: Way of the Sword Hidden Treasures Guide</h1>
        <p class="lede">Hidden Treasures are numbered optional chests found across Eastern Kyoto through Old Drawing clues and Oni Vision. This guide covers the five documented Hidden Treasure locations, with extra notes for No. 1 and No. 3 because those are easy to search for and miss.</p>
      </section>
      <section class="section">
        <div class="panel">
          <h2>Hidden Treasure Locations</h2>
          <ul class="rule-list">
            <li><strong>Hidden Treasure No. 1 - Kiyomizu-zaka Slope.</strong> Start near the Kiyomizu-zaka Slope Spirit Mirror, take the narrow path between buildings, climb the first ladder, then climb the smaller second ladder to the higher rooftop and use Oni Vision.</li>
            <li><strong>Hidden Treasure No. 2 - Yasaka Pagoda waterfall.</strong> Start from the Yasaka Pagoda Spirit Mirror, move toward the nearby rock edge, climb down by the waterfall, and use Oni Vision at the bottom.</li>
            <li><strong>Hidden Treasure No. 3 - Kamo River East.</strong> Start near the Kamo River East Spirit Mirror, enter the temple garden area, move toward the closed gate from the inside, and use Oni Vision there.</li>
            <li><strong>Hidden Treasure No. 4 - Gojo Street East.</strong> Start near the Gojo Street East Spirit Mirror, reach the shrine-like balcony area, go around the outside rather than entering the building, and use Oni Vision on the balcony.</li>
            <li><strong>Hidden Treasure No. 5 - Yasaka Pagoda rooftop.</strong> Return to the Yasaka Pagoda area, climb through the pagoda route to the upper rooftop, clear enemies if needed, then use Oni Vision on the southern side of the upper level.</li>
          </ul>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Hidden Treasure No. 1</h2>
          <p class="muted">For Hidden Treasure No. 1, the important detail is elevation. From the Kiyomizu-zaka Slope Spirit Mirror, head into the narrow side path, climb onto the first roof, then look for the smaller second ladder that takes you higher.</p>
          <p class="muted">Use Oni Vision on the upper rooftop. If nothing appears on the first roof, keep climbing instead of dropping back to street level.</p>
        </div>
        <div class="panel">
          <h2>Hidden Treasure No. 3</h2>
          <p class="muted">For Hidden Treasure No. 3, the search point is near Kamo River East. Enter the temple garden area from near the Spirit Mirror, move inside the wall toward the closed gate, and use Oni Vision from the inside of the garden area.</p>
          <p class="muted">This is the one players often search as "hidden treasure 3" because standing outside the wall or checking the wrong side of the gate can make the clue feel misleading.</p>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Exploration Tips</h2>
          <ul class="rule-list">
            <li><strong>Read the Old Drawing as a landmark clue.</strong> The map marker narrows the area, but the exact reveal point depends on matching the drawing's landmark.</li>
            <li><strong>Check elevation and building sides.</strong> No. 1 requires the higher rooftop, No. 3 is triggered from inside the wall, and No. 4 is on the exterior balcony.</li>
            <li><strong>Use Oni Vision at the exact spot.</strong> The chest is hidden until the reveal action is used from the right position.</li>
            <li><strong>Keep puzzle notes nearby.</strong> If you are clearing optional rooms too, the <a href="/puzzles/mask-puzzle/">Mask Puzzle Guide</a> covers the mask-order solution.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>What This Guide Does Not Guess</h2>
          <p class="muted">This page does not invent extra Hidden Treasure numbers, chest rewards, or unrelated old-game collectible routes. It covers the five documented numbered chests for Onimusha: Way of the Sword only.</p>
        </div>
      </section>
      <section class="section">
        <div class="panel">
          <h2>FAQ</h2>
          <ul class="rule-list">
            <li><strong>How many Hidden Treasures are in Onimusha: Way of the Sword?</strong> Current documented guides list five numbered Hidden Treasure chests.</li>
            <li><strong>Where is Hidden Treasure No. 1?</strong> It is on the higher rooftop reached from the Kiyomizu-zaka Slope route after climbing two ladders.</li>
            <li><strong>Where is Hidden Treasure No. 3?</strong> It is near Kamo River East, by the closed gate inside the temple garden area.</li>
            <li><strong>Is this only a Hidden Treasure 3 guide?</strong> No. This is the main Hidden Treasures guide, with No. 3 highlighted because players commonly search for it by number.</li>
          </ul>
        </div>
      </section>
    `,
  },
  {
    path: "/guides/issen/",
    lang: "en",
    title: pageTitle("Onimusha Issen Guide"),
    description: "Learn how to perform Issen in Onimusha: Way of the Sword, including timing, practice tips, and common mistakes.",
    h1: "Onimusha: Way of the Sword Issen Guide",
    schemaType: "Article",
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Guides", path: "/guides/" },
      { label: "Issen Guide", path: "/guides/issen/" },
    ],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Combat guide</p>
        <h1>Onimusha: Way of the Sword Issen Guide</h1>
        <p class="lede">Issen is Onimusha's signature critical counter. In Way of the Sword, the basic idea is simple but strict: attack at the last moment, just before an enemy strike connects.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>How to Perform Issen</h2>
          <ul class="rule-list">
            <li><strong>Watch the enemy's committed swing.</strong> Do not react to the first twitch or step forward. Wait until the attack is actually coming in.</li>
            <li><strong>Press attack just before impact.</strong> The regular Issen timing is an attack input placed right before the enemy hit lands.</li>
            <li><strong>Stay calm after a miss.</strong> If the input is too early or too late, treat it as a failed counter and reset your spacing instead of mashing.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>What Issen Is</h2>
          <p class="muted">Issen is a high-risk critical attack built around timing. It is different from defensive options such as parry, deflect, or evade because the counter depends on committing to the attack at the right moment.</p>
          <p class="muted">No official frame window was available in the checked sources, so this guide avoids claiming an exact number of frames.</p>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Timing Tips</h2>
          <ul class="rule-list">
            <li><strong>Use slower melee enemies for practice.</strong> Attacks with a clear wind-up make the final hit timing easier to read.</li>
            <li><strong>Look for the point of no return.</strong> The best cue is usually the moment the enemy has committed to the strike and can no longer simply reposition.</li>
            <li><strong>Practice one attack at a time.</strong> Learning a single swing pattern is more useful than trying to counter every move in a new fight.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>Common Mistakes</h2>
          <ul class="rule-list">
            <li><strong>Pressing too early.</strong> An early attack usually becomes a normal swing instead of an Issen.</li>
            <li><strong>Mashing attack.</strong> Repeated inputs make the timing less precise and can leave you exposed.</li>
            <li><strong>Treating Issen like a block.</strong> It is a counterattack timing, not a guard held through the enemy's hit.</li>
          </ul>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Related Terms</h2>
          <p class="muted">Some guides and in-game references may mention Chain Issen or Break Issen. Those are related Issen techniques, but this page focuses on the regular timing players search for first.</p>
        </div>
        <div class="panel">
          <h2>Keep Reading</h2>
          ${renderLinkList([
            ["Guides Hub", "/guides/"],
            ["Bosses", "/bosses/"],
            ["Weapons", "/weapons/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/bosses/",
    lang: "en",
    title: pageTitle("Bosses"),
    description: "Onimusha: Way of the Sword boss guide hub for verified strategy pages, counters, phases, and rewards once confirmed.",
    h1: "Onimusha: Way of the Sword Bosses",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Bosses", path: "/bosses/" }],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Boss hub</p>
        <h1>Onimusha: Way of the Sword Bosses</h1>
        <p class="lede">This boss hub is ready for confirmed encounters, but the first version does not publish a speculative boss roster or fake strategy links.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>What Will Be Added</h2>
          <p class="muted">Future boss pages should include verified location context, attack patterns, phase changes, openings, recommended preparation, and rewards only when those details are confirmed.</p>
          <p class="muted">Until then, this page keeps boss coverage organized without pretending the full encounter list is already verified.</p>
        </div>
        <div class="panel">
          <h2>Guide Standards</h2>
          <ul class="rule-list">
            <li>Use tested strategies, not copied summaries.</li>
            <li>Separate spoiler-light tips from full encounter breakdowns.</li>
            <li>Name bosses only after the guide can verify the encounter.</li>
          </ul>
        </div>
      </section>
    `,
  },
  {
    path: "/weapons/",
    lang: "en",
    title: pageTitle("Weapons"),
    description: "Onimusha: Way of the Sword weapon guide hub for verified unlocks, upgrades, moves, and build notes as they are confirmed.",
    h1: "Onimusha: Way of the Sword Weapons",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Weapons", path: "/weapons/" }],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Weapon hub</p>
        <h1>Onimusha: Way of the Sword Weapons</h1>
        <p class="lede">A future home for verified weapon pages covering unlock methods, upgrade notes, move behavior, and build relevance without guessing at the launch roster.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>Launch Version Policy</h2>
          <p class="muted">The site will not list weapon names, stats, or upgrade paths until the information is checked in the released game. That keeps the category useful without turning it into misinformation.</p>
        </div>
        <div class="panel">
          <h2>Related Coverage</h2>
          ${renderLinkList([
            ["Guides", "/guides/"],
            ["Items", "/items/"],
            ["Bosses", "/bosses/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/items/",
    lang: "en",
    title: pageTitle("Items"),
    description: "Onimusha: Way of the Sword item guide hub for verified item effects, sources, key uses, and collection notes.",
    h1: "Onimusha: Way of the Sword Items",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Items", path: "/items/" }],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Item hub</p>
        <h1>Onimusha: Way of the Sword Items</h1>
        <p class="lede">This hub reserves a clean place for confirmed item pages, including effects, sources, progression use, and collection notes once each detail is verified.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>What Belongs Here</h2>
          <p class="muted">Future pages should be written around a real player need: where an item is found, what it does, whether it is missable, and when it matters. No item page should exist just to fill an index.</p>
        </div>
        <div class="panel">
          <h2>Related Coverage</h2>
          ${renderLinkList([
            ["Guides", "/guides/"],
            ["Weapons", "/weapons/"],
            ["Puzzles", "/puzzles/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/puzzles/",
    lang: "en",
    title: pageTitle("Puzzles"),
    description: "Onimusha: Way of the Sword puzzle guide hub for verified puzzle solutions, locations, steps, and spoiler-aware hints.",
    h1: "Onimusha: Way of the Sword Puzzles",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Puzzles", path: "/puzzles/" }],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Puzzle hub</p>
        <h1>Onimusha: Way of the Sword Puzzles</h1>
        <p class="lede">Puzzle pages will be added only after exact locations, steps, and outcomes are verified. This page gives the category a real home without publishing untested solutions.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>Future Puzzle Format</h2>
          <p class="muted">Each solution should separate hints from full answers, identify the in-game location, and explain the result clearly. Pages should avoid vague guesses and copied walkthrough text.</p>
        </div>
        <div class="panel">
          <h2>Related Coverage</h2>
          ${renderLinkList([
            ["Guides", "/guides/"],
            ["Items", "/items/"],
            ["Bosses", "/bosses/"],
          ])}
        </div>
      </section>
      <section class="section" aria-labelledby="current-puzzles">
        <div class="section-heading">
          <h2 id="current-puzzles">Current Puzzle Guides</h2>
          <p>Focused puzzle help available now.</p>
        </div>
        ${renderLinkList([
          ["Mask Puzzle Guide", "/puzzles/mask-puzzle/"],
        ])}
      </section>
    `,
  },
  {
    path: "/puzzles/mask-puzzle/",
    lang: "en",
    title: pageTitle("Onimusha Mask Puzzle Solution"),
    description: "Solve the Onimusha mask puzzle in Way of the Sword with the correct mask order, clue explanation, and troubleshooting tips.",
    h1: "Onimusha: Way of the Sword Mask Puzzle Guide",
    schemaType: "Article",
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Puzzles", path: "/puzzles/" },
      { label: "Mask Puzzle", path: "/puzzles/mask-puzzle/" },
    ],
    body: () => `
      <section class="page-header">
        <p class="eyebrow">Puzzle guide</p>
        <h1>Onimusha: Way of the Sword Mask Puzzle Guide</h1>
        <p class="lede">The mask puzzle answer is 3, 4, 1, 2. Count the four masks above the locked container from left to right, then shoot them in that order.</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>Mask Puzzle Solution</h2>
          <ul class="rule-list">
            <li><strong>Face the locked container.</strong> Use the four masks mounted above it as the targets.</li>
            <li><strong>Number the target masks from left to right.</strong> The leftmost mask is 1, then 2, 3, and 4.</li>
            <li><strong>Shoot the masks in this order:</strong> 3, 4, 1, 2.</li>
            <li><strong>Collect the reward.</strong> Opening the container gives the Unsettling Mask.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>How the Puzzle Works</h2>
          <p class="muted">The room uses two sets of masks. The masks above the locked container are the ones you interact with, while the masks on the opposite shoji-style wall provide the clue.</p>
          <p class="muted">The light and shadow pattern points to the order. If you only need the answer, use 3, 4, 1, 2 on the target masks.</p>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Step-by-Step</h2>
          <ul class="rule-list">
            <li><strong>1. Stand where you can see the container and all four target masks.</strong></li>
            <li><strong>2. Count the target masks from left to right.</strong></li>
            <li><strong>3. Shoot the third mask, then the fourth mask.</strong></li>
            <li><strong>4. Shoot the first mask, then the second mask.</strong></li>
            <li><strong>5. Open the container and take the Unsettling Mask.</strong></li>
          </ul>
        </div>
        <div class="panel">
          <h2>Common Mistakes</h2>
          <ul class="rule-list">
            <li><strong>Shooting the clue masks.</strong> The shoji-wall masks show the hint; the targets are above the locked container.</li>
            <li><strong>Counting from the wrong wall.</strong> The 3, 4, 1, 2 order is for the target masks above the container.</li>
            <li><strong>Reversing left and right.</strong> Face the target masks directly before counting them.</li>
          </ul>
        </div>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>Location Note</h2>
          <p class="muted">The mask puzzle appears in the Underground Laboratory section. Use the direct order above if you are already in the room and just need the solution.</p>
        </div>
        <div class="panel">
          <h2>Keep Reading</h2>
          ${renderLinkList([
            ["Puzzles Hub", "/puzzles/"],
            ["Items", "/items/"],
            ["Guides", "/guides/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/ja/",
    lang: "ja",
    title: `Onimusha: Way of the Sword 非公式ファンガイド | ${site.name}`,
    description: "Onimusha: Way of the Sword の非公式ファンガイド。発売日向けの基礎Hubと、今後の検証済み攻略ページのための日本語入口です。",
    h1: "Onimusha: Way of the Sword 非公式ファンガイド",
    schemaType: "WebPage",
    breadcrumbs: [{ label: "ホーム", path: "/ja/" }],
    alternates: { en: "/", ja: "/ja/" },
    body: () => `
      <section class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow">非公式 Fan Guide / Wiki</p>
          <h1>Onimusha: Way of the Sword 非公式ファンガイド</h1>
          <p class="lede">発売日段階の基礎情報と、今後追加する検証済み攻略ページのための日本語入口です。未確認のボス名、武器名、アイテム名、謎解き手順は掲載しません。</p>
          <p class="notice">このサイトはファン運営の非公式サイトです。Capcom 公式サイトではなく、公式画像・ロゴ・他Wikiのコピーコンテンツは使用しません。</p>
        </div>
        <aside class="release-panel" aria-label="サイト情報">
          <img class="brand-mark" src="/favicon.svg" width="58" height="58" alt="">
          <dl>
            <div>
              <dt>Game</dt>
              <dd>${site.gameName}</dd>
            </div>
            <div>
              <dt>Release</dt>
              <dd>2026年9月4日 発売</dd>
            </div>
            <div>
              <dt>Site</dt>
              <dd>非公式 Fan Guide</dd>
            </div>
          </dl>
        </aside>
      </section>
      <section class="section content-grid">
        <div class="panel">
          <h2>日本語ページ方針</h2>
          <p class="muted">日本語版は英語ページを機械的に増やすのではなく、日本語検索で必要になるページだけを検証後に追加します。現在の日本語ページはホームとガイドHubです。</p>
        </div>
        <div class="panel">
          <h2>入口</h2>
          ${renderLinkList([
            ["日本語ガイドHub", "/ja/guides/"],
            ["English Guides", "/guides/"],
            ["Bosses", "/bosses/"],
            ["Weapons", "/weapons/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/ja/guides/",
    lang: "ja",
    title: `Onimusha: Way of the Sword 攻略ガイド | ${site.name}`,
    description: "Onimusha: Way of the Sword の日本語攻略ガイドHub。検証済みの攻略、進行、戦闘、謎解きページを今後追加するための入口です。",
    h1: "Onimusha: Way of the Sword 攻略ガイド",
    schemaType: "CollectionPage",
    breadcrumbs: [{ label: "ホーム", path: "/ja/" }, { label: "ガイド", path: "/ja/guides/" }],
    alternates: { en: "/guides/", ja: "/ja/guides/" },
    body: () => `
      <section class="page-header">
        <p class="eyebrow">日本語ガイドHub</p>
        <h1>Onimusha: Way of the Sword 攻略ガイド</h1>
        <p class="lede">検証済みの攻略記事を追加するための日本語Hubです。初版では、未確認の具体的なボス攻略、武器データ、アイテム一覧、謎解き答えは作成していません。</p>
      </section>
      <section class="content-grid">
        <div class="panel">
          <h2>今後追加する内容</h2>
          <p class="muted">実プレイで確認した進行ガイド、戦闘の基本、謎解きヒント、ボス攻略などを、検索意図ごとに独立ページとして追加します。</p>
        </div>
        <div class="panel">
          <h2>関連ページ</h2>
          ${renderLinkList([
            ["日本語ホーム", "/ja/"],
            ["English Guides", "/guides/"],
            ["Puzzles", "/puzzles/"],
          ])}
        </div>
      </section>
    `,
  },
  {
    path: "/404.html",
    lang: "en",
    title: `Page Not Found | ${site.name}`,
    description: "The requested Onimusha fan guide page could not be found.",
    h1: "Page Not Found",
    noindex: true,
    schemaType: "WebPage",
    breadcrumbs: [{ label: "Home", path: "/" }, { label: "Page Not Found", path: "/404.html" }],
    body: () => `
      <section class="not-found">
        <p class="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p class="lede">This guide page does not exist yet. The launch version only includes real hub pages, so unverified walkthrough URLs are not published.</p>
        ${renderLinkList([
          ["Return Home", "/"],
          ["Guides", "/guides/"],
          ["Bosses", "/bosses/"],
        ])}
      </section>
    `,
  },
];

async function copyDir(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else {
      await copyFile(src, dest);
    }
  }
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${absolute("/sitemap.xml")}
`;
}

function renderSitemap() {
  const indexable = pages.filter((page) => !page.noindex && !page.path.endsWith("404.html"));
  const urls = indexable.map((page) => {
    const alternateLinks = page.alternates
      ? `${Object.entries(page.alternates).map(([lang, route]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absolute(route)}" />`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(page.alternates.en)}" />`
      : "";

    return `  <url>
    <loc>${absolute(page.path)}</loc>
    <lastmod>${site.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page.path === "/" ? "1.0" : page.path.startsWith("/ja/") ? "0.7" : "0.8"}</priority>
${alternateLinks}
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

async function validateBuild() {
  const indexable = pages.filter((page) => !page.noindex);
  for (const page of indexable) {
    const file = outputPath(page.path);
    const info = await stat(file);
    if (info.size < 800) throw new Error(`${page.path} looks too small to be a real page.`);
    const html = await readFileUtf8(file);
    for (const required of [
      "<h1",
      'rel="canonical"',
      'name="description"',
      'property="og:title"',
      'application/ld+json',
    ]) {
      if (!html.includes(required)) throw new Error(`${page.path} is missing ${required}`);
    }
    const gaIdCount = html.split(gaMeasurementId).length - 1;
    if (gaIdCount !== 1) throw new Error(`${page.path} should include exactly one GA4 Measurement ID, found ${gaIdCount}.`);
    if (!html.includes("https://www.googletagmanager.com/gtag/js?id=")) {
      throw new Error(`${page.path} is missing the GA4 gtag.js script.`);
    }
  }
}

async function readFileUtf8(file) {
  const { readFile } = await import("node:fs/promises");
  return readFile(file, "utf8");
}

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(path.join(distDir, "assets"), { recursive: true });
  await copyDir(path.join(projectRoot, "public"), distDir);
  await copyFile(path.join(__dirname, "styles.css"), path.join(distDir, "assets", "styles.css"));

  for (const page of pages) {
    const file = outputPath(page.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, renderDocument(page), "utf8");
  }

  await writeFile(path.join(distDir, "robots.txt"), renderRobots(), "utf8");
  await writeFile(path.join(distDir, "sitemap.xml"), renderSitemap(), "utf8");
  await validateBuild();
  console.log(`Built ${pages.length} HTML files into ${path.relative(projectRoot, distDir)}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
