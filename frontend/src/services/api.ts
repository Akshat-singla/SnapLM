/**
 * SnapLM - Mock API service for auth (frontend)
 * Path: SnapLM/frontend/src/services/api.ts
 *
 * This module provides small, deterministic mock implementations of common
 * auth endpoints for development and UI work:
 *  - login(email, password)
 *  - signup({ name, email, password })
 *  - logout()
 *  - getCurrentUser()
 *
 * It persists a tiny in-browser mock user store in localStorage so state
 * survives page reloads during development. Replace these functions with
 * real network calls when integrating with a backend.
 */

export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type SignupResponse = {
  user: User;
};

const STORAGE_USERS_KEY = "mock_api_users_v1";
const STORAGE_AUTH_KEY = "mock_api_auth_v1";

/** Simulated network latency (ms). Customize for testing slower networks. */
const NETWORK_DELAY = 500;

const wait = (ms = NETWORK_DELAY) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Simple helper to load users from localStorage (mock DB). */
function loadUsers(): { [email: string]: { id: string; name: string; password: string } } {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      // seed with a demo user
      const seed = {
        "test@example.com": {
          id: "user_demo_1",
          name: "Demo User",
          password: "password", // NOTE: plain text only because this is a mock
        },
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (err) {
    // In case localStorage is unavailable, keep an in-memory fallback.
    return {
      "test@example.com": {
        id: "user_demo_1",
        name: "Demo User",
        password: "password",
      },
    };
  }
}

function saveUsers(users: { [email: string]: { id: string; name: string; password: string } }) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore for mock
  }
}

/** Persist the current auth session (token + email) */
function saveAuthSession(token: string, email: string) {
  try {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({ token, email }));
  } catch {
    // ignore
  }
}

function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_AUTH_KEY);
  } catch {
    // ignore
  }
}

function readAuthSession(): { token: string; email: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * login
 * - Accepts email & password
 * - Simulates network latency
 * - Resolves with a token + user on success
 * - Rejects with { message } on failure
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  await wait();

  if (!email || !email.includes("@")) {
    return Promise.reject({ message: "Please provide a valid email address." });
  }
  if (!password || password.length < 6) {
    return Promise.reject({ message: "Password must be at least 6 characters long." });
  }

  const users = loadUsers();
  const found = users[email.toLowerCase()];

  if (!found) {
    return Promise.reject({ message: "No account found for that email address." });
  }

  if (found.password !== password) {
    return Promise.reject({ message: "Invalid email or password." });
  }

  const token = `mock-token-${found.id}-${Date.now()}`;
  saveAuthSession(token, email.toLowerCase());

  const user: User = { id: found.id, name: found.name, email: email.toLowerCase() };

  return Promise.resolve({ token, user });
}

/**
 * signup / register
 * - Accepts { name, email, password }
 * - Simulates latency, checks for existing email
 * - Resolves with created user or rejects with { message }
 */
export async function signup(payload: { name: string; email: string; password: string }): Promise<SignupResponse> {
  await wait();

  const { name, email, password } = payload;

  if (!name || !name.trim()) {
    return Promise.reject({ message: "Name is required." });
  }
  if (!email || !email.includes("@")) {
    return Promise.reject({ message: "Please provide a valid email address." });
  }
  if (!password || password.length < 6) {
    return Promise.reject({ message: "Password must be at least 6 characters long." });
  }

  const lowerEmail = email.toLowerCase();
  const users = loadUsers();

  if (users[lowerEmail]) {
    return Promise.reject({ message: "An account with that email already exists." });
  }

  const id = `user_${Math.random().toString(36).slice(2, 9)}`;
  users[lowerEmail] = { id, name: name.trim(), password };

  saveUsers(users);

  // Optionally sign in user immediately:
  const token = `mock-token-${id}-${Date.now()}`;
  saveAuthSession(token, lowerEmail);

  const user: User = { id, name: name.trim(), email: lowerEmail };

  return Promise.resolve({ user });
}

/** logout - clear the mock session */
export async function logout(): Promise<void> {
  await wait(150);
  clearAuthSession();
  return Promise.resolve();
}

/** getCurrentUser - returns the currently "signed in" user, or null */
export function getCurrentUser(): User | null {
  const session = readAuthSession();
  if (!session) return null;
  const users = loadUsers();
  const record = users[session.email];
  if (!record) return null;
  return { id: record.id, name: record.name, email: session.email };
}

/** getToken - returns the mock token or null */
export function getToken(): string | null {
  const s = readAuthSession();
  return s ? s.token : null;
}

/**
 * Convenience: export default object so callers can import either:
 *   import api from '.../services/api';
 *   api.login(...)
 */
export default {
  login,
  signup,
  logout,
  getCurrentUser,
  getToken,
};
