# Handoff: Massage 4 You — premium studio website (local-SEO)

## Overview
Full website for **Massage 4 You**, a massage & body-treatment studio at ul. Zeylanda 3/1, Poznań, Poland. The site is a **local-SEO** build: a homepage, an offer hub, and a dedicated page per service so each targets its own keyword (`masaż [typ] Poznań`) and can be linked from Instagram and the Google Business Profile. All copy is in **Polish**.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look, layout, and behavior. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** (Next.js/React, Astro, WordPress, etc.) using its established patterns, routing, and component conventions. If no environment exists yet, choose the most appropriate framework for a content/SEO site (Astro or Next.js recommended for static-first SEO) and implement there.

Two parallel expressions of the homepage exist in the source project:
- **Design Components** (`*.dc.html`) — the authored prototypes (a small runtime renders template + logic).
- **`site/`** — a plain static HTML/CSS/JS version of the homepage (no runtime), which is the cleanest starting reference for a developer.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are specified. Recreate pixel-accurately using the codebase's libraries. The `site/styles.css` token block is the source of truth for colors and type.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Forest green | `#2E4B37` | Header/nav bg, dark sections, primary text, dark CTAs |
| Camel / tan | `#C08B4E` | Accent, primary button bg, eyebrows, prices, links |
| Cream | `#F6F3EC` | Page background, text on dark sections |
| Cream-2 | `#EDE7DA` | Alternating section background |
| Muted | `#55594C` | Body copy on light |
| Faint | `#8C9080` | Meta/labels, captions |
| Paper-dark | `#E6E2D6` | Secondary text on dark sections |
| On-dark faint | `#C4C7B5` | Muted text on forest-green sections |

Selection: bg `#2E4B37`, text `#F6F3EC`. Link default `#C08B4E`, hover `#2E4B37`.

### Typography
- **Display / headings:** `Cormorant Garamond` (serif) — weights 400/500/600, plus italic 400/500. Used for H1–H3, prices, stats, logo. Letter-spacing ≈ `-0.01em` on large headings.
- **Body / UI:** `Jost` (sans) — weights 300/400/500/600. Body weight 300. Eyebrows/labels: 11–13px, `letter-spacing: 0.14em–0.28em`, `text-transform: uppercase`.
- Google Fonts import:
  `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap`

### Scale & spacing
- Section vertical padding: `clamp(64px, 9vw, 120px)` (service pages), `clamp(80px, 12vh, 160px)` (homepage).
- Horizontal gutter: `clamp(24px, 5vw, 72px)`.
- H1: `clamp(40px, 5–7vw, 74–96px)`, line-height ~1.02.
- H2: `clamp(28px, 3.4–4.5vw, 46–60px)`, line-height ~1.05.
- Body: 15–19px, line-height 1.7–1.8.
- Border radius: cards 12–14px, pills/buttons 100px, images 4px (homepage) / cover on service heroes.
- Shadows: cards `0 10px 28px -22px rgba(46,75,55,.6)`; hover lift `translateY(-4px)` + `0 24px 46px -26px rgba(46,75,55,.5)`.
- Card grids: `repeat(auto-fit/auto-fill, minmax(280–320px, 1fr))`, gap `clamp(16px,2vw,28px)`.

## Sitemap
```
Strona główna (/)
├── O nas (/o-nas)                 studio · zespół · dyplomy i certyfikaty
├── Oferta (/oferta)               HUB — links to all 14 services
│   ├── Masaże ciała
│   │   ├── /oferta/masaz-klasyczny-poznan
│   │   ├── /oferta/masaz-leczniczy-poznan
│   │   ├── /oferta/masaz-relaksacyjny-poznan
│   │   ├── /oferta/masaz-tkanek-glebokich-poznan
│   │   ├── /oferta/drenaz-limfatyczny-poznan
│   │   ├── /oferta/masaz-antycellulitowy-poznan
│   │   ├── /oferta/masaz-kamieniami-goracymi-poznan
│   │   ├── /oferta/masaz-cztery-rece-poznan
│   │   └── /oferta/masaz-dla-dwojga-poznan
│   ├── Masaże tajskie
│   │   ├── /oferta/masaz-tajski-poznan
│   │   └── /oferta/masaz-tajski-stop-poznan
│   └── Masaże twarzy
│       ├── /oferta/masaz-kobido-poznan
│       ├── /oferta/masaz-skulpturalny-twarzy-poznan
│       └── /oferta/masaz-transbukalny-poznan
├── Cennik (/cennik)
├── Bony podarunkowe (/bony-podarunkowe)
├── Blog / Poradnik (/blog)        + post template
├── Opinie (/opinie)               Google + Booksy
├── Rezerwacja online (/rezerwacja)
├── Kontakt (/kontakt)             mapa, adres, godziny, formularz
├── FAQ (/faq)
├── Polityka prywatności (/polityka-prywatnosci)
└── Regulamin (/regulamin)
```

## Screens / Views

### 1. Homepage (`site/index.html`, `Massage4you.dc.html`)
- **Purpose:** brand entry; drive bookings and route to services.
- **Layout (top → bottom):**
  - **Fixed header** — logo (mark + wordmark) left, six-item nav center-right (`O nas · Zespół · Cennik · Galeria · Opinie · Kontakt`), "Rezerwacja" pill CTA right pointing at `#rezerwacja`. Transparent over the hero behind a top gradient scrim, then `.header--scrolled` fills it forest-green past 40px of scroll (`script.js`). Collapses to a hamburger < 860px, where `.nav__book` supplies the booking link inside the folded panel.
  - **Hero** — full-viewport image (`images/hero.jpg`) with a top-to-bottom dark scrim `linear-gradient(180deg, rgba(30,25,18,.55) → .78)`; content bottom-left: eyebrow, serif H1 (`Chwila spokoju, której potrzebuje Twoje ciało`), lead, two CTAs (solid camel + ghost underline). Opening hours + phone bottom-right.
  - **Marquee strip** — forest-green bar, italic serif, infinite scroll (`@keyframes marquee`, 34s linear).
  - **O nas** — 12-col grid: copy left (H2 + 2 paragraphs + 3 stats `8+ / 5 / 100%`), media right (tall image + overlapping inset framed with 10px cream border).
  - **Cennik** (`#cennik`) — cream-2 bg; the full catalogue of 16 services split into three groups (`01 Masaże ciała`, `02 Masaże tajskie`, `03 Masaże twarzy`), each a bordered card grid. Every tile carries number, name, description, duration, "od X zł" and a light **Rezerwacja** button (`.btn--light`) that jumps to the booking form with that treatment preselected; tiles with a dedicated page also show a "Więcej →" link. Tile hover fills forest-green with cream text (`transition: background/color .5s`); italic note beneath.
  - **Dlaczego my** — 4 numbered reasons in a 2-col grid + 5,0 rating badge.
  - **Zespół** — cream-2; 3 therapist cards (portrait, name serif, role uppercase).
  - **Feature/quote band** — full-bleed image + 55% scrim; centered play button (76px circle) + italic serif pull-quote.
  - **Galeria** — 4-col bento grid, one 2×2 tall + one 2-wide.
  - **Opinie** — forest-green section; 3 review cards (5 stars, italic quote, author + Google/Booksy source).
  - **Vouchery** — 12-col grid: gift-card visual (gradient forest-green, `aspect-ratio 1.6/1`) + copy/CTA.
  - **Blog** — cream-2; 3 post cards, image zoom on hover (`scale(1.04)`), title turns camel on hover.
  - **Rezerwacja** (`#rezerwacja`) — 12-col grid: copy + phone/e-mail/hours left, booking form right. Fields: name, phone, e-mail, treatment (`<optgroup>` per category, all 16 + voucher + "doradztwo"), duration, therapist, preferred date/time, message, consent checkbox. Native validation; every "Rezerwacja" button on the page preselects its treatment here.
  - **Kontakt / footer** — forest-green; big serif phone `+48 533 681 901`, email, hours, address (ul. Zeylanda 3/1, 60-808 Poznań), footer with the cream logo lockup and year.

### 2. Oferta hub (`Oferta.dc.html`)
- **Purpose:** list all 14 services grouped, each linking to its page.
- **Layout:** forest-green nav → forest-green hero (eyebrow, H1 `Masaż w Poznaniu — dobrany do Twojego ciała`, lead) → three group sections (`01 Masaże ciała`, `02 Masaże tajskie`, `03 Masaże twarzy`), each a `minmax(320px,1fr)` card grid → forest-green CTA band.
- **Service card:** white, radius 14px; 190px cover image with a forest-green category pill top-left; body = serif name, 14px description, footer row (uppercase meta `od X zł · N min` + camel "Zobacz →"). Hover lifts card and nudges the arrow.

### 3. Service page template (`Masaz-Klasyczny.dc.html`) — the pattern for all 14
- **Purpose:** convert a keyword visitor; H1 pattern `Masaż [typ] — Poznań`.
- **9 sections in order:**
  1. **Hero** — 2-col (≈1.05fr / 1fr): left = eyebrow `Masaż ciała · Poznań`, H1, lead, two CTAs (`Umów wizytę` solid camel + `Czas i cena` underline anchor to `#cennik`); right = full-height cover image. `min-height: 74vh`.
  2. **Korzyści / dla kogo** — forest-green; 12-col grid, heading left (4 cols), four numbered benefit blocks right (2×2).
  3. **Jak przebiega zabieg** — 4 step cards in a 1px-gap grid; big camel serif number, title, description.
  4. **Czas i cena** (`#cennik`) — cream-2; 12-col: copy left (5 cols), pricing rows right (white pill rows: time + note + camel price) + dark "Zarezerwuj termin" CTA. Three tiers: 30 min 120 zł, 60 min 180 zł, 90 min 250 zł.
  5. **Przeciwwskazania** — 12-col; heading left, 2-col list of 6 items each with a camel warning icon; italic consult note.
  6. **Opinie klientów** — forest-green; header row with 5,0 rating; 3 review cards (same as homepage).
  7. **Powiązane masaże** — 3 related cards (image, serif name, meta) linking to other service pages (internal linking for SEO).
  8. **FAQ** — cream-2, centered, max-width 860px; 4 Q&A items separated by top borders (`.sv-faq`). Serif question, body answer.
  9. **CTA — rezerwacja** — forest-green centered; H1-scale serif `Zarezerwuj masaż klasyczny w Poznaniu`, lead, two CTAs (camel `Umów wizytę` + phone outline).
- **Breadcrumb** above hero: `Strona główna / Oferta / <service>`.

### 4. Sitemap diagram (`Sitemap.dc.html`)
- Reference-only visual of the tree above (root → core pages → Oferta hub → grouped service cards → shared 9-section template callout). Not a shippable page; use for planning routes.

## Interactions & Behavior
- **Mobile nav:** hamburger toggles `.nav.open` (absolute dropdown panel on forest-green); links close it on click. Breakpoint 860px; at 520px the "why" grid collapses to 1 col. See `site/script.js`.
- **Hover:** service tiles (homepage) cross-fade to forest-green over 0.5s; offer/related cards lift 4px + shadow, arrow translates +4px; blog post images scale 1.04 over 0.7s and title → camel.
- **Marquee:** CSS `@keyframes marquee` translateX 0 → -50%, 34s linear infinite (track duplicated for seamless loop).
- **Hero entrance:** `@keyframes rise` (opacity 0 + translateY(24px) → settled), 1s ease.
- **Play button** in feature band is decorative in the prototype — wire to a lightbox/video in production.
- **Anchors:** `html { scroll-behavior: smooth }`. Service-page "Czas i cena" scrolls to `#cennik`.
- **Responsive:** all grids use `auto-fit/auto-fill minmax`; 12-col sections collapse to single column on mobile (see media queries in `site/styles.css`).

## State Management
Mostly static/content-driven. Dynamic needs when productionized:
- **Mobile nav open/closed** (boolean).
- **Booking** — the `#rezerwacja` form collects service, duration, therapist, preferred date/time and contact details. Delivery is switchable in `site/script.js`: set `FORM_ENDPOINT` to a Formspree/Getform/own-backend URL and the form POSTs the fields as JSON; left empty it falls back to opening the visitor's mail client with the request pre-filled to `massage4youpoznan@gmail.com`. Production should additionally integrate the real booking system (Booksy widget or custom calendar) for live slot availability.
- **Reviews** — hardcoded in the prototype; production may fetch from Google/Booksy APIs (or CMS-managed).
- **Blog** — CMS collection (title, category, read time, cover, body).
- **Services** — model as a single content collection (see below) so all 14 pages render from one template.

### Suggested service content model (drives every service page)
```
Service {
  slug, name, h1 ("Masaż … — Poznań"), category (ciało|tajski|twarz),
  eyebrow, heroImage, lead,
  benefits[ {num,title,desc} ],           // section 2
  steps[ {num,title,desc} ],              // section 3
  pricing[ {time,note,price} ],           // section 4
  contraindications[ string ],            // section 5
  reviews[ {text,author,source} ],        // section 6
  related[ slug ],                        // section 7
  faq[ {q,a} ],                           // section 8
  metaTitle, metaDescription              // SEO
}
```
Add JSON-LD `LocalBusiness` (studio-wide) and `Service` + `FAQPage` schema per service page for local SEO.

## Assets
`images/` (also copied to `site/images/`) — original AI-generated photography (no stock license/attribution needed), warm-toned to match the brand:
- `hero.jpg` — hero back massage in progress
- `feature.jpg` — oil poured into hands (close-up)
- `interior-1.jpg … interior-4.jpg` — studio interiors / details
- `team-1.jpg, team-2.jpg, team-3.jpg` — therapist portraits (4:5)

Replace with the client's real studio/therapist photography before launch (same crops/aspect ratios). Icons are inline SVG (search, home, calendar, user, phone, arrow, warning) — swap for the codebase's icon set.

### Brand & favicon assets
All derived from `images/Logo-massage4you.png` (2040×2042, white background) — the white field is keyed out to alpha and the seated-figure mark is cropped out of the top band. Regenerate from that source if the logo changes.

| File | Use |
| --- | --- |
| `site/images/logo.png` / `logo-light.png` | full lockup, transparent — dark version for light backgrounds, cream for dark (footer) |
| `site/images/logo-mark.png` / `logo-mark-light.png` | figure mark only — cream variant is the header logo |
| `site/favicon.ico` | 16/32/48 PNG-in-ICO, the browser's default probe |
| `site/images/favicon.svg` | scalable tab icon (`rel="icon" type="image/svg+xml"`) |
| `site/images/apple-touch-icon.png` | 180×180, iOS home screen |
| `site/images/icon-192.png`, `icon-512.png`, `favicon-96.png` | Android / PWA, referenced from `site/site.webmanifest` |

Icons put the cream mark on a forest-green field (`#2E4B37`, also the `theme-color`) so they read on any tab bar and need no separate maskable art.

## Deployment (Cloudflare Workers + static assets)
**Pushing to `main` deploys the site.** `.github/workflows/deploy.yml` runs `wrangler deploy` on every push and then fetches the four live URLs to confirm the change is actually serving, so a green tick means the site is updated. It needs two repository secrets — `CLOUDFLARE_API_TOKEN` (an "Edit Cloudflare Workers" token) and `CLOUDFLARE_ACCOUNT_ID` — and can be re-run by hand from the **Actions** tab via **Run workflow**.

This workflow exists because deploys used to be manual, and GitHub and the live site drifted apart without any signal: between 15 and 17 Aug 2026 five pushed commits never reached production, so the homepage still served an inline cennik and `/cennik` 404'd while the repo looked perfectly healthy. If the site ever looks stale again, check the Actions tab first — not `git status`.

The site is static — no build step and no Worker script. `wrangler.toml` at the repo root points `[assets] directory` at `site/`, which `npx wrangler deploy` uploads as-is (still the way to deploy from a laptop, after `npx wrangler login`); leave **Build command** empty in the dashboard. The `name` field must match the Worker name.

New Git-connected Cloudflare projects default to **Workers**, not Pages — a Pages-style config (`pages_build_output_dir`) is silently ignored by `wrangler deploy` and the build fails with "Missing entry-point to Worker script or to assets directory".

Static assets serve `foo.html` at `/foo` and redirect `/foo.html` → `/foo` (the default `html_handling = "auto-trailing-slash"`), which is exactly what the `rel="canonical"` tags and `sitemap.xml` declare — so no rewrites are needed. `site/_headers` adds baseline security headers and a one-week revalidating cache for `/images/*` (filenames are not content-hashed, so nothing is marked `immutable`).

The production domain is **massage-4-you.com** (apex). Attach it via the Worker's **Settings → Domains & Routes** tab — never by hand-adding DNS records; Cloudflare creates the CNAME and certificate itself. The domain is hardcoded in `site/robots.txt`, `site/sitemap.xml` and the three `rel="canonical"` tags; change all five together if it ever moves.

## Files
Design references included in this bundle:
- `site/index.html` — homepage, plain semantic HTML (**best starting point**)
- `site/styles.css` — all homepage styles + **design-token block at `:root`** (source of truth)
- `site/script.js` — mobile-nav toggle, scrolled-header state, booking-form handling (`FORM_ENDPOINT`), footer year
- `wrangler.toml` — Cloudflare config: Worker with static assets, publishes `site/`, no build step
- `.github/workflows/deploy.yml` — deploys `site/` to Cloudflare on every push to `main`, then verifies the live URLs
- `site/_headers` — security headers + image caching, read by Cloudflare static assets
- `site/site.webmanifest` — PWA/Android icon manifest
- `site/robots.txt` — crawling allowed; `Content-Signal` permits search indexing and AI input (RAG/grounding) but opts out of AI training; points at the sitemap
- `site/sitemap.xml` — the three live URLs on `massage-4-you.com`, matching each page's canonical. Add a `<url>` block per service page as it ships, and update `<lastmod>` when a page's content changes
- `site/zabiegi/` — services hub + `masaz-klasyczny-poznan.html`
- `site/images/` — photography plus the brand/favicon set above
- `Massage4you.dc.html` — homepage (Design Component version)
- `Oferta.dc.html` — offer hub
- `Masaz-Klasyczny.dc.html` — service-page template (pattern for all 14 services)
- `Sitemap.dc.html` — visual sitemap (planning reference only)

> The `.dc.html` files depend on a small runtime and are best viewed in the original project; use them to read structure and copy. For implementation, prefer `site/` for the homepage and `Masaz-Klasyczny.dc.html` for the service-page structure. Contact details in the prototype: phone `+48 533 681 901`, address `ul. Zeylanda 3/1, 60-808 Poznań`, hours `Pon–Czw 09:00–20:30, Pt–Nd 09:00–21:00` — verify against the client's real data.
