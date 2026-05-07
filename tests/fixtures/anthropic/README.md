# Anthropic API fixtures

`proxy/extract-why` と `proxy/sse-buffer` の単体テスト用に、Anthropic Messages API のレスポンスをハードコーディングしたフィクスチャ。

## 命名規則

```
non-streaming/<scenario>.json   ... POST /v1/messages (stream:false) のレスポンス全体
sse/<scenario>.txt              ... stream:true の SSE イベント列をそのまま保存
```

`<scenario>` は WHY 抽出の分岐ケースに対応する:

| Scenario | 期待される抽出結果 |
|---|---|
| `text-then-tool` | text ブロック直後に tool_use → `extraction_source=text`, WHY あり |
| `thinking-then-tool` | thinking ブロック直後に tool_use → `extraction_source=thinking`, WHY あり |
| `text-only` | tool_use なし → 記録対象外（呼び出し元でスキップ）|
| `no-preceding-text` | tool_use の直前に text/thinking なし → `flag_reason=no_preceding_text` |
| `short-why` | text あるが unicode 20 字未満 → `flag_reason=why_too_short` |
| `multiple-tool-uses` | text → tool_use → tool_use → ... → 最初の tool_use のみ WHY |

## 実 API からの再キャプチャ手順

仕様変更で `message_stop` フレーミングなどが変わった場合、以下で実 API から取り直せる:

```fish
set -x ANTHROPIC_API_KEY (cat /path/to/key)

# non-streaming
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5","max_tokens":1024,"tools":[...],"messages":[...]}' \
  > tests/fixtures/anthropic/non-streaming/<scenario>.json

# streaming (SSE)
curl --no-buffer https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5","max_tokens":1024,"stream":true,"tools":[...],"messages":[...]}' \
  > tests/fixtures/anthropic/sse/<scenario>.txt
```

実 API キャプチャに切り替えたフィクスチャはコミットメッセージで `captured: claude-haiku-4-5 @ 2026-XX-XX` を必ず明記し、再現性を担保すること。

## ハードコーディング版の根拠

現状フィクスチャは [Anthropic Messages API リファレンス](https://docs.anthropic.com/en/api/messages) に記載された JSON / SSE フォーマットを忠実に再現したもの。実 API の挙動（特に `thinking` ブロックの厳密な構造）と異なる可能性があるため、proxy 実装が安定したら実 API キャプチャに置き換えること。
