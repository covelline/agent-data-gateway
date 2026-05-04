import { Database, type SQLQueryBindings } from "bun:sqlite";
import type { AuditLogRow } from "./index.ts";

export interface ListLogsFilters {
  agent?: string;
  since?: string;
  until?: string;
  status?: "recorded" | "short" | "missing";
  limit?: number;
  offset?: number;
}

export type NewAuditLog = Omit<AuditLogRow, "id">;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    who TEXT NOT NULL,
    what TEXT NOT NULL,
    why TEXT,
    text_context TEXT,
    raw_response BLOB,
    extraction_source TEXT NOT NULL,
    flag_reason TEXT,
    streaming INTEGER NOT NULL CHECK (streaming IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_who ON audit_log(who);
  CREATE INDEX IF NOT EXISTS idx_audit_flag ON audit_log(flag_reason)
    WHERE flag_reason IS NOT NULL;
`;

export interface OpenDbOptions {
  readonly?: boolean;
}

export function openDb(path: string, opts: OpenDbOptions = {}): Database {
  const db = opts.readonly
    ? new Database(path, { readonly: true })
    : new Database(path, { create: true, readwrite: true });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");
  if (!opts.readonly) {
    db.exec(SCHEMA);
  }
  return db;
}

const SELECT_COLS = `
  id, timestamp, who, what, why, text_context, raw_response,
  extraction_source, flag_reason, streaming
`;

export function insertLog(db: Database, row: NewAuditLog): number {
  const result = db.run(
    `INSERT INTO audit_log
       (timestamp, who, what, why, text_context, raw_response,
        extraction_source, flag_reason, streaming)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.timestamp,
      row.who,
      row.what,
      row.why,
      row.text_context,
      row.raw_response,
      row.extraction_source,
      row.flag_reason,
      row.streaming,
    ],
  );
  return Number(result.lastInsertRowid);
}

export function getLog(db: Database, id: number): AuditLogRow | null {
  const stmt = db.query<AuditLogRow, [number]>(
    `SELECT ${SELECT_COLS} FROM audit_log WHERE id = ?`,
  );
  return stmt.get(id) ?? null;
}

export function listLogs(
  db: Database,
  filters: ListLogsFilters = {},
): AuditLogRow[] {
  const where: string[] = [];
  const params: SQLQueryBindings[] = [];

  if (filters.agent !== undefined) {
    where.push("who = ?");
    params.push(filters.agent);
  }
  if (filters.since !== undefined) {
    where.push("timestamp >= ?");
    params.push(filters.since);
  }
  if (filters.until !== undefined) {
    where.push("timestamp <= ?");
    params.push(filters.until);
  }
  if (filters.status === "recorded") {
    where.push("flag_reason IS NULL");
  } else if (filters.status === "short") {
    where.push("flag_reason = 'why_too_short'");
  } else if (filters.status === "missing") {
    where.push("flag_reason IS NOT NULL AND flag_reason != 'why_too_short'");
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  const stmt = db.query<AuditLogRow, SQLQueryBindings[]>(
    `SELECT ${SELECT_COLS} FROM audit_log
     ${whereClause}
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`,
  );
  return stmt.all(...params, limit, offset);
}

/**
 * 既知の問題: Bun の bun:sqlite は INTEGER NULL を 0 として返すケースがあるため、
 * raw_response の存在チェックは Uint8Array.byteLength で行うこと。
 */
export function clearRawResponseOlderThan(
  db: Database,
  cutoff: string,
): number {
  const result = db.run(
    `UPDATE audit_log
     SET raw_response = NULL
     WHERE raw_response IS NOT NULL
       AND timestamp < ?`,
    [cutoff],
  );
  return Number(result.changes);
}
