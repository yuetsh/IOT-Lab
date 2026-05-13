# Repository Guidelines

## Project Structure & Module Organization

This project is split into a Vite React client and an Express server. Client code lives in `client/src`, with student-facing views under `client/src/student`, admin views under `client/src/admin`, shared API helpers in `client/src/api.js`, static assets in `client/public`, and bundled output in `client/dist`. Server code lives in `server`, with route modules in `server/routes`, auth middleware in `server/middleware`, and SQLite setup plus data access in `server/db.js`. Runtime data is written to `data/` and uploaded screenshots to `server/uploads/`; both are ignored by git.

## Build, Test, and Development Commands

- `npm install`, `npm install --prefix client`, `npm install --prefix server`: install root, client, and server dependencies.
- `npm run dev`: run the Express server and Vite client together.
- `npm run dev --prefix client`: start only the Vite dev server.
- `npm run dev --prefix server`: start only the server with Node watch mode.
- `npm run build`: build the client for production.
- `npm run lint --prefix client`: run ESLint on client JavaScript and JSX.
- `npm start`: run the production server, which serves `client/dist` when `NODE_ENV=production`.

## Coding Style & Naming Conventions

Use two-space indentation. Keep React components in PascalCase files such as `DeviceManager.jsx`; use camelCase for functions, variables, and route helpers. Client modules use ES imports, JSX, and React Router patterns. Server modules use CommonJS, `'use strict'`, Express routers, prepared database helpers, and semicolons. Prefer small route handlers that validate inputs, call `server/db.js`, and return JSON errors consistently.

## Testing Guidelines

No automated test framework is configured yet; `server/package.json` still contains the default failing test placeholder. Before submitting changes, run `npm run lint --prefix client` and `npm run build`, then manually verify affected student and admin flows. When adding tests, keep names explicit, for example `DeviceManager.test.jsx` for client behavior or `devices.test.js` for server routes.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries, for example `Fix api.js: handle empty response body` and `Add routing to admin panel: ...`. Follow that style: start with `Add`, `Fix`, `Remove`, or `Expand`, and name the affected area. Pull requests should describe the user-facing change, list validation commands, mention any schema or environment changes, and include screenshots for visible UI updates.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local configuration. Set `ADMIN_PASSWORD` before exposing admin routes; without it, admin routes are intentionally open. Do not commit `.env`, `data/`, `server/uploads/`, or `client/dist/`.
