# 🚨 Bolt緊急対応: RLS有効化手順

## 現在の状況

❌ **全テーブルでRLSが無効化されています**
- ポリシーは作成済みだが、RLSが有効化されていない
- このままパブリッシュすると致命的なセキュリティリスクあり

## ✅ 今すぐ実行する手順

### ステップ1: Supabase SQL Editorで以下を実行

```sql
-- ========================================
-- 全テーブルでRLSを有効化
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
```

---

### ステップ2: プロジェクト作成の問題を修正

**問題**: 新規プロジェクト作成時、作成者が自分をproject_membersに追加できない

**解決**: 以下のSQLを実行

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "project_members_insert" ON project_members;

-- 修正版: 自分自身を追加可能にする
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    -- 自分自身を追加する場合は常に許可
    (auth.uid() = user_id)
    OR
    -- または既存の管理者である
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
```

---

### ステップ3: その他の重要なポリシーを修正

```sql
-- ========================================
-- projects テーブル
-- ========================================
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

-- ========================================
-- users_profile テーブル
-- ========================================
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
```

---

### ステップ4: 確認

```sql
-- RLSが有効になっていることを確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 結果: rowsecurity = true であること
```

---

## 🧪 テスト手順

### 1. プロジェクト作成のテスト

```typescript
// アプリで以下を実行
async function testCreateProject() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. プロジェクト作成
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: 'Test Project',
      description: 'Test',
      created_by: user.id  // 重要
    })
    .select()
    .single()
  
  if (projectError) {
    console.error('❌ Project creation failed:', projectError)
    return
  }
  console.log('✅ Project created:', project)
  
  // 2. 自分をメンバーに追加
  const { data: member, error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: user.id,
      role: 'admin'
    })
    .select()
    .single()
  
  if (memberError) {
    console.error('❌ Member add failed:', memberError)
    return
  }
  console.log('✅ Member added:', member)
}
```

### 2. データアクセスのテスト

```typescript
// 自分のプロジェクトのみ表示されることを確認
async function testDataAccess() {
  const supabase = await createClient()
  
  // プロジェクト一覧を取得
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
  
  console.log('Accessible projects:', projects?.length)
  // 期待: 自分がメンバーのプロジェクトのみ表示
}
```

---

## ⚠️ トラブルシューティング

### 問題1: "new row violates row-level security policy"

**原因**: `created_by` が設定されていない

**解決**:
```typescript
// ❌ 間違い
await supabase.from('projects').insert({ name: 'Test' })

// ✅ 正しい
const user = (await supabase.auth.getUser()).data.user
await supabase.from('projects').insert({
  name: 'Test',
  created_by: user.id
})
```

### 問題2: プロジェクト作成後、メンバー追加ができない

**原因**: `project_members_insert` ポリシーが修正されていない

**解決**: ステップ2のSQLを再実行

### 問題3: 既存のプロジェクトが表示されない

**原因**: `project_members` にレコードがない

**一時的な解決**（開発環境のみ）:
```sql
-- 既存プロジェクトの作成者をメンバーに追加
INSERT INTO project_members (project_id, user_id, role)
SELECT id, created_by, 'admin'
FROM projects
WHERE created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM project_members pm
  WHERE pm.project_id = projects.id
  AND pm.user_id = projects.created_by
);
```

---

## 📋 チェックリスト

実行後、以下を確認してください：

- [ ] ステップ1のSQLを実行（全テーブルのRLS有効化）
- [ ] ステップ2のSQLを実行（project_membersポリシー修正）
- [ ] ステップ3のSQLを実行（その他ポリシー修正）
- [ ] ステップ4で全テーブルの`rowsecurity = true`を確認
- [ ] テストユーザーでプロジェクト作成が成功
- [ ] 作成したプロジェクトが表示される
- [ ] 他人のプロジェクトが表示されない
- [ ] コンソールにエラーが出ていない

---

## 🚨 重要

### RLS無効のままパブリッシュした場合のリスク：

1. ❌ **全データが誰でも読み書き可能**
2. ❌ **個人情報・予算情報の漏洩**
3. ❌ **データの改ざん・削除**
4. ❌ **法的リスク（個人情報保護法違反）**
5. ❌ **JICAとの契約違反の可能性**

詳細は `RLS_DISABLED_RISKS.md` を参照してください。

---

## 📚 詳細ドキュメント

- `FIX_RLS_FOR_CURRENT_PROJECT.md` - 完全な修正ガイド
- `RLS_DISABLED_RISKS.md` - リスク評価の詳細

---

**今すぐRLSを有効化してください！** 🔒
