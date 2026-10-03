// Used only by the GitHub Pages workflow: renders the app shell into static HTML files.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const base = process.env.GITHUB_PAGES_BASE || "/";
const out = resolve("dist/client");
const mod = await import(pathToFileURL(resolve("dist/server/index.mjs")).href);
const handler = mod.default;

const res = await handler.fetch(
  new Request(`http://localhost${base}`),
  {},
  { waitUntil() {}, passThroughOnException() {} },
);
if (!res.ok) throw new Error(`Render failed: ${res.status}`);
const html = await res.text();

writeFileSync(`${out}/index.html`, html);
// GitHub Pages serves 404.html for unknown paths, so deep links like /menu still open the app.
writeFileSync(`${out}/404.html`, html);
writeFileSync(`${out}/.nojekyll`, "");
console.log("Wrote index.html and 404.html");
