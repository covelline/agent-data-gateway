import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/", (c) => c.html("<h1>Agent Data Gateway / 監査ログ</h1>"));

const port = parseInt(process.env.DASHBOARD_PORT ?? "3000", 10);
if (isNaN(port) || port < 1 || port > 65535) throw new Error(`Invalid DASHBOARD_PORT: ${process.env.DASHBOARD_PORT}`);
console.log(`[dashboard] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
