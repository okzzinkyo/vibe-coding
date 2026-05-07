#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "docs");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function safeJoin(base, target) {
  const targetPath = path.resolve(base, "." + target);
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = safeJoin(root, requestPath);

  if (!filePath) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(filePath, (statErr, stats) => {
    let finalPath = filePath;
    if (!statErr && stats.isDirectory()) {
      finalPath = path.join(filePath, "index.html");
    }

    fs.readFile(finalPath, (readErr, data) => {
      if (readErr) {
        const fallback = path.join(root, "index.html");
        if (requestPath !== "/index.html" && fs.existsSync(fallback)) {
          fs.readFile(fallback, (fallbackErr, fallbackData) => {
            if (fallbackErr) {
              return send(res, 404, "Not Found");
            }
            send(res, 200, fallbackData, "text/html; charset=utf-8");
          });
          return;
        }
        return send(res, 404, "Not Found");
      }

      const ext = path.extname(finalPath).toLowerCase();
      const type = mimeTypes[ext] || "application/octet-stream";
      send(res, 200, data, type);
    });
  });
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
  console.log(`Serving: ${root}`);
});
