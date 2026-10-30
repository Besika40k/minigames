import { createButton } from '../../components/button/button.ts';
import { createEmptyState } from '../../components/feedback/empty-state.ts';
import { PROFILE_CONTENT } from '../../data/profile.ts';
import { ButtonSize, ButtonVariant } from '../../types/button.ts';
import type { Game } from '../../types/game.ts';
import { DialogParameter, type AppLocation, type PageView } from '../../types/route.ts';
import type { AppSession } from '../../types/session.ts';
import { createElement } from '../../utils/create-element.ts';
import { createProfileCard, type ProfileCard } from './profile-card/profile-card.ts';
import {
  createProfileFavorites,
  type ProfileFavorites,
} from './profile-favorites/profile-favorites.ts';
import './profile-page.scss';
import { createProfileRecords } from './profile-records/profile-records.ts';

const GUEST_TITLE_ID = 'profile-guest-title';

export interface ProfilePageOptions {
  // The signed-in user, or undefined for a guest
  readonly getSession: () => AppSession | undefined;
  // Calls the listener whenever someone signs in or out; answers a function
  // that stops it
  readonly subscribe: (listener: (session: AppSession | undefined) => void) => () => void;
  // Checks the session before a change, and opens the auth dialog for a guest
  readonly requireSession: (warning: string) => AppSession | undefined;
  readonly onLogin: () => void;
  readonly onGameOpen: (game: Game) => void;
  // The picture of the user changed, so the header can show it
  readonly onPhotoChange: (photo: string | undefined) => void;
}

// The parts of the page of one signed-in user
interface UserView {
  readonly email: string;
  readonly card: ProfileCard;
  readonly favorites: ProfileFavorites;
}

// The page a guest sees: what a profile holds, and a way to log in
function createGuestState(onLogin: () => void): HTMLElement {
  return createElement('section', {
    className: 'profile-page__guest',
    attributes: { 'aria-labelledby': GUEST_TITLE_ID },
    children: [
      createElement('h1', {
        className: 'profile-page__title',
        text: PROFILE_CONTENT.title,
        attributes: { id: GUEST_TITLE_ID },
      }),
      createEmptyState({
        title: PROFILE_CONTENT.guestTitle,
        message: PROFILE_CONTENT.guestMessage,
        action: createButton({
          variant: ButtonVariant.Filled,
          size: ButtonSize.Medium,
          text: PROFILE_CONTENT.loginText,
          onClick: onLogin,
        }),
      }),
    ],
  });
}

// The page of the signed-in user: the profile card, the favorite games and
// the records. A guest sees a way to log in instead. The page follows the
// session: signing in or out draws it again for whoever is visiting.
export function renderProfilePage(location: AppLocation, options: ProfilePageOptions): PageView {
  const inner: HTMLDivElement = createElement('div', { className: 'profile-page__inner' });
  const element: HTMLElement = createElement('div', {
    className: 'profile-page',
    children: [inner],
  });

  let user: UserView | undefined;
  // Whose page is drawn: an email, the empty text for a guest, or undefined
  // before the first drawing
  let shownVisitor: string | undefined;
  // Whether a game's details were open over the page at the last address
  let isGameOpen: boolean = location.query.has(DialogParameter.Game);

  const show = (session: AppSession | undefined): void => {
    const visitor: string = session?.email ?? '';
    if (visitor === shownVisitor) {
      return;
    }
    shownVisitor = visitor;
    user?.card.abort();
    user?.favorites.abort();
    if (session === undefined) {
      user = undefined;
      inner.replaceChildren(createGuestState(options.onLogin));
      return;
    }
    user = {
      email: session.email,
      card: createProfileCard({
        session,
        requireSession: options.requireSession,
        onPhotoChange: options.onPhotoChange,
      }),
      favorites: createProfileFavorites(session.email, options.onGameOpen),
    };
    inner.replaceChildren(user.card.element, user.favorites.element, createProfileRecords());
  };

  const unsubscribe: () => void = options.subscribe(show);
  show(options.getSession());

  return {
    elements: [element],
    // A game opened from the favorites may have left them when its details
    // close, so the list loads again then
    update: (next: AppLocation): void => {
      const wasGameOpen: boolean = isGameOpen;
      isGameOpen = next.query.has(DialogParameter.Game);
      if (wasGameOpen && !isGameOpen) {
        user?.favorites.reload();
      }
    },
    destroy: (): void => {
      unsubscribe();
      user?.card.abort();
      user?.favorites.abort();
    },
  };
}
