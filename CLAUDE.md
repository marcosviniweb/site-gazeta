# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an **Nx monorepo** for the Gazeta do Pará news portal. It contains three main applications:
- **site-gazeta** — Public-facing Angular 20 website with SSR (deployed to Vercel)
- **painel-gazeta** — Angular 20 admin panel for content management
- **backend-gazeta** — NestJS 11 REST API with Prisma/MySQL (deployed via PM2)

Shared code lives in `libs/` and is consumed by both Angular apps via TypeScript path aliases defined in `tsconfig.base.json`.

## Commands

All commands run from the repo root. Use `--legacy-peer-deps` for npm installs.

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Development servers
npx nx serve site-gazeta          # Public site (port 4201, no SSR)
npx nx serve-ssr site-gazeta      # Public site with SSR (port 4000)
npx nx serve painel-gazeta        # Admin panel
npx nx serve backend-gazeta       # NestJS API

# Build
npx nx build site-gazeta          # Browser + SSR bundles
npx nx build painel-gazeta
npx nx build backend-gazeta       # Webpack build + Prisma generate

# Lint & Test
npx nx lint <project>
npx nx test <project>
npx nx test <project> --testFile=path/to/spec.ts   # Single test file

# E2E
npx nx e2e painel-gazeta-e2e      # Playwright E2E (single worker, sequential)

# CI equivalent (runs only affected projects)
npx nx affected -t lint test build

# Prisma
npx prisma generate --schema=apps/backend-gazeta/prisma/schema.prisma
npx prisma db push --schema=apps/backend-gazeta/prisma/schema.prisma
node --require dotenv/config apps/backend-gazeta/prisma/seed.js
```

Swagger UI for the backend is available at `/api` when the dev server is running.

## Architecture

### Monorepo layout

```
apps/
  site-gazeta/        Angular 20 SSR public site
  painel-gazeta/      Angular 20 admin panel
  backend-gazeta/     NestJS 11 API
libs/
  api/                HTTP client configuration & orchestrator services
  components/         ~16 reusable Angular UI component libraries
  shared/             alert, dark-mode, form-validator, modal, multi-select, sidebar
  ts/
    models/           Shared TypeScript interfaces (News, Category, User, …)
    mock/             Mock data for tests
    types/            Shared type definitions
```

### Path aliases

All `@site-gazeta/*` imports resolve through aliases in `tsconfig.base.json`. For example:
- `@site-gazeta/models` → `libs/ts/models/src/index.ts`
- `@site-gazeta/api` → `libs/api/src/index.ts`
- `@site-gazeta/text-editor` → `libs/components/text-editor/src/index.ts`

### Backend (NestJS)

- **Entry**: `apps/backend-gazeta/src/main.ts` — bootstraps Helmet, compression, CORS, ValidationPipe, Swagger
- **Root module**: `apps/backend-gazeta/src/app/app.module.ts` — imports all feature modules and `ConfigModule`
- **Feature modules**: Auth, Prisma, Categories, News, Media, NewsVideo, Advertisement, ConfigSystem, Menu, Video, Analytics, ContentMedia
- **Prisma client** is generated into `apps/backend-gazeta/generated/prisma/` (not the default location); import from there, never from `@prisma/client`. Binary targets include Windows + Linux/Debian to support dev→prod.
- Feature modules follow the pattern: `module → controller → service → (sub-services)`. The `NewsModule` is split into four sub-layers: `core`, `status`, `query`, `analytics`
- **Route ordering matters**: `QueryController` must be registered before `CoreController` in `NewsModule` so specific routes (e.g. `GET /news/slug/:slug`) resolve before parameterized ones (`GET /news/:id`)
- The global `ValidationPipe` uses a custom error factory that returns `{ details: [...] }` — match this shape in new DTOs/pipes
- Media uploads go to `/uploads`; Sharp handles image resizing; fluent-ffmpeg handles video thumbnails and metadata
- **News-Video is a sibling module**, not nested inside News. It has its own CRUD at `/api/news-videos` and `/api/news-videos/news/:newsId`. It validates that the parent news exists before creating/updating. Use `NewsErrorInterceptor` for error handling consistency.
- **Analytics activity logging**: use the `@LogActivity({ action, entityType, description })` decorator on controller methods (imported from `../analytics/decorators/log-activity.decorator`) to auto-log user actions to `UserActivity`. Requires `@UseGuards(JwtAuthGuard)` on the same method.
- **Env file loading**: the backend loads `.env` files in priority order: `apps/backend-gazeta/.env.local` → `apps/backend-gazeta/.env` → `.env.local` → `.env`. In production, it loads `.env` then `.env.production` (last file wins). The primary dev file is `apps/backend-gazeta/.env`.

### Frontend (Angular)

- Both Angular apps use `ChangeDetectionStrategy.OnPush` and Angular Signals for reactivity
- **site-gazeta** fetches data through services that wrap `libs/api` orchestrators; SSR is handled by `@angular/ssr`
- **painel-gazeta** uses an `AuthInterceptor` to inject JWT Bearer tokens and an `AuthGuard` to protect routes
- PrimeNG 20 + PrimeFlex provide the component/grid foundation
- **Auth storage**: `AuthService.saveToken()` writes to either `localStorage` (remember me) or `sessionStorage`. `AuthGuard` checks both. Re-login clears both storages first — last login wins across tabs.

### PrimeNG 20 usage

PrimeNG 20 renames several components. Key differences from earlier versions:
- `p-dropdown` is now **`p-select`** — import `SelectModule` from `'primeng/select'`
- The Aura theme is configured globally via `providePrimeNG({ theme: { preset: Aura } })` in `app.config.ts`
- `p-select` works with both `[(ngModel)]` (template forms) and `formControlName` (reactive forms)
- Use `styleClass="w-full"` to make selects fill their container

### painel-gazeta design system

Global CSS classes defined in `apps/painel-gazeta/src/styles/` and available everywhere without imports:

| Class | Purpose |
|---|---|
| `g-page-container` / `g-page-card` / `g-page-header` / `g-page-content` | Standard page shell |
| `g-form-group` | Label + input + error block with consistent spacing |
| `g-form-row` | Responsive auto-grid of form groups |
| `g-form-container` | Padding wrapper for forms inside sidebars/modals |
| `g-help-text info/accent` | Contextual hint block below a field |
| `g-field-error` | Red validation message below a field |
| `g-crud-footer` | Footer bar with action buttons |
| `g-modal-header` / `g-modal-body` | Standard modal structure |
| `g-manage-actions` | Row of icon buttons (edit/delete/config) |
| `g-empty-state` | Centered empty-state block |
| `g-loading-overlay` | Full-overlay spinner (also used in E2E assertions) |
| `btn-primary` / `btn-secondary` / `btn-danger` | Standard buttons |

Icons: use `<mat-icon>` (`MatIconModule`) everywhere in `painel-gazeta`. Do not use `<span class="material-icons">` — the project migrated away from font-based icons.

### Shared form logic pattern (painel-gazeta)

When two components share the same form structure, extract an abstract Angular `@Directive()` class as a base. Example: `apps/painel-gazeta/src/app/pages/menu/menu-form.base.ts` is extended by both `MenuFormComponent` and `SubmenuFormComponent`. The base class:
- Injects shared services (`FormBuilder`, `MenuService`, `CategoryService`, `AlertService`)
- Declares shared signals and form group
- Exposes abstract `resetForm()` and `submitForm()` for subclasses to implement

Static config shared between sibling components (e.g. list of internal routes) goes in a dedicated `*.config.ts` file in the same directory (e.g. `menu-routes.config.ts`).

### Video architecture

There are two distinct video libraries with different purposes:
- `libs/components/video-components` — Home page UI (featured, latest, category grid sections)
- `libs/components/video-player` — Admin/public interactive player with `VideoManagerComponent` (list + selection), `VideoPlayerComponent` (renderer), and `VideoModalComponent` (overlay). Auto-selects the first video on load.

**Content Blocks Pipe** (`apps/site-gazeta/src/app/shared/pipes/content-blocks.pipe.ts`) is the bridge between CMS and rendering: it parses article HTML, extracts inline `<video>` elements wrapped in CKEditor's `htmlEmbed` format (`div > p > video`), and splits content into alternating `'html'` and `'video'` blocks. It falls back to raw HTML during SSR (no `DOMParser` available server-side). This pipe is critical for correct video rendering in news articles.

### Config system (backend)

The `ConfigSystem` module (`/config`) manages the home page configuration:
- `/config/destaques` and `/config/top-gazeta` — category selections for home sections; support `randomMode: true` (auto-picks 3 categories) or explicit `categoryIds`
- `/config/sections` — array of ordered home sections (`carousel`, `videos`, `destaques`, `top-gazeta`, `cluster`)
- `/config/sections-map` — same data as a keyed object; **prefer this endpoint in frontends** for direct access (`config.carousel`, `config.videos`, etc.) without needing `Array.find`
- `/config/social-media` — social media URLs for the site footer
- Bulk section reorder (`PATCH /config/sections`) uses a two-pass strategy (temp negative values then final values) to avoid unique-constraint conflicts on the `order` column

### Shared models

All data shapes (News, Category, User, Video, Advertisement, etc.) are defined once in `libs/ts/models/` and imported by both frontend apps and the backend via path alias. Do not duplicate type definitions.

Key non-obvious Prisma model fields:
- `News.published` — stored as `String` `"true"/"false"`, not a boolean
- `News.status` — `"ACTIVE"` | `"INACTIVE"` (string, not enum)
- `News.validity` — optional string date, not a DateTime
- `Menu.parentId` — self-referential FK; `null` = top-level item, non-null = child of another menu
- `PageView` — full analytics per request (IP, user agent, referer, session, device/browser/OS/country/city, duration)
- `UserActivity` — audit log of all user actions (entity type, ID, description, IP, user agent)
- `MaintenanceConfig` — global maintenance mode toggle
- `ContentMedia` / `NewsContentMedia` — centralized media file tracking with junction table for inline video embeds in CKEditor content

### E2E Tests

Playwright config in `apps/painel-gazeta-e2e/`:
- Single worker (`workers: 1`) — tests run sequentially, not in parallel
- Retries twice in CI
- Auth state stored in `playwright/.auth/user.json`; test helper `loginAsAdmin()` uses seeded account `master@email.com / 123456`
- Wait for `.g-loading-overlay` to disappear before assertions

## Deployment

| Target | Tool | Config |
|---|---|---|
| site-gazeta | Vercel (Node 20, SSR) | `vercel.json` |
| backend-gazeta | PM2 cluster, port 3002 | `ecosystem.config.js` |

**Vercel**: All unknown routes rewrite to the SSR handler (`/api`). Static assets (`/css`, `/js`, `/img`, `/assets`, `/fonts`) route directly to `/browser/`. Everything is SSR'd — there is no static-only path.

**PM2**: Runs in cluster mode (1 instance), 1 GB memory limit with auto-restart, 4-second restart delay, max 10 restarts. Logs to `./logs/backend-{err,out,combined}.log`. Deployed to `/home/gazetadopara.com/public_html/site-gazeta`.

Environment files: primary dev file is `apps/backend-gazeta/.env`; production uses `.env.production`. The backend reads `DATABASE_URL` and `JWT_SECRET` from env; never hard-code these.

## Key constraints

- `--legacy-peer-deps` is required for all npm installs due to peer dependency conflicts
- Prisma schema path is non-default; always pass `--schema=apps/backend-gazeta/prisma/schema.prisma`
- The Prisma client output path is `apps/backend-gazeta/generated/prisma` — import from there, not `@prisma/client`
