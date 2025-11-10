# RLS無効でパブリッシュした場合のリスク評価

## 🔴 致命的リスク（Critical）

### 1. データ改ざん・削除のリスク

**リスクレベル**: 🔴🔴🔴🔴🔴 (5/5)

```javascript
// 攻撃者が実行可能な操作（RLS無効の場合）
const supabase = createClient(
  'https://gznoeweunqdjqbrtfjmo.supabase.co',  // 公開URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'   // 公開anonキー
)

// 全プロジェクトを削除
await supabase.from('projects').delete().neq('id', '00000000')

// 全予算データを0に設定
await supabase.from('budgets').update({ total_budget: 0 })

// 全タスクを完了済みに変更
await supabase.from('tasks').update({ status: 'completed' })
```

**影響範囲**:
- ✅ 全ユーザーのデータが削除可能
- ✅ プロジェクト管理が完全停止
- ✅ 復旧に多大な時間とコストが必要

---

### 2. 個人情報・機密情報の漏洩

**リスクレベル**: 🔴🔴🔴🔴🔴 (5/5)

```javascript
// 全ユーザーの個人情報を取得
const { data: users } = await supabase
  .from('users_profile')
  .select('*')

// 全プロジェクトの予算情報を取得
const { data: budgets } = await supabase
  .from('budgets')
  .select('*, budget_items(*), expenses(*)')

// 受益者の個人情報を取得
const { data: beneficiaries } = await supabase
  .from('beneficiaries')
  .select('*')
```

**法的リスク**:
- ❌ 個人情報保護法違反（日本）
- ❌ GDPR違反（EU市民のデータがある場合）
- ❌ JICAとの契約違反の可能性
- ❌ 損害賠償請求のリスク

**影響範囲**:
- ユーザーの氏名、メールアドレス、電話番号
- プロジェクトの予算情報
- 受益者の個人情報
- セミナー参加者情報

---

### 3. 不正アクセス・権限昇格

**リスクレベル**: 🔴🔴🔴🔴🔴 (5/5)

```javascript
// 攻撃者が自分を全プロジェクトの管理者に追加
const { data: projects } = await supabase
  .from('projects')
  .select('id')

for (const project of projects) {
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: '攻撃者のID',
    role: 'admin'  // 管理者権限を付与
  })
}
```

**影響範囲**:
- ✅ 全プロジェクトへの不正アクセス
- ✅ データの改ざん・削除
- ✅ 正規ユーザーのアクセス権限の剥奪

---

### 4. 予算情報の改ざん

**リスクレベル**: 🔴🔴🔴🔴 (4/5)

```javascript
// 予算データの改ざん
await supabase.from('budgets').update({
  total_budget: 999999999,
  currency: 'USD'
}).eq('project_id', 'target-project')

// 経費データの改ざん
await supabase.from('expenses').update({
  amount: 0
})

// 予算配分の変更
await supabase.from('budget_allocations').update({
  allocated_amount: 0
})
```

**JICA報告への影響**:
- ❌ 不正確な予算報告
- ❌ 会計監査で問題発覚
- ❌ プロジェクト資金の停止
- ❌ 組織の信用失墜

---

## 🟠 重大リスク（High）

### 5. APIキーの悪用

**リスクレベル**: 🟠🟠🟠🟠 (4/5)

現在、以下の情報が公開されています：
```
NEXT_PUBLIC_SUPABASE_URL=https://gznoeweunqdjqbrtfjmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**攻撃手法**:
1. ブラウザの開発者ツールでキーを取得
2. 自動スクリプトで大量データを取得
3. データベースを過負荷にする（DoS攻撃）

**影響**:
- サービス停止
- 過剰なSupabase料金請求
- データベースのパフォーマンス低下

---

### 6. 競合情報の漏洩

**リスクレベル**: 🟠🟠🟠 (3/5)

```javascript
// 他組織のプロジェクト情報を取得
const { data } = await supabase
  .from('projects')
  .select('*, objectives(*), activities(*), budgets(*)')
  .neq('created_by', auth.uid())

// 競合分析に利用される可能性
```

**ビジネスリスク**:
- プロジェクト戦略の漏洩
- 予算情報の漏洩
- 競合優位性の喪失

---

## 🟡 中程度リスク（Medium）

### 7. データの不整合

**リスクレベル**: 🟡🟡🟡 (3/5)

```javascript
// 関連データの不整合を引き起こす操作
await supabase.from('objectives').delete().eq('project_id', 'X')
// activitiesが孤立したobjectiveを参照

await supabase.from('budgets').update({ total_budget: -1000 })
// 負の予算
```

**影響**:
- データ整合性の喪失
- アプリケーションエラー
- レポート生成の失敗

---

## 📊 具体的な攻撃シナリオ

### シナリオ1: 悪意のある元メンバー

```
1. プロジェクトから削除された元メンバー
2. ブラウザのキャッシュに残っているanonキーを使用
3. 自分を再度管理者として追加
4. プロジェクトデータを全て削除
5. 証拠隠滅のためにログも削除
```

**対策なし（RLS無効）の場合**: 防ぐ手段なし

**対策あり（RLS有効）の場合**: 
- 元メンバーはデータにアクセス不可
- project_membersへの追加も不可

---

### シナリオ2: ライバル組織のスパイ

```
1. 公開されたWebアプリを解析
2. anonキーとSupabase URLを取得
3. 全プロジェクトのデータをダウンロード
4. 予算情報、活動内容、受益者リストを取得
5. 競合入札で有利な立場を獲得
```

**対策なし（RLS無効）の場合**: 完全に情報が漏洩

**対策あり（RLS有効）の場合**: 
- 認証なしではデータにアクセス不可
- 他組織のプロジェクトは見えない

---

### シナリオ3: 自動化された大量攻撃

```python
# Botによる攻撃スクリプト
import supabase

client = supabase.create_client(PUBLIC_URL, PUBLIC_ANON_KEY)

# 1秒に100回のリクエスト
while True:
    # 全データを削除
    client.table('projects').delete().neq('id', '0').execute()
    # データを再挿入（スパムデータ）
    client.table('projects').insert({'name': 'SPAM'*1000}).execute()
```

**影響**:
- サービスダウン
- データベース容量の圧迫
- 高額なSupabase料金

---

## ✅ RLS有効化による防御

### 防御できる攻撃

| 攻撃タイプ | RLS無効 | RLS有効 |
|----------|---------|---------|
| 他人のプロジェクトの閲覧 | ✅ 可能 | ❌ 不可能 |
| 他人のプロジェクトの編集 | ✅ 可能 | ❌ 不可能 |
| 他人のプロジェクトの削除 | ✅ 可能 | ❌ 不可能 |
| 不正な管理者権限の取得 | ✅ 可能 | ❌ 不可能 |
| 個人情報の一括取得 | ✅ 可能 | ❌ 不可能 |
| 予算データの改ざん | ✅ 可能 | ❌ 不可能 |
| DoS攻撃（一部） | ✅ 可能 | ⚠️ 軽減 |

---

## 💰 コスト評価

### RLS無効のまま運用するコスト

#### 1. セキュリティインシデント発生時
```
データ漏洩対応費用: ¥5,000,000 - ¥50,000,000
- 調査費用
- 通知費用（全ユーザー・JICA）
- 法的対応費用
- システム復旧費用
- 信用回復費用
```

#### 2. 日常的なリスク管理コスト
```
追加のセキュリティ対策: ¥500,000 - ¥2,000,000/年
- WAF（Web Application Firewall）の導入
- 不正アクセス検知システム
- 24時間監視体制
- 定期的なセキュリティ監査
```

#### 3. 法的リスク
```
個人情報保護法違反の罰金: 最大¥100,000,000
損害賠償請求: 被害者数 × ¥10,000 - ¥100,000
契約違反によるペナルティ: JICA契約金額の一部返還
```

---

### RLS有効化のコスト

```
開発工数: 2-5営業日
- RLSポリシーの修正
- テストの実施
- ドキュメント作成

追加ランニングコスト: ¥0
- Supabaseの基本機能のため追加料金なし
```

**ROI（投資対効果）**: 圧倒的にRLS有効化が有利

---

## 🎯 推奨アクション

### 最優先（今すぐ実行）

1. **RLSを有効化** - `FIX_RLS_FOR_CURRENT_PROJECT.md` の手順に従う
2. **プロジェクト作成フローの修正** - `project_members_insert` ポリシーを修正
3. **テスト実施** - 全機能が正常に動作することを確認

### 短期（1週間以内）

1. **セキュリティ監査** - 全てのRLSポリシーをレビュー
2. **アクセスログの確認** - 不正アクセスがないか確認
3. **バックアップ体制の確立** - 定期的なバックアップ

### 中期（1ヶ月以内）

1. **セキュリティドキュメントの整備**
2. **インシデント対応手順の作成**
3. **定期的なセキュリティレビューの実施**

---

## 📋 意思決定マトリクス

| オプション | セキュリティ | 開発工数 | 運用コスト | 推奨度 |
|----------|------------|---------|-----------|-------|
| RLS有効化 | ⭐⭐⭐⭐⭐ | 2-5日 | 低 | ✅ 強く推奨 |
| RLS無効のまま | ⭐ | 0日 | 非常に高 | ❌ 非推奨 |
| 代替セキュリティ対策 | ⭐⭐⭐ | 10-20日 | 高 | ⚠️ 現実的でない |

---

## ❓ FAQ

### Q: 開発中だけRLSを無効化してもいい？
**A**: ❌ 推奨しません。開発環境でもテストデータに個人情報が含まれる可能性があります。

### Q: RLSの代わりにアプリケーション層で権限チェックできる？
**A**: ⚠️ 可能ですが、以下の理由で推奨しません：
- Supabase Clientを直接使う場合、バイパス可能
- 実装ミスのリスクが高い
- RLSは"最後の砦"として必須

### Q: パフォーマンスへの影響は？
**A**: ✅ 適切に設計すれば影響は最小限：
- インデックスを適切に設定
- ポリシーのクエリを最適化
- 実測でほぼ差なし（数ms程度）

### Q: RLS有効化後に問題が起きたら？
**A**: ✅ 段階的にロールバック可能：
```sql
-- 特定のテーブルだけ無効化
ALTER TABLE テーブル名 DISABLE ROW LEVEL SECURITY;

-- 全て無効化（緊急時のみ）
-- 上記コマンドを全テーブルに実行
```

---

## 🚨 結論

### RLS無効のままパブリッシュすることは：

❌ **絶対に推奨しません**

**理由**:
1. 致命的なセキュリティリスク（データ削除・改ざん・漏洩）
2. 法的リスク（個人情報保護法違反、GDPR違反）
3. ビジネスリスク（信用失墜、契約違反）
4. 財務リスク（損害賠償、高額な対策費用）

**推奨される行動**:
1. ✅ `FIX_RLS_FOR_CURRENT_PROJECT.md` に従ってRLSを有効化
2. ✅ 十分なテストを実施
3. ✅ 段階的にデプロイ（開発→ステージング→本番）

**RLS有効化は必須のセキュリティ対策です。** 🔒

---

詳細な修正手順は `FIX_RLS_FOR_CURRENT_PROJECT.md` を参照してください。
