# Bolt用 - Supabase RLS設定指示書

## 🎯 問題

現在、Supabase でRow Level Security (RLS)を有効にすると、プロジェクトデータが表示されません。

## ✅ 解決方法

以下の手順を実行してください：

---

## ステップ1: Supabase ダッシュボードでSQLを実行

Supabase プロジェクトの **SQL Editor** を開き、以下のSQLを**全て実行**してください：

```sql
-- ============================================
-- User テーブル
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_policy" ON "User"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_update_policy" ON "User"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id);

-- ============================================
-- Role & Permission テーブル
-- ============================================
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_select_policy" ON "Role"
  FOR SELECT TO authenticated USING (true);

ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "userrole_select_policy" ON "UserRole"
  FOR SELECT TO authenticated USING (true);

ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_select_policy" ON "Module"
  FOR SELECT TO authenticated USING (true);

ALTER TABLE "Permission" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permission_select_policy" ON "Permission"
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- Task テーブル
-- ============================================
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- 全ての認証ユーザーがタスクを閲覧可能
CREATE POLICY "task_select_policy" ON "Task"
  FOR SELECT TO authenticated USING (true);

-- タスクの作成
CREATE POLICY "task_insert_policy" ON "Task"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 自分が作成または割り当てられたタスクのみ更新可能
CREATE POLICY "task_update_policy" ON "Task"
  FOR UPDATE TO authenticated
  USING (
    auth.uid()::text = "createdById" OR 
    auth.uid()::text = "assigneeId"
  );

-- 自分が作成したタスクのみ削除可能
CREATE POLICY "task_delete_policy" ON "Task"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "createdById");

-- ============================================
-- TaskComment テーブル
-- ============================================
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taskcomment_select_policy" ON "TaskComment"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "taskcomment_insert_policy" ON "TaskComment"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "taskcomment_update_policy" ON "TaskComment"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "authorId");

CREATE POLICY "taskcomment_delete_policy" ON "TaskComment"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "authorId");

-- ============================================
-- RecurringPattern テーブル
-- ============================================
ALTER TABLE "RecurringPattern" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurringpattern_all_policy" ON "RecurringPattern"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- Budget テーブル
-- ============================================
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_select_policy" ON "Budget"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "budget_modify_policy" ON "Budget"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- PaymentPlan テーブル
-- ============================================
ALTER TABLE "PaymentPlan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paymentplan_select_policy" ON "PaymentPlan"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "paymentplan_modify_policy" ON "PaymentPlan"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- Expense テーブル
-- ============================================
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_select_policy" ON "Expense"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "expense_modify_policy" ON "Expense"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- Farmer テーブル
-- ============================================
ALTER TABLE "Farmer" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer_select_policy" ON "Farmer"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "farmer_modify_policy" ON "Farmer"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================
-- Training テーブル
-- ============================================
ALTER TABLE "Training" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_select_policy" ON "Training"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_modify_policy" ON "Training"
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

---

## ステップ2: 既存のポリシーがある場合（エラーが出た場合）

もし上記のSQLで「policy already exists」エラーが出た場合は、先に既存のポリシーを削除してください：

```sql
-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "user_select_policy" ON "User";
DROP POLICY IF EXISTS "user_update_policy" ON "User";
DROP POLICY IF EXISTS "role_select_policy" ON "Role";
DROP POLICY IF EXISTS "userrole_select_policy" ON "UserRole";
DROP POLICY IF EXISTS "module_select_policy" ON "Module";
DROP POLICY IF EXISTS "permission_select_policy" ON "Permission";
DROP POLICY IF EXISTS "task_select_policy" ON "Task";
DROP POLICY IF EXISTS "task_insert_policy" ON "Task";
DROP POLICY IF EXISTS "task_update_policy" ON "Task";
DROP POLICY IF EXISTS "task_delete_policy" ON "Task";
DROP POLICY IF EXISTS "taskcomment_select_policy" ON "TaskComment";
DROP POLICY IF EXISTS "taskcomment_insert_policy" ON "TaskComment";
DROP POLICY IF EXISTS "taskcomment_update_policy" ON "TaskComment";
DROP POLICY IF EXISTS "taskcomment_delete_policy" ON "TaskComment";
DROP POLICY IF EXISTS "recurringpattern_all_policy" ON "RecurringPattern";
DROP POLICY IF EXISTS "budget_select_policy" ON "Budget";
DROP POLICY IF EXISTS "budget_modify_policy" ON "Budget";
DROP POLICY IF EXISTS "paymentplan_select_policy" ON "PaymentPlan";
DROP POLICY IF EXISTS "paymentplan_modify_policy" ON "PaymentPlan";
DROP POLICY IF EXISTS "expense_select_policy" ON "Expense";
DROP POLICY IF EXISTS "expense_modify_policy" ON "Expense";
DROP POLICY IF EXISTS "farmer_select_policy" ON "Farmer";
DROP POLICY IF EXISTS "farmer_modify_policy" ON "Farmer";
DROP POLICY IF EXISTS "training_select_policy" ON "Training";
DROP POLICY IF EXISTS "training_modify_policy" ON "Training";

-- その後、ステップ1のSQLを再実行
```

---

## ステップ3: コードでの認証確認

アプリケーションコードで、Supabase Clientが正しく認証情報を渡していることを確認してください：

### サーバーサイド（API Routes, Server Components）

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // ユーザー認証を確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // RLSが適用されたクエリ
  const { data, error } = await supabase
    .from('Task')
    .select('*')
  
  return Response.json({ data })
}
```

### クライアントサイド（Client Components）

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function TaskList() {
  const [tasks, setTasks] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('Task')
        .select('*')
      
      if (error) {
        console.error('Error fetching tasks:', error)
      } else {
        setTasks(data)
      }
    }
    
    fetchTasks()
  }, [])
  
  return <div>{/* タスク一覧 */}</div>
}
```

---

## ステップ4: デバッグ方法

データが表示されない場合、以下を確認してください：

### A. 認証状態の確認

```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)  // nullでないことを確認
```

### B. RLSポリシーのテスト（Supabase SQL Editorで実行）

```sql
-- 現在の認証ユーザーのIDを確認
SELECT auth.uid();

-- 特定のテーブルのポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'Task';

-- RLSを一時的に無効化してデータを確認（開発時のみ）
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
-- データが見えることを確認
SELECT * FROM "Task" LIMIT 5;
-- 再度有効化
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
```

---

## 📝 重要な注意事項

1. **`auth.uid()` は必ずテキスト型にキャスト**
   ```sql
   -- ❌ 誤り
   USING (auth.uid() = id)
   
   -- ✅ 正しい
   USING (auth.uid()::text = id)
   ```

2. **`service_role` キーは絶対にクライアントサイドで使用しない**
   - `SUPABASE_SERVICE_ROLE_KEY` は `.env.local` に保存
   - サーバーサイドのみで使用
   - RLSをバイパスするため、機密データへのアクセスに注意

3. **Prisma を使う場合**
   - Prisma Client は直接DBに接続するため、RLSが適用されません
   - RLSを活用したい場合は Supabase Client を使用してください
   - または、アプリケーション層で権限チェックを実装してください

---

## ✅ 完了確認

上記の手順を実行後、以下を確認してください：

- [ ] Supabase SQL Editorで全てのSQLが正常に実行された
- [ ] ログイン後、タスク一覧が表示される
- [ ] 新しいタスクを作成できる
- [ ] 自分が作成したタスクを編集・削除できる
- [ ] コンソールにRLS関連のエラーが出ていない

---

## 🆘 それでも解決しない場合

以下の一時的な回避策を試してください：

### 開発環境でRLSを無効化（本番環境では絶対にやらない）

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskComment" DISABLE ROW LEVEL SECURITY;
-- ... 他のテーブルも同様
```

これにより、認証なしでも全てのデータにアクセスできるようになります。
**本番環境では絶対に実行しないでください！**

---

詳細な説明は `SUPABASE_RLS_FIX_GUIDE.md` を参照してください。
