import { Controller, Get, Header } from '@nestjs/common';

@Controller('admin')
export class AdminUiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getAdminPage() {
    const isReadonlyMode = process.env.DATABASE_ACCESS_MODE === 'readonly';

    return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Wujibackstage 管理後台</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: rgba(17, 24, 39, 0.86);
      --panel-2: rgba(30, 41, 59, 0.9);
      --text: #e5eefb;
      --muted: #94a3b8;
      --line: rgba(148, 163, 184, 0.18);
      --accent: #5eead4;
      --accent-2: #60a5fa;
      --danger: #f87171;
      --warn: #fbbf24;
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, "Noto Sans TC", system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 30%),
        radial-gradient(circle at top right, rgba(94, 234, 212, 0.12), transparent 22%),
        linear-gradient(180deg, #090d19 0%, #0b1020 100%);
      min-height: 100vh;
    }
    .shell {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    .hero {
      display: grid;
      gap: 16px;
      grid-template-columns: 1.35fr 0.85fr;
      align-items: stretch;
      margin-bottom: 20px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }
    .hero-main {
      padding: 24px;
    }
    .eyebrow {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 14px;
    }
    .title {
      margin: 0;
      font-size: clamp(30px, 5vw, 54px);
      line-height: 1.03;
    }
    .sub {
      margin: 14px 0 0;
      color: var(--muted);
      max-width: 64ch;
      line-height: 1.7;
    }
    .hero-side {
      display: grid;
      gap: 12px;
    }
    .login-panel, .status-panel {
      padding: 20px;
      background: var(--panel-2);
    }
    .guide-panel {
      padding: 20px;
      background: var(--panel-2);
    }
    .guide-panel h2 {
      margin: 0;
      font-size: 16px;
    }
    .guide-panel ol {
      margin: 10px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.6;
    }
    .guide-panel li + li {
      margin-top: 8px;
    }
    .subsection {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }
    .subsection:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
    .subsection-title {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .subsection-copy {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    label {
      display: block;
      font-size: 13px;
      color: #cbd5e1;
      margin: 0 0 8px;
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      color: var(--text);
      padding: 13px 14px;
      font-size: 14px;
      outline: none;
    }
    input:focus {
      border-color: rgba(94, 234, 212, 0.5);
      box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12);
    }
    .row {
      display: grid;
      gap: 12px;
    }
    .row-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .row-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .btns {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    button {
      border: 0;
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 700;
      color: #04111a;
      cursor: pointer;
      transition: transform 0.12s ease, opacity 0.12s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
    .primary { background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%); }
    .secondary { background: linear-gradient(135deg, var(--accent-2), #22c55e); }
    .ghost {
      background: rgba(148, 163, 184, 0.16);
      color: var(--text);
      border: 1px solid var(--line);
    }
    .danger { background: linear-gradient(135deg, #fb7185, #f97316); }
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 18px 0;
    }
    .metric {
      padding: 18px;
      min-height: 118px;
    }
    .metric .label { color: var(--muted); font-size: 13px; }
    .metric .value { font-size: 34px; font-weight: 800; margin-top: 8px; }
    .metric .hint { color: var(--muted); margin-top: 6px; font-size: 12px; }
    .section {
      padding: 20px;
      margin-top: 16px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 12px;
      margin-bottom: 14px;
    }
    .section-head h2 {
      margin: 0;
      font-size: 18px;
    }
    .section-head p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
      vertical-align: top;
    }
    th { color: #cbd5e1; font-weight: 700; }
    tr:hover td { background: rgba(148, 163, 184, 0.05); }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      background: rgba(148, 163, 184, 0.12);
      color: #dbeafe;
      border: 1px solid var(--line);
    }
    .pill.active { color: #86efac; }
    .pill.banned { color: #fca5a5; }
    .log {
      font-size: 13px;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
      color: #dbeafe;
    }
    .log:last-child { border-bottom: 0; }
    .log small { display: block; color: var(--muted); margin-top: 4px; }
    .muted { color: var(--muted); }
    .detail-card {
      margin-top: 14px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: rgba(2, 6, 23, 0.72);
      white-space: pre-wrap;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .split {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr 1fr;
    }
    .section-stack {
      display: grid;
      gap: 16px;
      margin-top: 16px;
    }
    .pill.pending { color: #fbbf24; }
    .pill.confirmed { color: #86efac; }
    .pill.rejected { color: #fca5a5; }
    .textarea {
      width: 100%;
      min-height: 92px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      color: var(--text);
      padding: 13px 14px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .textarea:focus {
      border-color: rgba(94, 234, 212, 0.5);
      box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12);
    }
    .output {
      white-space: pre-wrap;
      background: rgba(2, 6, 23, 0.72);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      min-height: 160px;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .footer-note {
      margin-top: 14px;
      font-size: 12px;
      color: var(--muted);
    }
    .actions-cell {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .compact { font-size: 12px; padding: 9px 12px; border-radius: 12px; }
    @media (max-width: 980px) {
      .hero, .grid, .split, .row-2, .row-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="hero">
      <div class="card hero-main">
        <div class="eyebrow">Wujibackstage · admin console</div>
        <h1 class="title">後台入口</h1>
        <p class="sub">先登入，然後你可以直接看儀表板摘要、查玩家、試著停權/復權。現在這個頁面就是給你「真的能摸」的入口；如果資料庫還是 readonly，寫入按鈕會照安全規則擋下。</p>
      </div>
      <div class="hero-side">
        <div class="card login-panel">
          <label for="email">帳號</label>
          <input id="email" value="admin" />
          <div style="height:10px"></div>
          <input id="password" type="password" value="16888" />
          <div class="btns">
            <button class="primary" id="loginBtn">登入</button>
            <button class="ghost" id="logoutBtn">登出</button>
          </div>
          <div class="footer-note" id="authNote">尚未登入</div>
        </div>
        <div class="card status-panel">
          <div class="muted">目前狀態</div>
          <div style="font-size:20px;font-weight:800;margin-top:6px" id="modeText">等待登入</div>
          <div class="footer-note">建議用 owner 或 manager 帳號操作玩家停權/復權。</div>
        </div>
        <div class="card guide-panel">
          <h2>怎麼看這個後台</h2>
          <ol>
            <li>先看「摘要 / 稽核」確認整體狀態，再進玩家查詢找人。</li>
            <li>要處理儲值就去「核帳管理」，按列看詳情，按按鈕做核准或駁回。</li>
            <li>要查房卡就去「房卡管理」，先用查詢玩家或來源類型縮小範圍，再看下方 log。</li>
          </ol>
        </div>
      </div>
    </div>

    ${isReadonlyMode ? '<div class="card section" style="border-color: rgba(248, 113, 113, 0.35); background: rgba(127, 29, 29, 0.22);"><strong>目前是 readonly 觀察模式</strong><div class="muted" style="margin-top:8px">核准、駁回與房卡調整會被後端拒絕。你仍可查詢資料、檢視摘要與稽核紀錄。</div></div>' : ''}

    <div class="grid" id="metrics"></div>

    <div class="section-stack">
      <div class="card section">
        <div class="section-head">
          <div>
            <h2>摘要 / 稽核</h2>
            <p>先看整體狀態，再往下操作。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshSummary">重新整理</button>
          </div>
        </div>
        <div class="output" id="summaryBox">尚未載入</div>
        <div style="height:14px"></div>
        <div id="auditBox"></div>
      </div>

      <div class="card section">
        <div class="section-head">
          <div>
            <h2>玩家查詢</h2>
            <p>查列表與單筆，並可直接切換狀態。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshPlayers">重新整理</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="playerSearch">關鍵字</label>
            <input id="playerSearch" placeholder="externalId / nickname" />
          </div>
          <div>
            <label for="playerStatus">狀態</label>
            <input id="playerStatus" placeholder="active / banned" />
          </div>
          <div>
            <label for="playerTake">筆數</label>
            <input id="playerTake" value="10" />
          </div>
        </div>
        <div style="overflow:auto;margin-top:14px">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>狀態</th>
                <th>房卡</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="playersBody"></tbody>
          </table>
        </div>
      </div>

      <div class="card section">
        <div class="section-head">
          <div>
            <h2>後台帳號 / 權限</h2>
            <p>這裡看的是後台管理員，不是遊戲玩家。方便確認 owner / manager / support 分工。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshAdminUsers">重新整理</button>
          </div>
        </div>
        <div style="overflow:auto">
          <table>
            <thead>
              <tr>
                <th>帳號</th>
                <th>角色 / 狀態</th>
                <th>建立時間</th>
              </tr>
            </thead>
            <tbody id="adminUsersBody"></tbody>
          </table>
        </div>
        <div class="detail-card" id="adminUserDetail">點選上方管理員可查看細節</div>
      </div>

      <div class="card section">
        <div class="section-head">
          <div>
            <h2>核帳管理</h2>
            <p>查看待核帳訂單，manager / owner 可核准或駁回。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshRechargeOrders">重新整理</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="rechargeStatus">狀態</label>
            <input id="rechargeStatus" placeholder="pending / confirmed / rejected" />
          </div>
          <div>
            <label for="rechargeTake">筆數</label>
            <input id="rechargeTake" value="10" />
          </div>
          <div>
            <label for="rechargeReviewNote">審核備註</label>
            <input id="rechargeReviewNote" placeholder="核准或駁回時使用" />
          </div>
        </div>
        <div style="overflow:auto;margin-top:14px">
          <table>
            <thead>
              <tr>
                <th>訂單</th>
                <th>玩家</th>
                <th>金額 / 房卡</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="rechargeOrdersBody"></tbody>
          </table>
        </div>
        <div class="detail-card" id="rechargeOrderDetail">點選上方任一核帳單可查看詳情</div>
      </div>

      <div class="card section">
        <div class="section-head">
          <div>
            <h2>房卡管理</h2>
            <p>查看餘額、最近異動，並可手動調整房卡。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshRoomCards">重新整理</button>
            <button class="ghost compact" id="clearRoomCardsFilters">清除</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="roomCardSearch">查詢玩家</label>
            <input id="roomCardSearch" placeholder="externalId / nickname" />
          </div>
          <div>
            <label for="roomCardSourceType">來源類型</label>
            <select id="roomCardSourceType">
              <option value="">全部來源</option>
              <option value="recharge">recharge</option>
              <option value="open_table">open_table</option>
              <option value="admin_adjust">admin_adjust</option>
            </select>
          </div>
          <div>
            <label for="roomCardTake">餘額筆數</label>
            <input id="roomCardTake" value="10" />
          </div>
        </div>
        <div class="row row-3" style="margin-top:12px">
          <div>
            <label for="adjustPlayerId">調整玩家 ID</label>
            <input id="adjustPlayerId" placeholder="mock_player_001" />
          </div>
          <div>
            <label for="adjustAmount">調整數量</label>
            <input id="adjustAmount" placeholder="例如 20 或 -10" />
          </div>
          <div>
            <label for="adjustNote">調整備註</label>
            <input id="adjustNote" placeholder="手動補卡 / 修正餘額" />
          </div>
          <div>
            <label for="roomCardLogTake">紀錄筆數</label>
            <input id="roomCardLogTake" value="10" />
          </div>
        </div>
        <div class="btns">
          <button class="secondary" id="submitRoomCardAdjust" data-write-action="room-card-adjust">送出調整</button>
        </div>
        <div style="overflow:auto;margin-top:14px">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>外部編號</th>
                <th>餘額</th>
                <th>更新時間</th>
              </tr>
            </thead>
            <tbody id="roomCardBalancesBody"></tbody>
          </table>
        </div>
        <div style="height:14px"></div>
        <div id="roomCardLogsBox"></div>
        <div class="detail-card" id="roomCardLogDetail">點選下方房卡異動紀錄可查看詳情</div>
      </div>

      <div class="card section">
        <div class="section-head">
          <div>
            <h2>公會管理</h2>
            <p>把「建立 / 編修 / 註銷 / 歷史 / 成員」拆開看，避免全部擠在一起。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshGuilds">重新整理公會</button>
            <button class="ghost compact" id="refreshGuildRequests">重新整理申請</button>
          </div>
        </div>
        <div class="split">
          <div>
            <div class="subsection">
              <h3 class="subsection-title">公會申請建立 / 編修 / 註銷</h3>
              <p class="subsection-copy">所有寫入先走申請，等主管核准後才真正套用到公會資料。</p>
            </div>
            <div class="row row-2">
              <div>
                <label for="guildRequestType">申請類型</label>
                <select id="guildRequestType">
                  <option value="create_guild">create_guild</option>
                  <option value="update_reference_rate">update_reference_rate</option>
                  <option value="revoke_guild">revoke_guild</option>
                </select>
              </div>
              <div id="guildRequestGuildIdGroup">
                <label for="guildRequestGuildId">公會 ID</label>
                <input id="guildRequestGuildId" placeholder="update / revoke 時必填" />
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div id="guildRequestNameGroup">
                <label for="guildRequestName">公會名稱</label>
                <input id="guildRequestName" placeholder="create_guild 使用" />
              </div>
              <div id="guildRequestSelfTouchGroup">
                <label for="guildRequestSelfTouchRate">自摸參考趴數</label>
                <input id="guildRequestSelfTouchRate" value="0" />
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div id="guildRequestWinRateGroup">
                <label for="guildRequestWinRate">胡牌參考趴數</label>
                <input id="guildRequestWinRate" value="0" />
              </div>
              <div id="guildRequestVisibleGroup">
                <label for="guildRequestVisible">參考值顯示</label>
                <select id="guildRequestVisible">
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </div>
            </div>
            <div class="btns">
              <button class="ghost compact" id="createGuildRequestBtn" data-write-action="guild-request-submit">建立申請</button>
              <button class="ghost compact" id="updateGuildRequestBtn" data-write-action="guild-request-submit">更新申請</button>
              <button class="danger compact" id="revokeGuildRequestBtn" data-write-action="guild-request-submit">拆散申請</button>
              <button class="secondary" id="submitGuildRequest" data-write-action="guild-request-submit">送出公會申請</button>
            </div>
            <div class="footer-note">建立 / 編輯 / 拆散都先走申請；核准後才真正套用。</div>
          </div>
          <div>
            <div class="subsection">
              <h3 class="subsection-title">現有公會清單 / 成員操作</h3>
              <p class="subsection-copy">先查公會，再決定要查看成員、改角色或移出成員。</p>
            </div>
            <div class="row row-2">
              <div>
                <label for="guildSearch">公會關鍵字</label>
                <input id="guildSearch" placeholder="公會名稱" />
              </div>
              <div>
                <label for="guildStatus">狀態</label>
                <input id="guildStatus" placeholder="active / revoked" />
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div>
                <label for="guildTake">筆數</label>
                <input id="guildTake" value="10" />
              </div>
              <div>
                <label for="guildMemberRole">成員角色</label>
                <select id="guildMemberRole">
                  <option value="member">member</option>
                  <option value="master">master</option>
                </select>
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div>
                <label for="guildMemberPlayerId">加入/移除玩家 ID</label>
                <input id="guildMemberPlayerId" placeholder="player id" />
              </div>
              <div>
                <label for="guildMemberNote">移除備註</label>
                <input id="guildMemberNote" placeholder="選填" />
              </div>
            </div>
            <div style="margin-top:12px">
              <label for="guildMemberFilter">成員關鍵字</label>
              <input id="guildMemberFilter" placeholder="nickname / externalId / playerId" />
            </div>
            <div style="margin-top:10px">
              <label><input type="checkbox" id="guildMemberActiveOnly" checked /> 只看 active 成員</label>
            </div>
            <div class="btns">
              <button class="ghost compact" id="addGuildMemberBtn" data-write-action="guild-member-add">加入公會</button>
              <button class="danger compact" id="removeGuildMemberBtn" data-write-action="guild-member-remove">移出公會</button>
            </div>
          </div>
        </div>
        <div style="height:14px"></div>
        <div class="subsection">
          <h3 class="subsection-title">公會申請歷史</h3>
          <p class="subsection-copy">這裡看待審、已核准、已駁回的申請紀錄，方便回頭追查。</p>
        </div>
        <div class="row row-2" style="margin-bottom:12px">
          <div>
            <label for="guildRequestFilterType">申請類型篩選</label>
            <select id="guildRequestFilterType">
              <option value="">全部</option>
              <option value="create_guild">create_guild</option>
              <option value="update_reference_rate">update_reference_rate</option>
              <option value="revoke_guild">revoke_guild</option>
            </select>
          </div>
          <div>
            <label for="guildRequestFilterStatus">申請狀態篩選</label>
            <select id="guildRequestFilterStatus">
              <option value="">全部</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div>
            <label for="guildReviewNote">審核備註</label>
            <input id="guildReviewNote" placeholder="核准或駁回時使用" />
          </div>
        </div>
        <div class="split">
          <div>
            <div style="overflow:auto">
              <table>
                <thead>
                  <tr>
                    <th>申請</th>
                    <th>類型 / 狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="guildRequestsBody"></tbody>
              </table>
            </div>
          </div>
          <div>
            <div class="subsection" style="margin-bottom:12px">
              <h3 class="subsection-title">現有公會清單</h3>
              <p class="subsection-copy">點選「查看」後，下方會切到該公會的成員與細節。</p>
            </div>
            <div style="overflow:auto">
              <table>
                <thead>
                  <tr>
                    <th>公會</th>
                    <th>狀態 / 成員</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="guildsBody"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div style="height:14px"></div>
        <div class="subsection">
          <h3 class="subsection-title">成員 / 公會細節</h3>
          <p class="subsection-copy">這裡是單一公會的成員名單、角色、狀態與參考值設定。</p>
        </div>
        <div style="overflow:auto">
          <table>
            <thead>
              <tr>
                <th>成員</th>
                <th>角色 / 狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="guildMembersBody"></tbody>
          </table>
        </div>
        <div class="detail-card" id="guildDetail">點選右側公會可查看成員與細節</div>
      </div>
    </div>
  </div>

  <script>
    const api = async (path, options = {}) => {
      const token = localStorage.getItem('wuji_token');
      const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }

      const response = await fetch(path, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        const message = data && data.message ? data.message : response.statusText;
        throw new Error(message);
      }

      return data;
    };

    const authNote = document.getElementById('authNote');
    const modeText = document.getElementById('modeText');
    const metrics = document.getElementById('metrics');
    const playersBody = document.getElementById('playersBody');
    const adminUsersBody = document.getElementById('adminUsersBody');
    const summaryBox = document.getElementById('summaryBox');
    const adminUserDetail = document.getElementById('adminUserDetail');
    const auditBox = document.getElementById('auditBox');
    const rechargeOrdersBody = document.getElementById('rechargeOrdersBody');
    const rechargeOrderDetail = document.getElementById('rechargeOrderDetail');
    const roomCardBalancesBody = document.getElementById('roomCardBalancesBody');
    const roomCardLogsBox = document.getElementById('roomCardLogsBox');
    const roomCardLogDetail = document.getElementById('roomCardLogDetail');
    const guildRequestsBody = document.getElementById('guildRequestsBody');
    const guildsBody = document.getElementById('guildsBody');
    const guildMembersBody = document.getElementById('guildMembersBody');
    const guildDetail = document.getElementById('guildDetail');
    const guildRequestType = document.getElementById('guildRequestType');
    const guildRequestGuildIdGroup = document.getElementById('guildRequestGuildIdGroup');
    const guildRequestNameGroup = document.getElementById('guildRequestNameGroup');
    const guildRequestSelfTouchGroup = document.getElementById('guildRequestSelfTouchGroup');
    const guildRequestWinRateGroup = document.getElementById('guildRequestWinRateGroup');
    const guildRequestVisibleGroup = document.getElementById('guildRequestVisibleGroup');
    const guildMemberFilter = document.getElementById('guildMemberFilter');
    const guildMemberActiveOnly = document.getElementById('guildMemberActiveOnly');
    const guildRequestFilterType = document.getElementById('guildRequestFilterType');
    const guildRequestFilterStatus = document.getElementById('guildRequestFilterStatus');
    const readonlyMode = ${isReadonlyMode ? 'true' : 'false'};
    let lastRechargeOrders = [];
    let lastAdminUsers = [];
    let selectedRechargeOrderId = null;
    let selectedAdminUserId = null;
    let lastRoomCardLogs = [];
    let selectedRoomCardLogId = null;
    let lastGuilds = [];
    let lastGuildRequests = [];
    let selectedGuildId = null;
    let selectedGuildDetail = null;
    let selectedGuildMemberId = null;
    let playerSearchTimer = null;
    let roomCardSearchTimer = null;
    let guildSearchTimer = null;

    function formatCoin(value) {
      return String(value);
    }

    function applyReadonlyState() {
      if (!readonlyMode) {
        return;
      }

      document.querySelectorAll('[data-write-action]').forEach((button) => {
        button.disabled = true;
        button.title = 'readonly 模式，寫入已停用';
      });
    }

    function renderMetrics(summary) {
      const legacyChanged = summary.legacyChange?.hasChanges ?? false;
      const legacyChangedTables = (summary.legacyChange?.changedTables || []).join(', ') || '無';
      const legacyCapturedAt = summary.legacyChange?.capturedAt
        ? new Date(summary.legacyChange.capturedAt).toLocaleString('zh-TW')
        : '尚無快照';

      const items = [
        ['玩家數', summary.totals.players, '目前系統中的玩家總數'],
        ['管理員數', summary.totals.adminUsers, 'owner / manager / support 帳號總數'],
        ['待核帳', summary.totals.pendingRechargeOrders, '需要主管核准的房卡購買單'],
        ['房卡總餘額', summary.totals.roomCardBalance, '所有玩家房卡餘額加總'],
        [
          '舊後台異動',
          legacyChanged ? '有變更' : '無變更',
          '最近快照：' + legacyCapturedAt + '；異動表：' + legacyChangedTables,
        ],
      ];

      metrics.innerHTML = items.map(([label, value, hint]) => {
        return '<div class="card metric">' +
          '<div class="label">' + label + '</div>' +
          '<div class="value">' + value + '</div>' +
          '<div class="hint">' + hint + '</div>' +
          '</div>';
      }).join('');

      summaryBox.textContent = JSON.stringify(summary, null, 2);
    }

    function renderAuditLogs(logs) {
      auditBox.innerHTML = logs.map((log) => {
        return '<div class="log">' +
          '<strong>' + log.action + '</strong> · ' + log.entityName +
          '<small>' + log.summary + ' · ' + new Date(log.createdAt).toLocaleString('zh-TW') + '</small>' +
          '</div>';
      }).join('') || '<div class="muted">沒有稽核紀錄</div>';
    }

    function renderPlayers(players) {
      playersBody.innerHTML = players.map((player) => {
        const statusClass = player.status === 'banned' ? 'banned' : 'active';
        const nextStatus = player.status === 'banned' ? 'active' : 'banned';
        const actionText = player.status === 'banned' ? '復權' : '停權';
        return '<tr>' +
          '<td>' +
          '<strong>' + player.nickname + '</strong><br>' +
          '<span class="muted">' + player.externalId + '</span><br>' +
          '<span class="muted">ID: ' + player.id + '</span>' +
          '</td>' +
          '<td><span class="pill ' + statusClass + '">' + player.status + '</span></td>' +
          '<td>' + formatCoin(player.roomCardBalance?.balance ?? 0) + '</td>' +
          '<td>' +
          '<div class="actions-cell">' +
          '<button class="secondary compact" data-write-action="player-status" data-player-id="' + player.id + '" data-next-status="' + nextStatus + '">' + actionText + '</button>' +
          '</div>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="4" class="muted">沒有資料</td></tr>';
    }

    function renderRechargeOrders(orders) {
      lastRechargeOrders = orders;
      rechargeOrdersBody.innerHTML = orders.map((order) => {
        const statusClass = order.status === 'pending' ? 'pending' : order.status;
        const actions = order.status === 'pending'
          ? '<div class="actions-cell">' +
            '<button class="secondary compact" data-write-action="recharge-review" data-recharge-id="' + order.id + '" data-recharge-action="confirm">核准</button>' +
            '<button class="danger compact" data-write-action="recharge-review" data-recharge-id="' + order.id + '" data-recharge-action="reject">駁回</button>' +
            '</div>'
          : '<span class="muted">-</span>';

        return '<tr>' +
          '<td><strong>' + order.id + '</strong><br><span class="muted">' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : '-') + '</span></td>' +
          '<td>' + order.playerId + '</td>' +
          '<td>' + order.amount + ' / ' + order.roomCardAmount + '</td>' +
          '<td><span class="pill ' + statusClass + '">' + order.status + '</span></td>' +
          '<td>' + actions + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="5" class="muted">沒有核帳訂單</td></tr>';

      if (!orders.length) {
        selectedRechargeOrderId = null;
        rechargeOrderDetail.textContent = '點選上方任一核帳單可查看詳情';
      }
    }

    function renderAdminUsers(adminUsers) {
      lastAdminUsers = adminUsers;
      adminUsersBody.innerHTML = adminUsers.map((adminUser) => {
        const selectedClass = adminUser.id === selectedAdminUserId
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        return '<tr data-admin-user-id="' + adminUser.id + '"' + selectedClass + '>' +
          '<td><strong>' + adminUser.displayName + '</strong><br><span class="muted">' + adminUser.email + '</span></td>' +
          '<td><span class="pill ' + (adminUser.isActive ? 'active' : 'banned') + '">' + adminUser.role + '</span><br><span class="muted">' + (adminUser.isActive ? 'active' : 'disabled') + '</span></td>' +
          '<td>' + (adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleString('zh-TW') : '-') + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有管理員資料</td></tr>';

      const selectedAdmin = adminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) ?? adminUsers[0] ?? null;
      if (selectedAdmin) {
        selectedAdminUserId = selectedAdmin.id;
      }
      renderAdminUserDetail(selectedAdmin);
    }

    function renderAdminUserDetail(adminUser) {
      if (!adminUser) {
        adminUserDetail.textContent = '點選上方管理員可查看細節';
        return;
      }

      const lines = [
        '姓名：' + adminUser.displayName,
        '帳號：' + adminUser.email,
        '角色：' + adminUser.role,
        '狀態：' + (adminUser.isActive ? 'active' : 'disabled'),
        '建立時間：' + (adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleString('zh-TW') : '-'),
        '更新時間：' + (adminUser.updatedAt ? new Date(adminUser.updatedAt).toLocaleString('zh-TW') : '-'),
      ];

      adminUserDetail.textContent = lines.join('\n');
    }

    function renderRechargeOrderDetail(order) {
      if (!order) {
        rechargeOrderDetail.textContent = '點選上方任一核帳單可查看詳情';
        return;
      }

      const lines = [
        '訂單：' + order.id,
        '玩家：' + order.playerId,
        '狀態：' + order.status,
        '金額 / 房卡：' + order.amount + ' / ' + order.roomCardAmount,
        '銀行後五碼：' + (order.bankAccountLast5 || '-'),
        '轉帳時間：' + (order.transferredAt ? new Date(order.transferredAt).toLocaleString('zh-TW') : '-'),
        '提交時間：' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : '-'),
        '憑證備註：' + (order.proofNote || '-'),
        '審核備註：' + (order.reviewNote || '-'),
      ];

      rechargeOrderDetail.textContent = lines.join('\\n');
    }

    function renderRoomCardBalances(balances) {
      roomCardBalancesBody.innerHTML = balances.map((balance) => {
        const updatedAt = balance.updatedAt ? new Date(balance.updatedAt).toLocaleString('zh-TW') : '-';
        return '<tr>' +
          '<td>' + (balance.player?.nickname || '-') + '</td>' +
          '<td>' + (balance.player?.externalId || '-') + '</td>' +
          '<td>' + balance.balance + '</td>' +
          '<td>' + updatedAt + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="4" class="muted">沒有房卡餘額資料</td></tr>';
    }

    function renderRoomCardLogs(logs) {
      lastRoomCardLogs = logs;
      roomCardLogsBox.innerHTML = logs.map((log) => {
        return '<div class="log" data-room-card-log-id="' + log.id + '">' +
          '<strong>' + log.sourceType + '</strong> · ' + log.playerId +
          '<small>變動 ' + log.changeAmount + '，餘額 ' + log.balanceAfter + ' · ' + new Date(log.createdAt).toLocaleString('zh-TW') + '</small>' +
          '</div>';
      }).join('') || '<div class="muted">沒有房卡異動紀錄</div>';

      if (!logs.length) {
        selectedRoomCardLogId = null;
        roomCardLogDetail.textContent = '點選下方房卡異動紀錄可查看詳情';
      }
    }

    function renderRoomCardLogDetail(log) {
      if (!log) {
        roomCardLogDetail.textContent = '點選下方房卡異動紀錄可查看詳情';
        return;
      }

      const lines = [
        '紀錄：' + log.id,
        '玩家：' + log.playerId,
        '來源：' + log.sourceType,
        '變動：' + log.changeAmount,
        '異動後餘額：' + log.balanceAfter,
        '關聯核帳單：' + (log.relatedRechargeOrderId || '-'),
        '關聯桌號：' + (log.relatedTableId || '-'),
        '操作管理員：' + (log.adminUserId || '-'),
        '備註：' + (log.note || '-'),
        '建立時間：' + (log.createdAt ? new Date(log.createdAt).toLocaleString('zh-TW') : '-'),
      ];

      roomCardLogDetail.textContent = lines.join('\\n');
    }

    function safeJsonPreview(payload) {
      try {
        const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
        return JSON.stringify(parsed);
      } catch {
        return String(payload);
      }
    }

    function setElementVisible(element, visible) {
      if (!element) {
        return;
      }

      element.style.display = visible ? '' : 'none';
    }

    function updateGuildRequestFormVisibility() {
      const requestType = guildRequestType.value;
      const isCreate = requestType === 'create_guild';
      const isUpdate = requestType === 'update_reference_rate';
      const isRevoke = requestType === 'revoke_guild';

      setElementVisible(guildRequestGuildIdGroup, !isCreate);
      setElementVisible(guildRequestNameGroup, !isRevoke);
      setElementVisible(guildRequestSelfTouchGroup, !isRevoke);
      setElementVisible(guildRequestWinRateGroup, !isRevoke);
      setElementVisible(guildRequestVisibleGroup, !isRevoke);

      const guildIdInput = document.getElementById('guildRequestGuildId');
      const guildNameInput = document.getElementById('guildRequestName');

      if (isCreate) {
        guildNameInput.placeholder = '新公會名稱（必填）';
      }

      if (isUpdate && selectedGuildId && !guildIdInput.value.trim()) {
        guildIdInput.value = selectedGuildId;
      }

      if (isRevoke && selectedGuildId && !guildIdInput.value.trim()) {
        guildIdInput.value = selectedGuildId;
      }
    }

    function renderGuildRequests(requests) {
      lastGuildRequests = requests;
      guildRequestsBody.innerHTML = requests.map((request) => {
        const payload = request.payload ? safeJsonPreview(request.payload) : '-';
        const actions = request.status === 'pending'
          ? '<div class="actions-cell">' +
            '<button class="secondary compact" data-write-action="guild-request-review" data-guild-request-id="' + request.id + '" data-guild-request-action="approve">核准</button>' +
            '<button class="danger compact" data-write-action="guild-request-review" data-guild-request-id="' + request.id + '" data-guild-request-action="reject">駁回</button>' +
            '</div>'
          : '<span class="muted">-</span>';

        return '<tr>' +
          '<td><strong>' + request.id + '</strong><br><span class="muted">' + payload + '</span></td>' +
          '<td><span class="pill ' + request.status + '">' + request.requestType + '</span><br><span class="muted">' + request.status + '</span></td>' +
          '<td>' + actions + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有公會申請</td></tr>';
    }

    function renderGuilds(guilds) {
      lastGuilds = guilds;
      guildsBody.innerHTML = guilds.map((guild) => {
        const selectedClass = guild.id === selectedGuildId ? ' style="background: rgba(94, 234, 212, 0.08);"' : '';
        return '<tr data-guild-id="' + guild.id + '"' + selectedClass + '>' +
          '<td><strong>' + guild.name + '</strong><br><span class="muted">ID: ' + guild.id + '</span></td>' +
          '<td><span class="pill ' + guild.status + '">' + guild.status + '</span><br><span class="muted">成員 ' + (guild._count?.members ?? 0) + '</span></td>' +
          '<td><div class="actions-cell"><button class="ghost compact" data-guild-id="' + guild.id + '" data-guild-action="view">查看</button></div></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有公會資料</td></tr>';
    }

    function renderGuildDetail(guild) {
      selectedGuildDetail = guild;
      if (!guild) {
        guildMembersBody.innerHTML = '<tr><td colspan="3" class="muted">請先選擇公會</td></tr>';
        guildDetail.textContent = '點選右側公會可查看成員與細節';
        return;
      }

      const memberFilterText = guildMemberFilter.value.trim().toLowerCase();
      const activeOnly = guildMemberActiveOnly.checked;
      const filteredMembers = guild.members.filter((member) => {
        if (activeOnly && member.status !== 'active') {
          return false;
        }

        if (!memberFilterText) {
          return true;
        }

        const searchText = [
          member.player.nickname,
          member.player.externalId,
          member.playerId,
        ].join(' ').toLowerCase();

        return searchText.includes(memberFilterText);
      });

      const lines = [
        '公會：' + guild.name,
        'ID：' + guild.id,
        '狀態：' + guild.status,
        '建立方式：' + guild.creationMethod,
        '自摸參考趴數：' + guild.selfTouchReferenceRate + '（顯示：' + guild.selfTouchReferenceVisible + '）',
        '胡牌參考趴數：' + guild.winReferenceRate + '（顯示：' + guild.winReferenceVisible + '）',
        '成員：',
      ];

      guild.members.forEach((member) => {
        lines.push('  - ' + member.player.nickname + ' / ' + member.player.externalId + ' / ' + member.role + ' / ' + member.status + ' / ' + new Date(member.joinedAt).toLocaleString('zh-TW'));
      });

      guildMembersBody.innerHTML = filteredMembers.map((member) => {
        const nextRole = member.role === 'master' ? 'member' : 'master';
        const selectedClass = member.id === selectedGuildMemberId
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        return '<tr data-guild-member-id="' + member.id + '"' + selectedClass + '>' +
          '<td><strong>' + member.player.nickname + '</strong><br><span class="muted">' + member.player.externalId + '</span><br><span class="muted">PlayerID: ' + member.playerId + '</span></td>' +
          '<td><span class="pill ' + member.status + '">' + member.role + '</span><br><span class="muted">' + member.status + '</span></td>' +
          '<td><div class="actions-cell">' +
          '<button class="ghost compact" data-write-action="guild-member-role" data-guild-member-id="' + member.id + '" data-guild-member-next-role="' + nextRole + '">改為 ' + nextRole + '</button>' +
          '<button class="danger compact" data-write-action="guild-member-remove" data-guild-member-id="' + member.id + '">移出</button>' +
          '</div></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">目前沒有成員</td></tr>';

      guildDetail.textContent = lines.join('\\n');
    }

    async function loadSummary() {
      const summary = await api('/api/dashboard');
      renderMetrics(summary);
      renderAuditLogs(summary.recentAuditLogs || []);
      modeText.textContent = '已登入後台';
    }

    async function loadAdminUsers() {
      const adminUsers = await api('/api/admin-users');
      renderAdminUsers(adminUsers);
    }

    async function loadPlayers() {
      const search = document.getElementById('playerSearch').value.trim();
      const status = document.getElementById('playerStatus').value.trim();
      const take = document.getElementById('playerTake').value.trim() || '10';
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (status) qs.set('status', status);
      qs.set('take', take);
      const players = await api('/api/players?' + qs.toString());
      renderPlayers(players);
    }

    async function loadRechargeOrders() {
      const status = document.getElementById('rechargeStatus').value.trim();
      const take = document.getElementById('rechargeTake').value.trim() || '10';
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      qs.set('take', take);
      const orders = await api('/api/recharge-orders?' + qs.toString());
      renderRechargeOrders(orders);
      const selectedOrder = lastRechargeOrders.find((order) => order.id === selectedRechargeOrderId) ?? null;
      renderRechargeOrderDetail(selectedOrder);
    }

    async function loadRoomCards() {
      const search = document.getElementById('roomCardSearch').value.trim();
      const sourceType = document.getElementById('roomCardSourceType').value.trim();
      const take = document.getElementById('roomCardTake').value.trim() || '10';
      const logTake = document.getElementById('roomCardLogTake').value.trim() || '10';

      const balancesQs = new URLSearchParams();
      const logsQs = new URLSearchParams();
      if (search) balancesQs.set('search', search);
      balancesQs.set('take', take);
      if (search) logsQs.set('search', search);
      if (sourceType) logsQs.set('sourceType', sourceType);
      logsQs.set('take', logTake);

      const [balances, logs] = await Promise.all([
        api('/api/room-cards/balances?' + balancesQs.toString()),
        api('/api/room-cards/logs?' + logsQs.toString()),
      ]);

      renderRoomCardBalances(balances);
      renderRoomCardLogs(logs);
      const selectedLog = lastRoomCardLogs.find((log) => log.id === selectedRoomCardLogId) ?? null;
      renderRoomCardLogDetail(selectedLog);
    }

    async function loadGuildRequests() {
      const qs = new URLSearchParams();
      qs.set('take', '20');
      const requestType = guildRequestFilterType.value.trim();
      const status = guildRequestFilterStatus.value.trim();
      if (requestType) {
        qs.set('requestType', requestType);
      }
      if (status) {
        qs.set('status', status);
      }
      const requests = await api('/api/guild-approvals?' + qs.toString());
      renderGuildRequests(requests);
    }

    async function loadGuilds() {
      const search = document.getElementById('guildSearch').value.trim();
      const status = document.getElementById('guildStatus').value.trim();
      const take = document.getElementById('guildTake').value.trim() || '10';
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (status) qs.set('status', status);
      qs.set('take', take);
      const guilds = await api('/api/guilds?' + qs.toString());
      renderGuilds(guilds);

      if (selectedGuildId) {
        renderGuildDetail(selectedGuildDetail);
      }
    }

    async function loadGuildDetail(guildId) {
      const guild = await api('/api/guilds/' + guildId);
      selectedGuildId = guildId;
      selectedGuildMemberId = null;
      document.getElementById('guildRequestGuildId').value = guildId;
      updateGuildRequestFormVisibility();
      renderGuilds(lastGuilds);
      renderGuildDetail(guild);
    }

    async function refreshAll() {
      try {
        await Promise.all([loadSummary(), loadAdminUsers(), loadPlayers(), loadRechargeOrders(), loadRoomCards(), loadGuildRequests(), loadGuilds()]);
      } catch (error) {
        authNote.textContent = '載入失敗：' + error.message;
      }
    }

    async function toggleStatus(id, status) {
      try {
        await api('/api/players/' + id + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        await refreshAll();
      } catch (error) {
        alert('操作失敗：' + error.message);
      }
    }

    async function reviewRechargeOrder(orderId, action) {
      try {
        const reviewNote = document.getElementById('rechargeReviewNote').value.trim();
        await api('/api/recharge-orders/' + orderId + '/' + action, {
          method: 'POST',
          body: JSON.stringify({ reviewNote }),
        });
        await Promise.all([loadSummary(), loadRechargeOrders(), loadRoomCards()]);
      } catch (error) {
        alert('核帳失敗：' + error.message);
      }
    }

    async function submitRoomCardAdjust() {
      try {
        const playerId = document.getElementById('adjustPlayerId').value.trim();
        const changeAmount = Number(document.getElementById('adjustAmount').value.trim());
        const note = document.getElementById('adjustNote').value.trim();

        await api('/api/room-cards/adjust', {
          method: 'POST',
          body: JSON.stringify({ playerId, changeAmount, note }),
        });

        await Promise.all([loadSummary(), loadRoomCards(), loadPlayers()]);
      } catch (error) {
        alert('調整失敗：' + error.message);
      }
    }

    async function submitGuildRequest(forcedRequestType) {
      try {
        const requestType = forcedRequestType || document.getElementById('guildRequestType').value;
        guildRequestType.value = requestType;
        updateGuildRequestFormVisibility();
        const guildId = document.getElementById('guildRequestGuildId').value.trim();
        const name = document.getElementById('guildRequestName').value.trim();
        const selfTouchReferenceRate = Number(document.getElementById('guildRequestSelfTouchRate').value.trim() || '0');
        const winReferenceRate = Number(document.getElementById('guildRequestWinRate').value.trim() || '0');
        const visibility = document.getElementById('guildRequestVisible').value === 'true';

        const payload = requestType === 'create_guild'
          ? {
              name,
              selfTouchReferenceRate,
              selfTouchReferenceVisible: visibility,
              winReferenceRate,
              winReferenceVisible: visibility,
            }
          : requestType === 'update_reference_rate'
            ? {
                ...(name ? { name } : {}),
                ...(document.getElementById('guildRequestSelfTouchRate').value.trim() !== '' ? { selfTouchReferenceRate } : {}),
                selfTouchReferenceVisible: visibility,
                ...(document.getElementById('guildRequestWinRate').value.trim() !== '' ? { winReferenceRate } : {}),
                winReferenceVisible: visibility,
              }
            : {};

          if (requestType === 'create_guild' && !name) {
            throw new Error('建立公會需要公會名稱');
          }

        await api('/api/guild-approvals', {
          method: 'POST',
          body: JSON.stringify({
            requestType,
            guildId:
              requestType === 'create_guild'
                ? undefined
                : guildId || selectedGuildId || undefined,
            payload,
          }),
        });

        await Promise.all([loadGuildRequests(), loadGuilds(), loadSummary()]);
      } catch (error) {
        alert('公會申請失敗：' + error.message);
      }
    }

    async function reviewGuildRequest(requestId, action) {
      try {
        const reviewNote = document.getElementById('guildReviewNote').value.trim();
        await api('/api/guild-approvals/' + requestId + '/' + action, {
          method: 'POST',
          body: JSON.stringify({ reviewNote }),
        });

        await Promise.all([loadGuildRequests(), loadGuilds(), loadSummary()]);
      } catch (error) {
        alert('公會申請審核失敗：' + error.message);
      }
    }

    async function addGuildMember() {
      try {
        if (!selectedGuildId) {
          throw new Error('請先選一個公會');
        }

        const playerId = document.getElementById('guildMemberPlayerId').value.trim();
        const role = document.getElementById('guildMemberRole').value;

        await api('/api/guilds/' + selectedGuildId + '/members', {
          method: 'POST',
          body: JSON.stringify({ playerId, role }),
        });

        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        alert('加入公會失敗：' + error.message);
      }
    }

    async function updateGuildMemberRole(memberId, role) {
      try {
        if (!selectedGuildId) {
          throw new Error('請先選一個公會');
        }

        await api('/api/guilds/' + selectedGuildId + '/members/' + memberId + '/role', {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        });

        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        alert('調整成員角色失敗：' + error.message);
      }
    }

    async function removeGuildMember(memberIdOverride) {
      try {
        if (!selectedGuildId) {
          throw new Error('請先選一個公會');
        }

        const note = document.getElementById('guildMemberNote').value.trim();
        const playerId = document.getElementById('guildMemberPlayerId').value.trim();
        const memberId = memberIdOverride || selectedGuildMemberId;
        const memberByPlayerId = selectedGuildDetail?.members?.find((item) => item.playerId === playerId) ?? null;
        const targetMemberId = memberId || memberByPlayerId?.id;

        if (!targetMemberId) {
          throw new Error('找不到該公會成員');
        }

        await api('/api/guilds/' + selectedGuildId + '/members/' + targetMemberId + '/remove', {
          method: 'POST',
          body: JSON.stringify({ note }),
        });

        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        alert('移出公會失敗：' + error.message);
      }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
      try {
        const account = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const result = await api('/api/auth/login', {
          method: 'POST',
          // Backend DTO still uses the "email" field name for compatibility.
          body: JSON.stringify({ email: account, password }),
        });
        localStorage.setItem('wuji_token', result.accessToken);
        authNote.textContent = '已登入：' + result.admin.displayName + ' (' + result.admin.role + ')';
        modeText.textContent = '已登入後台';
        await refreshAll();
      } catch (error) {
        authNote.textContent = '登入失敗：' + error.message;
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      localStorage.removeItem('wuji_token');
      authNote.textContent = '已登出';
      modeText.textContent = '等待登入';
      metrics.innerHTML = '';
      playersBody.innerHTML = '';
      summaryBox.textContent = '尚未載入';
      auditBox.innerHTML = '';
    });

    document.getElementById('refreshSummary').addEventListener('click', refreshAll);
    document.getElementById('refreshAdminUsers').addEventListener('click', loadAdminUsers);
    document.getElementById('refreshPlayers').addEventListener('click', loadPlayers);
    document.getElementById('playerSearch').addEventListener('input', () => {
      clearTimeout(playerSearchTimer);
      playerSearchTimer = setTimeout(loadPlayers, 250);
    });
    document.getElementById('refreshRechargeOrders').addEventListener('click', loadRechargeOrders);
    document.getElementById('refreshRoomCards').addEventListener('click', loadRoomCards);
    document.getElementById('refreshGuildRequests').addEventListener('click', loadGuildRequests);
    document.getElementById('refreshGuilds').addEventListener('click', loadGuilds);
    document.getElementById('roomCardSearch').addEventListener('input', () => {
      clearTimeout(roomCardSearchTimer);
      roomCardSearchTimer = setTimeout(loadRoomCards, 250);
    });
    document.getElementById('roomCardSourceType').addEventListener('change', loadRoomCards);
    document.getElementById('clearRoomCardsFilters').addEventListener('click', () => {
      document.getElementById('roomCardSearch').value = '';
      document.getElementById('roomCardSourceType').value = '';
      loadRoomCards();
    });
    document.getElementById('submitRoomCardAdjust').addEventListener('click', submitRoomCardAdjust);
    document.getElementById('submitGuildRequest').addEventListener('click', () => submitGuildRequest());
    document.getElementById('createGuildRequestBtn').addEventListener('click', () => submitGuildRequest('create_guild'));
    document.getElementById('updateGuildRequestBtn').addEventListener('click', () => submitGuildRequest('update_reference_rate'));
    document.getElementById('revokeGuildRequestBtn').addEventListener('click', () => submitGuildRequest('revoke_guild'));
    document.getElementById('addGuildMemberBtn').addEventListener('click', addGuildMember);
    document.getElementById('removeGuildMemberBtn').addEventListener('click', () => removeGuildMember());
    document.getElementById('guildSearch').addEventListener('input', () => {
      clearTimeout(guildSearchTimer);
      guildSearchTimer = setTimeout(loadGuilds, 250);
    });
    document.getElementById('guildStatus').addEventListener('input', () => {
      clearTimeout(guildSearchTimer);
      guildSearchTimer = setTimeout(loadGuilds, 250);
    });
    document.getElementById('guildRequestType').addEventListener('change', updateGuildRequestFormVisibility);
    document.getElementById('guildMemberFilter').addEventListener('input', () => {
      if (selectedGuildDetail) {
        renderGuildDetail(selectedGuildDetail);
      }
    });
    document.getElementById('guildMemberActiveOnly').addEventListener('change', () => {
      if (selectedGuildDetail) {
        renderGuildDetail(selectedGuildDetail);
      }
    });
    document.getElementById('guildRequestFilterType').addEventListener('change', loadGuildRequests);
    document.getElementById('guildRequestFilterStatus').addEventListener('change', loadGuildRequests);
    playersBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const playerId = target.dataset.playerId;
      const nextStatus = target.dataset.nextStatus;

      if (playerId && nextStatus) {
        toggleStatus(playerId, nextStatus);
      }
    });
    adminUsersBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const row = target.closest('[data-admin-user-id]');
      const adminUserId = row?.getAttribute('data-admin-user-id');
      if (!adminUserId) {
        return;
      }

      selectedAdminUserId = adminUserId;
      renderAdminUsers(lastAdminUsers);
    });
    guildRequestsBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const requestId = target.dataset.guildRequestId;
      const action = target.dataset.guildRequestAction;
      if (requestId && action) {
        reviewGuildRequest(requestId, action);
      }
    });
    guildsBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const row = target.closest('[data-guild-id]');
      const guildId = row?.getAttribute('data-guild-id');
      if (!guildId) {
        return;
      }

      loadGuildDetail(guildId);
    });
    guildMembersBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        const row = event.target instanceof HTMLElement ? event.target.closest('[data-guild-member-id]') : null;
        const memberId = row?.getAttribute('data-guild-member-id');
        if (memberId) {
          selectedGuildMemberId = memberId;
          renderGuildDetail(selectedGuildDetail);
        }
        return;
      }

      const memberId = target.dataset.guildMemberId;
      if (!memberId) {
        return;
      }

      selectedGuildMemberId = memberId;
      renderGuildDetail(selectedGuildDetail);

      if (target.dataset.guildMemberNextRole) {
        updateGuildMemberRole(memberId, target.dataset.guildMemberNextRole);
        return;
      }

      removeGuildMember(memberId);
    });
    rechargeOrdersBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        const row = target.closest('tr');
        if (!row) {
          return;
        }

        const orderId = row.querySelector('strong')?.textContent?.trim() ?? null;
        if (!orderId) {
          return;
        }

        selectedRechargeOrderId = orderId;
        const selectedOrder = lastRechargeOrders.find((order) => order.id === orderId) ?? null;
        renderRechargeOrderDetail(selectedOrder);
        return;
      }

      const rechargeId = target.dataset.rechargeId;
      const rechargeAction = target.dataset.rechargeAction;

      if (rechargeId && rechargeAction) {
        reviewRechargeOrder(rechargeId, rechargeAction);
      }
    });
    roomCardLogsBox.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const row = target.closest('[data-room-card-log-id]');
      const logId = row?.getAttribute('data-room-card-log-id');
      if (!logId) {
        return;
      }

      selectedRoomCardLogId = logId;
      const selectedLog = lastRoomCardLogs.find((log) => log.id === logId) ?? null;
      renderRoomCardLogDetail(selectedLog);
    });

    applyReadonlyState();
    updateGuildRequestFormVisibility();

    if (localStorage.getItem('wuji_token')) {
      refreshAll();
      authNote.textContent = '已載入本機 token';
      modeText.textContent = '已登入後台';
    }
  </script>
</body>
</html>`;
  }
}
