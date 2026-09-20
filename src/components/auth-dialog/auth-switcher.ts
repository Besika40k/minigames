import { AUTH_CONTENT, AUTH_MODES, AUTH_TABS_LABEL } from '../../data/auth.ts';
import { AuthMode } from '../../types/auth.ts';
import { createElement } from '../../utils/create-element.ts';
import { getPanelId, getTabId } from './auth-ids.ts';
import { createAuthPanel } from './auth-panel.ts';

export interface AuthSwitcher {
  readonly tabList: HTMLElement;
  readonly panels: HTMLElement;
  // Selects the form of a mode. The forms cross-fade unless the dialog is being
  // opened, where the right form has to be there from the first frame.
  readonly select: (mode: AuthMode, isAnimated: boolean) => void;
  readonly focusTab: (mode: AuthMode) => void;
}

// CSS reads this to slide the forms forwards or backwards
const DIRECTION_PROPERTY = '--auth-direction';

// The keyboard moves between tabs as the ARIA tabs pattern says
function getTargetMode(key: string, current: AuthMode): AuthMode | undefined {
  const lastIndex: number = AUTH_MODES.length - 1;
  const index: number = AUTH_MODES.indexOf(current);
  const targets: Readonly<Record<string, number>> = {
    ArrowRight: index === lastIndex ? 0 : index + 1,
    ArrowLeft: index === 0 ? lastIndex : index - 1,
    Home: 0,
    End: lastIndex,
  };
  const target: number | undefined = targets[key];

  return target === undefined ? undefined : AUTH_MODES[target];
}

// Both forms are on screen while they cross-fade. The leaving form leaves the
// flow, so the box around the forms is as high as the entering form, and CSS
// eases that box from the height of the leaving form to its own. Returns a
// function that ends the change at once.
function crossFade(
  container: HTMLElement,
  leaving: HTMLElement,
  entering: HTMLElement,
  isForward: boolean,
): () => void {
  const startHeight: number = container.getBoundingClientRect().height;

  container.style.setProperty(DIRECTION_PROPERTY, isForward ? '1' : '-1');
  leaving.classList.add('auth-dialog__panel--leaving');
  entering.hidden = false;
  entering.classList.add('auth-dialog__panel--entering');
  const endHeight: number = container.getBoundingClientRect().height;

  // The box starts at the old height. Reading its layout makes the browser
  // apply that height before the new one is set, so the change is animated.
  container.classList.add('auth-dialog__panels--resizing');
  container.style.height = `${startHeight}px`;
  container.getBoundingClientRect();
  container.style.height = `${endHeight}px`;

  const animations: Animation[] = [
    ...leaving.getAnimations(),
    ...entering.getAnimations(),
    ...container.getAnimations(),
  ];

  let isFinished = false;
  const finish = (): void => {
    if (isFinished) {
      return;
    }
    isFinished = true;

    for (const animation of animations) {
      animation.cancel();
    }
    leaving.hidden = true;
    leaving.classList.remove('auth-dialog__panel--leaving');
    entering.classList.remove('auth-dialog__panel--entering');
    container.classList.remove('auth-dialog__panels--resizing');
    container.style.removeProperty('height');
    container.style.removeProperty(DIRECTION_PROPERTY);
  };

  void Promise.allSettled(
    animations.map((animation: Animation): Promise<Animation> => animation.finished),
  ).then(finish);

  return finish;
}

export function createAuthSwitcher(): AuthSwitcher {
  let selectedMode: AuthMode = AuthMode.Login;
  let finishChange: (() => void) | undefined;

  const createTab = (mode: AuthMode): HTMLButtonElement => {
    const tab: HTMLButtonElement = createElement('button', {
      className: 'auth-dialog__tab',
      text: AUTH_CONTENT[mode].tabLabel,
      attributes: {
        id: getTabId(mode),
        type: 'button',
        role: 'tab',
        'aria-controls': getPanelId(mode),
      },
    });
    tab.addEventListener('click', (): void => {
      select(mode, true);
    });

    return tab;
  };

  const tabs: Readonly<Record<AuthMode, HTMLButtonElement>> = {
    [AuthMode.Login]: createTab(AuthMode.Login),
    [AuthMode.Register]: createTab(AuthMode.Register),
  };

  // The link inside a form switches too, and its own form is gone afterwards,
  // so the focus moves to the tab that stands for the new form
  const switchFromLink = (mode: AuthMode): void => {
    select(mode, true);
    tabs[mode].focus();
  };

  const panels: Readonly<Record<AuthMode, HTMLElement>> = {
    [AuthMode.Login]: createAuthPanel(AuthMode.Login, switchFromLink),
    [AuthMode.Register]: createAuthPanel(AuthMode.Register, switchFromLink),
  };

  const tabList: HTMLElement = createElement('div', {
    className: 'auth-dialog__tabs',
    attributes: { role: 'tablist', 'aria-label': AUTH_TABS_LABEL },
    children: AUTH_MODES.map((mode: AuthMode): HTMLButtonElement => tabs[mode]),
  });

  const container: HTMLElement = createElement('div', {
    className: 'auth-dialog__panels',
    children: AUTH_MODES.map((mode: AuthMode): HTMLElement => panels[mode]),
  });

  // Only the selected tab is a stop of the Tab key: the arrow keys move between tabs
  const markSelected = (): void => {
    for (const mode of AUTH_MODES) {
      const isSelected: boolean = mode === selectedMode;
      tabs[mode].setAttribute('aria-selected', String(isSelected));
      tabs[mode].tabIndex = isSelected ? 0 : -1;
    }
  };

  function select(mode: AuthMode, isAnimated: boolean): void {
    finishChange?.();
    finishChange = undefined;

    const previousMode: AuthMode = selectedMode;
    selectedMode = mode;
    markSelected();

    if (isAnimated && mode !== previousMode) {
      const isForward: boolean = AUTH_MODES.indexOf(mode) > AUTH_MODES.indexOf(previousMode);
      finishChange = crossFade(container, panels[previousMode], panels[mode], isForward);
      return;
    }

    for (const panelMode of AUTH_MODES) {
      panels[panelMode].hidden = panelMode !== mode;
    }
  }

  tabList.addEventListener('keydown', (event: KeyboardEvent): void => {
    const target: AuthMode | undefined = getTargetMode(event.key, selectedMode);
    if (target === undefined) {
      return;
    }

    event.preventDefault();
    select(target, true);
    tabs[target].focus();
  });

  select(AuthMode.Login, false);

  return {
    tabList,
    panels: container,
    select,
    focusTab: (mode: AuthMode): void => {
      tabs[mode].focus();
    },
  };
}
