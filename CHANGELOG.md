# Changelog

All notable changes to agent-data-gateway are documented in this file.

Format: [Semantic Versioning](https://semver.org/). Dates are in YYYY-MM-DD.

## [0.1.0.0] - 2026-05-07

### Added

- モノレポ構造（Bun workspaces）: `packages/shared/`, `proxy/`, `dashboard/`, `mock-api/` の4ワークスペースを初期化
- SQLite 監査ログスキーマ: `audit_log` テーブルに WHO/WHAT/WHY/extraction_source/flag_reason/streaming 列を実装
- `packages/shared/src/db.ts`: `openDb`, `insertLog`, `getLog`, `listLogs`, `clearRawResponseOlderThan` を実装（WAL モード・インデックス付き）
- 型定義: `AuditLogRow`, `WhyExtractionSource`, `FlagReason`, Anthropic API リクエスト/レスポンス型
- Docker Compose: proxy (8080), dashboard (3000), mock-api (8081) の 1 コマンド起動環境
- Dockerfile: マルチステージビルド（`bun:1.3-slim`）、非 root ユーザー実行（`USER bun`）
- デザインシステム (`DESIGN.md`): Compliance Editorial 方向性、日本語ファーストタイポグラフィ、カラートークン、インタラクションパターン
- テストスイート: 32 テスト（db.ts の全 CRUD パス、エラーパス、WAL 並行読み取り、各サービスの healthcheck）
- BLOB TTL: `clearRawResponseOlderThan()` で `raw_response` の定期クリアをサポート

### Changed

- `CLAUDE.md` にデザインシステム参照、GBrain 設定、スキルルーティング規則を追加
- `docs/ceo-plan.md` に Eng Review 追加事項（スキーマ拡張・テスト要件・パフォーマンス設計）を統合
