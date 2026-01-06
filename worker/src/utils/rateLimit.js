import { json, noStore, withCors } from "./response.js";

export async function rateLimitOrThrow(request, env, { key, limitPerMinute }) {
  const nowMin = Math.floor(Date.now() / 60000);
  const k = `rl:${key}:${nowMin}`;
  const current = Number(await env.LIMITS.get(k)) || 0;

  if (current >= limitPerMinute) {
    const headers = withCors(request, noStore());
    return json({ message: "Too many attempts. Try again in a minute." }, { status: 429, headers });
  }

  await env.LIMITS.put(k, String(current + 1), { expirationTtl: 120 });
  return null;
}
