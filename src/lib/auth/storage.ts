export type StoredUser = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active?: string | boolean;
};

const TOKEN_KEY = "skybase_token";
const USER_KEY = "skybase_user";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (!isBrowser()) return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getUser(): StoredUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser | null) {
  if (!isBrowser()) return;
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearAuth() {
  setToken(null);
  setUser(null);
}

