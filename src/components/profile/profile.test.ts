import { describe, expect, it } from 'vitest';
import { createProfileAvatar, createProfileSummary } from './profile.ts';

describe('createProfileAvatar', (): void => {
  it('shows the account photo without sending the page as referrer', (): void => {
    const avatar: HTMLElement = createProfileAvatar('Alex Pro', 'https://photo.example/alex.jpg');
    const photo: HTMLImageElement | null = avatar.querySelector('img');

    expect(photo?.getAttribute('src')).toBe('https://photo.example/alex.jpg');
    expect(photo?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the initials once the photo fails to load', (): void => {
    const avatar: HTMLElement = createProfileAvatar('Alex Pro', 'https://photo.example/broken.jpg');

    avatar.querySelector('img')?.dispatchEvent(new Event('error'));

    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar.textContent).toBe('AP');
  });

  it('shows the initials without a photo', (): void => {
    expect(createProfileAvatar('cozy').textContent).toBe('C');
  });

  it('shows a generic person for a name without letters or digits', (): void => {
    const avatar: HTMLElement = createProfileAvatar('!!!');

    expect(avatar.textContent).toBe('');
    expect(avatar.querySelector('svg')).not.toBeNull();
  });
});

describe('createProfileSummary', (): void => {
  it('shows the avatar and the name', (): void => {
    const summary: HTMLElement = createProfileSummary(
      { displayName: 'Alex Pro', email: 'alex@minigames.com' },
      'header__profile',
    );

    expect(summary.classList.contains('header__profile')).toBe(true);
    expect(summary.querySelector('.profile-summary__name')?.textContent).toBe('Alex Pro');
    expect(summary.querySelector('.profile-avatar')?.textContent).toBe('AP');
  });

  it('writes a name that looks like markup as text', (): void => {
    const summary: HTMLElement = createProfileSummary(
      { displayName: '<img src=x onerror=alert(1)>', email: 'x@minigames.com' },
      'header__profile',
    );

    expect(summary.querySelector('.profile-summary__name')?.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
    expect(summary.querySelectorAll('img')).toHaveLength(0);
  });

  it('names a profile without a name after its email', (): void => {
    const summary: HTMLElement = createProfileSummary(
      { displayName: '', email: 'cozy@minigames.com' },
      'mobile-menu__profile',
    );

    expect(summary.querySelector('.profile-summary__name')?.textContent).toBe('cozy');
  });
});
