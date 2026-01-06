export async function onRequest({ request, params }) {
  const incomingUrl = new URL(request.url);

  // params.path will be an array because of [[path]].js
  const parts = Array.isArray(params.path) ? params.path : [];
  const restPath = parts.join("/");

  // forward to your Worker API
  const targetUrl = new URL(
    `https://mcq-platform-api.muslmalaa998.workers.dev/api/${restPath}`
  );

  // keep query string
  targetUrl.search = incomingUrl.search;

  // clone request to new destination (keeps method/body/headers)
  const proxyReq = new Request(targetUrl.toString(), request);

  // optional helpful headers
  proxyReq.headers.set("X-Forwarded-Host", incomingUrl.host);
  proxyReq.headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));

  const resp = await fetch(proxyReq);

  // return response as-is
  return resp;
}
