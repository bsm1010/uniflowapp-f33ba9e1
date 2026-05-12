# Fennecly Builder & Custom Domain Upgrade Plan

This is a large, multi-system upgrade. I'll deliver it in **3 shippable phases** so you can review progress, rather than dumping 50+ files at once with no review point.

---

## Phase 1 — Custom Domain Connection Wizard (ship first)

**New backend table** `custom_domains`:
- `domain`, `user_id`, `store_slug`, `type` (root/www/subdomain)
- `status` (pending / verifying / verified / failed / ssl_active)
- `dns_records` (jsonb), `verification_token`, `last_checked_at`, `error_message`
- RLS: owners only

**Server functions** (`src/lib/domains/domains.functions.ts`):
- `addCustomDomain(domain)` → validates, generates DNS records, returns wizard payload
- `verifyDomainDNS(domainId)` → does DNS lookup via Cloudflare DoH (`https://cloudflare-dns.com/dns-query`), updates status
- `removeDomain(domainId)`
- `detectProvider(domain)` → checks NS records, returns Cloudflare/GoDaddy/Namecheap/Hostinger/Other

**Wizard UI** `src/components/domains/ConnectDomainWizard.tsx` — premium 5-step modal:
1. **Enter domain** — input with live validation, root/www/subdomain auto-detect
2. **DNS records** — copy-able A + CNAME + TXT cards with provider auto-detect badge
3. **Visual tutorial** — 4 illustrated cards (provider → DNS → add records → save), per-provider deep links
4. **Verification** — animated radar/pulse, "Checking DNS…", auto-retry every 5s up to 12 attempts
5. **Success** — confetti, SSL active, store-published confirmation

Plus: troubleshooting accordion, FAQ section, copy-to-clipboard everywhere, dark/light, mobile responsive, gradient + glassmorphism styling, framer-motion step transitions.

**Settings integration** — new section in `dashboard.settings.tsx` (or new `dashboard.domains.tsx`) listing connected domains with status badges and a "Connect Custom Domain" CTA opening the wizard.

---

## Phase 2 — Modern Builder Component Library

**Component registry** `src/components/storefront/blocks/` — ~30 premium block components grouped by category:

```
hero/         (HeroSplit, HeroCentered, HeroVideo, HeroGradient)
products/     (ProductGrid, ProductCarousel, FeaturedProduct, BentoProducts)
social-proof/ (Testimonials, ReviewsSlider, BrandLogos, StatsCounter, UGCWall)
media/        (ImageGallery, MasonryGallery, VideoSection, BeforeAfter, TikTokReels)
banners/      (Marquee, AnnouncementBar, PromoBanner, CountdownBanner)
content/      (FAQ, Features, ComparisonTable, Pricing, BentoGrid, InteractiveCards)
trust/        (TrustBadges, Guarantees, Shipping)
cta/          (CTASection, Newsletter, ContactForm, FloatingButton, StickyCart)
```

Each block:
- Lazy-loaded via dynamic import
- Strict TypeScript props interface
- Uses semantic tokens from `styles.css` (no hard-coded colors)
- framer-motion entrance + hover animations
- Responsive (mobile + desktop)
- Editable schema (`schema.ts` per block) declaring fields → autogenerates editor controls

**Block registry** `src/components/storefront/blocks/registry.ts` exports `{ key, label, category, icon, component, defaultProps, schema }` for every block.

---

## Phase 3 — Builder UX Upgrade

**New customize page** `src/routes/customize.tsx` redesign:
- **Left panel**: searchable component library with category tabs, favorites, drag handles
- **Center**: live preview iframe with desktop/mobile toggle
- **Right panel**: contextual editor — when a section is selected, shows controls auto-generated from its schema:
  - Border radius slider, shadow presets, blur/glass toggle, gradient picker
  - Hover/entrance animation dropdowns, layout width, section spacing
  - Button style variants, image aspect ratios, color/typography overrides
- **Top bar**: undo/redo, save indicator (auto-save every 3s debounced), duplicate, delete, drag reorder
- **Section templates** library: preset combos + one-click page layouts
- **AI section generator**: button calls Lovable AI Gateway with store niche → returns block config
- **Import/export**: JSON download/upload of the section list

**Data model** — extend `store_settings.sections` to store ordered array of `{ id, blockKey, props, styleOverrides }` instead of the current fixed section keys.

---

## Technical details

- **Routing/links**: typed Tanstack `<Link>`, no react-router
- **DNS verification**: server-side via Cloudflare DoH JSON API (no API key, fast, edge-compatible)
- **Drag-drop**: reuse existing `@dnd-kit` already in project
- **Animations**: framer-motion (already present)
- **Provider detection**: NS lookup → match against known patterns
- **SSL**: documented as automatic via the hosting layer (Vercel/Netlify/Cloudflare) once DNS verifies — wizard reflects this
- All new files keep components <300 lines, schemas separate from rendering

---

## What I need from you

This is **3–4 days of work in one shot**. To keep quality high I'll **ship Phase 1 first** (domain wizard end-to-end, fully working including the DB migration), then **Phase 2** (block library), then **Phase 3** (builder UX). Each phase is reviewable and usable on its own.

**Confirm to proceed and I'll start with Phase 1 (custom domain wizard + DB migration).**

If you'd rather I bundle everything into one mega-delivery anyway, say "do it all at once" and I will — just expect a much larger diff that's harder to review.
