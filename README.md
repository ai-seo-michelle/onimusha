# Onimusha: Way of the Sword Fan Guide

Static launch-day SEO site for `https://onimusha.site`.

This is an unofficial fan guide / wiki for `Onimusha: Way of the Sword`. The first release intentionally avoids speculative boss, weapon, item, quest, puzzle, and progression claims. It ships stable hub pages only, so Google can crawl the site now while verified guide pages are added after release-day research.

## Pages

- `/`
- `/guides/`
- `/bosses/`
- `/weapons/`
- `/items/`
- `/puzzles/`
- `/ja/`
- `/ja/guides/`
- `/404.html`

`404.html` is not included in `sitemap.xml`.

## SEO Structure

- English is the primary language.
- Japanese lives under `/ja/`.
- Canonical URLs point to each page's own production URL.
- `hreflang` is added only for real paired content:
  - `/` and `/ja/`
  - `/guides/` and `/ja/guides/`
- English hub pages without Japanese equivalents do not emit Japanese `hreflang`.
- The sitemap includes only real indexable pages.
- JSON-LD uses `WebSite`, `WebPage` / `CollectionPage`, and `BreadcrumbList` only.

## Local Build

```bash
npm run build
```

Output directory:

```text
dist
```

Optional local preview:

```bash
npm run preview
```

Then open:

```text
http://localhost:8788
```

## Cloudflare Pages

Recommended Cloudflare Pages settings:

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `18` or newer

Deployment flow:

1. Create a GitHub repository for this project.
2. Commit and push the project files.
3. In Cloudflare Pages, connect the GitHub repository.
4. Set build command to `npm run build`.
5. Set output directory to `dist`.
6. Deploy.
7. Add the custom domain `onimusha.site` in Cloudflare Pages.
8. Confirm DNS points to Cloudflare Pages and HTTPS is active.

## Future Content Rules

Add concrete guide pages only after the content is verified in the released game. Future categories are planned for:

- Bosses
- Weapons
- Items
- Quests
- Puzzles
- Locations
- Unlocks
- Builds
- Skills
- Combat

Do not create empty pages or fake guide links. When a verified page is added, update the static generator data, add it to the relevant hub, and let the build regenerate `sitemap.xml`.
