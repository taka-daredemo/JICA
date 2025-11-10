# 📚 RLS問題解決ドキュメント - 使い方ガイド

このプロジェクトには、Supabase Row Level Security (RLS) の問題を解決するための3つのドキュメントが用意されています。

## 📄 ドキュメント一覧

### 1. **RLS問題の解決方法.md** ⭐ まずはこちら
**最も簡潔な日本語ガイド - 5分で読める**

```
├─ 問題の説明
├─ 最速の解決策
├─ Boltへの指示テンプレート
└─ クイックリファレンス（よく使うSQL）
```

**こんな人におすすめ：**
- とにかく早く問題を解決したい
- 日本語で簡潔に理解したい
- Boltに何を指示すればいいか知りたい

---

### 2. **BOLT_INSTRUCTIONS.md** 🤖 Bolt専用
**Boltに渡す実装指示書 - 実行可能なSQLスクリプト付き**

```
├─ 問題の説明
├─ ステップバイステップの解決手順
├─ 全テーブル用のSQL（コピペ可能）
├─ コード例（TypeScript）
├─ デバッグ方法
└─ トラブルシューティング
```

**こんな人におすすめ：**
- Boltでプロジェクトを実装している
- すぐに実行できるSQLが欲しい
- コード例を見ながら実装したい

**使い方：**
1. このファイルをBoltにアップロード、または内容を共有
2. 「BOLT_INSTRUCTIONSに従ってRLSを設定してください」と指示
3. Boltが自動的にSupabase SQL Editorでスクリプトを実行

---

### 3. **SUPABASE_RLS_FIX_GUIDE.md** 📖 完全版
**最も詳細な技術ドキュメント - 全ての情報が含まれる**

```
├─ 問題の深い理解
├─ 複数の解決策（推奨・代替案）
├─ 詳細なRLSポリシーの説明
├─ Prismaとの統合方法
├─ セキュリティのベストプラクティス
├─ 開発・本番環境の違い
└─ 参考リンク集
```

**こんな人におすすめ：**
- RLSの仕組みを深く理解したい
- 複数の実装オプションを比較したい
- セキュリティを重視したい
- Prismaと併用している

---

## 🎯 推奨される使い方

### ケース1: とにかく急いでいる
```
1. 「RLS問題の解決方法.md」を読む（5分）
2. Supabase SQL Editorで提供されたSQLを実行
3. 解決！
```

### ケース2: Boltで実装中
```
1. 「BOLT_INSTRUCTIONS.md」をBoltに共有
2. 「このファイルの手順に従ってRLSを設定してください」と指示
3. Boltが自動実装
4. 動作確認
```

### ケース3: しっかり理解したい
```
1. 「RLS問題の解決方法.md」でざっくり理解（5分）
2. 「SUPABASE_RLS_FIX_GUIDE.md」で詳細を学習（20分）
3. 「BOLT_INSTRUCTIONS.md」のSQLを実行
4. 必要に応じてカスタマイズ
```

### ケース4: チーム開発
```
開発者A: 「RLS問題の解決方法.md」を読んで概要把握
開発者B: 「BOLT_INSTRUCTIONS.md」のSQLを実行
レビュワー: 「SUPABASE_RLS_FIX_GUIDE.md」でベストプラクティスを確認
```

---

## 🚀 クイックスタート（最速）

### ステップ1: SQLの実行（2分）

Supabase Dashboard → SQL Editor → 新しいクエリ → 以下をコピペして実行：

```sql
-- Taskテーブルの基本的なRLS設定
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_select_all" ON "Task"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_insert_all" ON "Task"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "task_update_own" ON "Task"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "createdById" OR auth.uid()::text = "assigneeId");

CREATE POLICY "task_delete_own" ON "Task"
  FOR DELETE TO authenticated USING (auth.uid()::text = "createdById");
```

全テーブルのSQLは **BOLT_INSTRUCTIONS.md** にあります。

### ステップ2: 動作確認（1分）

```typescript
// ログイン状態を確認
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// データ取得を確認
const { data, error } = await supabase.from('Task').select('*')
console.log('Tasks:', data, 'Error:', error)
```

---

## 🔍 よくある質問

### Q1: どのファイルから読めばいい？
**A:** 「RLS問題の解決方法.md」から始めてください。5分で概要がわかります。

### Q2: Boltに何を伝えればいい？
**A:** 以下のテンプレートを使ってください：

```
このプロジェクトはSupabase RLSを使用します。
「BOLT_INSTRUCTIONS.md」ファイルに従って、
Supabase SQL EditorでRLSポリシーを設定してください。

重要ポイント：
- 全テーブルでRLSを有効化
- 認証済みユーザーは全データを閲覧可能
- auth.uid()は必ず::textでキャスト
```

### Q3: SQLエラーが出た場合は？
**A:** 「BOLT_INSTRUCTIONS.md」のステップ2に既存ポリシーの削除方法があります。

### Q4: データがまだ表示されない場合は？
**A:** 「RLS問題の解決方法.md」のデバッグセクションを確認してください。

---

## 📊 ドキュメント比較表

| 特徴 | RLS問題の解決方法.md | BOLT_INSTRUCTIONS.md | SUPABASE_RLS_FIX_GUIDE.md |
|------|---------------------|---------------------|---------------------------|
| **読了時間** | 5分 | 10分 | 30分 |
| **言語** | 日本語 | 英語 | 英語 |
| **詳細度** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **実行可能SQL** | ○（一部） | ◎（全テーブル） | ◎（全テーブル） |
| **コード例** | △ | ○ | ◎ |
| **Bolt向け** | ○ | ◎ | ○ |
| **初心者向け** | ◎ | ○ | △ |
| **上級者向け** | △ | ○ | ◎ |

---

## 💡 ヒント

### Boltでの使用例
```
ファイルをアップロード → 「これを読んでRLSを設定して」

または

「BOLT_INSTRUCTIONS.mdの内容に従って、
SupabaseプロジェクトにRLSポリシーを設定してください。
SQL Editorで全てのSQLスクリプトを実行してください。」
```

### チームでの共有
```
Slack/Discord:
@team RLS問題が発生したので、以下のドキュメントを作成しました：
- クイックガイド: RLS問題の解決方法.md
- 実装手順: BOLT_INSTRUCTIONS.md  
- 詳細資料: SUPABASE_RLS_FIX_GUIDE.md

まずは「RLS問題の解決方法.md」を読んでください。
```

---

## 🎓 学習パス

### 初心者向け
```
1日目: RLS問題の解決方法.md を読む
2日目: BOLT_INSTRUCTIONS.md のSQLを実行
3日目: 自分のプロジェクトで動作確認
```

### 中級者向け
```
1日目: 全ドキュメントを読む
2日目: カスタムポリシーを作成
3日目: ロールベースのアクセス制御を実装
```

### 上級者向け
```
- SUPABASE_RLS_FIX_GUIDE.mdの全オプションを検討
- Prismaとの統合パターンを選択
- セキュリティ監査を実施
- チーム向けのベストプラクティスを確立
```

---

## ✅ チェックリスト

プロジェクトでRLSを実装する際のチェックリスト：

- [ ] 「RLS問題の解決方法.md」を読んだ
- [ ] 全テーブルのRLS設定SQLを実行した
- [ ] ログイン後にデータが表示されることを確認した
- [ ] 新規データの作成ができることを確認した
- [ ] 自分のデータのみ編集できることを確認した
- [ ] コンソールにエラーが出ていないことを確認した
- [ ] `service_role`キーがクライアントサイドで使用されていないことを確認した
- [ ] チームメンバーにドキュメントを共有した

---

## 🆘 サポート

問題が解決しない場合：

1. **デバッグセクションを確認**
   - 各ドキュメントにデバッグ方法が記載されています

2. **エラーメッセージをコピー**
   - ブラウザのコンソール（F12）を確認
   - エラーメッセージ全文をコピー

3. **Supabaseダッシュボードで確認**
   - SQL Editor → `SELECT * FROM pg_policies WHERE schemaname = 'public';`
   - 既存のポリシーを確認

4. **一時的な回避策**
   - 開発環境でのみRLSを無効化
   - `ALTER TABLE "テーブル名" DISABLE ROW LEVEL SECURITY;`
   - ⚠️ 本番環境では絶対に使用しないこと

---

## 📌 まとめ

- **急いでいる** → 「RLS問題の解決方法.md」
- **Bolt使用中** → 「BOLT_INSTRUCTIONS.md」
- **詳しく学びたい** → 「SUPABASE_RLS_FIX_GUIDE.md」

すべてのドキュメントはGitHubリポジトリのルートディレクトリにあります。

Happy coding! 🚀
