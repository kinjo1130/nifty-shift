# Nifty Shift

Next.js (Frontend) + Express/Prisma (Backend) のフルスタックアプリケーション

## 必要な環境

- Node.js 18以上
- Docker & Docker Compose
- npm または yarn

## ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd nifty-shift
```

### 2. 依存関係のインストール

```bash
# Backendの依存関係
cd backend
npm install

# Frontendの依存関係
cd ../frontend
npm install
```

### 3. 環境変数の設定

Backend用の環境変数ファイルを作成:

```bash
cd backend
cp .env.local .env
```

Frontend用の環境変数ファイルを作成:

```bash
cd ../frontend
cp .env.local .env
```

### 4. データベースの起動

プロジェクトルートで以下を実行:

```bash
docker compose build && docker compose up
```

これによりPostgreSQLがポート5432で起動します。

### 5. データベースのマイグレーション

```bash
cd backend
npx prisma migrate dev
```

### 6. アプリケーションの起動

2つのターミナルを開いて、それぞれで以下を実行:

**Backend (ターミナル1):**
```bash
cd backend
npm run dev
```
→ http://localhost:8080 で起動

**Frontend (ターミナル2):**
```bash
cd frontend
npm run dev
```
→ http://localhost:3000 で起動

## 開発用コマンド

### Backend

```bash
# 開発サーバー起動
npm run dev

# Prismaスタジオ起動（DBをGUIで確認）
npx prisma studio

# マイグレーション作成
npx prisma migrate dev --name <migration-name>

# Prismaクライアント生成
npx prisma generate
```h

### Frontend

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションモード起動
npm run start

# Lint実行
npm run lint
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

## API エンドポイント

Backend APIは以下のエンドポイントを提供:

- `GET /health` - ヘルスチェック
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `GET /api/posts` - 投稿一覧取得
- `POST /api/posts` - 投稿作成

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# 使用中のポートを確認
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
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
   cat backend/.env
   ```

3. データベースに接続できるか確認:
   ```bash
   docker exec -it nifty-shift-db psql -U postgres -d niftyshift
   ```

### Prismaエラー

```bash
# Prismaクライアントを再生成
cd backend
npx prisma generate

# スキーマとDBを同期
npx prisma db push
```
