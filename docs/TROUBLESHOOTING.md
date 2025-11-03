# トラブルシューティングガイド

## タスクが表示されない場合

### 1. データベースにタスクが登録されているか確認

Supabase SQL Editorで以下を実行してください：

```sql
-- タスクの総数確認
SELECT COUNT(*) as total_tasks FROM "Task";

-- タスク一覧（最新10件）
SELECT 
  id,
  name,
  status,
  priority,
  duedate,
  createdat
FROM "Task"
ORDER BY createdat DESC
LIMIT 10;
```

**結果が0の場合**: `scripts/insert_tasks_year1.sql`を実行していません。
**対処**: Supabase SQL Editorで`scripts/insert_tasks_year1.sql`を実行してください。

### 2. ブラウザのコンソールを確認

1. ブラウザでタスクページを開く
2. 開発者ツールを開く（F12 または Cmd+Option+I）
3. 「Console」タブを確認
4. エラーメッセージがないか確認

**よくあるエラー**:
- `401 Unauthorized` → 認証が必要です。ログインしてください。
- `500 Internal Server Error` → サーバーエラー。API側のログを確認してください。
- `Failed to fetch` → ネットワークエラーまたはCORSエラー

### 3. ネットワークタブでAPIリクエストを確認

1. 開発者ツールの「Network」タブを開く
2. ページをリロード
3. `/api/tasks` のリクエストを確認
4. ステータスコードとレスポンスを確認

**正常なレスポンス例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "...",
      "status": "...",
      ...
    }
  ]
}
```

**エラーレスポンス例**:
```json
{
  "success": false,
  "message": "Error message here"
}
```

### 4. フィルターを解除する

タスクページのフィルターが適用されていると、条件に合うタスクが表示されない場合があります。

- 「すべてのステータス」を選択
- 「すべての優先度」を選択
- ページをリロード

### 5. 認証状態を確認

タスクAPIは認証が必要です。

1. ログインページ（`/ja/login`）でログイン
2. ログイン後、再度タスクページにアクセス

---

## よくある問題と解決方法

### 問題: 「401 Unauthorized」エラー

**原因**: 認証トークンが無効または期限切れ

**解決方法**:
1. ログアウトして再度ログイン
2. ブラウザのCookieをクリア
3. 再度ログイン

### 問題: 「タスクがありません」メッセージが表示される

**確認事項**:
1. ✅ データベースにタスクが存在するか（上記SQLで確認）
2. ✅ APIが正常にレスポンスを返しているか（Networkタブで確認）
3. ✅ フィルターが適用されていないか
4. ✅ ブラウザコンソールにエラーがないか

**解決方法**:
- データベースにタスクがない場合: `scripts/insert_tasks_year1.sql`を実行
- フィルターが原因の場合: フィルターを解除
- APIエラーの場合: サーバーログを確認

### 問題: タスクは表示されるが、担当者が「未割り当て」になっている

**原因**: タスクの`assigneeId`がNULL、または該当ユーザーが存在しない

**確認方法**:
```sql
-- 担当者が割り当てられていないタスク
SELECT id, name, assigneeid
FROM "Task"
WHERE assigneeid IS NULL;

-- 存在しないユーザーに割り当てられているタスク
SELECT t.id, t.name, t.assigneeid
FROM "Task" t
LEFT JOIN "User" u ON t.assigneeid = u.id
WHERE t.assigneeid IS NOT NULL AND u.id IS NULL;
```

**解決方法**:
- タスクに正しい`assigneeId`を設定する
- または、`insert_tasks_year1.sql`を再実行（ユーザーが登録されていることを確認）

---

## デバッグ方法

### 1. フロントエンドでのデバッグ

タスクページで以下を確認：

```javascript
// ブラウザコンソールで実行
fetch('/api/tasks')
  .then(res => res.json())
  .then(data => console.log('Tasks:', data))
  .catch(err => console.error('Error:', err))
```

### 2. APIエンドポイントの直接確認

ブラウザまたはcurlで直接確認：

```bash
# 認証が必要な場合は、ブラウザでログイン後に
# 開発者ツール > Application > Cookies から認証トークンを取得

curl http://localhost:3000/api/tasks \
  -H "Cookie: your-auth-cookie"
```

### 3. データベース接続の確認

Prismaクライアントが正しく接続できているか確認：

```typescript
// 一時的にAPIルートに追加して確認
const taskCount = await prisma.task.count()
console.log('Total tasks:', taskCount)
```

---

## ログの確認場所

### フロントエンド
- ブラウザの開発者ツール > Console
- ブラウザの開発者ツール > Network

### バックエンド
- Next.jsの開発サーバーのターミナル出力
- Supabaseのログ（本番環境の場合）

---

## サポート

問題が解決しない場合：

1. **エラーメッセージを記録**
   - ブラウザコンソールのエラー
   - ネットワークタブのレスポンス
   - サーバーログのエラー

2. **再現手順を記録**
   - どのページで発生するか
   - 何を操作したか
   - エラーが発生するタイミング

3. **環境情報を記録**
   - Next.jsのバージョン
   - ブラウザの種類とバージョン
   - OSの種類とバージョン

---

**最終更新**: 2025年11月

