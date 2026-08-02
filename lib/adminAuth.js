const SESSION_KEY = "gongdeok-lunch:is-admin";

function isBrowser() {
  return typeof window !== "undefined";
}

export function isAdminUnlocked() {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "true";
}

export function tryUnlockAdmin(inputPassword) {
  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!correctPassword) return false;

  if (inputPassword === correctPassword) {
    window.sessionStorage.setItem(SESSION_KEY, "true");
    return true;
  }
  return false;
}

export function lockAdmin() {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
