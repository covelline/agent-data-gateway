import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));

const port = Number(process.env.PROXY_PORT ?? 8080);
console.log(`[proxy] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
