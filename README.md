# Financial Application

A small portfolio app built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.

You log in, see your holdings with prices that move every couple of seconds, and can read market news. There is no database. The user, the holdings and the news are mock data that live on the server.

## Contents

1. [Running it locally](#running-it-locally)
2. [Environment variables](#environment-variables)
3. [Project structure](#project-structure)
4. [How the app works](#how-the-app-works)
5. [Pages](#pages)
6. [API routes](#api-routes)
7. [Route protection](#route-protection)
8. [Security](#security)
9. [Rendering strategy](#rendering-strategy)
10. [Performance](#performance)
11. [Logging](#logging)
12. [Architectural decisions](#architectural-decisions)
13. [Requirements checklist](#requirements-checklist)
14. [Known limitations](#known-limitations)

## Running it locally

You need Node.js 20.9 or newer and npm.

```bash
git clone <repo-url>
cd financial-application-nextjs
npm install
```

Create a `.env.local` file. You can copy the example file:

```bash
cp .env.example .env.local
```

For local development you can leave the values empty. Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000. You'll be sent to the login page.

Test account:

| Email | Password |
| --- | --- |
| test@finapp.com | 123456 |

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server on port 3000 |
| `npm run build` | Builds for production |
| `npm run start` | Runs the production build. Run `build` first |
| `npm run lint` | Runs ESLint |

To try a production build locally, set `AUTH_SECRET` first, because the app refuses to start signing tokens without it in production:

```bash
npm run build
npm run start
```

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | In production | Secret key used to sign the login token (HMAC SHA-256). In dev it falls back to a hard-coded value. In production the app throws an error if it's missing. |
| `APP_URL` | No | Base URL the dashboard uses when it calls `/api/portfolio` from the server. If it's not set, the app works it out from the request's `host` and `x-forwarded-*` headers. |

To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env*` files are git-ignored, except `.env.example`.

## Project structure

```
app/
  layout.tsx                 Root layout (fonts, global CSS, metadata)
  login/
    page.tsx                 Login page
    login-form.tsx           Client-side form with validation
  (app)/                     Route group for logged-in pages
    layout.tsx               Header with nav and logout button
    dashboard/
      page.tsx               Portfolio page (SSR)
      error.tsx              Error boundary for the dashboard
      _components/
        live-portfolio.tsx   Client component that runs the live prices
        summary-cards.tsx    Totals cards
        holdings-table.tsx   Holdings table, one memoized row per stock
    news/
      page.tsx               News page (cached, ISR style)
      news-feed.tsx          Client-side filter and pagination
      error.tsx              Error boundary for news
  api/
    login/route.ts           POST: checks credentials, sets the cookie
    logout/route.ts          POST: clears the cookie
    portfolio/route.ts       GET: returns holdings for the logged-in user
components/                  Shared UI (nav, logout dialog, skeleton, spinner, error state)
hooks/use-live-prices.ts     Price ticker hook
lib/
  auth/token.ts              Creating and verifying the signed token, cookie options
  auth/credentials.ts        Mock user and the credential check
  validation.ts              Login validation, shared by client and server
  logger.ts                  Small console logger
  portfolio.ts               Types, P&L math, formatters, response shape check
  api/portfolio.ts           Server-side fetch to /api/portfolio
  data/portfolio.ts          Mock holdings
  data/news.ts               Mock news plus the cache settings
proxy.ts                     Route protection (Next 16's replacement for middleware.ts)
next.config.ts               "/" redirects to "/dashboard", cache components on
```

## How the app works

Here's what happens from opening the site to logging out.

1. **Opening `/`**: `next.config.ts` redirects it to `/dashboard`.
2. **Proxy check**: `proxy.ts` runs before the page. It reads the `amk-token` cookie and verifies it. No valid cookie means a redirect to `/login?from=/dashboard`.
3. **Logging in**: the form validates the email and password in the browser first. If they look fine, it sends a JSON `POST` to `/api/login`.
4. **Server side of login**: the route checks the request origin and content type, runs the same validation again, then checks the credentials. If everything passes, it creates a signed token and sets it as an HTTP-only cookie. The token is never part of the response body.
5. **Redirect**: the form sends you to the `from` path (only if it's a relative path on this site), or to `/dashboard` by default.
6. **Dashboard**: the server component reads the cookie, calls `/api/portfolio` on the server with that cookie, checks the response shape, and renders the page. While that's loading you see a skeleton.
7. **Live prices**: in the browser, `useLivePrices` changes each price by up to 1% every 2.5 seconds. Totals and P&L update with it. You can pause it, and it stops by itself when the tab is hidden.
8. **News**: comes from a cached function that refreshes at most every 30 seconds. Filtering by source and pagination happen in the browser.
9. **Logout**: a confirmation dialog, then a `POST` to `/api/logout`, which clears the cookie. You're sent back to `/login`.
10. **Token expiry**: the token lasts 1 hour. After that the proxy sees it's expired, deletes the cookie and sends you to login.

## Pages

### `/login`

- A form with email, password and a show/hide password toggle.
- Validation runs on submit. Errors show under each field and are linked to the input with `aria-describedby`.
- Errors from the server (wrong password, bad input) appear in an alert box under the form.
- The button shows a spinner and is disabled while the request is running.
- If you're already logged in, the proxy sends you straight to `/dashboard`.

### `/dashboard`

- Four summary cards: current value, invested amount, total P&L, number of holdings.
- A holdings table: symbol, quantity, average price, current price, value and P&L with a percentage.
- The current price turns green with ▲ when it goes up and red with ▼ when it goes down.
- A Live/Paused button to stop or start the price updates.
- A skeleton shows while loading. If the API fails, `error.tsx` shows a message and a "Try again" button.

### `/news`

- 15 headlines, 5 per page.
- Filter chips by source, each with a count. Changing the filter takes you back to page 1.
- Previous, Next and numbered page buttons.
- An "Updated x minutes ago" label that refreshes every 30 seconds.
- An empty state with a "Clear filters" button, and its own error boundary.

### Shared layout

Both logged-in pages share the header in `app/(app)/layout.tsx`. It has the app name, the Dashboard and News links (the current page is highlighted), and the logout button. The logout dialog closes with Escape or by clicking outside it.

## API routes

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/login` | No | Body `{ email, password }` as JSON. Sets the `amk-token` cookie on success. Returns 400 (validation), 401 (wrong credentials), 403 (wrong origin) or 415 (not JSON). |
| POST | `/api/logout` | No | Clears the cookie and responds with a 303 redirect to `/login`. |
| GET | `/api/portfolio` | Yes | Returns the holdings array. 401 if the cookie is missing or invalid. Sent with `Cache-Control: private, no-store`. |

## Route protection

Protection is done in two places.

**1. `proxy.ts`** (this is what middleware is called in Next.js 16)

It runs on `/dashboard/*`, `/news/*` and `/login`.

- Valid token on `/login`: redirect to `/dashboard`.
- No valid token on a protected page: redirect to `/login?from=<original path>`.
- If the cookie was there but broken, tampered with or expired, the proxy also deletes it so it isn't checked again on every request.
- Every blocked attempt is logged with the path and the reason (`missing`, `malformed`, `bad-signature` or `expired`).

**2. Inside the API route**

The proxy doesn't run on `/api/*`, so `/api/portfolio` checks the token itself. That way the data can't be reached by calling the API directly without a valid cookie.

**The token**

There's no auth library. `lib/auth/token.ts` builds a simple signed token:

```
base64url(JSON payload) . base64url(HMAC-SHA256 signature)
```

The payload holds only the user id (`sub`) and the expiry time (`exp`). Verification checks the format, the signature, the payload shape and the expiry. It uses the Web Crypto API, so the same code works in the proxy and in route handlers.

## Security

**HTTP-only cookie.** The token is stored in a cookie with these options:

```ts
httpOnly: true,                                   // JavaScript can't read it
secure: process.env.NODE_ENV === "production",    // HTTPS only in production
sameSite: "lax",                                  // not sent on cross-site POSTs
path: "/",
maxAge: 3600                                      // 1 hour
```

**Nothing sensitive in the browser.** No token in localStorage or sessionStorage, and no token in any JSON response. The user list and password check stay on the server. The browser only gets the holdings it needs to show.

**Validation on both sides.** `lib/validation.ts` is used by the login form and by `/api/login`, so the rules are the same in both places:

- Email is required, trimmed, at most 254 characters, and must look like an email.
- Password is required, between 6 and 128 characters.
- Both values must be strings. Anything else is treated as empty.

The server never trusts the client's check. It runs it again on every request.

**CSRF.**

- `SameSite=Lax` means the cookie isn't sent on cross-site POST requests.
- `/api/login` rejects requests whose `Origin` header doesn't match the site.
- `/api/login` only accepts `application/json`. A normal HTML form can't send JSON, so a forged form on another site won't work.
- Logout is POST only, so something like `<img src="/api/logout">` on another site can't log you out.

**XSS.**

- All content is rendered through React, which escapes text. There's no `dangerouslySetInnerHTML` anywhere.
- Even if a script did get injected, it couldn't read the token because the cookie is HTTP-only.

**Open redirects.** The `?from=` value is only used if it starts with `/` and not `//`. Anything else goes to `/dashboard`, so the login page can't be used to send people to another site.

**API responses.**

- Error messages are short and generic. Stack traces and internal details only go to the server log.
- The login error doesn't say whether the email or the password was wrong.
- The portfolio response is marked `private, no-store`, so shared caches don't keep it.
- The dashboard checks the shape of the portfolio data (`isHoldingList`) before using it. If it's wrong, it throws and the error boundary takes over.

**Secret handling.** In production the app won't sign or verify tokens without `AUTH_SECRET`. It throws instead of quietly using the dev fallback.

## Rendering strategy

| Part | Strategy | Why |
| --- | --- | --- |
| Dashboard data | SSR, on every request | Holdings belong to the user, so they need the cookie and must be fresh. The page reads `cookies()` and fetches with `cache: "no-store"`. |
| Live prices | CSR | Prices change every 2.5 seconds in the browser. Re-rendering on the server for that would be wasteful. The server gives the starting values and the client takes over. |
| News | ISR style caching | Headlines are the same for everyone and don't need to be up to the second. `getNews()` uses `"use cache"` with `cacheLife({ revalidate: 30 })`, so it's served from cache and refreshed in the background at most every 30 seconds. It's also tagged `news` so it can be cleared on demand later. |
| News filter and pagination | CSR | The full list is already on the page, so filtering and paging don't need another request. |
| Login page | Static shell plus a client form | Nothing on it depends on the user. |

`cacheComponents` is turned on in `next.config.ts`. That's the Next 16 model where a page is static by default and the dynamic parts are wrapped in `<Suspense>`. Because of that, the page header shows immediately and only the data section streams in behind a skeleton.

## Performance

- **No extra API calls.** After the first server render, the price ticker doesn't call any API. It works on the data it already has. News filtering and paging are also done in the browser.
- **Pauses when not needed.** The ticker stops when the tab is hidden (`visibilitychange`) and when you press Pause, so there's no background work.
- **Fewer re-renders.**
  - Each table row is wrapped in `React.memo` and receives plain values as props.
  - `SummaryCards` is memoized too, and the totals are calculated with `useMemo`.
  - The filtered news list and source counts use `useMemo`.
  - The "x minutes ago" clock uses `useSyncExternalStore` with a shared 30 second timer, instead of setting state inside an effect.
- **Component split.** Server components handle data and layout. Client components are kept small and only exist where there's interaction (`login-form`, `live-portfolio`, `news-feed`, `nav-links`, `logout-button`).
- **Number formatting.** `Intl.NumberFormat` is created once at module level and reused, not created on every render.

## Logging

`lib/logger.ts` is a small wrapper around `console`. Every line looks like `LEVEL [scope] message { meta }`.

| Event | Where | Level |
| --- | --- | --- |
| Login success | `api/login` | info |
| Login failed (validation) | `api/login` | warn |
| Login failed (wrong credentials) | `api/login` | warn |
| Login rejected (cross-origin) | `api/login` | warn |
| Logout | `api/logout` | info |
| Unauthorized page access | `proxy.ts` | warn |
| Unauthorized API call | `api/portfolio` | warn |
| Portfolio failed to load | `api/portfolio` | error |
| Portfolio API returned a bad status or bad data | `lib/api/portfolio.ts` | error |
| UI error boundary shown | `components/error-state.tsx` (browser console) | error |

Example output:

```
INFO [auth] Login success { userId: 'user_001' }
WARN [auth] Login failed: invalid credentials { email: 'someone@test.com' }
WARN [proxy] Unauthorized access attempt { path: '/dashboard', reason: 'missing' }
```

Passwords and tokens are never logged.

## Architectural decisions

- **Next.js 16 App Router.** Server components keep data fetching and secrets on the server, and it lets each part of the app use a different rendering method.
- **`proxy.ts` instead of `middleware.ts`.** Next 16 renamed middleware to proxy. It runs before rendering, so protected pages are never rendered for someone who isn't logged in.
- **Own signed token instead of an auth library.** The task only needs one mock user. A small HMAC token with Web Crypto keeps things easy to read and has no extra dependencies. In a real project I'd use something like Auth.js or `jose`.
- **The dashboard calls its own API.** The server component goes through `/api/portfolio` instead of reading the mock data directly. This keeps one data entry point with its own auth check, and the same API can later be used by a mobile app or the client.
- **Route group `(app)`.** Dashboard and News share a layout with the header. Login doesn't, and the URL stays clean.
- **Shared validation file.** One file for client and server, so the rules can't drift apart.
- **Mock data behind functions.** `getHoldingsForUser()` and `fetchNewsArticles()` are async and take the same inputs a real backend would. Swapping in a real database or news API only means changing those functions.
- **Simulated prices instead of WebSocket.** There's no real price feed, so a client-side random walk is used. Each new price is based on the previous one, so the movement looks realistic. The hook returns the same shape a WebSocket version would, so it can be replaced without touching the components.
- **No state library.** The state is small and local (prices, paused flag, filter, page), so `useState` and `useMemo` are enough.

## Requirements checklist

### Security (mandatory)

| Requirement | Status | Where |
| --- | --- | --- |
| HTTP-only cookies for authentication | Done | `lib/auth/token.ts`, `app/api/login/route.ts` |
| No sensitive data on the client | Done | Token only in the HTTP-only cookie, credentials only on the server |
| Validate input on client and server | Done | `lib/validation.ts` used in `login-form.tsx` and `api/login` |
| Block unauthorized access with middleware | Done | `proxy.ts`, plus a check inside `api/portfolio` |

### Security (good to have)

| Requirement | Status | Notes |
| --- | --- | --- |
| CSRF awareness | Done | SameSite=Lax, Origin check, JSON-only login, POST-only logout |
| XSS prevention | Done | React escaping, no raw HTML, HTTP-only cookie. No CSP header yet |
| Input sanitization | Done | Type checks, trimming, length limits |
| Secure API response handling | Done | Generic errors, `no-store`, response shape check |

### Performance

| Requirement | Status | Where |
| --- | --- | --- |
| SSR for real-time data (dashboard) | Done | `dashboard/page.tsx` |
| ISR for semi-static content (news) | Done | `lib/data/news.ts` (`"use cache"` with 30s revalidate) |
| CSR for real-time updates (prices) | Done | `hooks/use-live-prices.ts` |
| Avoid unnecessary API calls | Done | No polling, news cached, filter and paging on the client |
| Minimize re-renders | Done | `memo`, `useMemo`, `useSyncExternalStore`, pause when hidden |
| Efficient component structure | Done | Server components by default, small client components |

### Logging

| Requirement | Status |
| --- | --- |
| Login success and failure | Done |
| Unauthorized access attempts | Done |
| API errors | Done |

### Optional extras

| Feature | Status | Notes |
| --- | --- | --- |
| Loading states and skeleton UI | Done | `components/skeleton.tsx`, spinner on login |
| Error boundaries | Done | `dashboard/error.tsx`, `news/error.tsx` |
| TypeScript with strict typing | Done | `"strict": true` in `tsconfig.json` |
| Pagination or filtering in news | Done | Both |
| Environment variables for config | Done | `AUTH_SECRET`, `APP_URL` |
| WebSocket live updates | Not done | Prices are simulated in the browser with a timer |

### Deliverables

| Item | Status |
| --- | --- |
| Source code | This repo |
| How to run locally | [Running it locally](#running-it-locally) |
| Architectural decisions | [Architectural decisions](#architectural-decisions) |
| Rendering strategy | [Rendering strategy](#rendering-strategy) |
| Security considerations | [Security](#security) |

## Known limitations

- There's one hard-coded user, and the password is compared as plain text. A real app would store a password hash (bcrypt or argon2) in a database.
- No rate limiting on `/api/login`, so password guessing isn't slowed down.
- Logging out only removes the cookie. The token is still valid until it expires, because there's no server-side session list to revoke it from.
- `/api/logout` doesn't check the `Origin` header the way login does.
- No Content Security Policy or other security headers are set yet.
- Prices are simulated, not taken from a real market feed.
- Every user sees the same mock holdings.
