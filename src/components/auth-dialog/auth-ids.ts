import type { AuthMode } from '../../types/auth.ts';

// Ids tie a tab to its form and a label to its input
export function getTabId(mode: AuthMode): string {
  return `auth-tab-${mode}`;
}

export function getPanelId(mode: AuthMode): string {
  return `auth-panel-${mode}`;
}

export function getFieldId(mode: AuthMode, fieldName: string): string {
  return `auth-${mode}-${fieldName}`;
}
