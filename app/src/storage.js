const THEME_KEY = "mcq_theme";
const DEVICE_KEY = "mcq_device_id";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function initTheme() {
  const saved = getTheme();
  document.documentElement.dataset.theme = saved;
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function lastQuestionKey(pathKey) {
  return `mcq_last_q:${pathKey}`;
}

export function saveLastQuestionIndex(pathKey, index) {
  localStorage.setItem(lastQuestionKey(pathKey), String(index));
}

export function loadLastQuestionIndex(pathKey) {
  const v = localStorage.getItem(lastQuestionKey(pathKey));
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
