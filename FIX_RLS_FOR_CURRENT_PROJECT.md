# 現在のプロジェクト用 RLS修正ガイド

## 🎯 問題の特定

現在、全テーブルに**RLSポリシーは作成済み**だが、**RLSが無効化**されている状態です。

```
✅ ポリシー存在: projects_select, projects_insert, etc.
❌ RLS無効: ALTER TABLE projects DISABLE ROW LEVEL SECURITY
```

## 🔧 修正手順

### ステップ1: 全テーブルでRLSを有効化

Supabase SQL Editorで以下を実行：

```sql
-- 全テーブルでRLSを有効化
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_item_monthly_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
```

---

### ステップ2: 既存ポリシーの確認

```sql
-- 現在のポリシーを確認
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### ステップ3: プロジェクト作成時の問題を修正

あなたが指摘した問題：

> 新規プロジェクト作成時に、まだproject_membersレコードが存在しないため、プロジェクト作成者は自分を追加できない

#### 現在の`project_members_insert`ポリシー（推測）

```sql
-- 問題のあるポリシー
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    -- 既存の管理者のみメンバーを追加可能
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
```

#### 修正後のポリシー

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "project_members_insert" ON project_members;

-- 修正版：プロジェクト作成者または既存管理者がメンバーを追加可能
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    -- 条件1: 自分自身を追加する場合は常に許可
    (auth.uid() = user_id)
    OR
    -- 条件2: プロジェクトの既存管理者である
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
```

---

### ステップ4: プロジェクト作成フローの確認

プロジェクト作成時のコードが以下のようになっていることを確認：

```typescript
// ✅ 正しいフロー
async function createProject(projectData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. プロジェクトを作成（created_byを設定）
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      created_by: user.id  // 重要：作成者を記録
    })
    .select()
    .single()
  
  if (projectError) throw projectError
  
  // 2. 作成者を管理者として追加
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: user.id,      // 自分自身を追加
      role: 'admin'
    })
  
  if (memberError) throw memberError
  
  return project
}
```

---

### ステップ5: projects_insertポリシーの確認

```sql
-- projectsテーブルの挿入ポリシーを確認
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'projects' AND cmd = 'INSERT';
```

推奨されるポリシー：

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "projects_insert" ON projects;

-- 認証済みユーザーは誰でもプロジェクトを作成可能
CREATE POLICY "projects_insert" ON projects
  FOR INSERT
  WITH CHECK (
    -- 認証済みユーザーのみ
    auth.uid() IS NOT NULL
    AND
    -- 作成者は自分自身である必要がある
    auth.uid() = created_by
  );
```

---

## 🔍 その他の重要なポリシー修正

### 1. users_profile ポリシー

```sql
-- 既存ポリシーを削除
DROP POLICY IF EXISTS "users_insert_own" ON users_profile;
DROP POLICY IF EXISTS "users_select_project_members" ON users_profile;
DROP POLICY IF EXISTS "users_update_own" ON users_profile;

-- 自分のプロファイルを作成
CREATE POLICY "users_insert_own" ON users_profile
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- プロジェクトメンバーのプロファイルを閲覧
CREATE POLICY "users_select_project_members" ON users_profile
  FOR SELECT
  USING (
    -- 自分自身
    auth.uid() = id
    OR
    -- 同じプロジェクトのメンバー
    EXISTS (
      SELECT 1 FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid()
      AND pm2.user_id = users_profile.id
    )
  );

-- 自分のプロファイルのみ更新
CREATE POLICY "users_update_own" ON users_profile
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

### 2. プロジェクト関連テーブルの基本パターン

全てのプロジェクト関連テーブル（objectives, activities, tasks, budgets等）には以下のパターンを適用：

```sql
-- 例: objectivesテーブル
DROP POLICY IF EXISTS "objectives_select" ON objectives;
DROP POLICY IF EXISTS "objectives_insert" ON objectives;
DROP POLICY IF EXISTS "objectives_update" ON objectives;
DROP POLICY IF EXISTS "objectives_delete" ON objectives;

-- SELECT: プロジェクトメンバーは閲覧可能
CREATE POLICY "objectives_select" ON objectives
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = objectives.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- INSERT: プロジェクトメンバーは作成可能
CREATE POLICY "objectives_insert" ON objectives
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = objectives.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- UPDATE: プロジェクトメンバーは更新可能
CREATE POLICY "objectives_update" ON objectives
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = objectives.project_id
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = objectives.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- DELETE: 管理者のみ削除可能
CREATE POLICY "objectives_delete" ON objectives
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = objectives.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
```

---

### 3. 通貨・為替レート（グローバルテーブル）

```sql
-- currencies: 全員閲覧可能
DROP POLICY IF EXISTS "currencies_select" ON currencies;
CREATE POLICY "currencies_select" ON currencies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- exchange_rates: 全員閲覧可能、管理者のみ編集
DROP POLICY IF EXISTS "exchange_rates_select" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_insert" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_update" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_delete" ON exchange_rates;

CREATE POLICY "exchange_rates_select" ON exchange_rates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 管理者の判定は実装に応じて調整が必要
-- 例: users_profileにis_admin列がある場合
CREATE POLICY "exchange_rates_insert" ON exchange_rates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );
```

---

## 🧪 テスト手順

### 1. RLS有効化のテスト

```sql
-- RLSが有効になっていることを確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'project_members', 'objectives');

-- 結果: rowsecurity = true であること
```

### 2. プロジェクト作成のテスト

```typescript
// テストコード
async function testProjectCreation() {
  const supabase = await createClient()
  
  // 1. ログイン
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password'
  })
  
  // 2. プロジェクト作成
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: 'Test Project',
      description: 'Test',
      created_by: (await supabase.auth.getUser()).data.user.id
    })
    .select()
    .single()
  
  console.log('Project created:', project)
  console.log('Error:', projectError)
  
  // 3. 自分をメンバーに追加
  const { data: member, error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: (await supabase.auth.getUser()).data.user.id,
      role: 'admin'
    })
    .select()
    .single()
  
  console.log('Member added:', member)
  console.log('Error:', memberError)
}
```

### 3. データアクセスのテスト

```typescript
// 他人のプロジェクトにアクセスできないことを確認
async function testRLS() {
  const supabase = await createClient()
  
  // 自分のプロジェクトのみ取得されるはず
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
  
  console.log('Accessible projects:', projects)
  
  // 特定のプロジェクトのobjectivesを取得
  // メンバーでない場合は空配列が返されるはず
  const { data: objectives } = await supabase
    .from('objectives')
    .select('*')
    .eq('project_id', 'some-project-id')
  
  console.log('Objectives:', objectives)
}
```

---

## 📋 完全なSQLスクリプト

全ての修正を一度に適用するスクリプト：

```sql
-- ========================================
-- Step 1: 全テーブルでRLSを有効化
-- ========================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_item_monthly_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Step 2: 重要なポリシーを修正
-- ========================================

-- project_members の修正（最重要）
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) -- 自分自身を追加
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- projects の確認
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

-- users_profile の修正
DROP POLICY IF EXISTS "users_insert_own" ON users_profile;
CREATE POLICY "users_insert_own" ON users_profile
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_project_members" ON users_profile;
CREATE POLICY "users_select_project_members" ON users_profile
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid()
      AND pm2.user_id = users_profile.id
    )
  );

DROP POLICY IF EXISTS "users_update_own" ON users_profile;
CREATE POLICY "users_update_own" ON users_profile
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================================
-- Step 3: 確認
-- ========================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
```

---

## ⚠️ 注意事項

1. **バックアップを取る**
   - 本番環境で実行する前に、必ずデータベースのバックアップを取ってください

2. **段階的に適用**
   - まずは開発環境でテスト
   - 次にステージング環境でテスト
   - 最後に本番環境に適用

3. **既存データの確認**
   - RLS有効化後、既存のユーザーがデータにアクセスできることを確認

4. **Function の search_path 警告**
   - 現在のWarningについては、以下で修正可能：
   ```sql
   ALTER FUNCTION can_manage_project SET search_path = public, pg_temp;
   ALTER FUNCTION user_is_manager SET search_path = public, pg_temp;
   -- 他のfunctionも同様
   ```

---

## ✅ チェックリスト

- [ ] 全テーブルでRLSが有効化された
- [ ] `project_members_insert` ポリシーが修正された
- [ ] テストユーザーでプロジェクト作成が成功する
- [ ] 他人のプロジェクトが見えないことを確認
- [ ] 自分のプロジェクトのデータが正常に表示される
- [ ] 本番環境に適用する前にバックアップを取得

---

## 🆘 トラブルシューティング

### 問題: プロジェクト作成時に "new row violates RLS" エラー

**原因**: `created_by` フィールドが設定されていない

**解決**:
```typescript
// ❌ 間違い
await supabase.from('projects').insert({ name: 'Test' })

// ✅ 正しい
const user = (await supabase.auth.getUser()).data.user
await supabase.from('projects').insert({
  name: 'Test',
  created_by: user.id  // 必須
})
```

### 問題: メンバー追加時に "new row violates RLS" エラー

**原因**: 修正前の `project_members_insert` ポリシーが適用されている

**解決**: 上記のSQLスクリプトで `project_members_insert` ポリシーを再作成

---

このガイドに従えば、RLSを有効化しながら全ての機能が正常に動作するはずです！
