import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));

const port = Number(process.env.MOCK_API_PORT ?? 8081);
console.log(`[mock-api] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
