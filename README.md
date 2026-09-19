# MiniGames

MiniGames is a single-page web app for browsing and playing small browser games. The home page features a game carousel, a leaderboard of top players, and a section inviting game developers to publish their games. Users can sign in or register through an auth dialog.

The layout is responsive and follows the Figma design at three breakpoints: 375px, 768px and 1920px.

## Tech stack

- TypeScript (strict mode), no frameworks
- Vite
- Sass (SCSS)
- ESLint (typescript-eslint, Unicorn) and Prettier
- Husky and commitlint for Git hooks

## Getting started

Requires Node.js 22 or newer.

```bash
    git clone https://github.com/Besika40k/minigames.git
    cd minigames
    npm install
    npm run dev
```

## Scripts

| Script                 | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the development server                       |
| `npm run build`        | Type-check and create a production build in `dist` |
| `npm run build:dev`    | Create a development build with source maps        |
| `npm run preview`      | Serve the latest build locally                     |
| `npm run lint`         | Run ESLint on the codebase (fails on warnings)     |
| `npm run lint:fix`     | Run ESLint and fix what can be fixed automatically |
| `npm run format`       | Format the codebase with Prettier                  |
| `npm run format:check` | Check formatting without changing files            |

## Git hooks

- `commit-msg`: validates commit messages against the RS School Git convention
- `pre-push`: runs `npm run lint` and `npm run format:check`; the push is aborted on any error or warning

## Project structure

```text
src/
├── main.ts            # entry point
├── app/               # app bootstrap and SPA router
├── components/        # UI reused across pages (header, burger menu, footer, auth dialog)
├── pages/             # one folder per page, each section in its own subfolder
│   └── home/          # hero, games carousel, leaderboard, game dev section
├── data/              # mock data (games, leaderboard)
├── types/             # shared interfaces and enums
├── utils/             # DOM and formatting helpers
├── assets/            # fonts, icons, images
└── styles/
    ├── main.scss      # global styles entry point
    ├── abstracts/     # tokens, functions, mixins (no CSS output)
    └── base/          # global element styles and typography
```

Each component and page section keeps its TypeScript and SCSS files together in one folder.

## Architecture

The app is a single-page application: `index.html` has an empty `body` and one script tag, and every element is created from TypeScript with the typed `createElement` helper (`src/utils/create-element.ts`). Routes live in the URL hash (`#/`), so the app works on any static host without server rules.

To add a page, add a value to the `Route` enum (`src/types/route.ts`), write a function that returns the page's elements, and register both in `src/app/app.ts`.

## Styling

Design tokens from the style guide live in `src/styles/abstracts/_tokens.scss`: colors, typography, sizes, corner radii, button sizes, shadows and breakpoints. Styles read them through helpers instead of raw values:

- functions (`_functions.scss`): `get-color`, `get-font-family`, `get-font-size`, `get-font-weight`, `get-size`, `get-radius`, `get-shadow`, `get-button-size` and `get-breakpoint`. An unknown token name fails the build.
- mixins (`_mixins.scss`): `media-up` and `media-down` for media queries, `hover` for hover-only styles and `button-size` for button padding.

Every stylesheet starts with `@use 'abstracts' as *;` (Vite adds `src/styles` to Sass's load path). Media queries always go through `media-up` and `media-down`, so the breakpoints stay in one place.

## Deployment

Coming soon.
