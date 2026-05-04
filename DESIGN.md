# Design System — Agent Data Gateway

> このファイルは Agent Data Gateway のすべての視覚・UI 決定の単一ソース。
> コード／テンプレート／ドキュメントを書く前に必ず読むこと。
> 逸脱するときはユーザー承認を得てから DESIGN.md を更新すること。

## Product Context

- **What this is**: AI エージェントの API 呼び出しを中継し、WHO（誰が）／ WHAT（何を）／ WHY（なぜ）を記録する HTTP プロキシと、その記録を閲覧・監査するダッシュボード
- **Who it's for**: 日本の中堅〜大手企業の **コンプライアンス担当者・CISO・VPoE**。Outlook／Excel／SharePoint の世界に住む人。**開発者ではない**
- **Project type**: 監査ダッシュボード（Hono + 静的 HTML）+ 開発者向けランディングページ（OSS リリース時）
- **Memorable theme**: **「説明責任を果たす真面目さ」** — 法的証跡として通用する重みを視覚で達成する
- **Reference points**: The Economist の本文タイポグラフィ、日本政府監査報告 PDF、Bloomberg Terminal の情報密度（ただしより明るく）
- **Approved mockup**: `~/.gstack/projects/covelline-agent-data-gateway/designs/design-system-20260504/variant-C.png`

## Aesthetic Direction

- **Direction**: **Compliance Editorial** — 監査報告書 + エディトリアル雑誌のハイブリッド
- **Decoration level**: **Intentional** — タイポグラフィと細罫線が主役。装飾は控えめ。「書き起こされた監査記録」の質感
- **Mood**: 重い、信頼に足る、印刷可能、「これは証跡である」と無言で主張する
- **Default mode**: **Light（紙の温かみ）**。Dark mode は提供するが default ではない（観測ツールが軒並み Dark default なのに対する意図的な逸脱 — コンプライアンス担当者は Outlook / Excel / SharePoint = Light の世界に住む）

## Typography

日本語ファースト設計。すべての英数字フォントには必ず日本語フォントをペアリングする。

| Role | English | Japanese | Size | Weight |
|------|---------|----------|------|--------|
| **Display / Hero（H1）** | Instrument Serif | Noto Serif JP | 32 px (2rem) | 700 |
| **Section（H2）** | Instrument Serif | Noto Serif JP | 24 px (1.5rem) | 400 |
| **Body** | Source Sans 3 | Noto Sans JP | 16 px (1rem) | 400 |
| **UI Labels** | Source Sans 3 | Noto Sans JP | 13–14 px | 500 |
| **Data Tables** | Geist (`font-feature-settings: "tnum"`) | Noto Sans JP | 14 px | 400 |
| **WHY Field（Evidence）** | Berkeley Mono | Noto Sans Mono CJK JP | 13 px | 400 |
| **Code（LP / docs）** | Berkeley Mono | Noto Sans Mono CJK JP | 13 px | 400 |

- **Loading**: Google Fonts または Bunny Fonts（Berkeley Mono は商用ライセンスのためセルフホスト、無理なら JetBrains Mono にフォールバック）
- **Avoid（black-list）**: Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, system-ui を primary フォントとして使わない
- **Line-height**: 本文 1.7（日本語混在を考慮）、見出し 1.25
- **Mixed JP/EN**: `font-family: "Source Sans 3", "Noto Sans JP", sans-serif;` のように英→和の順で fallback。日本語の括弧・読点の余白を `font-feature-settings: "palt"` で詰める

## Color

**Restrained** — オフホワイト基調 + 1 アクセント（institutional navy）。下記トークンは承認モックアップ（variant-C）から抽出。

### Light mode（default）

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-paper` | `#FAF8F3` | ページ背景（紙の温かみ） |
| `--bg-menu` | `#F8F4F0` | サイドバー背景（やや黄味） |
| `--surface` | `#FFFFFF` | カード／表のセル |
| `--why-tint` | `#F5F2EA` | WHY フィールドの微タント（証拠の隔離） |
| `--border` | `#E5E2DA` | 細罫線（ヘアライン） |
| `--text-primary` | `#333333` | 本文・見出し |
| `--text-muted` | `#5A5A5A` | サブテキスト |
| `--accent-navy` | `#1F3A5F` | リンク・主要アクション・ロゴ（控えめに使う） |
| `--status-success` | `#1D8777` | 「記録あり」ステータス |
| `--status-warning` | `#F0AD4E` | 「WHY 不足」ステータス（文字数 < 20） |
| `--status-error` | `#D9534F` | 「欠落」ステータス（WHY が null） |

### Dark mode

提供はするが default ではない。`prefers-color-scheme: dark` または明示トグルで切替。
彩度を 10〜20% 下げ、サーフェスは `#1A1F26` 前後、紙のメタファは捨てない（純黒は使わない）。詳細は実装時に別表で定義。

### 禁止

- 紫／菫色のグラデーション（AI slop の最たる物）
- 派手な複数色アクセント
- カラーフルなチャート（緑／琥珀／赤の三色＋ navy 以外は使わない）

## Spacing

**Comfortable, not compact**。コンプライアンス担当者は密度より呼吸を好む。

- **Base unit**: 4 px
- **Scale**: `2xs(2) xs(4) sm(8) md(16) lg(24) xl(40) 2xl(64) 3xl(96)`
- **見出し top margin**: 16 px
- **リストアイテム間**: 12 px
- **メインコンテンツ padding**: 24 px
- **Section padding**: 24–40 px
- **Table cell padding**: 12 px 縦 × 16 px 横
- **Card padding**: 24 px

## Layout

- **Approach**: ダッシュボードは **Grid-disciplined**、LP は **Editorial single-column**
- **Dashboard grid**:
  - 左サイドバー: 240 px 固定（`--bg-menu`）
  - メインキャンバス: 残り、最大幅 1440 px、左寄せ
  - トップバー（フィルタ）: 高さ 56 px、罫線で区切り
- **LP**:
  - 中央読み物カラム: 最大 720 px
  - フルブリードのマーケティング breakout を要所に配置
- **Border radius scale**:
  - `0` — 表（監査記録のシャープさ＝印刷可能性の暗示）
  - `4 px` — フィルタ／ボタン／バッジ
  - `8 px` — KPI カード
  - `9999 px` — アバター・ステータスドットのみ
- **Hairlines**: 全ボーダーは 1 px、`--border` カラー。影は最小限（`0 1px 0 var(--border)` で十分）

## Motion

**Minimal-functional**。「安定」を感じさせる。

- **Duration**: micro 100ms / short 150ms / medium 250ms（これ以上長いものは使わない）
- **Easing**: enter `ease-out`、exit `ease-in`、move `ease-in-out`
- **Allowed**: opacity fade、background-color transition、accordion expand
- **Forbidden**: spring、slide-in-from-left、parallax、scroll-driven、bounce

## Interaction Patterns（dashboard 固有）

### 1. WHY クリック展開（必須）

表の WHY 列はデフォルトで 1 行に切り詰める（`text-overflow: ellipsis`）。
**クリックすると行全体がインラインで展開し、以下のメタデータを表示する**:

- WHY 全文（monospace、改行保持）
- WHY 抽出ソース（`tool_use_text` / `system_prompt_fallback` / `null`）
- 直前の `text` ブロック全文（context として）
- リクエスト ID／タイムスタンプ／ユーザー ID（あれば）／API キーハッシュ無し
- レスポンス全文へのリンク（生 JSON ダウンロード）
- 「クリップボードにコピー」ボタン

理由: コンプライアンス担当者は短い WHY だけでは判断できない。**ワンクリックで全文と context にアクセスできる**ことが「証跡として通用する」要件（ユーザーフィードバック由来）。

実装: 各行に詳細パネルを `<details>` または React state で持つ。閉じている時は KB バイト消費なし。展開時 ARIA `aria-expanded`、キーボード操作対応必須。

### 2. WHY 不足行のフラグ表示

- 行の左に 3 px の縦帯（`border-left: 3px solid var(--status-warning)` または `--status-error`）
- ステータス列に色付きバッジ（「WHY 不足」 / 「欠落」）
- 全テーブルで一貫

### 3. ステータスバッジ

すべてピル形（`border-radius: 4px`、padding `2px 8px`、サイズ `12px / 1.4`）：

| Label | BG | Text |
|-------|----|------|
| 記録あり | `#E5F0EE` | `#1D8777` |
| WHY 不足 | `#FBE8C8` | `#A57A1A` |
| 欠落 | `#F5D8D8` | `#A53737` |

### 4. KPI カード

3 枚横並び、白背景、`border: 1px solid var(--border)`、`border-radius: 8px`。
- 上段: ラベル（`--text-muted`、12 px、Source Sans 3）
- 下段: 数値（`Geist tnum`、`32px / 1.0`、weight 600）+ 単位（小さく）

例: 「本日の呼び出し」 / `2,847` / 「件」

## Tone of Voice（マイクロコピー）

- **Formal Japanese**（ですます調）。「監査ログ」「記録あり」「WHY 不足」「欠落」など漢字熟語を優先
- **発見した不正を煽らない**: 「警告！」「危険！」のような強い表現は避け、「フラグあり 12件」のように事実だけ
- **英語まじり禁止**: WHO/WHAT/WHY は固有名詞として残してよいが、UI ラベルは「ユーザー」「アクション」「理由」のような日本語訳を併用
- **法的にニュートラル**: 「違反」「不正」のような断定を避け、「要確認」「文字数不足」のような中立表現

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-04 | デザインシステム初版を作成 | `/design-consultation` 実行。Variant C を採用、Phase 3 の SAFE/RISK 提案を統合 |
| 2026-05-04 | Light mode を default に | 全観測ツールが Dark default の中、コンプライアンス担当者の作業環境（Outlook/Excel/SharePoint）と一致させ「dev toy」誤認を回避（Eureka） |
| 2026-05-04 | 見出しに Serif（Instrument Serif + Noto Serif JP）採用 | 法的文書のグラビタスを獲得し、「これは証跡である」を視覚的に主張 |
| 2026-05-04 | WHY フィールドを Monospace + 微タント背景で隔離 | reasoning を「inspectable な evidence」として扱い、本文と差別化 |
| 2026-05-04 | 日本語ファースト・タイポグラフィ | JP 企業内デモで合字／行高崩れを起こさない |
| 2026-05-04 | WHY クリック展開（必須要件追加） | Variant C レビュー時のフィードバック。1 行表示では判断不能な場面があるため、全文と context へのワンクリックアクセスを保証 |
| 2026-05-04 | アクセント色を Navy 1 色（`#1F3A5F`）に限定 | 派手さを排除して信頼性を最大化。緑／琥珀／赤はステータス専用 |
| 2026-05-04 | 表は border-radius 0（シャープ） | 印刷可能性と「監査報告書」のメタファを強化 |

## References

- Approved mockup: `~/.gstack/projects/covelline-agent-data-gateway/designs/design-system-20260504/variant-C.png`
- Extracted tokens: `~/.gstack/projects/covelline-agent-data-gateway/designs/design-system-20260504/extracted-tokens.json`
- Comparison board: `~/.gstack/projects/covelline-agent-data-gateway/designs/design-system-20260504/design-board.html`
- Approved feedback: `~/.gstack/projects/covelline-agent-data-gateway/designs/design-system-20260504/approved.json`
