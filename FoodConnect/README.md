# FoodConnect – Project Structure Guide

FoodConnect was originally **one HTML file, one CSS file and one JavaScript file** that showed all its "pages" as sections of a single page. This version splits it into **separate HTML pages, with their own CSS and JavaScript files**, so each page can be found and edited on its own.

The website looks and behaves the same as before (see the verification report in section 11). Because splitting needed real code changes (not just moving files), every change is listed in section 10.

---

## 1. Folder and file overview

```text
FoodConnect/
├── README.md
└── frontend/
    ├── index.html                      <- entry point: opens Home, and links to every page
    │
    ├── pages/                          <- ONE HTML FILE PER PAGE
    │   ├── home.html
    │   ├── domains.html                (Who can take part)
    │   ├── guide.html                  (Guide and food safety)
    │   ├── fame.html                   (Hall of Fame)
    │   ├── listings.html               (Available food)
    │   ├── login.html
    │   ├── register.html
    │   └── dashboard.html              (donor / organisation / admin dashboard)
    │
    ├── styles/
    │   ├── common/                     <- used by every page
    │   │   ├── global.css              colours, reset, fonts, buttons, containers
    │   │   ├── layout.css              header, logo, menu, footer
    │   │   └── responsive.css          ALL phone / tablet rules (loaded last)
    │   ├── components/                 <- shared by several pages
    │   │   ├── cards.css               card grid
    │   │   ├── badges.css              tier badges and small tags
    │   │   ├── forms.css               inputs, messages, role picker
    │   │   └── welcome-modal.css       the login popup
    │   └── pages/                      <- one file per page that has its own styling
    │       ├── home.css
    │       ├── guide.css
    │       ├── fame.css
    │       ├── auth.css                (shared by login.html and register.html)
    │       └── dashboard.css
    │
    ├── scripts/
    │   ├── common/                     <- used by every page
    │   │   ├── helpers.js              short selector, storage wrapper, safe-text, messages
    │   │   ├── data.js                 demo data, saving, meal totals, recognition tiers
    │   │   ├── navigation.js           page links, top menu, mobile menu, log out
    │   │   └── welcome.js              the login popup behaviour
    │   └── pages/                      <- one file per page that has its own behaviour
    │       ├── home.js
    │       ├── fame.js
    │       ├── listings.js
    │       ├── login.js
    │       ├── register.js
    │       └── dashboard.js
    │
    └── assets/
        └── images/
            └── logo.png
```

`domains.html` and `guide.html` have no page-specific JavaScript, and `domains.html`, `listings.html` have no page-specific CSS, because those pages are static content (or use only the shared card/badge styles). No empty files were created.

---

## 2. Pages and their purpose

| Page | File | Purpose |
|---|---|---|
| Entry point | `frontend/index.html` | Opens `pages/home.html` straight away; also lists a link to every page |
| Home | `pages/home.html` | Hero banner, impact counters, how it works, benefits for businesses |
| Who can take part | `pages/domains.html` | Donor types, receiver types, administrators |
| Guide | `pages/guide.html` | Donor / organisation guide, food-safety tips, FAQ |
| Hall of Fame | `pages/fame.html` | Recognition tiers and the ranked list of donors |
| Available food | `pages/listings.html` | Live food listings that organisations can request |
| Log in | `pages/login.html` | Log in form (donor, organisation, admin) with demo accounts |
| Register | `pages/register.html` | Create a donor or organisation account |
| Dashboard | `pages/dashboard.html` | Donor, organisation or admin dashboard (login required) |

Every page also contains the same top bar, footer and welcome popup (these are repeated in each HTML file, see section 9).

---

## 3. Page → CSS → JavaScript mapping

Every page loads these **common** files: CSS `common/global.css`, `common/layout.css`, `components/forms.css`, `components/welcome-modal.css`, `common/responsive.css` (last); JS `common/helpers.js`, `common/data.js`, `common/navigation.js`, `common/welcome.js`. The table shows what each page adds.

| Page | Extra CSS | Page JavaScript |
|---|---|---|
| `home.html` | `components/cards.css`, `pages/home.css` | `pages/home.js` (fills the impact numbers) |
| `domains.html` | `components/cards.css` | none |
| `guide.html` | `components/cards.css`, `pages/guide.css` | none |
| `fame.html` | `components/cards.css`, `components/badges.css`, `pages/fame.css` | `pages/fame.js` (ranked donor list) |
| `listings.html` | `components/cards.css`, `components/badges.css` | `pages/listings.js` (listing cards, request food) |
| `login.html` | `pages/auth.css` | `pages/login.js` (demo buttons, login check) |
| `register.html` | `pages/auth.css` | `pages/register.js` (account types, password checks, create account) |
| `dashboard.html` | `components/cards.css`, `components/badges.css`, `pages/dashboard.css` | `pages/dashboard.js` (donor / organisation / admin views) |

---

## 4. Shared stylesheets and scripts

**Stylesheets**
- `styles/common/global.css`: colour variables (change the theme here), reset, fonts, headings, buttons, content container.
- `styles/common/layout.css`: header, logo, menu bar, footer.
- `styles/components/cards.css`, `badges.css`, `forms.css`, `welcome-modal.css`: reusable pieces shared by several pages.

**Scripts**
- `scripts/common/helpers.js`: `$()`, the `DB` storage wrapper, `esc()`, `uid()`, `msg()`.
- `scripts/common/data.js`: `users`, `foods`, `reqs`, `me`, `seed()`, `save()`, `meals()`, `tier()`. It also loads the saved login on every page.
- `scripts/common/navigation.js`: `PAGE_URLS`, `go()`, `route()`, `renderNav()`, `toggleMenu()`, `logout()`.
- `scripts/common/welcome.js`: `openWelcome()`, `closeWelcome()` and the popup login form.

---

## 5. Where responsive design is handled

**All phone and tablet rules are in one file: `frontend/styles/common/responsive.css`.** Every page loads it **last**, so its rules override the desktop rules. It contains four `@media` sections:

| Breakpoint | What it does |
|---|---|
| `max-width: 800px` | Login / Register layout becomes one column; form rows stack |
| `max-width: 800px` | Home hero banner becomes one column |
| `max-width: 800px` | Hamburger button and slide-in mobile menu (all pages) |
| `max-width: 600px` | More compact welcome popup on phones |

The breakpoints and rules are exactly the ones from the original file. The card grids adapt without media queries, and the `<meta name="viewport">` tag in each page enables mobile scaling. The only other `@media` rule is the headline entrance animation in `pages/home.css` (`prefers-reduced-motion`); it is an accessibility setting, not a screen-size rule.

---

## 6. How to find and change things

| I want to change… | Open |
|---|---|
| Text or layout of a page | `pages/<page>.html` |
| Colours / theme | top of `styles/common/global.css` |
| How the menu, header or footer looks | `styles/common/layout.css` |
| How one page looks | `styles/pages/<page>.css` (or `components/…` for cards, badges, forms) |
| Phone / tablet layout | `styles/common/responsive.css` |
| What one page does | `scripts/pages/<page>.js` |
| Menu links, log out, page list | `scripts/common/navigation.js` |
| Demo accounts and starting data | `seed()` in `scripts/common/data.js` |
| Login popup | `welcome-modal.css`, `welcome.js`, and the popup block at the bottom of each HTML page |
| The logo | replace `assets/images/logo.png` (keep the filename) |

---

## 7. How to add another page

Example: a new "About" page.

1. Copy `pages/domains.html` to `pages/about.html` (it is the simplest page).
2. In the new file: change the `<title>`, change `<body data-page="domains">` to `data-page="about"`, and replace the content inside `<main>`.
3. In `scripts/common/navigation.js`: add `about: 'about.html'` to `PAGE_URLS`, and (if you want a menu link) add `['about', 'About']` to the `links` list in `renderNav()`.
4. Add a link in `frontend/index.html` if you want it in the entry list.
5. *Optional – page styling:* create `styles/pages/about.css` and add `<link rel="stylesheet" href="../styles/pages/about.css">` **before** the `responsive.css` line. Put any phone rules for it in `responsive.css`.
6. *Optional – page behaviour:* create `scripts/pages/about.js` and add `<script src="../scripts/pages/about.js"></script>` **after** `navigation.js` and **before** `welcome.js`.

---

## 8. Dependencies and loading-order requirements

- **No build tools, no package manager, no backend.** The project has no `package.json`, PHP, Node.js or database configuration.
- **Script order matters** (they share global variables). Every page loads them in this order, and new pages must too: `helpers.js` → `data.js` → `navigation.js` → *(page script)* → `welcome.js`.
- **`responsive.css` must be linked last** so phone rules override desktop rules.
- **`<body data-page="…">`** tells `navigation.js` which menu item to highlight and whether the page is the dashboard. Every page needs it.
- **Browser storage:** accounts, listings, requests and the login are saved in `localStorage` (keys start with `fc_`), which is what lets the login carry from page to page. `sessionStorage` remembers that the welcome popup was dismissed.
- **Google Fonts (external):** every page loads *Bricolage Grotesque* and *Source Sans 3* from `fonts.googleapis.com`. Without internet, default fonts are used.
- **How to run:** the most reliable way is a small local web server, for example `cd frontend` then `python3 -m http.server 8000`, then open `http://localhost:8000/`. Opening `frontend/index.html` directly from disk also worked in Chromium (see section 11), but was not tested in other browsers.

---

## 9. Things to know about the split

- **Header, footer and welcome popup are repeated in every HTML page.** This is normal for plain HTML without a build tool. If you change the menu bar markup, footer text or popup markup, change it in all 8 pages. (The menu *links* are built by `navigation.js`, so those are changed in one place.)
- **Login and Register are now two pages** (they were two tabs of one section). The two tab buttons now open the other page. The green side-panel text, which was filled in by JavaScript, is now written directly in each HTML page.
- **The dashboard needs a login.** Opening `dashboard.html` while logged out sends you to `login.html`, as before.

---

## 10. Change record

### Files created or moved

| Original | New location(s) |
|---|---|
| `index.html` (8 sections) | `pages/home.html`, `domains.html`, `guide.html`, `fame.html`, `listings.html`, `login.html`, `register.html`, `dashboard.html` |
| `style.css` | split across the 12 CSS files in section 1 |
| `script.js` | split across the 10 JS files in section 1 |
| `logo.png` | `assets/images/logo.png` (byte-identical) |
| *(new)* | `frontend/index.html`: redirect + link list |

### CSS changes
- All 119 other rules were moved **unchanged** into the new files, and every `@media` block went into `responsive.css`.
- **2 rules were removed:** `section.pg` and `section.pg.show`. They only hid every section except one, which is no longer needed because each page is its own file.

### JavaScript changes (the only logic edits)
| Where | Original | Now |
|---|---|---|
| `go(page)` | set `location.hash` | opens the page's file via `PAGE_URLS` |
| `route()` | read the URL hash, show one section, redraw | runs once per page: builds the menu, redirects logged-out visitors away from the dashboard |
| page list | `PAGES` array | `PAGE_URLS` map (page name → file) |
| `renderNav()` | links like `#home` | links like `home.html` |
| `logout()` | `go('home'); route();` | `go('home');` |
| `requestFood()` | `location.hash = 'login'` | `go('login')` |
| `orgView()` | link `#listings` | link `listings.html` |
| popup login | `go('dash'); route();` | `go('dash');` |
| `showTab()`, `SIDE` | switched the Login/Register tab | removed (two separate pages) |
| `hashchange` listener, `.pg` toggling, `scrollTo(0,0)` | needed for one-page switching | removed |
| start-up | one block at the bottom | split: data load → `data.js`, menu → `navigation.js`, page drawing and `fillTypes()` → each page's script |

All other function bodies (login, register, dashboards, certificate, admin tools, popup, etc.) are copied verbatim.

### HTML changes
- `class="pg"` removed from sections; `data-page` added to `<body>`.
- In-page links `#register`, `#login`, `#listings` became `register.html`, `login.html`, `listings.html`.
- Logo, stylesheet and script paths updated for the new folders.
- Each page has its own `<title>` (the home page keeps the original title).
- A few HTML comments that mentioned `script.js` now name the correct file.

---

## 11. Verification report

**Checks actually performed:**

1. **Nothing lost (static):** every one of the original 121 CSS rules is present in the new CSS files except the 2 removed ones; every original JavaScript line is present in the new files except the lines listed in section 10; every original HTML line is present in the new pages except the ones changed as listed above.
2. **Syntax:** all 10 JS files pass `node --check`.
3. **References:** all 146 local `href`/`src` references in the HTML files resolve to existing files, and every page named in `PAGE_URLS` exists.
4. **Real browser test (headless Chromium, via a local web server):** 41 checks passed with **no JavaScript or console errors**. They cover: the `index.html` redirect, the welcome popup, every menu link and the active-menu highlight, the Login/Register tab buttons, the hero buttons, the live Hall of Fame and listings, requesting food while logged out, the dashboard login guard, donor login, posting food, the login persisting across pages, log out, registering an organisation, requesting food, the donor approving and marking collected, wrong-password and wrong-role messages, the admin Overview/Users/Listings tabs and verify, login through the popup, and the mobile hamburger menu.
5. **Visual comparison:** 23 screenshots of the new site were compared pixel by pixel against the original site: all 7 public pages, all 3 dashboard roles, the open mobile menu and the welcome popup, each at desktop (1280 px) and phone (390 px) width. **All 23 were identical.**
6. **Opening from disk:** with `file://` (no web server) in Chromium, the redirect, login across pages and dashboard all worked.

**Limitations:**
- Tested in **Chromium only**. Firefox and Safari were not tested. (Firefox in particular can treat each local file separately for storage, so use a local web server there.)
- The test environment had no internet, so the **Google Fonts did not load**; both the original and the new site were compared with the same fallback fonts.
- Tablet-width layouts (between the 600 px and 800 px breakpoints) were not separately screenshotted; the CSS rules for them are unchanged.
- Printing the donor certificate (a pop-up window) was not exercised.
- Your original project was not modified.
