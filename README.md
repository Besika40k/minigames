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
├── components/        # UI reused across pages (button, logo, header, burger menu, footer, section title, auth dialog)
├── pages/             # one folder per page, each section in its own subfolder
│   └── home/          # hero, games carousel, leaderboard, game developers section
├── data/              # static data (navigation links, footer content, mock games and leaderboard)
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

## Auth dialog

The auth dialog (`src/components/auth-dialog`) is a native `<dialog>` opened with `showModal()`, so the browser centers it, dims the page behind it, traps the focus and returns the focus to the button that opened it. `createAuthDialog()` returns the dialog element and an `open(mode)` function, and `app.ts` passes that function to the header and to the mobile menu: Log In opens the login form and Sign Up the registration form. The mobile menu closes itself before it opens the dialog.

Inside, a tab bar (ARIA tabs, arrow keys move between the tabs) switches between the two forms. The forms cross-fade while the box around them eases to the new height. The dialog closes with Esc or a click on the backdrop, and both the opening and the closing are animated (only a fade when the system asks for reduced motion). The content of the forms lives in `src/data/auth.ts`. Checking the fields and sending them are not implemented yet, so a form only stays on the page when it is submitted.

## Styling

Design tokens from the style guide live in `src/styles/abstracts/_tokens.scss`: colors, typography, sizes, corner radii, button sizes, shadows and breakpoints. Styles read them through helpers instead of raw values:

- functions (`_functions.scss`): `get-color`, `get-font-family`, `get-font-size`, `get-font-weight`, `get-size`, `get-radius`, `get-shadow`, `get-button-size`, `get-breakpoint` and `get-duration`. An unknown token name fails the build.
- mixins (`_mixins.scss`): `media-up` and `media-down` for media queries, `hover` for hover-only styles, `button-size` for button padding (the border is taken off it, because the mockups draw a button's stroke inside its box), `reduced-motion` for styles that respect that system setting, and `animated-dialog` for the open and close animation of a modal `<dialog>`.

Every stylesheet starts with `@use 'abstracts' as *;` (Vite adds `src/styles` to Sass's load path). Media queries always go through `media-up` and `media-down`, so the breakpoints stay in one place. Both count whole pixels (`media-down(tablet)` is everything below 769px), so a fractional width from browser zoom or display scaling, such as 375.2px at 125%, still lands in the right layout. The mobile layout holds from 375px up to 560px.

## Deployment

The app is deployed to GitHub Pages: <https://besika40k.github.io/minigames/>

Every push to `story-1` runs `.github/workflows/deploy.yml`, which builds the project and publishes the `dist` folder. The workflow builds with `--base` set to the Pages base path (`/minigames/`), so `npm run dev` and a plain `npm run build` keep using `/`.
