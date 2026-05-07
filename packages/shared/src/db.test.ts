import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import {
  clearRawResponseOlderThan,
  getLog,
  insertLog,
  listLogs,
  openDb,
  type NewAuditLog,
} from "./db.ts";

let tmpDir: string;
let dbPath: string;
let db: Database;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "adg-db-"));
  dbPath = join(tmpDir, "audit.db");
  db = openDb(dbPath);
});

afterEach(() => {
  db.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

const sample: NewAuditLog = {
  timestamp: "2026-05-04T10:00:00.000Z",
  who: "project-mgmt-agent",
  what: "create_issue",
  why: "バグの影響範囲を特定するために",
  text_context:
    "バグの影響範囲を特定するために、関連 issue を調査して新しいチケットを作成します。",
  raw_response: new TextEncoder().encode('{"id":"msg_01","content":[]}'),
  extraction_source: "text",
  flag_reason: null,
  streaming: 0,
};

describe("openDb", () => {
  it("enables WAL journal mode", () => {
    const row = db
      .query<{ journal_mode: string }, []>("PRAGMA journal_mode")
      .get();
    expect(row?.journal_mode).toBe("wal");
  });

  it("creates the audit_log table with expected indexes", () => {
    const tables = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
      )
      .all();
    expect(tables.map((t) => t.name)).toContain("audit_log");

    const indexes = db
      .query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'audit_log' AND name NOT LIKE 'sqlite_%'",
      )
      .all()
      .map((r) => r.name)
      .sort();
    expect(indexes).toEqual([
      "idx_audit_flag",
      "idx_audit_timestamp",
      "idx_audit_who",
    ]);
  });

  it("is idempotent: re-opening preserves existing data", () => {
    insertLog(db, sample);
    db.close();
    const reopened = openDb(dbPath);
    try {
      const rows = listLogs(reopened);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.who).toBe("project-mgmt-agent");
    } finally {
      reopened.close();
    }
  });

  it("rejects streaming values other than 0 or 1", () => {
    expect(() =>
      db.run(
        `INSERT INTO audit_log
           (timestamp, who, what, why, text_context, raw_response,
            extraction_source, flag_reason, streaming)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.timestamp,
          sample.who,
          sample.what,
          sample.why,
          sample.text_context,
          sample.raw_response,
          sample.extraction_source,
          sample.flag_reason,
          2,
        ],
      ),
    ).toThrow();
  });

  it("rejects invalid extraction_source values via DB CHECK constraint", () => {
    expect(() =>
      db.run(
        `INSERT INTO audit_log
           (timestamp, who, what, why, text_context, raw_response,
            extraction_source, flag_reason, streaming)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.timestamp, sample.who, sample.what, sample.why,
          sample.text_context, sample.raw_response,
          "invalid_source", sample.flag_reason, 0,
        ],
      ),
    ).toThrow();
  });

  it("throws when opened with a non-existent directory path", () => {
    expect(() =>
      openDb("/nonexistent/dir/that/cannot/exist/audit.db"),
    ).toThrow();
  });
});

describe("insertLog error paths", () => {
  it("throws when writing to a readonly database", () => {
    const id = insertLog(db, sample);
    expect(id).toBeGreaterThan(0);
    db.close();

    const reader = openDb(dbPath, { readonly: true });
    try {
      expect(() => insertLog(reader, sample)).toThrow();
    } finally {
      reader.close();
      db = openDb(dbPath);
    }
  });

  it("throws when streaming is not 0 or 1 at runtime", () => {
    expect(() =>
      insertLog(db, { ...sample, streaming: 2 as unknown as 0 | 1 }),
    ).toThrow();
  });
});

describe("insertLog + getLog", () => {
  it("roundtrips all columns including BLOB and unicode WHY", () => {
    const id = insertLog(db, sample);
    expect(id).toBeGreaterThan(0);

    const row = getLog(db, id);
    expect(row).not.toBeNull();
    expect(row?.who).toBe("project-mgmt-agent");
    expect(row?.why).toBe("バグの影響範囲を特定するために");
    expect(row?.extraction_source).toBe("text");
    expect(row?.streaming).toBe(0);
    expect(row?.flag_reason).toBeNull();

    expect(row?.raw_response).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(row?.raw_response!)).toBe(
      '{"id":"msg_01","content":[]}',
    );
  });

  it("returns null for unknown id", () => {
    expect(getLog(db, 999)).toBeNull();
  });

  it("accepts NULL for nullable columns and records flag_reason", () => {
    const id = insertLog(db, {
      ...sample,
      why: null,
      text_context: null,
      raw_response: null,
      extraction_source: "none",
      flag_reason: "no_preceding_text",
    });
    const row = getLog(db, id);
    expect(row?.why).toBeNull();
    expect(row?.text_context).toBeNull();
    expect(row?.raw_response).toBeNull();
    expect(row?.extraction_source).toBe("none");
    expect(row?.flag_reason).toBe("no_preceding_text");
  });
});

describe("listLogs filters", () => {
  beforeEach(() => {
    insertLog(db, {
      ...sample,
      timestamp: "2026-05-01T00:00:00.000Z",
      who: "agent-a",
      flag_reason: null,
    });
    insertLog(db, {
      ...sample,
      timestamp: "2026-05-02T00:00:00.000Z",
      who: "agent-b",
      flag_reason: "why_too_short",
    });
    insertLog(db, {
      ...sample,
      timestamp: "2026-05-03T00:00:00.000Z",
      who: "agent-a",
      flag_reason: "no_preceding_text",
    });
  });

  it("returns rows in newest-first order with no filter", () => {
    const rows = listLogs(db);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.timestamp).toBe("2026-05-03T00:00:00.000Z");
    expect(rows[2]?.timestamp).toBe("2026-05-01T00:00:00.000Z");
  });

  it("filters by agent", () => {
    const rows = listLogs(db, { agent: "agent-a" });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.who === "agent-a")).toBe(true);
  });

  it("filters by date range (since/until inclusive)", () => {
    const rows = listLogs(db, {
      since: "2026-05-02T00:00:00.000Z",
      until: "2026-05-02T23:59:59.999Z",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.who).toBe("agent-b");
  });

  it("status=recorded returns only NULL flag_reason rows", () => {
    const rows = listLogs(db, { status: "recorded" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.flag_reason).toBeNull();
  });

  it("status=short returns only why_too_short rows", () => {
    const rows = listLogs(db, { status: "short" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.flag_reason).toBe("why_too_short");
  });

  it("status=missing returns flagged-but-not-short rows", () => {
    const rows = listLogs(db, { status: "missing" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.flag_reason).toBe("no_preceding_text");
  });

  it("respects limit + offset for pagination", () => {
    const page1 = listLogs(db, { limit: 1, offset: 0 });
    const page2 = listLogs(db, { limit: 1, offset: 1 });
    expect(page1).toHaveLength(1);
    expect(page2).toHaveLength(1);
    expect(page1[0]?.id).not.toBe(page2[0]?.id);
  });
});

describe("WAL allows concurrent reader while writer is open", () => {
  it("reader sees writer's committed inserts", () => {
    insertLog(db, sample);
    const reader = openDb(dbPath, { readonly: true });
    try {
      insertLog(db, { ...sample, who: "agent-b" });
      const rows = listLogs(reader);
      expect(rows.length).toBe(2);
      expect(rows.map((r) => r.who).sort()).toEqual([
        "agent-b",
        "project-mgmt-agent",
      ]);
    } finally {
      reader.close();
    }
  });
});

describe("clearRawResponseOlderThan (M7 prep)", () => {
  it("nulls out raw_response for rows older than cutoff", () => {
    const oldId = insertLog(db, {
      ...sample,
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    const recentId = insertLog(db, {
      ...sample,
      timestamp: "2026-05-01T00:00:00.000Z",
    });

    const changed = clearRawResponseOlderThan(
      db,
      "2026-04-01T00:00:00.000Z",
    );
    expect(changed).toBe(1);

    expect(getLog(db, oldId)?.raw_response).toBeNull();
    expect(getLog(db, recentId)?.raw_response).toBeInstanceOf(Uint8Array);
  });

  it("preserves why and text_context when clearing raw_response", () => {
    const id = insertLog(db, {
      ...sample,
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    clearRawResponseOlderThan(db, "2026-04-01T00:00:00.000Z");
    const row = getLog(db, id);
    expect(row?.raw_response).toBeNull();
    expect(row?.why).toBe(sample.why);
    expect(row?.text_context).toBe(sample.text_context);
  });

  it("returns 0 when no rows are older than cutoff", () => {
    insertLog(db, {
      ...sample,
      timestamp: "2026-05-01T00:00:00.000Z",
    });
    const changed = clearRawResponseOlderThan(
      db,
      "2026-01-01T00:00:00.000Z",
    );
    expect(changed).toBe(0);
  });

  it("skips rows where raw_response is already NULL", () => {
    const id = insertLog(db, {
      ...sample,
      timestamp: "2026-01-01T00:00:00.000Z",
      raw_response: null,
    });
    const changed = clearRawResponseOlderThan(
      db,
      "2026-04-01T00:00:00.000Z",
    );
    expect(changed).toBe(0);
    expect(getLog(db, id)?.raw_response).toBeNull();
  });
});

describe("listLogs edge cases", () => {
  it("returns empty array when table is empty", () => {
    expect(listLogs(db)).toEqual([]);
  });

  it("applies default limit of 100 without overflowing small dataset", () => {
    insertLog(db, sample);
    const rows = listLogs(db);
    expect(rows).toHaveLength(1);
  });
});
