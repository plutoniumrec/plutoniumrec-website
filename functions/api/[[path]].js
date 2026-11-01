// Optional forwarder for Cloudflare Pages. Only used when useProxy is true in config.js.
// A request to /api/<service>/<path> is sent on to https://<service>.<domain>/<path>,
// so the browser only ever talks to this site and the server does not need to allow it (CORS).
//
// Set these in the Pages project under Settings > Variables if yours differ:
//   RECFLARE_DOMAIN     default: plutoniumrec.net
//   ALLOWED_SERVICES    default: auth,accounts,rooms,photos   (comma separated subdomains)

const PASS_HEADERS = ["content-type", "authorization", "accept"];

export async function onRequest({ request, params, env }) {
  const parts = Array.isArray(params.path) ? params.path : [params.path];
  const service = (parts[0] || "").toLowerCase();
  const allowed = (env.ALLOWED_SERVICES || "auth,accounts,rooms,photos").split(",").map((s) => s.trim().toLowerCase());
  const domain = env.RECFLARE_DOMAIN || "plutoniumrec.net";

  if (!service || !allowed.includes(service)) {
    return new Response(JSON.stringify({ error: "unknown service" }), { status: 404, headers: { "content-type": "application/json" } });
  }
  if (!["GET", "POST", "HEAD"].includes(request.method)) {
    return new Response("method not allowed", { status: 405 });
  }

  const incoming = new URL(request.url);
  const rest = parts.slice(1).map(encodeURIComponent).join("/");
  const target = `https://${service}.${domain}/${rest}${incoming.search}`;

  const headers = new Headers();
  for (const name of PASS_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const out = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  out.set("cache-control", "no-store");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
