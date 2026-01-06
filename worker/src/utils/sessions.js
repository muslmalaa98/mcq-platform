import { parseCookies, randomToken } from "./crypto.js";

const COOKIE_NAME = "mcq_session";

export function getSessionToken(request) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  return cookies[COOKIE_NAME] || null;
}

export async function requireSession(request, env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const raw = await env.SESSIONS.get(`sess:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function createSession(request, env, payload, ttlDays) {
  const token = randomToken(24);
  const ttl = Math.max(1, Number(ttlDays) || 30) * 86400;

  await env.SESSIONS.put(`sess:${token}`, JSON.stringify(payload), { expirationTtl: ttl });
  return { token, ttlSeconds: ttl };
}

export async function deleteSession(env, token) {
  if (!token) return;
  await env.SESSIONS.delete(`sess:${token}`);
}

export function sessionCookie(token, maxAgeSeconds, secure) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure) {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
