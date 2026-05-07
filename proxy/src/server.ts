import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));

const port = parseInt(process.env.PROXY_PORT ?? "8080", 10);
if (isNaN(port) || port < 1 || port > 65535) throw new Error(`Invalid PROXY_PORT: ${process.env.PROXY_PORT}`);
console.log(`[proxy] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
