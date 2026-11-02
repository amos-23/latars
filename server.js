// Serves the Latars site and forwards the admin to the events app, so latars.xyz/adminx works
// without sending people to another address. No dependencies.
//
//   PORT            port to listen on (Railway sets it)
//   ADMIN_UPSTREAM  where the admin runs (default https://events.latars.xyz)
"use strict";
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const UPSTREAM = new URL(process.env.ADMIN_UPSTREAM || "https://events.latars.xyz");

// Only these paths go to the events app. Everything else is a static file of this site.
const PROXIED = ["/adminx", "/admin", "/_next", "/api", "/photo", "/moment-photo", "/brands", "/og", "/signin", "/signup", "/auth", "/account"];
const isProxied = (p) => PROXIED.some((prefix) => p === prefix || p.startsWith(prefix + "/"));

// The only top-level entries that are public.
const PUBLIC = new Set(["index.html", "styles.css", "script.js", "assets"]);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2",
};

const HOP = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"]);

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { res.writeHead(400).end("Bad request"); return; }
  if (rel.includes("\0")) { res.writeHead(400).end("Bad request"); return; }
  let file = path.normalize(path.join(ROOT, rel));
  // Serve only what the site is made of: its top-level files and the assets folder. Nothing else in
  // the repository (.git, tests, this server, package files) is ever reachable, whatever the path looks like.
  const top = path.relative(ROOT, file).split(path.sep)[0];
  const inside = file === ROOT || file.startsWith(ROOT + path.sep);
  if (!inside || !(top === "" || PUBLIC.has(top))) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found"); return; }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, "index.html");
    fs.stat(file, (err2, st2) => {
      if (err2 || !st2.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found"); return; }
      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Content-Length": st2.size, "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600" });
      if (req.method === "HEAD") res.end(); else fs.createReadStream(file).pipe(res);
    });
  });
}

// Point redirects and cookies that name the upstream back at the public address.
function rewriteLocation(value, publicOrigin) {
  try {
    const url = new URL(value, UPSTREAM);
    return url.origin === UPSTREAM.origin ? publicOrigin + url.pathname + url.search + url.hash : value;
  } catch { return value; }
}

function proxy(req, res) {
  const host = req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || "http";
  const publicOrigin = `${proto}://${host}`;
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v;
  headers.host = UPSTREAM.host;
  headers["x-forwarded-host"] = host;
  headers["x-forwarded-proto"] = proto;
  // Keep the visitor's address first, so the app's per-network rate limits still see the visitor, not this server.
  headers["x-forwarded-for"] = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const lib = UPSTREAM.protocol === "https:" ? https : http;
  const up = lib.request({ protocol: UPSTREAM.protocol, hostname: UPSTREAM.hostname, port: UPSTREAM.port || undefined, method: req.method, path: req.url, headers, timeout: 30000 }, (r) => {
    const out = {};
    for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k)) out[k] = v;
    if (out.location) out.location = rewriteLocation(String(out.location), publicOrigin);
    // The admin is for people signed in; keep it out of search results and shared caches.
    const pathname = req.url.split("?")[0];
    if (pathname === "/adminx" || pathname.startsWith("/adminx/") || pathname === "/admin" || pathname.startsWith("/admin/")) out["x-robots-tag"] = "noindex, nofollow";
    res.writeHead(r.statusCode || 502, r.statusMessage, out);
    r.pipe(res);
  });
  up.on("timeout", () => up.destroy(new Error("timeout")));
  up.on("error", () => { if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" }); res.end("The admin is unavailable right now."); });
  req.pipe(up);
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || "/").split("?")[0];
  if (isProxied(pathname)) return proxy(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed"); return; }
  serveStatic(req, res, pathname);
});

module.exports = { server, isProxied };
if (require.main === module) {
  const port = Number(process.env.PORT) || 8000;
  server.listen(port, () => console.log(`Latars on :${port}, admin from ${UPSTREAM.origin}`));
}
