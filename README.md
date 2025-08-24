# Nifty Shift

Next.js フルスタックアプリケーション（Google認証対応）

## アーキテクチャ

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: PostgreSQL (ローカル: Docker, 本番: Neon)
- **認証**: NextAuth.js + Google OAuth
- **ORM**: Prisma
- **スタイリング**: Tailwind CSS

## 必要な環境

- Node.js 18以上
- Docker & Docker Compose
- npm または yarn
- Google Cloud Console アカウント（OAuth設定用）

## ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kinjo1130/nifty-shift.git
cd nifty-shift
```

### 2. 依存関係のインストール

```bash
cd frontend
npm install
```

### 3. Google OAuth の設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
4. アプリケーションの種類: 「ウェブアプリケーション」
5. 承認済みのリダイレクト URI に追加:
   - `http://localhost:3000/api/auth/callback/google` (開発用)
   - `https://your-domain.com/api/auth/callback/google` (本番用)

### 4. 環境変数の設定

```bash
cd frontend
cp .env.sample .env
```

`.env` ファイルを編集:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/niftyshift?schema=public"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret  # openssl rand -base64 32 で生成

NODE_ENV=development
```

### 5. データベースの起動

プロジェクトルートで以下を実行:

```bash
docker compose up -d
```

これによりPostgreSQLがポート5432で起動します。

### 6. データベースのセットアップ

```bash
cd frontend

# Prismaクライアントを生成
npx prisma generate

# データベースマイグレーション実行
npx prisma migrate dev
```

### 7. アプリケーションの起動

```bash
npm run dev
```

→ http://localhost:3000 で起動

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションモード起動
npm run start

# Lint実行
npm run lint

# Prismaスタジオ起動（DBをGUIで確認）
npx prisma studio

# マイグレーション作成
npx prisma migrate dev --name <migration-name>

# Prismaクライアント生成
npx prisma generate
```

### Docker

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# ログ確認
docker-compose logs -f postgres

# DBデータを削除して再起動
docker-compose down -v
docker-compose up -d
```

## プロジェクト構成

```
nifty-shift/
├── frontend/               # Next.jsアプリケーション
│   ├── app/               # App Router
│   │   ├── api/          # API Routes
│   │   │   ├── auth/     # NextAuth認証
│   │   │   └── schedules/ # スケジュールAPI
│   │   ├── components/   # Reactコンポーネント
│   │   └── page.tsx      # ホームページ
│   ├── lib/              # ユーティリティ
│   │   └── prisma.ts     # Prismaクライアント
│   ├── prisma/           # Prismaスキーマ
│   └── public/           # 静的ファイル
├── scripts/              # デプロイメントスクリプト
└── docker-compose.yml    # ローカルDB設定
```

## API エンドポイント

### 認証
- `GET/POST /api/auth/*` - NextAuth.js認証エンドポイント

### スケジュール管理
- `GET /api/schedules` - スケジュール一覧取得
- `POST /api/schedules` - スケジュール作成
- `GET /api/schedules/[id]` - スケジュール詳細取得
- `PUT /api/schedules/[id]` - スケジュール更新
- `DELETE /api/schedules/[id]` - スケジュール削除

## デプロイメント

### 前提条件

1. Google Cloud SDK のインストール
2. GCPプロジェクトの作成と設定
3. 必要なAPIの有効化:
   - Cloud Run API
   - Cloud Build API
   - Secret Manager API
   - Container Registry API

### シークレットの設定

環境ごとのシークレットをGoogle Cloud Secret Managerに登録:

```bash
# ステージング環境のシークレット登録
cd scripts
./setup-staging-secrets.sh

# 本番環境のシークレット登録
./setup-prod-secrets.sh
```

### シェルスクリプトデプロイ（推奨）

シェルスクリプトを使用した無料デプロイ。以下が自動的に実行されます:
1. Dockerイメージのビルド&プッシュ
2. データベースマイグレーション（Cloud Run Jobs使用）
3. アプリケーションのデプロイ

```bash
# ステージング環境
cd scripts
./deploy-stg.sh

# 本番環境
./deploy-prod.sh
```

### デプロイの流れ

1. **Dockerイメージのビルド**: マルチステージビルドで最適化されたイメージを作成
2. **データベースマイグレーション**: Cloud Run Jobsでマイグレーションを実行
3. **アプリケーションデプロイ**: Cloud Runにデプロイ

### 環境変数とシークレット

各環境で必要な環境変数:
- `DATABASE_URL`: PostgreSQL接続文字列
- `NEXTAUTH_SECRET`: NextAuth.js用のシークレット
- `NEXTAUTH_URL`: アプリケーションのURL
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth クライアントシークレット

### デプロイ後の確認

```bash
# サービスの状態確認
gcloud run services describe nifty-shift-stg --region=asia-northeast1
gcloud run services describe nifty-shift-prod --region=asia-northeast1

# ログの確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nifty-shift-stg" --limit 50
```

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# 使用中のポートを確認
lsof -i :3000  # Next.js
lsof -i :5432  # PostgreSQL

# プロセスを終了
kill -9 <PID>
```

### データベース接続エラー

1. Dockerコンテナが起動しているか確認:
   ```bash
   docker-compose ps
   ```

2. 環境変数が正しく設定されているか確認:
   ```bash
   cat frontend/.env
   ```

3. データベースに接続できるか確認:
   ```bash
   docker exec -it nifty-shift-db psql -U postgres -d niftyshift
   ```

### Prismaエラー

```bash
# Prismaクライアントを再生成
cd frontend
npx prisma generate

# スキーマとDBを同期
npx prisma db push
```

### Google認証エラー

1. Google Cloud ConsoleでOAuth設定を確認
2. リダイレクトURIが正しく設定されているか確認
3. 環境変数の`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`を確認