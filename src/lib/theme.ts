export type Theme = 'light' | 'dark';
export const THEME_KEY = 'dba-theme';

export function readTheme(storage: Pick<Storage, 'getItem'> | undefined): Theme | null {
  try {
    const v = storage?.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function writeTheme(storage: Pick<Storage, 'setItem'> | undefined, theme: Theme): void {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked or full: the theme just will not persist
  }
}
