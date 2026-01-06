export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function noStore(headers = new Headers()) {
  headers.set("Cache-Control", "no-store");
  return headers;
}

export function withCors(request, headers = new Headers()) {
  // في نفس الدومين غالبًا لا تحتاج CORS، لكن هذا يجعل dev أسهل.
  const origin = request.headers.get("Origin");
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  return headers;
}
