# Supabase RLS（Row Level Security）修正ガイド

## 🚨 問題の概要

Bolt上でRLS（Row Level Security）を適用すると、プロジェクトデータが見えなくなる問題が発生しています。

### 問題の原因

1. **RLSポリシーが設定されていない、または不適切**
   - テーブルにRLSが有効化されているが、適切なポリシーが設定されていない
   - 認証されたユーザーでもデータにアクセスできない状態

2. **認証コンテキストの欠如**
   - クエリ実行時にユーザー認証情報が正しく渡されていない
   - `anon`キーではなく`service_role`キーが必要な場合がある

3. **ポリシーの条件が厳しすぎる**
   - 特定のユーザーIDやロールに限定されすぎている

## 🔧 解決策

### ステップ1: RLSポリシーの確認と修正

Supabaseダッシュボードで以下のSQLを実行して、現在のRLS状態を確認します：

```sql
-- RLSが有効になっているテーブルを確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 既存のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### ステップ2: 基本的なRLSポリシーの作成

各テーブルに対して、認証されたユーザーがアクセスできるようにポリシーを設定します：

```sql
-- ============================================
-- User テーブルのRLSポリシー
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全てのユーザー情報を閲覧可能
CREATE POLICY "Enable read access for authenticated users" ON "User"
  FOR SELECT
  TO authenticated
  USING (true);

-- ユーザーは自分の情報のみ更新可能
CREATE POLICY "Enable update for users based on user_id" ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 管理者のみユーザーを作成可能（例：特定のロールを持つユーザー）
CREATE POLICY "Enable insert for admin users" ON "User"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "UserRole" ur
      JOIN "Role" r ON ur."roleId" = r.id
      WHERE ur."userId" = auth.uid()::text
      AND r.name = 'Administrator'
    )
  );

-- ============================================
-- Task テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは全てのタスクを閲覧可能
CREATE POLICY "Enable read access for authenticated users" ON "Task"
  FOR SELECT
  TO authenticated
  USING (true);

-- ユーザーは自分が作成したタスクまたは自分に割り当てられたタスクを更新可能
CREATE POLICY "Enable update for task owners and assignees" ON "Task"
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = "createdById" OR 
    auth.uid()::text = "assigneeId"
  );

-- 認証されたユーザーは誰でもタスクを作成可能
CREATE POLICY "Enable insert for authenticated users" ON "Task"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- タスク作成者のみ削除可能
CREATE POLICY "Enable delete for task creators" ON "Task"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "createdById");

-- ============================================
-- TaskComment テーブルのRLSポリシー
-- ============================================
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "TaskComment"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "TaskComment"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "Enable update for comment authors" ON "TaskComment"
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "authorId");

CREATE POLICY "Enable delete for comment authors" ON "TaskComment"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "authorId");

-- ============================================
-- RecurringPattern テーブルのRLSポリシー
-- ============================================
ALTER TABLE "RecurringPattern" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON "RecurringPattern"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Role, Module, Permission テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Permission" ENABLE ROW LEVEL SECURITY;

-- 管理者のみ編集可能、全員閲覧可能
CREATE POLICY "Enable read for authenticated users" ON "Role"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write for admins only" ON "Role"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "UserRole" ur
      JOIN "Role" r ON ur."roleId" = r.id
      WHERE ur."userId" = auth.uid()::text
      AND r.name = 'Administrator'
    )
  );

-- UserRole: 全員閲覧可能、管理者のみ編集
CREATE POLICY "Enable read for authenticated users" ON "UserRole"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write for admins only" ON "UserRole"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "UserRole" ur
      JOIN "Role" r ON ur."roleId" = r.id
      WHERE ur."userId" = auth.uid()::text
      AND r.name = 'Administrator'
    )
  );

-- Module: 全員閲覧可能
CREATE POLICY "Enable read for authenticated users" ON "Module"
  FOR SELECT TO authenticated USING (true);

-- Permission: 全員閲覧可能、管理者のみ編集
CREATE POLICY "Enable read for authenticated users" ON "Permission"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write for admins only" ON "Permission"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "UserRole" ur
      JOIN "Role" r ON ur."roleId" = r.id
      WHERE ur."userId" = auth.uid()::text
      AND r.name = 'Administrator'
    )
  );

-- ============================================
-- Budget テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "Budget"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for budget managers" ON "Budget"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Permission" p
      JOIN "UserRole" ur ON ur."roleId" = p."roleId"
      JOIN "Module" m ON m.id = p."moduleId"
      WHERE ur."userId" = auth.uid()::text
      AND m.name = 'Budget Management'
      AND p.level IN ('full', 'edit')
    )
  );

-- ============================================
-- PaymentPlan テーブルのRLSポリシー
-- ============================================
ALTER TABLE "PaymentPlan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "PaymentPlan"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for budget managers" ON "PaymentPlan"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Permission" p
      JOIN "UserRole" ur ON ur."roleId" = p."roleId"
      JOIN "Module" m ON m.id = p."moduleId"
      WHERE ur."userId" = auth.uid()::text
      AND m.name = 'Budget Management'
      AND p.level IN ('full', 'edit')
    )
  );

-- ============================================
-- Expense テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "Expense"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for budget managers" ON "Expense"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Permission" p
      JOIN "UserRole" ur ON ur."roleId" = p."roleId"
      JOIN "Module" m ON m.id = p."moduleId"
      WHERE ur."userId" = auth.uid()::text
      AND m.name = 'Budget Management'
      AND p.level IN ('full', 'edit')
    )
  );

-- ============================================
-- Farmer テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Farmer" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "Farmer"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for farmer managers" ON "Farmer"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Permission" p
      JOIN "UserRole" ur ON ur."roleId" = p."roleId"
      JOIN "Module" m ON m.id = p."moduleId"
      WHERE ur."userId" = auth.uid()::text
      AND m.name = 'Farmer Database'
      AND p.level IN ('full', 'edit')
    )
  );

-- ============================================
-- Training テーブルのRLSポリシー
-- ============================================
ALTER TABLE "Training" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "Training"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all for training managers" ON "Training"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Permission" p
      JOIN "UserRole" ur ON ur."roleId" = p."roleId"
      JOIN "Module" m ON m.id = p."moduleId"
      WHERE ur."userId" = auth.uid()::text
      AND m.name = 'Training & Seminars'
      AND p.level IN ('full', 'edit')
    )
  );
```

### ステップ3: 開発環境での一時的な回避策

開発中にRLSをバイパスする必要がある場合、以下の方法を使用できます：

#### オプションA: Service Roleキーの使用（サーバーサイドのみ）

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // RLSをバイパス
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

⚠️ **注意**: `service_role`キーは絶対にクライアントサイドで使用しないでください！

#### オプションB: 特定のテーブルでRLSを無効化（開発時のみ）

```sql
-- 開発環境でのみ実行
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ... 他のテーブル
```

### ステップ4: 認証フローの確認

現在のコードで認証が正しく機能していることを確認します：

```typescript
// app/api/tasks/route.ts (例)
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // ユーザー認証を確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // RLSポリシーが適用されたクエリ
  const { data: tasks, error } = await supabase
    .from('Task')
    .select('*')
  
  if (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ tasks })
}
```

### ステップ5: Prismaとの統合（既存のスキーマを使用する場合）

PrismaとSupabaseを併用する場合、Prisma Clientは直接接続するため、RLSが適用されません。以下の選択肢があります：

#### オプションA: Supabase Clientを使用（推奨）

RLSを活用する場合、Prismaの代わりにSupabase Clientを使用：

```typescript
// Prismaの代わりに
const supabase = await createClient()
const { data } = await supabase
  .from('Task')
  .select('*, assignee:User(*)')
  .eq('status', 'InProgress')
```

#### オプションB: Prisma + Supabase Postgrest

Prismaで直接接続し、アプリケーション層で権限チェックを実装：

```typescript
import { prisma } from '@/lib/prisma'

export async function getTasks(userId: string, userRole: string) {
  // アプリケーションレベルでの権限チェック
  if (userRole === 'Administrator') {
    return await prisma.task.findMany()
  } else {
    return await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { createdById: userId }
        ]
      }
    })
  }
}
```

## 📋 チェックリスト

RLS実装時に確認すべき項目：

- [ ] 全てのテーブルにRLSが有効化されている
- [ ] 各テーブルに適切な`SELECT`ポリシーが設定されている
- [ ] 各テーブルに適切な`INSERT/UPDATE/DELETE`ポリシーが設定されている
- [ ] 認証されたユーザーの基本的なアクセスが許可されている
- [ ] `auth.uid()`が正しくUUID型にキャストされている（`auth.uid()::text`）
- [ ] ポリシーでのロールチェックが機能している
- [ ] 開発環境でテストして動作確認済み
- [ ] `service_role`キーがクライアントサイドで使用されていない

## 🐛 デバッグ方法

RLSの問題をデバッグする際のクエリ：

```sql
-- 現在の認証ユーザーを確認
SELECT auth.uid();

-- 特定のユーザーとしてポリシーをテスト
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM "Task";

-- ポリシーが拒否する理由を確認
EXPLAIN (ANALYZE, VERBOSE) SELECT * FROM "Task";
```

## 🎯 Boltへの指示

Boltでプロジェクトを実装する際は、以下を伝えてください：

```
Supabase RLSの設定：

1. 全てのテーブルにRow Level Security (RLS)を適用してください

2. 基本ポリシー：
   - 認証済みユーザーは全てのデータを閲覧可能 (SELECT)
   - ユーザーは自分が作成したデータのみ編集・削除可能
   - 管理者（Administrator ロール）は全ての操作が可能

3. auth.uid()を使用する際は必ずテキスト型にキャスト: auth.uid()::text

4. 上記の「SUPABASE_RLS_FIX_GUIDE.md」ファイルのSQLスクリプトを
   Supabase SQL Editorで実行してください

5. 認証フローでは @supabase/ssr を使用し、
   サーバーサイドでは lib/supabase/server.ts、
   クライアントサイドでは lib/supabase/client.ts を使用してください

6. service_role キーは絶対にクライアントサイドで使用しないでください
```

## 📚 参考リンク

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
