# Agent Data Gateway

AI エージェントの API 呼び出しを中継し、**WHO（誰が）/ WHAT（何を）/ WHY（なぜ）** を SQLite に記録する HTTP プロキシと監査ダッシュボード。コンプライアンス担当者向けの証跡管理ツール。

## クイックスタート

```bash
docker compose up
```

| サービス | URL | 説明 |
|---------|-----|------|
| proxy | http://localhost:8080 | Anthropic API 中継プロキシ |
| dashboard | http://localhost:3000 | 監査ログ閲覧ダッシュボード |
| mock-api | http://localhost:8081 | テスト用モック API |

## アーキテクチャ

```
AI Agent → proxy:8080 → Anthropic API
                ↓
          audit_log (SQLite)
                ↓
        dashboard:3000
```

- **proxy**: Hono ベースの HTTP プロキシ。リクエスト/レスポンスを SQLite に記録し、WHY を抽出
- **dashboard**: 監査ログを閲覧・フィルタリングできる読み取り専用 UI
- **mock-api**: 統合テスト用のモック Anthropic API
- **packages/shared**: SQLite スキーマ・CRUD・共有型定義

## 開発

```bash
bun install
bun test          # 全テスト実行
bun run proxy/src/server.ts    # プロキシ単体起動
```

## 要件

- [Bun](https://bun.sh/) 1.3 以上
- Docker Compose（本番起動時）
