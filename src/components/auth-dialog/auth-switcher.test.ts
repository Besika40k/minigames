import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthFieldName, AuthMode, type AuthRequest } from '../../types/auth.ts';
import { getErrorId, getFieldId, getPanelId, getTabId } from './auth-ids.ts';
import { createAuthSwitcher, type AuthSwitcher } from './auth-switcher.ts';

type ModeListener = Mock<(mode: AuthMode) => void>;

function renderSwitcher(onModeChange: ModeListener = vi.fn()): AuthSwitcher {
  const switcher: AuthSwitcher = createAuthSwitcher({
    onModeChange,
    onSubmit: vi.fn<(request: AuthRequest) => Promise<void>>().mockResolvedValue(),
    onGoogle: vi.fn<() => Promise<void>>().mockResolvedValue(),
  });
  document.body.append(switcher.tabList, switcher.panels);

  return switcher;
}

function getById<T extends HTMLElement>(id: string): T {
  const element: T | null = document.querySelector<T>(`#${id}`);
  if (element === null) {
    throw new Error(`No #${id}`);
  }

  return element;
}

function getInput(mode: AuthMode, name: AuthFieldName): HTMLInputElement {
  return getById<HTMLInputElement>(getFieldId(mode, name));
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function isPanelShown(mode: AuthMode): boolean {
  return !getById(getPanelId(mode)).hidden;
}

afterEach((): void => {
  document.body.replaceChildren();
});

describe('auth form switcher', (): void => {
  it('starts with the login form and its tab selected', (): void => {
    const switcher: AuthSwitcher = renderSwitcher();

    expect(switcher.getMode()).toBe(AuthMode.Login);
    expect(isPanelShown(AuthMode.Login)).toBe(true);
    expect(isPanelShown(AuthMode.Register)).toBe(false);
    expect(getById(getTabId(AuthMode.Login)).getAttribute('aria-selected')).toBe('true');
    expect(getById(getTabId(AuthMode.Register)).tabIndex).toBe(-1);
  });

  it('switches to the form of a clicked tab and reports the pick', (): void => {
    const onModeChange: ModeListener = vi.fn();
    const switcher: AuthSwitcher = renderSwitcher(onModeChange);

    getById(getTabId(AuthMode.Register)).click();

    expect(switcher.getMode()).toBe(AuthMode.Register);
    expect(getById(getTabId(AuthMode.Register)).getAttribute('aria-selected')).toBe('true');
    expect(onModeChange).toHaveBeenCalledExactlyOnceWith(AuthMode.Register);
  });

  it('ignores a click on the tab of the form already shown', (): void => {
    const onModeChange: ModeListener = vi.fn();
    renderSwitcher(onModeChange);

    getById(getTabId(AuthMode.Login)).click();

    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('moves between the tabs with the arrow, Home and End keys', (): void => {
    const switcher: AuthSwitcher = renderSwitcher();
    const press = (key: string): void => {
      switcher.tabList.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    };

    press('ArrowRight');
    expect(switcher.getMode()).toBe(AuthMode.Register);
    press('ArrowRight');
    expect(switcher.getMode()).toBe(AuthMode.Login);
    press('ArrowLeft');
    expect(switcher.getMode()).toBe(AuthMode.Register);
    press('Home');
    expect(switcher.getMode()).toBe(AuthMode.Login);
    press('End');
    expect(switcher.getMode()).toBe(AuthMode.Register);
    press('Enter');
    expect(switcher.getMode()).toBe(AuthMode.Register);
  });

  it('switches with the link at the bottom of a form', (): void => {
    const switcher: AuthSwitcher = renderSwitcher();
    const link: HTMLButtonElement | null = getById(getPanelId(AuthMode.Login)).querySelector(
      ':scope .auth-dialog__switch button',
    );

    link?.click();

    expect(switcher.getMode()).toBe(AuthMode.Register);
    expect(document.activeElement).toBe(getById(getTabId(AuthMode.Register)));
  });

  it('clears the fields and their errors when the user switches forms', (): void => {
    renderSwitcher();
    type(getInput(AuthMode.Login, AuthFieldName.Email), 'alex@');
    getById(getTabId(AuthMode.Register)).click();
    type(getInput(AuthMode.Register, AuthFieldName.Username), 'cozy');

    getById(getTabId(AuthMode.Login)).click();

    expect(getInput(AuthMode.Login, AuthFieldName.Email).value).toBe('');
    expect(getById(getErrorId(AuthMode.Login, AuthFieldName.Email)).hidden).toBe(true);

    getById(getTabId(AuthMode.Register)).click();

    expect(getInput(AuthMode.Register, AuthFieldName.Username).value).toBe('');
    expect(getById(getErrorId(AuthMode.Register, AuthFieldName.Username)).hidden).toBe(true);
  });

  it('empties both forms when a form is selected without the animation', (): void => {
    const switcher: AuthSwitcher = renderSwitcher();
    type(getInput(AuthMode.Login, AuthFieldName.Email), 'alex@');

    switcher.select(AuthMode.Login, false);

    expect(getInput(AuthMode.Login, AuthFieldName.Email).value).toBe('');
    expect(isPanelShown(AuthMode.Login)).toBe(true);
  });
});
