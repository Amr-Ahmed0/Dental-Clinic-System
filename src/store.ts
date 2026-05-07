/**
 * Lightweight localStorage store.
 * Only manages theme preference and the current user session.
 * All clinic data now comes from the SQL Server backend via src/api.ts.
 */

import { User } from './types';

const KEYS = {
  currentUser: 'dc_currentUser',
  theme: 'dc_theme',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Current user session
export function getCurrentUser(): User | null {
  return get<User | null>(KEYS.currentUser, null);
}
export function setCurrentUser(u: User | null) {
  set(KEYS.currentUser, u);
}

// Theme
export function getTheme(): 'light' | 'dark' {
  return get(KEYS.theme, 'light') as 'light' | 'dark';
}
export function setTheme(t: 'light' | 'dark') {
  set(KEYS.theme, t);
}
