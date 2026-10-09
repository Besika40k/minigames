import type { AuthProfile } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { createIcon, IconName } from '../../utils/create-icon.ts';
import { getProfileInitials, getProfileName } from '../../utils/profile-name.ts';
import './profile.scss';

// The round picture of a signed-in user: the account photo when there is one,
// else the initials of the name, else a generic person. The name stands next
// to it, so screen readers skip the picture.
export function createProfileAvatar(name: string, avatarUrl?: string): HTMLElement {
  const avatar: HTMLElement = createElement('span', {
    className: 'profile-avatar',
    attributes: { 'aria-hidden': 'true' },
  });

  const showInitials = (): void => {
    const initials: string | undefined = getProfileInitials(name);
    avatar.replaceChildren(
      initials === undefined
        ? createIcon(IconName.Person)
        : createElement('span', { className: 'profile-avatar__initials', text: initials }),
    );
  };

  if (avatarUrl === undefined) {
    showInitials();
    return avatar;
  }

  // Google serves account photos only to requests without a referrer
  const photo: HTMLImageElement = createElement('img', {
    className: 'profile-avatar__photo',
    attributes: { src: avatarUrl, alt: '', referrerpolicy: 'no-referrer' },
  });
  photo.addEventListener('error', showInitials, { once: true });
  avatar.append(photo);

  return avatar;
}

// The avatar and the name of a signed-in user, side by side. The name is text,
// never markup.
export function createProfileSummary(profile: AuthProfile, className: string): HTMLElement {
  const name: string = getProfileName(profile);

  return createElement('div', {
    className: `profile-summary ${className}`,
    children: [
      createProfileAvatar(name, profile.avatarUrl),
      createElement('span', { className: 'profile-summary__name', text: name }),
    ],
  });
}
