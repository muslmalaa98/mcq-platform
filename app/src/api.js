export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err = new Error(body?.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function verifyCode(code, deviceId) {
  return apiFetch("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ code, deviceId })
  });
}

export function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export function getStructure() {
  return apiFetch("/api/structure");
}

export function getQuestions(params) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/questions?${q}`);
}
