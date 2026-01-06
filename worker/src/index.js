import { json, noStore, withCors } from "./utils/response.js";
import { sha256Hex } from "./utils/crypto.js";
import { rateLimitOrThrow } from "./utils/rateLimit.js";
import {
  requireSession,
  createSession,
  deleteSession,
  sessionCookie,
  clearSessionCookie,
  getSessionToken
} from "./utils/sessions.js";
import { structure, getQuestionsByPathKey } from "./data/questionsIndex.js";

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")
    || "0.0.0.0";
}

function isSecureRequest(request) {
  try {
    const url = new URL(request.url);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

async function verifyCodeHandler(request, env) {
  const headers = withCors(request, noStore());

  const ip = getClientIp(request);
  const limitPerMinute = Number(env.RATE_LIMIT_PER_MINUTE) || 6;

  const rlResp = await rateLimitOrThrow(request, env, { key: `verify:${ip}`, limitPerMinute });
  if (rlResp) return rlResp;

  const body = await request.json().catch(() => null);
  const code = body?.code?.trim();
  const deviceId = body?.deviceId?.trim();

  if (!code || code.length < 4) return json({ message: "Invalid code." }, { status: 400, headers });
  if (!deviceId || deviceId.length < 8) return json({ message: "Invalid device." }, { status: 400, headers });

  const pepper = env.AUTH_PEPPER;
  if (!pepper) return json({ message: "Server misconfigured (AUTH_PEPPER missing)." }, { status: 500, headers });

  const codeHash = await sha256Hex(`${code}:${pepper}`);
  const exists = await env.CODES.get(`codehash:${codeHash}`);
  if (!exists) return json({ message: "Wrong code." }, { status: 401, headers });

  const deviceBindingEnabled = String(env.DEVICE_BINDING_ENABLED).toLowerCase() === "true";
  if (deviceBindingEnabled) {
    const bindKey = `bind:${codeHash}`;
    const bound = await env.CODES.get(bindKey);
    if (bound && bound !== deviceId) {
      return json({ message: "This code is already bound to another device." }, { status: 403, headers });
    }
    if (!bound) {
      await env.CODES.put(bindKey, deviceId);
    }
  }

  const ttlDays = Number(env.SESSION_TTL_DAYS) || 30;
  const payload = {
    codeHash,
    deviceId,
    createdAt: Date.now()
  };

  const { token, ttlSeconds } = await createSession(request, env, payload, ttlDays);

  const secure = isSecureRequest(request);
  headers.append("Set-Cookie", sessionCookie(token, ttlSeconds, secure));

  return json({ ok: true }, { status: 200, headers });
}

async function logoutHandler(request, env) {
  const headers = withCors(request, noStore());
  const token = getSessionToken(request);
  await deleteSession(env, token);

  const secure = isSecureRequest(request);
  headers.append("Set-Cookie", clearSessionCookie(secure));

  return json({ ok: true }, { status: 200, headers });
}

async function structureHandler(request, env) {
  const headers = withCors(request, noStore());
  const sess = await requireSession(request, env);
  if (!sess) return json({ message: "Unauthorized" }, { status: 401, headers });
  return json(structure, { status: 200, headers });
}

async function questionsHandler(request, env) {
  const headers = withCors(request, noStore());
  const sess = await requireSession(request, env);
  if (!sess) return json({ message: "Unauthorized" }, { status: 401, headers });

  const url = new URL(request.url);
  const college = url.searchParams.get("college");
  const stage = url.searchParams.get("stage");
  const term = url.searchParams.get("term");
  const course = url.searchParams.get("course");
  const subject = url.searchParams.get("subject");

  if (!college || !stage || !term || !course || !subject) {
    return json({ message: "Missing parameters." }, { status: 400, headers });
  }

  const key = `${college}/${stage}/${term}/${course}/${subject}`;
  const data = getQuestionsByPathKey(key);
  if (!data) return json({ message: "Not found." }, { status: 404, headers });

  return json(data, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const headers = withCors(request, noStore());
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/auth/verify-code" && request.method === "POST") {
      return verifyCodeHandler(request, env);
    }
    if (path === "/api/auth/logout" && request.method === "POST") {
      return logoutHandler(request, env);
    }
    if (path === "/api/structure" && request.method === "GET") {
      return structureHandler(request, env);
    }
    if (path === "/api/questions" && request.method === "GET") {
      return questionsHandler(request, env);
    }

    const headers = withCors(request, noStore());
    return json({ message: "Not found" }, { status: 404, headers });
  }
};
