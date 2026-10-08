# Financial Application (Next.js)

A small finance app where you log in, see your stock portfolio with live prices, and read market news.

## Run it locally

1. Make sure Node.js 20 or newer is installed.
2. Clone the repo: `git clone https://github.com/Amarkumar66428/financial-application-nextjs.git`
3. Go into the folder: `cd financial-application-nextjs`
4. Install packages: `npm install`
5. Copy `.env.example` to `.env.local` (you can leave it empty for local use).
6. Start the app: `npm run dev`
7. Open http://localhost:3000 in your browser.
8. Log in with `test@finapp.com` / `123456`.

## What it covers

- Login and logout with a signed session cookie.
- Portfolio dashboard with summary cards and a holdings table.
- Prices that update every few seconds to feel live.
- Market news page that refreshes every 30 seconds.
- Loading skeletons and friendly error screens.

## How it flows

- You open the app and get sent to `/login` if you're not signed in.
- You log in, the server checks your details and sets a cookie.
- You land on the dashboard, which loads your holdings from `/api/portfolio`.
- Prices keep moving on screen while the tab is open.
- You can switch to the news page or log out from the nav.

## Approach

- Built with Next.js 16 App Router, React 19, TypeScript and Tailwind CSS.
- Pages render on the server and stream in with Suspense.
- `proxy.ts` guards private pages before they render.
- Same validation rules are shared by the form and the API.
- Data is mocked, so no database is needed.

## Security

- Session token is signed with HMAC-SHA256 and expires after 1 hour.
- Cookie is `httpOnly`, `sameSite=lax` and `secure` in production.
- Private pages and the portfolio API both check the token.
- Bad or expired cookies are cleared automatically.
- Login only accepts same-origin JSON requests to block CSRF.
- Logout is POST-only so other sites can't log you out.
- Redirect after login only allows in-app paths, so no open redirects.
- Portfolio responses are never cached.
- Failed logins and unauthorized hits are logged.
