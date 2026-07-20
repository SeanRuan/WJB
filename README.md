# Wujibackstage

新後台後端專案，使用 NestJS + Prisma + SQL Server。

## 目前定位

- 先做客服與營運會用到的核心功能
- 先以可查詢、可追蹤、可控風險為主
- 寫入功能預設受 `DATABASE_ACCESS_MODE=readonly` 保護

## 主要功能

- 玩家查詢與狀態管理
- 儲值核帳
- 房卡餘額與異動查詢
- Legacy 異動追蹤
- 公會建立、編輯、拆散與成員管理
- 後台稽核紀錄

## 快速啟動

1. 複製 `.env.example` 成 `.env`
2. 安裝相依套件：`npm install`
3. 開發模式先用 `DATA_SOURCE=mock`
4. 產生 Prisma client：`npm run prisma:generate`
5. 啟動開發伺服器：`npm run start:dev`

## 切到 MSSQL

1. 將 `DATA_SOURCE` 改成 `prisma`
2. 把 `DATABASE_URL` 改成可用的 MSSQL 連線字串
3. 如需比對現有資料表，執行 `npm run prisma:pull`
4. 重新啟動 `npm run start:dev`

## 安全規則

- 不要直接連生產資料庫
- 先用 staging 或唯讀 replica
- `readonly` 模式下，寫入 API 會被封鎖
- Prisma 的寫入操作也有第二層保護

## Git / GitHub

- 預設分支：`main`
- 先在 feature branch 開發，再合併回主線
- 不要把 `.env`、`node_modules`、`dist` 推上去

## 分享給朋友

- 如果只是要看程式碼，直接分享 GitHub repo 連結即可：`https://github.com/SeanRuan/WJB`
- 如果 repo 是私人倉庫，先到 GitHub 的 Settings > Collaborators 邀請朋友
- 如果朋友要本機執行，請他先 `git clone`，再依照這份 README 的快速啟動步驟設定 `.env`
- 如果你只想分享最新版本，先確認 `main` 已經 `git push` 到 GitHub

可直接貼給朋友：

```
我把專案放在 GitHub 了：
https://github.com/SeanRuan/WJB

如果你只是想看程式碼，直接開連結就行。
如果要本機跑，先 git clone，再照 README 建立 .env、npm install、npm run prisma:generate、npm run start:dev。
```

## 交接文件

- [HANDOFF.md](HANDOFF.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [RELEASE_NOTES.md](RELEASE_NOTES.md)
- [BRANCHING.md](BRANCHING.md)
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)

## Scripts

- `npm run start:dev` 開發模式
- `npm run build` 編譯專案
- `npm run check` TypeScript 檢查
- `npm run prisma:generate` 產生 Prisma client
- `npm run prisma:pull` 讀取 MSSQL schema
