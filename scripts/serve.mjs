import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.argv[2] ?? "storybook-static");
const port = Number(process.argv[3] ?? 6006);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
};
http
  .createServer(async (req, res) => {
    try {
      let file = path.resolve(
        root,
        `.${decodeURIComponent(new URL(req.url, "http://localhost").pathname)}`,
      );
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      res.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
