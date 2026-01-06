export async function onRequest({ request, params }) {
  const incomingUrl = new URL(request.url);

  const parts = Array.isArray(params.path) ? params.path : [];
  const restPath = parts.join("/");

  const targetUrl = new URL(
    `https://mcq-platform-api.muslmalaa998.workers.dev/api/${restPath}`
  );

  targetUrl.search = incomingUrl.search;

  const proxyReq = new Request(targetUrl.toString(), request);

  return fetch(proxyReq);
}
