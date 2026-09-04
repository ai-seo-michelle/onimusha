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

const verifiedGuides = [];

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

function renderHead(page) {
  const locale = page.lang === "ja" ? "ja_JP" : "en_US";
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
    <link rel="stylesheet" href="/assets/styles.css">
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
