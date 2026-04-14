🌐 [한국어](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

# DOOOZ

小言はもうおしまい。応援を始めよう。

毎週何時間も子どもにやるべきことを言い続けていませんか？ 毎日のお手伝いが戦場になっていませんか？ **DOOOZ**は退屈な日常を何年も続く冒険に変えます。親がタスクを決めて、子どもが完了して、ポイントが貯まって、キャラクターが成長して、連続記録が家族みんなをひとつにします。

子どもの成長を5年以上見守りたい家族のために作りました。

## 🤩 なぜ DOOOZ？

- **自律チェック、保護者承認。** 子どもが自分でやることをチェックするとポイントが加算。おねだり・ごほうび交換は保護者の承認が必要です。
- **ポイントが共通言語。** 追加専用（append-only）台帳がすべての獲得と使用を記録します。ポイントがなくなることはありません。
- **子どもから「もっとやりたい」が言える。** 「おねだり」機能で子どもが追加タスクをリクエストしてボーナスポイントを獲得できます。親はワンタップで承認。
- **長く続くゲーミフィケーション。** 30レベル、58バッジ、12の進化するキャラクター — 週末ではなく*何年も*楽しめるように設計しました。
- **自動運転。** 毎日午前1時にタスクが自動生成。午後9時に未完了アイテムをプッシュ通知でお知らせ。
- **アプリインストール＆プッシュ通知対応。** ホーム画面に追加すればアプリのように使えます。おねだり・ごほうび・リマインダーのプッシュ通知を受け取れます。
- **家族データの保護。** 他の家族のデータはデータベースレベルで完全に隔離されます。保護者専用の機能はコードとDB両方で二重に保護されています。
- **多言語対応。** 韓国語、日本語、英語をデフォルトでサポート。

## 📸 スクリーンショット

| ![ダッシュボード](./images/DOOOZ%20dashboard.jpeg) | ![タスクチェック](./images/DOOOZ%20tasks1.png) |
|:---:|:---:|
| 家族詳細 | やること現況(1) |

| ![やること現況(2)](./images/DOOOZ%20tasks2.png) | ![ごほうび管理](./images/DOOOZ%20rewards.jpeg) |
|:---:|:---:|
| やること現況(2) | ごほうび管理 |

## 💡 技術スタック

- Next.js 15 (App Router, RSC) + React 19 + TypeScript 5
- Tailwind + shadcnスタイルのコンポーネント
- Supabase (Postgres, Auth, RLS)
- Zodスキーマバリデーション
- Web Push API (VAPID)
- Vercelでデプロイ

## 🔰 初めての方はGoogle/AIに聞いてください

このガイドに従うには、少しだけ開発環境のセットアップが必要です。
- **ターミナルを開く** — Macはターミナル、Windowsは **PowerShell** を使ってください。開き方がわからない場合はGoogleで検索するかAIに聞いてください。
- **gitが使えない場合** — Googleで **「Gitのインストール方法」** を検索するかAIに聞いてください。
- **npm/npxが使えない場合** — Googleで **「Node.jsのインストール方法」** を検索するかAIに聞いてください。

## 🖥️ 自分のPCのターミナルで実行する

```bash
# 1. ダウンロード先のフォルダに移動（例: デスクトップ）
cd ~/Desktop

# 2. クローン & インストール
git clone https://github.com/taekim34/doooz.git
cd doooz && npm install

# 3. 環境変数（.env.exampleをコピーして.env.localを作成）
cp .env.example .env.local   # 下記の必須値を設定してください

# 4. 開発サーバー
npm run dev               # http://localhost:3000
```

### 環境変数

コピーされた `.env.local` の必須値は空欄になっています。テキストエディタで開き、以下のガイドに従って値を設定してください。

#### 必須（ローカル実行に必要な値）

**1. Supabase接続情報** — [supabase.com](https://supabase.com)で無料プロジェクトを作成し、左メニューの Project Settings → API Keys からコピーします。

| 変数 | どこで見つける？ |
|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクトホーム → プロジェクト名の下に表示されるURL（`https://xxx.supabase.co`） |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key（公開キー） |
| `SUPABASE_SERVICE_SECRET_KEY` | Secret key（⚠️ このキーは絶対に外部に公開しないでください） |

> **Supabaseにローカルアドレスを登録** — Supabase Dashboard → Auth → URL Configurationで:
> - **Site URL**: `http://localhost:3000`
> - **Redirect URLs**: 全サブパスを追加（入力値: `http://localhost:3000/**`）
>
> この設定がないとローカルでログインが動作しません。

**2. サイトURL** — ローカルでは以下の値をそのまま使ってください。

| 変数 | 値 |
|------|-----|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

**3. プッシュ通知キー** — ターミナルで以下のコマンドを実行すると2つのキーが出力されます。そのままコピーして貼り付けてください。

```bash
npx web-push generate-vapid-keys
```

| 変数 | 値 |
|------|-----|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 出力されたPublic Key |
| `VAPID_PRIVATE_KEY` | 出力されたPrivate Key |

**4. cronパスワード** — 好きなパスワードを自分で作って入れてください。後からいつでも変更できます。（例: `my-secret-123`）

| 変数 | 値 |
|------|-----|
| `CRON_SECRET` | 自由に決めた秘密の文字列 |

> ここまで設定すれば `npm run dev` でローカル実行できます。
> インターネットに公開するには、下の「Vercelデプロイ」セクションに従ってください。

#### オプション（`.env.example`にデフォルト値があるので、そのままでOK）

| 変数 | デフォルト | 説明 |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `DOOOZ` | アプリ表示名 |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Family tasks, points...` | アプリの説明 |
| `NEXT_PUBLIC_THEME_COLOR` | `#7c3aed` | アプリのテーマカラー |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` | デフォルト言語 |
| `NEXT_PUBLIC_LOCALE_COOKIE` | `doooz_locale` | 言語設定のCookie名 |
| `NEXT_PUBLIC_SYNTHETIC_EMAIL_DOMAIN` | `dooooz.invalid` | 子どもアカウント用の疑似メールドメイン（実際のメール送信なし）。サイトドメインとの一致は不要ですが、一貫性のため推奨。 |
| `VAPID_CONTACT_EMAIL` | `mailto:noreply@dooooz.invalid` | プッシュサービスの連絡先URI。上記と同様 — ドメインの一致は推奨だが任意。 |
| `NEXT_PUBLIC_FAMILY_STORAGE_KEY` | `doooz_family_name` | ファミリー名のlocalStorageキー |

## 家族のオンラインサービスを構築する 🚀🔥

### インターネット配信の設定（Vercel）

この設定は最初の1回だけで、以降は不要です。

1. [vercel.com](https://vercel.com)で無料登録後、ダッシュボードで **Add New → Project** から新しいプロジェクトを作成します。好きなプロジェクト名を指定すると `https://my-project.vercel.app` のURLになります。

2. Vercel CLIをインストールします:
   ```bash
   npm i -g vercel
   ```

3. ターミナルでdoouzソースがあるフォルダに移動します: `cd ~/Desktop/doooz`（ダウンロード先に合わせて変更）

4. `vercel link` を実行します。ログイン後、"Link to existing project?" に **Y** を選択し、上で作成したプロジェクトを選びます。

5. ローカルで設定した環境変数をVercelにも登録します。以下のコマンドを**一つずつ**実行してください。コマンドを実行すると値の入力プロンプトが表示されます。値を貼り付けてEnterを押してください。

   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL production              # ⚠️ VercelのデプロイURLを入力（例: https://my-project.vercel.app）
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   vercel env add SUPABASE_SERVICE_SECRET_KEY production
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
   vercel env add VAPID_PRIVATE_KEY production
   vercel env add CRON_SECRET production
   ```

   > `NEXT_PUBLIC_SITE_URL`のみVercelのデプロイURLに変更し、残りはローカル（`.env.local`）と同じ値を入力してください。

6. **SupabaseにデプロイURLを登録** — Supabase Dashboard → Auth → URL Configuration:
   - **Site URL**: VercelのデプロイURL（例: `https://my-project.vercel.app`）
   - **Redirect URLs**: VercelデプロイURLの全サブパスを追加（入力値: `https://my-project.vercel.app/**`）— ローカル設定で登録した `localhost:3000` はそのまま維持

### デプロイする 🥳

ターミナルで以下のコマンドを入力してしばらく待つと、DOOOZのソースがVercelサーバーにデプロイされます。

```bash
vercel --prod
```

デプロイが完了すれば、自分と家族がパソコンでもスマホでも `https://my-project.vercel.app` に直接アクセスできます！

ソースを修正するたびに `vercel --prod` を再実行すれば、インターネット上のサービスが更新されます。

### 開発環境の構築

このガイドではローカルPCとインターネット配信版が同じ環境を見ています。ソースを直接修正・開発する方は、別途dev環境を構築することをおすすめします。

## 🎩 魔法のプロンプト — お子さんと一緒に作ろう

同じようなアプリを自分で作ってみたいですか？ AIアシスタント（Claude、ChatGPT、Geminiなど）にプロンプトを貼り付けるだけで、似たアプリをゼロから作れるガイドを用意しました。

### 事前準備

AIコーディングツール（Claude Codeなど）を使う場合、Supabase MCPを接続するとAIがデータベースを直接作成・管理できて便利です。特に「Supabaseのベストプラクティスを参考にして」と指示すれば、データベースに詳しくなくてもSupabase環境を安定的に構築できます。Vercel CLIは上の「インターネット配信の設定」ステップで既にインストール済みです。

### プロンプト

- **[ワンショットプロンプト](./guides/magic-prompt-one-shot.md)** — プロンプト全体をAIチャットにコピーするだけで、動くアプリが一発で完成します。
- **[ステップバイステッププロンプト](./guides/magic-prompt-steps.md)** — ガイドに沿ってプロンプトを一つずつ入力し、段階的にアプリを構築します。

ガイドは韓国語で書かれていますが、どのAIでも言語設定に関係なく使えます。お子さんと一緒に自分だけのアプリを作ってみてください！

## 📜 主要コマンド

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 自分のPCで開発サーバーを実行（`http://localhost:3000`） |
| `npm run build` | デプロイ前にビルドエラーを確認 |
| `npm run typecheck` | 型エラーの検査 |
| `npm run lint` | コードスタイルの検査 |
| `vercel --prod` | インターネットにデプロイ |

## 📂 フォルダ構成

```
src/
├─ app/
│  ├─ (auth)/              ログイン、サインアップ、オンボーディング
│  ├─ (app)/               認証必須ルート — ホーム、タスク、ポイント、リワード、キャラクター、ファミリー、設定
│  └─ api/                 ルートハンドラー + cronジョブ（夕方リマインダー、深夜ロールオーバー）
├─ features/
│  ├─ auth/                requireUser, getCurrentAuth
│  ├─ tasks/               サーバーアクション（更新、大目に見る）
│  ├─ children/            ランク計算
│  └─ characters/          絵文字マップ
├─ lib/
│  ├─ supabase/            client, server, adminクライアント + 型付きDatabase
│  ├─ datetime/            ファミリータイムゾーンユーティリティ + 注入可能なclock
│  ├─ i18n/                ko.json, ja.json, en.json + 翻訳ヘルパー
│  ├─ push/                Webプッシュ通知送信
│  ├─ level.ts             L1-L30しきい値計算
│  ├─ streak.ts            連続日数計算
│  └─ invariants.ts        I1-I10台帳検証ヘルパー
├─ schemas/                Zodスキーマ（ファミリー、ユーザー、タスク、ポイント、リワード、バッジ）
└─ components/ui/          shadcnスタイルの基本コンポーネント

supabase/
├─ migrations/             スキーマ、RLS、トリガー、インデックス
└─ seed.sql                キャラクター12体 + バッジ58個

tests/
├─ unit/                   ソースファイルと同じ場所
├─ integration/            RLSマトリクス
└─ e2e/                    Playwrightシナリオ
```

## 📄 ライセンス

[Apache License 2.0](./LICENSE)
