import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 8788);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

function cleanPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const safe = decoded.replace(/^\/+/, "").replace(/\.\./g, "");
  return safe || "index.html";
}

async function resolveFile(urlPath) {
  const requested = path.join(root, cleanPath(urlPath));
  try {
    const info = await stat(requested);
    if (info.isDirectory()) return path.join(requested, "index.html");
    return requested;
  } catch {
    if (!path.extname(requested)) return path.join(requested, "index.html");
    return requested;
  }
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", `http://localhost:${port}`).pathname;
  let filePath = await resolveFile(pathname);
  let statusCode = 200;

  try {
    const body = await readFile(filePath);
    response.writeHead(statusCode, {
      "Content-Type": types.get(path.extname(filePath)) || "application/octet-stream",
    });
    response.end(body);
  } catch {
    statusCode = 404;
    filePath = path.join(root, "404.html");
    const body = await readFile(filePath);
    response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
    response.end(body);
  }
}).listen(port, () => {
  console.log(`Onimusha fan guide preview: http://localhost:${port}`);
});
