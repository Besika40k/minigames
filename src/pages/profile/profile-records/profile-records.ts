import { createButtonLink } from '../../../components/button/button.ts';
import { createEmptyState } from '../../../components/feedback/empty-state.ts';
import { createSectionTitle } from '../../../components/section-title/section-title.ts';
import { OWN_GAMES } from '../../../data/own-games.ts';
import { PROFILE_CONTENT } from '../../../data/profile.ts';
import { ButtonSize, ButtonVariant } from '../../../types/button.ts';
import { createElement } from '../../../utils/create-element.ts';
import './profile-records.scss';

const TITLE_ID = 'profile-records-title';

// The records of the user in the games of MiniGames itself. No game sends its
// scores yet, so the section invites the user to play.
export function createProfileRecords(): HTMLElement {
  const [game] = OWN_GAMES;
  const action: HTMLAnchorElement | undefined =
    game === undefined
      ? undefined
      : createButtonLink({
          variant: ButtonVariant.Filled,
          size: ButtonSize.Medium,
          text: PROFILE_CONTENT.playText,
          href: game.playUrl,
        });

  return createElement('section', {
    className: 'profile-records',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [
      createSectionTitle(TITLE_ID, [PROFILE_CONTENT.recordsTitle]),
      createEmptyState({
        title: PROFILE_CONTENT.noRecordsTitle,
        message: PROFILE_CONTENT.noRecordsMessage,
        action,
      }),
    ],
  });
}
