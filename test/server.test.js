"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

let upstream, site, seen;
const get = (port, path, opts = {}) => new Promise((resolve, reject) => {
  const req = http.request({ port, path, method: opts.method || "GET", headers: opts.headers || {} }, (r) => {
    let body = ""; r.on("data", (c) => (body += c)); r.on("end", () => resolve({ status: r.statusCode, headers: r.headers, body }));
  });
  req.on("error", reject); if (opts.body) req.write(opts.body); req.end();
});

before(async () => {
  upstream = http.createServer((req, res) => {
    seen = { url: req.url, method: req.method, headers: req.headers };
    if (req.url === "/adminx/go") { res.writeHead(307, { Location: `http://127.0.0.1:${upstream.address().port}/adminx?x=1` }).end(); return; }
    res.setHeader("Set-Cookie", "mc_admin=abc; Path=/; HttpOnly");
    res.end("admin:" + req.url);
  });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  process.env.ADMIN_UPSTREAM = `http://127.0.0.1:${upstream.address().port}`;
  const { server } = require("../server.js");
  site = server; await new Promise((r) => site.listen(0, "127.0.0.1", r));
});
after(() => { site.close(); upstream.close(); });

test("serves the static site", async () => {
  const r = await get(site.address().port, "/");
  assert.equal(r.status, 200); assert.match(r.body, /Latars/i);
  assert.equal((await get(site.address().port, "/styles.css")).status, 200);
});

test("forwards the admin paths, keeping the public host and visitor address", async () => {
  const r = await get(site.address().port, "/adminx?tab=1", { headers: { host: "latars.xyz", "x-forwarded-proto": "https", "x-forwarded-for": "203.0.113.9" } });
  assert.equal(r.body, "admin:/adminx?tab=1");
  assert.equal(seen.headers["x-forwarded-host"], "latars.xyz");
  assert.equal(seen.headers["x-forwarded-for"], "203.0.113.9");
  assert.equal(seen.headers.host, new URL(process.env.ADMIN_UPSTREAM).host);
  assert.match(r.headers["set-cookie"][0], /mc_admin=abc/);
  assert.equal(r.headers["x-robots-tag"], "noindex, nofollow");
  for (const p of ["/admin/stats", "/_next/static/x.js", "/api/health"]) assert.match((await get(site.address().port, p)).body, /^admin:/);
});

test("passes POSTs through (admin forms)", async () => {
  const r = await get(site.address().port, "/adminx", { method: "POST", body: "a=1", headers: { "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(r.status, 200); assert.equal(seen.method, "POST");
});

test("rewrites redirects back to the public address", async () => {
  const r = await get(site.address().port, "/adminx/go", { headers: { host: "latars.xyz", "x-forwarded-proto": "https" } });
  assert.equal(r.status, 307); assert.equal(r.headers.location, "https://latars.xyz/adminx?x=1");
});

test("does not forward other paths, and never serves outside the site or its own files", async () => {
  seen = null;
  assert.equal((await get(site.address().port, "/nope")).status, 404);
  assert.equal((await get(site.address().port, "/adminxyz")).status, 404);
  assert.equal(seen, null);
  for (const p of ["/server.js", "/package.json", "/README.md", "/../etc/passwd", "/%2e%2e/etc/passwd", "/.git/config"]) assert.equal((await get(site.address().port, p)).status, 404, p);
  assert.equal((await get(site.address().port, "/", { method: "POST" })).status, 405);
});
