# 功能優先雙路徑計畫

> 目標：以新後台為主，先完成功能可用與可驗證；補強項目先完整列出，之後有時間再補。

## 路徑 A：主軸先完成功能（現在進行）

### A1. 一次確認核心可用（每次改完都跑）
1. `npm run check`
2. `npm run build`
3. API 冒煙：
   - `POST /api/auth/login`
   - `GET /api/dashboard`
   - `GET /api/players`
   - `GET /api/room-cards/balances`
   - `GET /api/room-cards/logs`
   - `GET /api/recharge-orders`

### A2. 功能完成定義（本階段 Done Criteria）
1. 新後台可在 legacy DB 下穩定查詢（不因舊 schema 缺少新表而 500）。
2. room-cards / recharge-orders / dashboard 的查詢語意一致。
3. readonly 模式下：查詢正常、寫入被正確阻擋。
4. 舊後台變更可追蹤（`/api/legacy-change/snapshot`、`/api/legacy-change/history`）。

### A3. 主軸剩餘工作（按順序）
1. 儀表板顯示 legacy 變更狀態（hasChanges / changedTables / capturedAt）完成後，做 UI 實測一次。
2. 將 room-cards 與 recharge-orders 的 legacy 映射規則做小幅校正（只修錯誤命中，不擴大範圍）。
3. 固定回歸腳本（同一組 API）並留結果，避免「看起來可用」但其實退化。

---

## 路徑 B：補強與治理（先記錄，後續補）

### B1. 監控自動化
1. legacy 快照排程（每 5~10 分鐘）。
2. 偵測異動後寫入統一稽核流（AuditLog）或獨立告警清單。

### B2. 可追溯性
1. 首頁增加「手動刷新快照」按鈕。
2. 顯示最近 N 次快照差異（表名、時間、是否變更）。

### B3. 穩定性
1. 修正本機 `start:dev` watcher 的 PID 清理衝突流程，避免 EADDRINUSE 反覆中斷。
2. 建立單一啟動慣例（僅保留一個 3000 服務程序）。

---

## 執行規則（簡版）
1. 任何新需求先判斷放 A 還是 B。
2. 只要會影響主功能可用性，一律先進 A。
3. B 不刪、不散落，集中在本文件維護。
4. 每完成一項 A，立刻更新狀態並重新跑 A1 驗證。

## 目前建議
- 現在只做路徑 A，先把「功能可用 + 可追蹤 + 可驗證」完整收斂。
