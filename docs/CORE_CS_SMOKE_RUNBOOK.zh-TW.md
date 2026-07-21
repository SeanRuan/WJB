# Core Customer-Service Smoke Runbook (zh-TW)

這份文件提供「核心客服流程」的一鍵回歸檢查說明，目標是每次版更後快速確認高風險寫入路徑仍正常。

## 適用範圍

- 儲值核帳（review note 必填、成功駁回）
- 管理員停權（reason 必填、不可重複停權、不可自我停權）
- 公會成員操作（新增/改角色/移出，note 必填）
- 公會申請審核（approve/reject，reviewNote 必填）

## 前置條件

1. 伺服器可用且 `DATA_SOURCE=mock`
2. 已安裝套件（`npm install`）
3. 後端可對外服務（預設 `http://127.0.0.1:3000`）
4. 可使用測試帳號登入：`owner@wuji.test / mock-owner-pass`

## 標準執行順序

1. 先做靜態檢查

```powershell
npm run check
```

2. 再跑核心總驗證

```powershell
npm run smoke:core-cs
```

3. 出現下列字樣才算通過

```text
[CORE-CS] All core customer-service smoke tests passed.
```

## 各 smoke 指令用途

- `npm run smoke:recharge-review`: 核帳必填原因 + 駁回成功
- `npm run smoke:admin-disable`: 停權必填原因 + 重複停權防呆 + 自我停權防呆
- `npm run smoke:guild-member`: 公會成員新增/改角/移出必填 note 與成功路徑
- `npm run smoke:guild-approval-review`: 公會申請 approve/reject 必填 reviewNote 與成功路徑
- `npm run smoke:core-cs`: 依序聚合執行上述四支 smoke

## 失敗排查

### 1) `Internal server error`（HTTP 500）

處理步驟：

1. 重啟後端

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/backend_control.ps1 -Action restart -Port 3000
```

2. 先單獨跑失敗那支 smoke，縮小範圍

```powershell
npm run smoke:guild-approval-review
```

3. 再跑總驗證確認

```powershell
npm run smoke:core-cs
```

### 2) `不可為空白` 類訊息不一致

說明：
- DTO 多為 `Matches(/\S/)`，訊息可能是 `reason 不可為空白`、`note 不可為空白`、`reviewNote 不可為空白`。
- smoke 允許以關鍵字匹配，不要求完全一致句子。

處理步驟：
1. 先確認是「語意一致但文案不同」還是「規則失效」。
2. 若規則仍生效，只需調整 smoke 的關鍵字匹配。
3. 若規則失效，先修 service/DTO 再更新 smoke。

### 3) 權限或登入失敗（401/403）

處理步驟：
1. 確認帳密仍是 `owner@wuji.test / mock-owner-pass`。
2. 確認 token 未被舊環境污染（重啟服務後重跑）。
3. 使用 owner 角色執行需要 manager/owner 權限的流程。

### 4) Mock 測試資料持續增加

說明：
- smoke 會新增 mock 訂單、管理員、公會申請等資料，這是預期行為。

建議：
1. 先接受「可追蹤累積」策略（每次 smoke 可在清單看到新紀錄）。
2. 若要重置，執行下列指令清理 `.cache/mock-state`。

```powershell
npm run smoke:reset-mock-state
```

3. 清理後重啟服務，再重跑 smoke。

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/backend_control.ps1 -Action restart -Port 3000
npm run smoke:core-cs
```

## 版更後建議節奏

1. 先 `npm run check`
2. 再 `npm run smoke:core-cs`
3. 綠燈後才更新文件或發佈說明
4. 若文件有改指令或流程，最後再跑一次 `npm run smoke:core-cs`
