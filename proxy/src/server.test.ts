import { describe, expect, it } from "bun:test";
import server from "./server.ts";

describe("proxy /healthz", () => {
  it("returns 200 ok", async () => {
    const req = new Request("http://localhost/healthz");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});

describe("proxy unknown route", () => {
  it("returns 404 for unregistered paths", async () => {
    const req = new Request("http://localhost/nonexistent");
    const res = await server.fetch(req);
    expect(res.status).toBe(404);
  });
});
