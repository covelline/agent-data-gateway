import { describe, expect, it } from "bun:test";
import server from "./server.ts";

describe("dashboard /healthz", () => {
  it("returns 200 ok", async () => {
    const req = new Request("http://localhost/healthz");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});

describe("dashboard /", () => {
  it("returns HTML with page title", async () => {
    const req = new Request("http://localhost/");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Agent Data Gateway");
    expect(body).toContain("監査ログ");
  });
});

describe("dashboard unknown route", () => {
  it("returns 404 for unregistered paths", async () => {
    const req = new Request("http://localhost/nonexistent");
    const res = await server.fetch(req);
    expect(res.status).toBe(404);
  });
});
