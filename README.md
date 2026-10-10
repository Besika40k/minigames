# MiniGames

MiniGames is a single-page web app for browsing and playing small browser games. The Home page features a slider of featured games, a leaderboard of top players, and a section inviting game developers to publish their games. The Library page lists the games with category filters, sorting and pagination, and the details of a game open in a dialog with its top records and latest comments.

The games, the categories, the leaderboard and the comments come from the course's REST API. Every page, Library filter and open dialog is kept in the URL, so any screen can be bookmarked, shared and reached again with Back and Forward.

Visitors can register and sign in with an email and a password or with Google (Firebase Authentication). A signed-in user can add games to the favorites, write comments and like them; a guest can browse everything and is asked to log in for those actions. The sign-in lasts five minutes.

The layout is responsive and follows the Figma design at three breakpoints: 375px, 768px and 1920px.

## Tech stack

- TypeScript (strict mode), no frameworks
- Firebase Authentication (the modular SDK), the only runtime dependency
- Vite
- Sass (SCSS)
- Vitest with happy-dom and v8 coverage for the unit tests
- ESLint (typescript-eslint, Unicorn) and Prettier
- Husky and commitlint for Git hooks

## Getting started

Requires Node.js 22.12 or newer.

```bash
git clone https://github.com/Besika40k/minigames.git
cd minigames
npm install
npm run dev
```

Signing in needs the web app config of a Firebase project: copy `.env.example` to `.env.local` (git ignores it) and fill in the values from the Firebase console (Project settings, Your apps). The project needs the Email/Password and Google sign-in methods, and the address the app runs on among its authorized domains (`localhost` is there by default). Everything else, the tests included, works without it.

## Scripts

| Script                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Start the development server                       |
| `npm run build`         | Type-check and create a production build in `dist` |
| `npm run build:dev`     | Create a development build with source maps        |
| `npm run preview`       | Serve the latest build locally                     |
| `npm run lint`          | Run ESLint on the codebase (fails on warnings)     |
| `npm run lint:fix`      | Run ESLint and fix what can be fixed automatically |
| `npm run format`        | Format the codebase with Prettier                  |
| `npm run format:check`  | Check formatting without changing files            |
| `npm test`              | Run every unit test once                           |
| `npm run test:coverage` | Run the tests and print the coverage table         |

## Git hooks

- `commit-msg`: validates commit messages against the RS School Git convention
- `pre-push`: runs `npm run lint`, `npm run format:check` and `npm test`; the push is aborted on any error, warning or failing test

## Project structure

```text
src/
├── main.ts            # entry point
├── app/               # app bootstrap, the History API router and the URL helpers
├── api/               # the REST API client: requests, answer checks and errors
├── auth/              # Firebase, sign-in and sign-out, the form rules and the app session
├── components/        # UI reused across pages (button, logo, header, burger menu, footer, section title, auth dialog, game details dialog, skeleton, snackbar, and the loading, error and empty states)
├── pages/             # one folder per page, each section in its own subfolder
│   ├── home/          # hero, games slider, leaderboard, game developers section
│   ├── library/       # title with filters and sorting, game cards, pagination, the Library's URL state
│   └── not-found/     # the 404 page for an unknown address
├── data/              # static content (navigation links, footer content, the texts and messages of every section)
├── types/             # shared interfaces and enums
├── utils/             # DOM, navigation, dialog, timer and formatting helpers
├── assets/            # fonts, icons, images
└── styles/
    ├── main.scss      # global styles entry point
    ├── abstracts/     # tokens, functions, mixins (no CSS output)
    └── base/          # global element styles and typography
public/
└── assets/images/games/  # the course's game pictures, at the paths the API names them by
```

Each component and page section keeps its TypeScript and SCSS files together in one folder, and a module's unit tests sit next to it as `*.test.ts`.

## Architecture

The app is a single-page application: `index.html` has an empty `body` and one script tag, and every element is created from TypeScript with the typed `createElement` helper (`src/utils/create-element.ts`). The header, the footer and the dialogs are created once, in `src/app/app.ts`.

### Router and URL

The router (`src/app/router.ts`) is a small class over the History API, written without a library. Every page has a real path, and the query holds the rest of the state:

| State                           | In the URL                                       | Example                                            |
| ------------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| Page                            | `/` or `/home`, `/library`; other paths are 404s | `/library`                                         |
| Library category, sort and page | `category`, `sort`, `page`                       | `/library?category=puzzle&sort=rating-desc&page=2` |
| Game Details                    | `game=<slug>`, over any page                     | `/library?category=arcade&page=2&game=palia`       |
| Auth dialog (guests only)       | `auth=login` or `auth=register`, over any page   | `/?auth=login`                                     |

The URL is the single source of truth. A click on a chip, a sort option, a page button, a Details button or Log In only asks the router for a new URL (`router.navigate`). The router then passes the new location to the page and to the dialogs, which draw themselves and send their requests from it. A click, Back and Forward and a deep link all take this one way, so the same URL always shows the same screen.

- A new path renders its page into `main`, sets the tab title and scrolls to the top. A new query of the open page goes to the page's `update`, so the Library loads new games without drawing the page again and without scrolling.
- Every Library change adds a history entry, so Back steps through them. A new category or sort starts again from page 1.
- Opening a dialog adds a history entry marked `isDialogEntry`. Closing it (the close button, Esc or the backdrop) goes back to the entry before it or, after a deep link, replaces the URL without the dialog's parameter, so no duplicate entries are left. Back closes an open dialog and Forward opens it again. Switching between the login and the registration form replaces `auth`, so one Back still closes the dialog.
- Invalid values are corrected with `replaceState`: an unknown category, sort or page falls back to its default with a warning snackbar, an unknown `auth` mode is dropped, and so is `auth` for a signed-in user. A page past the last one keeps its URL and shows the "Data Not Found" banner, and an unknown game opens the dialog in its "Game Not Found" state.
- When both `game` and `auth` are present, the auth dialog shows in place of Game Details, and the game comes back when `auth` leaves the URL (see [Authentication and the app session](#authentication-and-the-app-session)). `decideDialog` in `src/app/url.ts` makes all these decisions in one pure function.
- A dialog changes only the query: the path and the hash of the page stay.
- Plain left clicks on links of the app are opened by the router. Clicks with Ctrl, Shift or Meta, links with a `target`, and other sites are left to the browser, and every link has a real `href` (`getRouteHref`), so "Open in new tab" works too. An old Story 2 link (`#/library`) moves to its path.
- The header and the mobile menu mark the link of the open page with `aria-current="page"` (`src/utils/page-links.ts`), which also styles it, and the mobile menu closes on every new URL.

The URL helpers (`src/app/url.ts`, `src/pages/library/library-query.ts`) are pure functions without DOM access, ready for unit tests.

To add a page, add a value to the `Route` enum (`src/types/route.ts`) and its path to `ROUTES` in `src/app/url.ts`, write a function that returns the page's `PageView`, and register it in `src/app/app.ts`.

## API

The data comes from the course's REST API: the base URL is in `src/api/api-config.ts`, and the endpoints are described at <https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/docs>. Each kind of data has its own module in `src/api/`:

| Request                                                     | Module               | Used by                                                          |
| ----------------------------------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `GET /games?featured=true`                                  | `games-api.ts`       | Home slider                                                      |
| `GET /leaderboard`                                          | `leaderboard-api.ts` | Home leaderboard                                                 |
| `GET /categories`                                           | `categories-api.ts`  | Library category chips                                           |
| `GET /games?category=&sort=&page=&limit=6`                  | `games-api.ts`       | Library cards and pagination                                     |
| `GET /games/{slug}?userEmail=`                              | `games-api.ts`       | Game Details, with the favorite of a signed-in user              |
| `GET /games/{slug}/comments?limit=3&sort=newest&userEmail=` | `comments-api.ts`    | The comments of Game Details, with the likes of a signed-in user |
| `POST /games/{slug}/favorite`                               | `favorites-api.ts`   | Add to Favorites                                                 |
| `POST /games/{slug}/comments`                               | `comments-api.ts`    | The comment form                                                 |
| `POST /comments/{commentId}/like`                           | `likes-api.ts`       | The like buttons                                                 |

A guest's requests leave `userEmail` out. Every `POST` sends the email of the app session, which is the only identity the API needs.

- `getJson` (`http-client.ts`) sends every request with the caller's `AbortSignal` and a 15-second timeout. Every failure becomes an `ApiError` of one kind: no connection, a bad request (400), no user (401), not found (404), too many requests (429), a server error, or an answer of the wrong shape. Its message is the API's own `{ "error": "..." }` text when there is one.
- `postJson` sends a change as JSON, with the same timeout. A change is never canceled once it is sent and never sent again by itself: the favorite and the like endpoints toggle, so a second request would undo the first, and a second comment would be posted twice. When the outcome is unknown (no answer, a server failure or an unreadable answer, see `isOutcomeUnknown`), the app says so and loads the state again instead.
- Answers are read as `unknown` and checked with type guards (`guards.ts`, `response.ts`) before they become the app's types, so an unexpected answer is shown as an error instead of breaking the page.
- Filtering, sorting and paging happen on the server only: the app sends the values of the URL as request parameters and draws what comes back.
- The API names its pictures by paths such as `/assets/images/games/palia-card.jpg` but does not serve them, so the 48 pictures of the course are in `public/assets/images/games/`. `resolveAssetUrl` puts the app's base path in front of them.

## Loading, error and empty states

Every area that loads data (the slider, the leaderboard, the category chips, the game cards, the game details and the comments) is an `AsyncArea` (`src/components/feedback/async-area.ts`):

- While its request is on the way, the area shows a skeleton in the shape of its content (`src/components/skeleton`) and has `aria-busy="true"`. The skeleton shimmers, or only pulses when the system asks for reduced motion.
- A failure shows an error banner with a Retry button in place of the content (`error-banner.ts`), and an empty answer shows a placeholder with a way on, such as "Show all games" (`empty-state.ts`).
- Only the latest request may draw: a new request cancels the one before it with an `AbortController`, so a late answer never replaces a newer one, and a page cancels its requests when it closes.

Snackbars (`src/components/snackbar`) tell what happened: an error when a request fails, a success after a Retry, and a warning for a corrected URL, a rate limit or an unknown game. They appear near the top of the screen and never block the page. A message closes by itself after 5 seconds (the time stops while the pointer or the focus is on it) or with its close button. At most three are shown, the same message is shown once, and while a modal dialog is open they appear inside it, where they can be seen and closed.

## Auth dialog

The auth dialog (`src/components/auth-dialog`) is a native `<dialog>` opened with `showModal()`, so the browser centers it, dims the page behind it, traps the focus and returns the focus to the button that opened it. It follows the `auth` parameter of the URL: Log In in the header or the mobile menu opens `?auth=login`, Sign Up opens `?auth=register`, and a deep link opens the dialog over its page. `createAuthDialog` returns the dialog with `show(mode)` and `hide()`, which `app.ts` calls when the URL changes.

Inside, a tab bar (ARIA tabs, arrow keys move between the tabs) switches between the two forms, and each switch replaces the mode in the URL and empties the fields. The forms cross-fade while the box around them eases to the new height. The dialog closes with Esc or a click on the backdrop, which take `auth` out of the URL, and both the opening and the closing are animated (only a fade when the system asks for reduced motion). The content of the forms lives in `src/data/auth.ts`.

- The fields are checked as the visitor types and when a field is left (`src/auth/validation.ts`): an email address; a username of 2 to 30 letters and digits that starts with a capital letter; a registration password of at least 6 characters with a capital letter, a digit and a special character; a login password of at least 6 characters; and a matching confirmation. An invalid field shows its message under it (`aria-invalid`, `aria-describedby`), and the submit button works only for a valid form.
- While a sign-in is under way, every control of the dialog is locked, the pressed button shows a turning ring, and Esc and the backdrop do not close it. A success closes the dialog and greets the user with a snackbar; a failure unlocks the form with the values kept and says why in a snackbar.

## Authentication and the app session

Firebase Authentication (`src/auth/firebase.ts`, `src/auth/auth-service.ts`) signs the visitor in with an email and a password, registers a new account with its username as the display name, or signs in with Google in a popup window. The service loads only when the auth dialog opens, so a guest's visit never downloads Firebase. Firebase error codes become plain messages, and closing Google's window is not an error.

A successful sign-in starts the app session (`src/auth/session.ts`, `src/auth/session-store.ts`): one JSON object in `localStorage` under the key **`minigames:besika40k:app-session`**:

```json
{
  "displayName": "Alex Pro",
  "email": "alex@minigames.com",
  "authenticatedAt": 1791580800000,
  "avatarUrl": "https://lh3.googleusercontent.com/..."
}
```

`avatarUrl` is there only when the account has a photo. No password or token is stored. The session lasts five minutes from `authenticatedAt`, which never moves, and the app never signs a user in from Firebase's own stored sign-in alone.

- The stored session is read and checked at startup, when the tab becomes visible again, before every page or dialog change, before every protected action, and when another tab changes it (the `storage` event). A timer also ends it at its exact expiry while the page is open.
- An expired session removes only its key, signs out of Firebase, turns the UI to guest mode and shows one warning snackbar. Data that is not a valid session (not JSON, missing or wrong fields, a sign-in time in the future) is removed the same way, without a message.
- The header and the mobile menu show the signed-in user (the Google photo, or the initials of the name) and a Log Out button. Logging out removes only the session key and signs out of Firebase; if that sign-out fails, the app still stays in guest mode and says so.
- The auth dialog is for guests only. For a signed-in user, `?auth=...` is removed from the URL in place (the path, the other parameters and the hash stay) with one snackbar, whether it comes from a button, a link, a typed address or Back and Forward.
- A protected action (a favorite, a comment or a like) checks the session first. A guest, or a user whose session has just expired, gets the auth dialog in place of Game Details, whose game stays in the URL (`?game=palia&auth=login`): closing the dialog or signing in brings Game Details back, for a guest or for the signed-in user. The action is never repeated by itself.

## Home slider

The slider on the Home page (`src/pages/home/games-carousel`) shows the featured games of the API (nine at the moment) in a loop: the active card in the middle, a near card and a far card on each side, and the other cards hidden off the row. All the cards stay in the list: the script gives each card a role class and a CSS `order` from its distance to the active card, and CSS transitions slide the cards and change their widths. The arrows stay disabled until the games are there.

- The arrows move one card back or forward. With more than one game, the slider also moves forward by itself every four seconds (`AutoplayTimer`, `src/utils/autoplay-timer.ts`), and a manual step starts a new countdown.
- A swipe, by touch or with a mouse drag (`carousel-swipe.ts`), moves one card. Holding the slider pauses the countdown, and the slider also waits while the browser tab is hidden.
- A click on a card opens the game in the details dialog (`?game=<slug>`). A card 288px wide or wider shows its title, rating and likes, a narrower card shows only its photo, and the text of a narrow card stays in the page for screen readers.

## Library page

The Library page (`src/pages/library`) has three sections:

- The title with the category chips and the sort control. The chips come from the API, and the chip of the URL's category is pressed (`aria-pressed`); the row of chips never wraps, and the chips that do not fit can be swiped into view, or dragged with a mouse. The sort control opens a list of orders that follows the ARIA listbox pattern: the arrow keys, Home and End move through it, Enter or Space picks an order and Esc closes it.
- The game cards, six per page, loaded for the URL's category, sort and page. Each list item is a CSS container, so a card lays itself out by its own width: the photo sits beside the text while the card is at least 688px wide, and above it on narrower cards. Details opens the game in the details dialog.
- The pagination for the number of pages the API reports, with the previous and next arrows and a window of four page buttons around the current page (three on mobile). A page button scrolls the top of the list into view.

The Library's state lives in the URL (see [Router and URL](#router-and-url)): `library-query.ts` reads and corrects it, and `library-page.ts` loads the categories first, so that an unknown category can be corrected, and then the games.

## Game details dialog

The game details dialog (`src/components/game-details-dialog`) opens for the `game` parameter of the URL: from the Details button of a Library card, a click on a slider card, or a deep link. Like the auth dialog, it is a native `<dialog>` opened with `showModal()` and animated with the `animated-dialog` mixin. It closes with its close button, with Esc and with a click on the backdrop (`enableDialogDismiss` in `src/utils/dismiss-dialog.ts`, shared with the auth dialog), which take `game` out of the URL, and the page behind it does not scroll while it is open.

The game is loaded by its slug, for the signed-in user or for a guest, and loads again when the session changes. Under the hero picture come the game info (title, rating and likes, description, the four spec boxes, Play Now, or Buy Now with the price of a paid game, and Add to Favorites) and the top records. The comments load next to the game, with states of their own: the three newest comments with times such as "5 min ago" (`src/utils/format-relative-time.ts`), and the total number of comments in the heading. An unknown slug shows the "Game Not Found" state with a Close button.

The favorite, the comment form and the likes work for a signed-in user only; a guest's click opens the auth dialog with a warning (see [Authentication and the app session](#authentication-and-the-app-session)). They show only what the server confirms:

- Add to Favorites starts from the user's state in the game details, and its text says what a click will do. A click locks it with a turning ring until the answer comes, then shows the new state and the new number of likes.
- The comment form is locked for a guest, and its avatar shows the first letter of the user's name. The textarea grows with its text from 48px to 88px and scrolls after that (CSS `field-sizing: content`, with a script fallback for browsers without it). Enter sends and Shift+Enter starts a new line; the text is trimmed and may have at most 500 characters. While a comment is on its way the form is locked; after the `201` the form empties and the comments load again with the new total. A refusal keeps the text for another try, and an unknown outcome keeps it too and loads the comments again.
- A like button is locked with a turning ring while its request is on its way and then shows the server's state and count.
- A commenter's avatar shows the first letter of the name and one of the `avatar-random` colors, picked at random and kept for that commenter while the dialog exists.
- Every opening empties the comment form and scrolls the dialog to the top; a comment interrupted by a sign-in comes back in its game.

## Tests

The unit tests run on Vitest in happy-dom, a browser-like DOM (`vitest.config.ts`): `npm test` runs them once, and `npm run test:coverage` runs them with v8 coverage and prints the table (an HTML report goes to `coverage/`). The coverage includes every file in `src/` except the tests themselves, the bootstrap `src/main.ts` and type declarations, and the run fails when the statements fall below 80%.

- The tests check behavior: the form rules, the session (fake timers for the expiry), the URL decisions and the router, the API requests and how answers and failures are read, and the components through real clicks, keys and input events, down to the whole app started in happy-dom.
- The tests mock only the boundaries: `fetch` returns prepared answers, Firebase is replaced by a fake module, and snackbars are spied on where a test asks what was said. No test needs a Firebase project or the network.
- Every change sent to the API is tested for success, a refusal and an unknown outcome, and for being sent only once.

## Styling

Design tokens live in `src/styles/abstracts/_tokens.scss`: colors, typography, sizes, corner radii, button sizes, shadows, breakpoints, border widths and durations. Styles read them through helpers instead of raw values:

- functions (`_functions.scss`): `get-color`, `get-font-family`, `get-font-size`, `get-font-weight`, `get-size`, `get-radius`, `get-shadow`, `get-button-size`, `get-breakpoint` and `get-duration`. An unknown token name fails the build.
- mixins (`_mixins.scss`): `media-up` and `media-down` for media queries, `hover` for hover-only styles, `button-size` for button padding (the border is taken off it, because the mockups draw a button's stroke inside its box), `reduced-motion` for styles that respect that system setting, `visually-hidden` for a text that screen readers keep and the eye does not need, `animated-dialog` for the open and close animation of a modal `<dialog>`, and `modal-backdrop` for its dimmed backdrop, which also keeps the page behind it from scrolling.

Every stylesheet starts with `@use 'abstracts' as *;` (Vite adds `src/styles` to Sass's load path). Media queries always go through `media-up` and `media-down`, so the breakpoints stay in one place. Both count whole pixels (`media-down(tablet)` is everything below 769px), so a fractional width from browser zoom or display scaling, such as 375.2px at 125%, still lands in the right layout. The mobile layout holds from 375px up to 560px.

A number that no token covers (a size measured from a mockup, a line height the style guide does not give) becomes a named constant at the top of the stylesheet that uses it, with a comment saying where it comes from.

## Deployment

The app is deployed to GitHub Pages: <https://besika40k.github.io/minigames/>

Every push to `story-4` runs `.github/workflows/deploy.yml`, which builds the project and publishes the `dist` folder. The workflow builds with `--base` set to the Pages base path (`/minigames/`), so `npm run dev` and a plain `npm run build` keep using `/`. The router and the picture paths read the base from `import.meta.env.BASE_URL`.

The build reads the Firebase config from the repository variables (Settings, Secrets and variables, Actions, Variables) with the names of `.env.example`. The Firebase project lists `besika40k.github.io` among its authorized domains, so sign-in works on the deployed site.

GitHub Pages serves only the files it has, so a deep link such as `/minigames/library?category=puzzle` would get its 404 page. The workflow copies `dist/index.html` to `dist/home.html` and `dist/library.html`, which Pages serves for `/home` and `/library` with status 200, and to `dist/404.html`, which it serves for every other path with status 404. Each copy starts the app, and the router shows the page of the path, or the app's own 404 page.
