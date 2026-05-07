import { Hono } from "hono";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));

const port = parseInt(process.env.MOCK_API_PORT ?? "8081", 10);
if (isNaN(port) || port < 1 || port > 65535) throw new Error(`Invalid MOCK_API_PORT: ${process.env.MOCK_API_PORT}`);
console.log(`[mock-api] listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
