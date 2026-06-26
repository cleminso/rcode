# Logo and OG image strategy

## Table of Contents

- [Context](#context)
- [Goals](#goals)
- [Current codebase facts](#current-codebase-facts)
- [Logo source of truth](#logo-source-of-truth)
- [Logo and icon asset matrix](#logo-and-icon-asset-matrix)
- [Static app metadata](#static-app-metadata)
- [Implemented static assets](#implemented-static-assets)
- [Dynamic room OG images](#dynamic-room-og-images)
- [Shared room URL requirements](#shared-room-url-requirements)
- [Implementation plan](#implementation-plan)
- [Open questions](#open-questions)

## Context

rcode is a Vite SPA. The current entry is static in `apps/web/index.html`, so dynamic OG tags for room pages will not work from client-side React alone.

Social platforms read the initial HTML response. They do not reliably wait for the React app to load.

## Goals

1. Define the logo source and exported asset set.
2. Add browser/app icons for tabs, bookmarks, and install surfaces.
3. Add static metadata for the app shell.
4. Add dynamic OG images for shared rooms.
5. Support both share-token and static-token room URLs.

## Current codebase facts

- `apps/web/index.html` only has title/meta basics.
- `apps/web/src/routes/rooms/$shareToken.tsx` renders a share-token room in the browser.
- `apps/web/src/routes/s/$staticToken.tsx` renders a static-token room in the browser.
- `apps/api` is a Hono server and is the right place for dynamic OG image generation.
- `packages/icons` contains reusable React icon components and language logo registries.
- `apps/web/public` handle favicon, manifest, static logo exports, and default OG image assets

## Logo source of truth

Decision: use both `packages/icons` and `apps/web/public`, but for different purposes.

### `packages/icons`

Use this for source React components that the app imports directly.

Add an `RcodeLogo` component, plus variants if useful:

- `RcodeLogoMark`
- `RcodeLogoLight`
- `RcodeLogoDark`

This keeps in-app usage type-safe and consistent with the existing icon package. It also avoids importing assets from `public` inside React components.

### `apps/web/public`

Use this for static files that must be addressable by URL.

Add exported assets here:

- favicon files
- Apple touch icon
- web app manifest icons
- default OG image
- optional standalone logo SVG/PNG assets used by metadata, external previews, and documentation

Browsers and social crawlers need URL-based files, so `public` is still required even if the React source lives in `packages/icons`.

### Design export status

The current Paper brand page has `logo-light` and `logo-dark` artboards at `32 × 32`.

Observed logo styles:

- Light logo background: `oklch(81.2% 0.096 332.3)`
- Dark logo background: `oklch(89.4% 0.139 90.5)`
- Letter color: `#171717`
- Letter font: `Tomorrow`
- Letter size: `16px`
- Corner radius: `3px`

Paper was used for brand exploration. The final path-based SVG export was created from Figma because Paper does not currently provide the SVG export path needed for this workflow.

Final source files inspected:

- `~/Desktop/rcode-logo-light.svg`
- `~/Desktop/rcode-logo-dark.svg`

Both final source files use a `32 × 32` SVG viewBox, a rounded background rectangle, and a path-based `r` mark. They do not depend on the `Tomorrow` font at runtime.

Important follow-up: if the exported SVG keeps the `r` as a text node, we should convert the letter to a vector path before using it as favicon/app icon source. Path-based SVGs are safer because they do not depend on font loading in browser icon surfaces.

Vector conversion workflow:

1. Keep the editable source at the current `32 × 32` logo artboard size.
2. Select the `r` text layer inside the logo artboard.
3. Use a vector editor that can convert text to outlines.
4. Confirm the selected layer becomes a vector/shape layer instead of a text layer.
5. Export the full `logo-light` and `logo-dark` frames as SVG.
6. Inspect the SVG and confirm it contains `<path>` data for the `r`, not a `<text>` element that references `Tomorrow`.

The original conversion should happen at `32 × 32` because the final SVG is vector-based and scales cleanly. The SVG viewBox should stay `0 0 32 32`; larger PNG sizes such as `180 × 180`, `192 × 192`, and `512 × 512` should be generated from that vector source after conversion.

The final app asset should be path-based even if the editable design source keeps a text layer.

## Logo and icon asset matrix

SVGs are scalable, but the base logo viewBox should stay `0 0 32 32` because the Paper source artboards are `32 × 32`.

| Asset                  | Format              |                            Size | Location                                 | Purpose                               | Source                                          |
| ---------------------- | ------------------- | ------------------------------: | ---------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| Logo light source      | React SVG component |               `32 × 32` viewBox | `packages/icons/src/rcodeLogo.tsx`       | In-app logo on light surfaces         | Paper export, converted to component            |
| Logo dark source       | React SVG component |               `32 × 32` viewBox | `packages/icons/src/rcodeLogo.tsx`       | In-app logo on dark surfaces          | Paper export, converted to component            |
| Logo light URL asset   | SVG                 |               `32 × 32` viewBox | `apps/web/public/logo-light.svg`         | Public/static usage and documentation | Figma vector export                             |
| Logo dark URL asset    | SVG                 |               `32 × 32` viewBox | `apps/web/public/logo-dark.svg`          | Public/static usage and documentation | Figma vector export                             |
| Favicon light SVG      | SVG                 |               `32 × 32` viewBox | `apps/web/public/favicon-light.svg`      | Light theme browser tab icon          | Figma vector export                             |
| Favicon dark SVG       | SVG                 |               `32 × 32` viewBox | `apps/web/public/favicon-dark.svg`       | Dark theme browser tab icon           | Figma vector export                             |
| Favicon ICO            | ICO                 | `16 × 16`, `32 × 32`, `48 × 48` | `apps/web/public/favicon.ico`            | Legacy browser tab icon               | Generated from vector logo                      |
| PNG favicon            | PNG                 |                       `32 × 32` | `apps/web/public/favicon-32x32.png`      | Browser fallback                      | Generated from vector logo                      |
| PNG favicon            | PNG                 |                       `16 × 16` | `apps/web/public/favicon-16x16.png`      | Browser fallback                      | Generated from vector logo                      |
| Apple touch icon       | PNG                 |                     `180 × 180` | `apps/web/public/apple-touch-icon.png`   | iOS home screen icon                  | Generated from vector logo                      |
| Web app manifest icon  | PNG                 |                     `192 × 192` | `apps/web/public/icons/icon-192.png`     | PWA/install icon                      | Paper already has a `192 × 192` target artboard |
| Web app manifest icon  | PNG                 |                     `512 × 512` | `apps/web/public/icons/icon-512.png`     | PWA/install icon                      | Paper already has a `512 × 512` target artboard |
| Maskable manifest icon | PNG                 |      `512 × 512` with safe area | `apps/web/public/icons/maskable-512.png` | Android adaptive icon                 | Generated with padding/safe area                |
| Default OG image       | PNG or WebP         |                    `1200 × 630` | `apps/web/public/og/default.png`         | Fallback social image                 | Dedicated OG composition                        |
| Dynamic room OG image  | PNG                 |                    `1200 × 630` | API response                             | Per-room social image                 | Takumi render output                            |

## Static app metadata

Add static metadata to `apps/web/index.html` for the app shell.

Required metadata:

- `title`
- `description`
- `theme-color`
- favicon links
- Apple touch icon link
- manifest link
- default Open Graph title/description/image
- default Twitter card title/description/image

This gives every route a safe fallback. Dynamic room pages still need a server response to override these tags for crawlers.

Favicon theme behavior is different from the in-app `ThemeProvider`. The app provider runs after React loads and toggles the HTML class for UI rendering. Browser favicon selection happens before React runs and is handled by the browser from static HTML and icon files.

Static `prefers-color-scheme` favicon links follow the user's browser/system theme, not the app-level `next-themes` selection. Because rcode lets users choose `system`, `light`, or `dark` inside the app, the favicon and `theme-color` are updated from `apps/web/src/providers/themeProvider.tsx` after React resolves the active theme.

Use dynamic app-theme favicon behavior:

- `favicon-light.svg` for resolved light mode
- `favicon-dark.svg` for resolved dark mode
- `theme-color` updated to match the resolved app theme

This is different from the initial static HTML fallback. The static HTML starts with the light favicon, then the provider synchronizes the head once the app theme is known.

## Implemented static assets

Implemented assets:

- `apps/web/public/logo-light.svg`
- `apps/web/public/logo-dark.svg`
- `apps/web/public/favicon-light.svg`
- `apps/web/public/favicon-dark.svg`

Implemented metadata in `apps/web/index.html`:

- app description
- light and dark `theme-color`
- theme-aware SVG favicon links
- fallback SVG favicon link
- default Open Graph metadata
- default Twitter metadata

The default social image currently points to `https://rcode.app/logo-light.svg` as a temporary fallback. A dedicated `1200 × 630` default OG image should replace it before final release.

## Dynamic room OG images

Decision: use `apps/api` with Hono and Takumi.

With Takumi the API shape is JSX in, image bytes out. The framework-specific part is where we mount the HTTP route.

Proposed endpoints:

- `GET /api/og/share/:shareToken.png`
- `GET /api/og/rooms/s/:staticToken.png`

Rationale:

- `/api/og/share/:shareToken.png` mirrors the idea that share-token rooms are live collaboration links.
- `/api/og/rooms/s/:staticToken.png` mirrors the existing app route shape `/s/$staticToken` while keeping the OG route under the room image namespace.
- Avoid exposing raw token names in the public route path unless the distinction helps maintainability.

OG image size:

- `1200 × 630`
- This is the common large social card size and matches Takumi examples.

Recommended content:

- rcode logo and URL
- room title
- language icon and language name
- creator display name
- token type label only if it helps debugging; avoid showing raw tokens
- no code preview in the first version

Visual direction: follow the Stripe-style full OG image approach for room links rather than the generic documentation-link card style. A room share is a product object with useful metadata, not only a plain web page description. The OG image should be a designed card that can stand on its own when pasted into chat.

Static-token card example structure:

- large language logo tile
- large room title, for example `schema.ts`
- metadata rows for `Language` and `Creator`
- rcode logo/link as a small brand footer

Share-token card example structure:

- same visual layout as static-token cards
- collaborative title/copy, for example `Come collaborate with Helium on schema.ts`
- language logo/name and creator display name

Important Takumi font note: Takumi does not read system fonts. If the OG image uses `Tomorrow`, the API must explicitly load the Tomorrow font through Takumi's `fonts` option or use a path-based logo mark that does not require font rendering.

Decision: `Tomorrow` is only for the app logo mark. Dynamic OG images should use the product UI font direction, likely Geist, and should use the logo as a path/image asset so the card does not need Tomorrow.

## Shared room URL requirements

Both token types are shareable and can be pasted into public social media or private discussions.

Required shared URL support:

| Token type   | Current app route    | Dynamic metadata route     | OG image route                          | Notes                                                                      |
| ------------ | -------------------- | -------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Share token  | `/rooms/$shareToken` | `/share/rooms/$shareToken` | `/api/og/share/$shareToken.png`       | Live room link; preview copy can invite collaboration with the creator |
| Static token | `/s/$staticToken`    | `/share/s/$staticToken`    | `/api/og/rooms/s/$staticToken.png`    | Static/public room snapshot link                                       |

The metadata routes return an HTML response with dynamic OG tags and then send humans to the actual app route. This avoids needing full SSR for the Vite SPA.

The metadata HTML should include:

- `<title>`
- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `twitter:card`
- `twitter:title`
- `twitter:description`
- `twitter:image`
- canonical link to the actual app route

Implementation detail to decide: the metadata route can either redirect humans immediately or show a tiny fallback page with a link. A tiny fallback page is easier to debug and safer for crawlers.

Preview copy direction:

- Share-token preview: collaborative language, such as `Come collaborate with {creator} on {roomTitle}` plus language logo/name.
- Static-token preview: neutral document-style language focused on `{roomTitle}`, language, creator, and `rcode.app`.
- Visual layout can stay identical between token types; copy can differ.

## Implementation plan

1. Finalize Paper logo exports.
   - Convert the `r` to vector/path.
   - Export `logo-light.svg` and `logo-dark.svg` from the `32 × 32` frames.
   - Generate the favicon and manifest PNG sizes from the vector source.
2. Add `RcodeLogo` components to `packages/icons`.
   - Export them from `packages/icons/src/index.ts`.
   - Use the component anywhere the app needs the logo.
3. Add static assets to `apps/web/public`.
   - Add `/brand`, `/icons`, and `/og` directories.
   - Add `site.webmanifest`.
4. Update `apps/web/index.html`.
   - Add static app metadata and fallback OG tags.
5. Add Takumi to `apps/api`.
   - Install with PNPM in the API workspace.
   - Add a room OG component in API source.
   - Add Hono routes for share-token and static-token OG images.
6. Add metadata routes.
   - Add share-token and static-token HTML preview routes.
   - Point their `og:image` values to the Takumi image endpoints.
7. Update share/copy behavior.
   - Copy metadata routes when the user wants a shareable social preview.
   - Keep current app routes as the actual product routes.

## Open questions

Answered decisions:

1. Browser favicon should be theme-aware through static `prefers-color-scheme` icon links, not through the React theme provider.
2. OG images should show creator display name.
3. Share-token and static-token previews should use the same visual layout, with copy differences allowed.
4. OG images should not include a code preview in the first version.
5. The production app URL is `https://rcode.app`.

Remaining questions:

1. Should the favicon fallback `favicon.ico` use the light logo, dark logo, or a neutral single-color mark?
2. Should the metadata preview routes redirect humans immediately or show a tiny fallback page with a link?
