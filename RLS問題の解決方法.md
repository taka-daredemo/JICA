# 🔧 Supabase RLS問題の解決方法（簡潔版）

## 問題

BoltでSupabase RLSを有効にすると、プロジェクトのデータが見えなくなる。

## 原因

- RLSポリシーが未設定、または不適切
- 認証ユーザーがデータにアクセスする権限がない

## 解決策

### 方法1: RLSポリシーを正しく設定する（推奨）

Supabaseの**SQL Editor**で以下を実行：

```sql
-- Taskテーブルの例
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全タスクを閲覧可能
CREATE POLICY "task_select_all" ON "Task"
  FOR SELECT TO authenticated USING (true);

-- 認証済みユーザーは誰でもタスク作成可能
CREATE POLICY "task_insert_all" ON "Task"
  FOR INSERT TO authenticated WITH CHECK (true);

-- 自分が作成または割り当てられたタスクのみ更新可能
CREATE POLICY "task_update_own" ON "Task"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "createdById" OR auth.uid()::text = "assigneeId");

-- 自分が作成したタスクのみ削除可能
CREATE POLICY "task_delete_own" ON "Task"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "createdById");
```

**全テーブル用のSQLスクリプトは `BOLT_INSTRUCTIONS.md` を参照してください。**

---

### 方法2: 開発中は一時的にRLSを無効化（推奨しない）

```sql
-- 開発環境でのみ実行
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ... 他のテーブル
```

⚠️ **警告**: 本番環境では絶対に使用しないこと！

---

## Boltへの指示テンプレート

Boltに以下のように伝えてください：

```
このプロジェクトではSupabase Row Level Security (RLS)を使用します。
以下のポリシーをSupabase SQL Editorで設定してください：

1. 全てのテーブルでRLSを有効化
2. 認証済みユーザー（authenticated）は全データを閲覧可能（SELECT）
3. データの作成・更新・削除は以下のルール：
   - Taskテーブル: 誰でも作成可、自分が作成または割り当てられたものだけ編集・削除可
   - 他のテーブル: 基本的に認証済みユーザーは全操作可能

詳細は「BOLT_INSTRUCTIONS.md」ファイルのSQLを実行してください。

重要: auth.uid()を使う際は必ず::textでキャストすること
例: USING (auth.uid()::text = "userId")
```

---

## 確認方法

1. Supabaseダッシュボード → Authentication → Users でテストユーザーを作成
2. アプリでログイン
3. ブラウザのコンソールを開く（F12）
4. エラーが出ていないか確認
5. データが表示されることを確認

---

## デバッグ

データが表示されない場合：

```typescript
// コードに追加してログを確認
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)  // ユーザーがnullでないことを確認

const { data, error } = await supabase.from('Task').select('*')
console.log('Data:', data)
console.log('Error:', error)  // エラーメッセージを確認
```

よくあるエラー：
- `"new row violates row-level security policy"` → ポリシーが厳しすぎる
- `"permission denied for table"` → RLSポリシーが未設定
- データが空配列 → ポリシーの条件が合わない

---

## 詳細ドキュメント

- `BOLT_INSTRUCTIONS.md` - Bolt用の詳細な実装手順
- `SUPABASE_RLS_FIX_GUIDE.md` - RLSの完全なガイド

---

## クイックリファレンス

### よく使うポリシーパターン

```sql
-- 全員が閲覧可能
CREATE POLICY "読み取り許可" ON "テーブル名"
  FOR SELECT TO authenticated USING (true);

-- 自分のデータのみ編集可能
CREATE POLICY "自分のみ更新" ON "テーブル名"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "userId");

-- 管理者のみ全操作可能
CREATE POLICY "管理者のみ" ON "テーブル名"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "UserRole" ur
      JOIN "Role" r ON ur."roleId" = r.id
      WHERE ur."userId" = auth.uid()::text
      AND r.name = 'Administrator'
    )
  );
```

### RLS状態の確認SQL

```sql
-- RLSが有効なテーブル一覧
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 既存のポリシー一覧
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public';

-- 現在の認証ユーザーID
SELECT auth.uid();
```
