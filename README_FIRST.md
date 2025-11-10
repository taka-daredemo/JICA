# 🚨 重要：RLS問題 - 必ずお読みください

## 📍 現在の状況

**致命的なセキュリティ問題が発見されました：**

```
❌ 全テーブルでRow Level Security (RLS)が無効化されています
❌ このままパブリッシュすると、全データが誰でもアクセス可能です
```

---

## ⚠️ 今すぐ確認すべきこと

### あなたの質問への回答：

> **「Boltでこのエラーが出ているが、そのままパブリッシュすると致命的なものはある？」**

### 答え：**はい、致命的です** 🔴

RLS無効のままパブリッシュすると：

1. ✅ **全プロジェクトのデータが誰でも削除可能**
2. ✅ **全ユーザーの個人情報が誰でも閲覧可能**
3. ✅ **予算情報が誰でも改ざん可能**
4. ✅ **攻撃者が全プロジェクトの管理者になれる**
5. ✅ **個人情報保護法・GDPR違反のリスク**
6. ✅ **JICAとの契約違反のリスク**

---

## 📚 ドキュメント構成

### 1. **BOLT_FIX_RLS_NOW.md** ⭐ 今すぐこれを読んでください
**最優先・最短の修正手順（10分で実行可能）**

```
内容：
├─ 問題の説明
├─ 今すぐ実行するSQLスクリプト
├─ テスト手順
└─ トラブルシューティング
```

**こんな人向け：**
- とにかく早く問題を解決したい
- Boltで実装している
- SQLをコピペしてすぐ実行したい

**使い方：**
1. このファイルを開く
2. SQLをSupabase SQL Editorにコピペ
3. 実行
4. テストして確認

---

### 2. **FIX_RLS_FOR_CURRENT_PROJECT.md** 📖 完全版
**詳細な修正ガイド（30分で理解可能）**

```
内容：
├─ 問題の詳細な説明
├─ 全テーブルのRLS設定
├─ project_membersポリシーの修正（重要）
├─ その他の重要ポリシー
├─ テストコード例
└─ 完全なSQLスクリプト
```

**こんな人向け：**
- RLSの仕組みを理解したい
- プロジェクト固有の問題を解決したい
- 各ポリシーの意味を知りたい
- カスタマイズが必要

---

### 3. **RLS_DISABLED_RISKS.md** 🔴 リスク評価
**RLS無効でパブリッシュした場合のリスク詳細**

```
内容：
├─ 致命的リスクの具体例
├─ 攻撃シナリオ
├─ 法的リスク
├─ コスト評価
├─ 推奨アクション
└─ 意思決定マトリクス
```

**こんな人向け：**
- リスクを正確に把握したい
- 経営陣・JICAへの報告資料が必要
- なぜRLSが必須なのか理解したい

---

## 🎯 推奨される対応フロー

### パターンA：今すぐ修正（推奨）

```
1. BOLT_FIX_RLS_NOW.md を開く（2分）
2. SQLスクリプトをコピー（1分）
3. Supabase SQL Editorで実行（5分）
4. テスト実施（5分）
5. 完了！
```

**所要時間**: 約15分

---

### パターンB：しっかり理解してから修正

```
1. RLS_DISABLED_RISKS.md でリスクを理解（10分）
2. FIX_RLS_FOR_CURRENT_PROJECT.md で詳細を学習（30分）
3. BOLT_FIX_RLS_NOW.md のSQLを実行（5分）
4. テスト実施（10分）
5. 完了！
```

**所要時間**: 約60分

---

### パターンC：チーム対応

```
開発者: BOLT_FIX_RLS_NOW.md で即座に修正
マネージャー: RLS_DISABLED_RISKS.md でリスク把握
全員: FIX_RLS_FOR_CURRENT_PROJECT.md でレビュー
```

---

## 🚀 クイックスタート（最速5分）

### ステップ1: Supabase Dashboardにログイン
https://supabase.com/dashboard

### ステップ2: SQL Editorを開く
左メニュー → SQL Editor → New Query

### ステップ3: 以下のSQLを貼り付けて実行

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

-- プロジェクト作成の問題を修正
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id)
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
```

### ステップ4: アプリでテスト
- プロジェクトを新規作成できることを確認
- 自分のプロジェクトが表示されることを確認
- 他人のプロジェクトが見えないことを確認

---

## ❓ FAQ

### Q1: 「RLSを使うと一部機能が動かなくなる」問題は？

**A**: それは`project_members_insert`ポリシーの設計ミスです。

**問題のあるポリシー**:
```sql
-- ❌ 新規プロジェクト作成時に動かない
CREATE POLICY ... WITH CHECK (
  EXISTS (SELECT ... WHERE role = 'admin')  -- まだadminが存在しない！
)
```

**修正版**:
```sql
-- ✅ 自分自身を追加できる
CREATE POLICY ... WITH CHECK (
  (auth.uid() = user_id)  -- 自分を追加する場合はOK
  OR EXISTS (...)
)
```

詳細は`BOLT_FIX_RLS_NOW.md`のステップ2を参照。

---

### Q2: パブリッシュまでに時間がない場合は？

**A**: 最低限、以下だけでも実行してください（5分）：

```sql
-- 全テーブルでRLSを有効化（上記のALTER TABLE文）
-- project_membersポリシーの修正（上記のDROP & CREATE POLICY）
```

残りは後からでも追加可能です。

---

### Q3: RLSを有効化すると既存データが見えなくなる？

**A**: はい、一時的に見えなくなります。以下で修正：

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

### Q4: 本番環境でこれを実行しても大丈夫？

**A**: はい、以下の手順で安全に実行できます：

1. **バックアップを取る**（Supabase Dashboard → Database → Backups）
2. **開発環境でテスト**（可能であれば）
3. **メンテナンスウィンドウで実行**（ユーザーが少ない時間帯）
4. **段階的にロールバック可能**（問題があれば`DISABLE ROW LEVEL SECURITY`で元に戻せる）

---

## 📊 ドキュメント比較表

| ドキュメント | 読了時間 | 詳細度 | 対象者 | 優先度 |
|------------|---------|-------|-------|-------|
| BOLT_FIX_RLS_NOW.md | 5-10分 | ⭐⭐ | 実装者 | 🔴 最優先 |
| FIX_RLS_FOR_CURRENT_PROJECT.md | 30-60分 | ⭐⭐⭐⭐⭐ | 開発者 | 🟠 高 |
| RLS_DISABLED_RISKS.md | 20-30分 | ⭐⭐⭐⭐ | マネージャー | 🟡 中 |

---

## 🎯 推奨される行動

### 今すぐ（5分以内）
1. ✅ `BOLT_FIX_RLS_NOW.md`を開く
2. ✅ クイックスタートのSQLを実行

### 今日中（1時間以内）
1. ✅ アプリでテスト実施
2. ✅ `FIX_RLS_FOR_CURRENT_PROJECT.md`を読む
3. ✅ 追加のポリシー修正を実施

### 今週中
1. ✅ `RLS_DISABLED_RISKS.md`を読んでリスクを把握
2. ✅ チームメンバーに共有
3. ✅ JICAへの報告準備（必要に応じて）

---

## 🚨 結論

### RLS無効のままパブリッシュしないでください！

**理由**:
- 🔴 致命的なセキュリティリスク
- 🔴 法的リスク（個人情報保護法・GDPR違反）
- 🔴 JICAとの契約違反のリスク
- 🔴 データ削除・改ざん・漏洩のリスク

**推奨アクション**:
1. ✅ **今すぐ** `BOLT_FIX_RLS_NOW.md` の手順を実行
2. ✅ テストして動作確認
3. ✅ 問題があれば `FIX_RLS_FOR_CURRENT_PROJECT.md` を参照

---

## 📞 サポート

問題が解決しない場合：
1. `FIX_RLS_FOR_CURRENT_PROJECT.md`のトラブルシューティングを確認
2. Supabaseのログを確認（Dashboard → Logs）
3. ブラウザのコンソールでエラーを確認（F12）

---

**すぐに対応してください！あなたのプロジェクトのセキュリティはあなた次第です。** 🔒

---

## 📁 ファイル一覧

```
プロジェクトルート/
├── README_FIRST.md                      ← このファイル（概要）
├── BOLT_FIX_RLS_NOW.md                  ← 最優先・最短修正手順
├── FIX_RLS_FOR_CURRENT_PROJECT.md       ← 完全な修正ガイド
└── RLS_DISABLED_RISKS.md                ← リスク評価詳細
```

**まず `BOLT_FIX_RLS_NOW.md` を開いてください！** ⚡
