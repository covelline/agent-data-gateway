import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/", (c) => c.html("<h1>Agent Data Gateway / 監査ログ</h1>"));

const port = Number(process.env.DASHBOARD_PORT ?? 3000);
console.log(`[dashboard] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
