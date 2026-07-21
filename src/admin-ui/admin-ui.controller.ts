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
    .hero-main { padding: 24px; }
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
    .hero-side { display: grid; gap: 12px; }
    .login-panel, .status-panel { padding: 20px; background: var(--panel-2); }
    .guide-panel { padding: 20px; background: var(--panel-2); }
    .guide-panel h2 { margin: 0; font-size: 16px; }
    .guide-panel ol {
      margin: 10px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.6;
    }
    .guide-panel li + li { margin-top: 8px; }
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
    input:focus, select:focus {
      border-color: rgba(94, 234, 212, 0.5);
      box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12);
    }
    .row { display: grid; gap: 12px; }
    .row-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .row-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
    .quick-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 18px 0 0;
    }
    .quick-nav button {
      background: rgba(96, 165, 250, 0.12);
      color: var(--text);
      border: 1px solid rgba(96, 165, 250, 0.22);
    }
    .metric { padding: 18px; min-height: 118px; }
    .metric .label { color: var(--muted); font-size: 13px; }
    .metric .value { font-size: 34px; font-weight: 800; margin-top: 8px; }
    .metric .hint { color: var(--muted); margin-top: 6px; font-size: 12px; }
    .section { padding: 20px; margin-top: 16px; }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 12px;
      margin-bottom: 14px;
    }
    .section-head h2 { margin: 0; font-size: 18px; }
    .section-head p { margin: 0; color: var(--muted); font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
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
    .pill.pending { color: #fbbf24; }
    .pill.confirmed { color: #86efac; }
    .pill.rejected { color: #fca5a5; }
    .log {
      font-size: 13px;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
      color: #dbeafe;
    }
    .log:last-child { border-bottom: 0; }
    .log small { display: block; color: var(--muted); margin-top: 4px; }
    .audit-entry-list { display: grid; gap: 10px; }
    .audit-entry-button {
      width: 100%;
      text-align: left;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(15, 23, 42, 0.52);
      color: var(--text);
      cursor: pointer;
    }
    .audit-entry-button.selected {
      border-color: rgba(94, 234, 212, 0.5);
      box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.12);
      background: rgba(15, 23, 42, 0.8);
    }
    .audit-entry-button strong { display: block; font-size: 13px; }
    .audit-entry-button span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
    }
    .audit-detail-lines { display: grid; gap: 8px; }
    .audit-detail-line { color: #dbeafe; line-height: 1.7; }
    .mini-card {
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: rgba(2, 6, 23, 0.72);
    }
    .mini-card h3 { margin: 0; font-size: 15px; }
    .mini-card p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    .mini-card ul {
      margin: 10px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.7;
    }
    #playerEditFormPanel {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      background: rgba(2, 6, 23, 0.5);
    }
    .player-form-mode-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #bae6fd;
    }
    .player-form-mode-hint.warn { color: #fbbf24; }
    .player-form-mode-hint.success { color: #86efac; }
    .player-form-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .player-form-title::before {
      content: '';
      width: 4px;
      height: 18px;
      border-radius: 999px;
      background: #34d399;
      box-shadow: 0 0 10px rgba(52, 211, 153, 0.45);
    }
    #playerEditFormPanel.edit-mode .player-form-title::before {
      background: #60a5fa;
      box-shadow: 0 0 10px rgba(96, 165, 250, 0.45);
    }
    .player-id-block {
      transition: opacity 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
      border-radius: 12px;
      padding: 8px;
    }
    #playerEditFormPanel.create-mode .player-id-block {
      opacity: 0.58;
      border: 1px dashed rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.22);
    }
    #playerEditFormPanel.edit-mode .player-id-block {
      opacity: 1;
      border: 1px solid rgba(96, 165, 250, 0.42);
      background: rgba(30, 64, 175, 0.12);
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
    }
    #playerEditFormPanel.edit-mode #updatePlayerBtn,
    #playerEditFormPanel.create-mode #createPlayerBtn {
      box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.18);
    }
    .required-mark {
      color: #fca5a5;
      margin-left: 4px;
      font-weight: 800;
    }
    input.field-invalid {
      border-color: rgba(248, 113, 113, 0.75);
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
    }
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
    .detail-kv-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 12px;
    }
    .detail-kv-item {
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(15, 23, 42, 0.52);
    }
    .detail-kv-item .k {
      display: block;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.4;
    }
    .detail-kv-item .v {
      display: block;
      margin-top: 4px;
      color: #e2e8f0;
      font-weight: 700;
      line-height: 1.5;
      word-break: break-word;
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
    .section-players-highlight {
      border-color: rgba(125, 211, 252, 0.88);
      background:
        linear-gradient(145deg, rgba(14, 116, 144, 0.36) 0%, rgba(8, 47, 73, 0.88) 42%, rgba(15, 23, 42, 0.95) 100%);
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(56, 189, 248, 0.35),
        0 0 28px rgba(56, 189, 248, 0.26),
        inset 0 1px 0 rgba(186, 230, 253, 0.44);
    }
    .section-players-highlight .section-head h2 {
      color: #dff6ff;
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
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
    .summary-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 14px;
      margin-top: 14px;
    }
    .summary-list { display: grid; gap: 10px; }
    .summary-item {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(15, 23, 42, 0.52);
    }
    .summary-item strong {
      display: block;
      font-size: 13px;
      letter-spacing: 0.02em;
    }
    .summary-item span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    .footer-note {
      margin-top: 14px;
      font-size: 12px;
      color: var(--muted);
    }
    .actions-cell { display: flex; gap: 8px; flex-wrap: wrap; }
    .compact { font-size: 12px; padding: 9px 12px; border-radius: 12px; }
    @media (max-width: 980px) {
      .hero, .grid, .split, .row-2, .row-3 { grid-template-columns: 1fr; }
      .detail-kv-grid { grid-template-columns: 1fr; }
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
          <input id="email" value="owner@wuji.test" />
          <div style="height:10px"></div>
          <input id="password" type="password" value="mock-owner-pass" />
          <div class="btns">
            <button class="primary" id="loginBtn">登入</button>
            <button class="ghost" id="logoutBtn">登出</button>
          </div>
          <div class="footer-note" id="authNote">尚未登入</div>
        </div>
        <div class="card status-panel">
          <div class="muted">目前狀態</div>
          <div style="font-size:20px;font-weight:800;margin-top:6px" id="modeText">等待登入</div>
          <div class="footer-note">預設可直接用 owner@wuji.test / mock-owner-pass 登入；也可改用 manager@wuji.test 或 support@wuji.test。</div>
        </div>
        <div class="card guide-panel">
          <h2>怎麼看這個後台</h2>
          <ol>
            <li>先查看「會員」，確認玩家狀態與基本資料。</li>
            <li>再查看「房卡」與「公會」，處理常見客服與組織問題。</li>
            <li>接著查看「核帳」與「管理」，完成審核與權限作業。</li>
            <li>最後查看「總覽」，進行整體回顧與稽核追蹤。</li>
          </ol>
        </div>
      </div>
    </div>

    ${isReadonlyMode ? '<div class="card section" style="border-color: rgba(248, 113, 113, 0.35); background: rgba(127, 29, 29, 0.22);"><strong>目前是 readonly 觀察模式</strong><div class="muted" style="margin-top:8px">核准、駁回與房卡調整會被後端拒絕。你仍可查詢資料、檢視摘要與稽核紀錄。</div></div>' : ''}

    <div class="quick-nav">
      <button class="compact" data-section-jump="playersSection">會員</button>
      <button class="compact" data-section-jump="roomCardsSection">房卡</button>
      <button class="compact" data-section-jump="guildSection">公會</button>
      <button class="compact" data-section-jump="rechargeSection">核帳</button>
      <button class="compact" data-section-jump="adminUsersSection">管理</button>
      <button class="compact" data-section-jump="summarySection">總覽</button>
    </div>

    <div class="grid" id="metrics"></div>

    <div class="section-stack">
      <div class="card section" id="summarySection">
        <div class="section-head">
          <div>
            <h2>總覽 / 稽核</h2>
            <p>最後回到這裡檢視整體狀態、風險回顧與稽核追蹤。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshSummary">重新整理</button>
          </div>
        </div>
        <div class="summary-grid">
          <div class="output" id="summaryBox">尚未載入</div>
          <div class="summary-list" id="summaryHighlights"></div>
        </div>
        <div style="height:14px"></div>
        <div class="split">
          <div class="mini-card">
            <h3>最近稽核動作</h3>
            <p>看最近誰做了什麼，適合先判斷目前工作焦點。</p>
            <div class="row row-3" style="margin-top:12px">
              <div>
                <label for="auditEntityFilter">實體</label>
                <select id="auditEntityFilter">
                  <option value="">全部</option>
                  <option value="Player">會員</option>
                  <option value="GuildApprovalRequest">公會申請</option>
                  <option value="GuildMember">公會成員</option>
                  <option value="RechargeOrder">核帳</option>
                  <option value="RoomCardBalance">房卡</option>
                  <option value="AdminUser">管理員</option>
                </select>
              </div>
              <div>
                <label for="auditActionFilter">動作</label>
                <select id="auditActionFilter">
                  <option value="">全部</option>
                  <option value="CREATE_PLAYER">建立會員</option>
                  <option value="UPDATE_PLAYER">更新會員</option>
                  <option value="UPDATE_PLAYER_STATUS">變更會員狀態</option>
                  <option value="CREATE_ADMIN_USER">建立管理員</option>
                  <option value="DISABLE_ADMIN_USER">停用管理員</option>
                  <option value="SUBMIT_RECHARGE_ORDER">送出核帳申請</option>
                  <option value="CONFIRM_RECHARGE_ORDER">核准核帳</option>
                  <option value="REJECT_RECHARGE_ORDER">駁回核帳</option>
                  <option value="ADJUST_ROOM_CARD_BALANCE">調整房卡</option>
                  <option value="SUBMIT_GUILD_APPROVAL_REQUEST">送出公會申請</option>
                  <option value="APPROVE_GUILD_APPROVAL_REQUEST">核准公會申請</option>
                  <option value="REJECT_GUILD_APPROVAL_REQUEST">駁回公會申請</option>
                  <option value="ADD_GUILD_MEMBER">加入公會成員</option>
                  <option value="UPDATE_GUILD_MEMBER_ROLE">調整公會角色</option>
                  <option value="REMOVE_GUILD_MEMBER">移出公會成員</option>
                </select>
              </div>
              <div>
                <label for="auditAdminFilter">操作人</label>
                <select id="auditAdminFilter">
                  <option value="">全部</option>
                </select>
              </div>
              <div>
                <label for="auditTake">顯示筆數</label>
                <input id="auditTake" value="8" />
              </div>
              <div>
                <label for="auditCreatedFrom">事件日期起</label>
                <input id="auditCreatedFrom" type="date" />
              </div>
              <div>
                <label for="auditCreatedTo">事件日期迄</label>
                <input id="auditCreatedTo" type="date" />
              </div>
            </div>
            <div class="btns" style="margin-top:12px">
              <button class="ghost compact" id="applyAuditFiltersBtn">套用稽核篩選</button>
              <button class="ghost compact" id="clearAuditFiltersBtn">清除稽核篩選</button>
            </div>
            <div id="auditBox"></div>
            <div class="detail-card" id="auditDetail" style="margin-top:14px">點選左側稽核事件可查看完整明細</div>
          </div>
          <div class="mini-card">
            <h3>舊後台監測</h3>
            <p>這裡只看 Legacy 是否有異動風險，以及要不要回頭追查。</p>
            <div id="legacyBox"></div>
          </div>
        </div>
      </div>

      <div class="card section section-players-highlight" id="playersSection">
        <div class="section-head">
          <div>
            <h2>會員（第一層）</h2>
            <p>先確認玩家列表、身分與停權狀態，作為所有操作起點。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshPlayers">重新整理</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="playerSearch">會員關鍵字</label>
            <input id="playerSearch" placeholder="會員ID / 外部編號 / 暱稱 / 備註 / 標籤" />
          </div>
          <div>
            <label for="playerStatus">會員狀態</label>
            <select id="playerStatus">
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="banned">停權</option>
            </select>
          </div>
          <div>
            <label for="playerTake">每頁筆數</label>
            <input id="playerTake" value="10" />
          </div>
        </div>
        <div class="row row-3" style="margin-top:12px">
          <div>
            <label for="playerCreatedFrom">註冊區間起</label>
            <input id="playerCreatedFrom" type="date" />
          </div>
          <div>
            <label for="playerCreatedTo">註冊區間迄</label>
            <input id="playerCreatedTo" type="date" />
          </div>
          <div>
            <label>快速篩選新註冊</label>
            <div class="btns" style="margin:0">
              <button class="ghost compact" id="playerJoinedTodayBtn">今日新增</button>
              <button class="ghost compact" id="playerJoinedWeekBtn">本週新增</button>
              <button class="ghost compact" id="playerJoinedMonthBtn">本月新增</button>
              <button class="ghost compact" id="clearPlayerDateFilters">清除日期</button>
            </div>
          </div>
        </div>
        <div class="row row-3" style="margin-top:12px">
          <div>
            <label>快速篩選標籤</label>
            <div class="btns" style="margin:0">
              <button class="ghost compact" id="playerTagVipBtn">#VIP</button>
              <button class="ghost compact" id="playerTagRiskBtn">#高風險</button>
              <button class="ghost compact" id="playerTagTestBtn">#測試帳號</button>
              <button class="ghost compact" id="clearPlayerTagFilterBtn">清除標籤篩選</button>
            </div>
          </div>
        </div>
        <div class="footer-note">這裡的日期是給客服做批次排查新註冊會員，不需要會員本人記得日期；新增與編修可在下方直接操作。</div>
        <div class="mini-card" style="margin-top:12px">
          <h3>如何查資料</h3>
          <p>先用「今日/本週/本月新增」縮小範圍，再用會員ID、外部編號或暱稱搜尋；要改資料就點列表那筆，接著用下方快捷按鈕。</p>
        </div>
        <div class="detail-card" id="playerDetail">點選會員可查看單筆詳情</div>
        <div class="btns" style="margin-top:10px">
          <button class="ghost compact" id="playerActionFillFormBtn">帶入編修表單</button>
          <button class="secondary compact" id="playerActionToggleStatusBtn" data-write-action="player-status-quick">停權 / 復權</button>
          <button class="ghost compact" id="playerActionReloadContextBtn">重新整理此會員</button>
        </div>
        <div class="row row-3" style="margin-top:10px">
          <div>
            <label for="playerStatusReason">停權 / 復權原因（必填）</label>
            <input id="playerStatusReason" maxlength="120" placeholder="例如：客服複核後確認異常登入，先停權待本人確認" />
          </div>
        </div>
        <div class="split" style="margin-top:14px">
          <div class="detail-card" id="playerHistory">點選會員後，左側可查看最近操作紀錄</div>
          <div class="detail-card" id="playerHistoryDetail">點選左側會員歷史事件可查看完整明細</div>
        </div>
        <div class="detail-card" id="playerRelations" style="margin-top:14px">點選會員可查看公會 / 房卡 / 核帳摘要</div>
        <div style="margin-top:14px">
          <div id="playerEditFormPanel" class="create-mode">
            <div class="subsection">
              <h3 class="subsection-title player-form-title">新增 / 編修會員資料</h3>
              <p class="subsection-copy">新增：填「外部編號＋暱稱」後送出；更新：先從列表點會員帶入系統會員 ID 再按更新。</p>
              <div class="player-form-mode-hint" id="playerFormModeHint">目前：新增模式（不用填系統會員 ID）</div>
            </div>
            <div class="row row-3">
              <div class="player-id-block">
                <label for="playerFormId">系統會員 ID（自動）</label>
                <input id="playerFormId" placeholder="系統自動產生（新增時留白）" readonly />
                <div class="muted" style="margin-top:6px;font-size:12px">這格不需要手動輸入；新增會員請填右側「外部編號」與「暱稱」。</div>
              </div>
              <div>
                <label for="playerFormExternalId">外部編號 <span class="required-mark">*</span></label>
                <input id="playerFormExternalId" maxlength="64" placeholder="wuji_test_20260701" />
                <div class="btns" style="margin-top:8px">
                  <button class="ghost compact" id="generatePlayerExternalIdBtn" type="button">自動產生不重複編號</button>
                </div>
              </div>
              <div>
                <label for="playerFormNickname">暱稱 <span class="required-mark">*</span></label>
                <input id="playerFormNickname" maxlength="24" placeholder="會員暱稱（2-24字）" />
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div>
                <label for="playerFormNote">備註</label>
                <textarea id="playerFormNote" maxlength="200" placeholder="客服備註，例如：聯繫方式、風險提醒、特殊處理說明"></textarea>
              </div>
              <div>
                <label for="playerFormTags">標籤</label>
                <input id="playerFormTags" maxlength="120" placeholder="VIP, 高風險, 測試帳號" />
                <div class="muted" style="margin-top:6px;font-size:12px">可用逗號或空白分隔，送出後會自動整理成一致格式。</div>
              </div>
            </div>
            <div class="row row-3" style="margin-top:12px">
              <div>
                <label for="playerUpdateReason">操作原因（新增 / 更新會員必填）</label>
                <input id="playerUpdateReason" maxlength="120" placeholder="例如：客服核對身份後建立帳號 / 修正外部編號與備註" />
              </div>
            </div>
            <div class="row row-3" style="margin-top:12px">
              <div>
                <label for="playerFormStatus">狀態</label>
                <select id="playerFormStatus">
                  <option value="active">啟用</option>
                  <option value="banned">停權</option>
                </select>
              </div>
              <div>
                <label>操作</label>
                <div class="btns" style="margin:0">
                  <button class="ghost compact" id="clearPlayerFormBtn">清除</button>
                  <button class="secondary compact" id="createPlayerBtn" data-write-action="player-create">新增會員</button>
                  <button class="ghost compact" id="updatePlayerBtn" data-write-action="player-update">更新會員</button>
                </div>
              </div>
              <div>
                <label>連續新增</label>
                <label class="muted" style="display:flex;align-items:center;gap:8px;margin:0">
                  <input type="checkbox" id="keepExternalIdPrefixOnCreate" style="width:auto" />
                  保留外部編號前綴（例如：wuji-team-）
                </label>
              </div>
            </div>
            <div class="footer-note">清除會重置系統會員 ID、外部編號、暱稱與狀態，並關閉目前顯示的會員詳情 / 歷史 / 關聯摘要。外部編號規則：4-64字，僅英數/_/-；暱稱：2-24字，不可全空白。新增/更新會員資料都必須填寫操作原因。房卡與遊戲幣仍走獨立流程。外部編號採永不回收政策：曾使用過的編號不可再用。可直接按 Enter 依目前模式送出。</div>
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
        <div class="section-head" style="margin-top:14px;align-items:center">
          <div class="footer-note" id="playersMeta">尚未載入會員清單</div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="jumpToPlayerEditFormBtn">回到編修區</button>
            <button class="ghost compact" id="playerPrevPageBtn">上一頁</button>
            <button class="ghost compact" id="playerNextPageBtn">下一頁</button>
          </div>
        </div>
      </div>

      <div class="card section" id="adminUsersSection">
        <div class="section-head">
          <div>
            <h2>管理員與權限</h2>
            <p>這裡檢視後台帳號、啟用狀態與角色分工（owner / manager / support）。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshAdminUsers">重新整理</button>
          </div>
        </div>
        <div class="footer-note" id="adminUsersMeta">尚未載入管理員摘要</div>
        <div class="row row-3" style="margin:12px 0 10px">
          <div>
            <label for="adminFormEmail">新管理員帳號</label>
            <input id="adminFormEmail" placeholder="new-admin@wuji.test" />
          </div>
          <div>
            <label for="adminFormDisplayName">顯示名稱</label>
            <input id="adminFormDisplayName" placeholder="例如：新客服" />
          </div>
          <div>
            <label for="adminFormPassword">初始密碼</label>
            <input id="adminFormPassword" type="password" placeholder="至少 8 碼" />
          </div>
        </div>
        <div class="row row-3" style="margin:0 0 12px">
          <div>
            <label for="adminFormRole">角色</label>
            <select id="adminFormRole">
              <option value="support">support</option>
              <option value="manager">manager</option>
              <option value="owner">owner</option>
            </select>
          </div>
          <div>
            <label for="adminActionReason">操作原因（建立 / 停用必填）</label>
            <input id="adminActionReason" maxlength="120" placeholder="例如：人員編制調整 / 權限異動" />
          </div>
          <div>
            <label>操作</label>
            <div class="btns" style="margin:0">
              <button class="secondary compact" id="createAdminUserBtn" data-write-action="admin-user-create">建立管理員</button>
              <button class="danger compact" id="disableAdminUserBtn" data-write-action="admin-user-disable">停用已選管理員</button>
            </div>
          </div>
        </div>
        <div class="footer-note" id="adminActionNote">尚未執行管理員寫入操作</div>
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

      <div class="card section" id="rechargeSection">
        <div class="section-head">
          <div>
            <h2>核帳與審核</h2>
            <p>先查看訂單明細，再進行核准或駁回；manager / owner 才可操作。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshRechargeOrders">重新整理</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="rechargeStatus">訂單狀態</label>
            <select id="rechargeStatus">
              <option value="">全部</option>
              <option value="pending">待審</option>
              <option value="confirmed">已核准</option>
              <option value="rejected">已駁回</option>
            </select>
          </div>
          <div>
            <label for="rechargeTake">顯示筆數</label>
            <input id="rechargeTake" value="10" />
          </div>
          <div>
            <label for="rechargeReviewNote">審核備註</label>
            <input id="rechargeReviewNote" placeholder="例如：已對帳無誤 / 憑證不完整，需補件（必填）" />
          </div>
        </div>
        <div class="footer-note" id="rechargeActionNote">尚未執行核帳寫入操作</div>
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
        <div class="btns" style="margin-top:10px">
          <button class="secondary compact" id="rechargeQuickApproveBtn" data-write-action="recharge-quick-approve">快速核准</button>
          <button class="danger compact" id="rechargeQuickRejectBtn" data-write-action="recharge-quick-reject">快速駁回</button>
          <button class="ghost compact" id="rechargeQuickReloadBtn">重新整理此訂單</button>
        </div>
      </div>

      <div class="card section" id="roomCardsSection">
        <div class="section-head">
          <div>
            <h2>房卡餘額 / 異動</h2>
            <p>先看目前餘額，再看異動紀錄；所有玩家都適用，減少手動輸入錯誤。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshRoomCards">重新整理</button>
            <button class="ghost compact" id="clearRoomCardsFilters">清除</button>
          </div>
        </div>
        <div class="row row-3">
          <div>
            <label for="roomCardSearch">玩家關鍵字</label>
            <input id="roomCardSearch" placeholder="會員ID / 外部編號 / 暱稱" />
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
            <label for="roomCardTake">餘額清單筆數</label>
            <input id="roomCardTake" value="10" />
          </div>
        </div>
        <div class="row row-3" style="margin-top:12px">
          <div>
            <label for="adjustPlayerId">要調整的玩家 ID</label>
            <input id="adjustPlayerId" placeholder="可先點下方異動，再按「帶入上方調整欄」" />
          </div>
          <div>
            <label for="adjustAmount">調整數量</label>
            <input id="adjustAmount" placeholder="例如 20 或 -10" />
          </div>
          <div>
            <label for="adjustNote">調整原因（必填）</label>
            <input id="adjustNote" placeholder="例如：客服複核後補卡 / 修正餘額" />
          </div>
          <div>
            <label for="roomCardLogTake">異動紀錄筆數</label>
            <input id="roomCardLogTake" value="10" />
          </div>
        </div>
        <div class="btns">
          <button class="secondary" id="submitRoomCardAdjust" type="button" data-write-action="room-card-adjust" disabled>送出調整</button>
        </div>
        <div style="overflow:auto;margin-top:14px">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>外部編號</th>
                <th>目前餘額</th>
                <th>更新時間</th>
              </tr>
            </thead>
            <tbody id="roomCardBalancesBody"></tbody>
          </table>
        </div>
        <div style="height:14px"></div>
        <div class="footer-note">上方表格顯示目前總餘額；下方清單為歷史異動，每一筆都顯示該筆異動後的餘額，並依最新到最舊排列。</div>
        <div id="roomCardLogsBox"></div>
        <div class="detail-card" id="roomCardLogDetail">點選下方房卡異動紀錄可查看詳情</div>
        <div class="btns" style="margin-top:10px">
          <button class="ghost compact" id="roomCardQuickFillPlayerBtn">帶入上方調整欄</button>
          <button class="ghost compact" id="roomCardQuickCancelFillBtn" disabled>取消帶入</button>
          <button class="ghost compact" id="roomCardQuickReloadBtn">重新載入清單</button>
        </div>
      </div>

      <div class="card section" id="guildSection">
        <div class="section-head">
          <div>
            <h2>公會管理</h2>
            <p>這裡將申請、審核與成員管理分開處理，方便依流程排查。</p>
          </div>
          <div class="btns" style="margin:0">
            <button class="ghost compact" id="refreshGuilds">重新整理公會資料</button>
            <button class="ghost compact" id="refreshGuildRequests">重新整理申請資料</button>
          </div>
        </div>
        <div class="split">
          <div>
            <div class="subsection">
              <h3 class="subsection-title">公會申請（建立 / 編修 / 註銷）</h3>
              <p class="subsection-copy">所有變更先走申請流程，待主管核准後才套用到公會資料。</p>
            </div>
            <div class="row row-2">
              <div>
                <label for="guildRequestType">申請類型</label>
                <select id="guildRequestType">
                  <option value="create_guild">建立公會</option>
                  <option value="update_reference_rate">更新參考值</option>
                  <option value="revoke_guild">註銷公會</option>
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
                  <option value="false">不顯示</option>
                  <option value="true">顯示</option>
                </select>
              </div>
            </div>
            <div class="btns">
              <button class="ghost compact" id="createGuildRequestBtn" data-write-action="guild-request-submit">建立申請</button>
              <button class="ghost compact" id="updateGuildRequestBtn" data-write-action="guild-request-submit">更新申請</button>
              <button class="danger compact" id="revokeGuildRequestBtn" data-write-action="guild-request-submit">拆散申請</button>
              <button class="secondary" id="submitGuildRequest" data-write-action="guild-request-submit">送出公會申請</button>
            </div>
            <div class="footer-note">建立、編輯與拆散皆先送出申請；核准後才正式生效。</div>
          </div>
          <div>
            <div class="subsection">
              <h3 class="subsection-title">公會清單與成員操作</h3>
              <p class="subsection-copy">先查詢公會，再決定查看成員、調整角色或移出成員。</p>
            </div>
            <div class="row row-2">
              <div>
                <label for="guildSearch">公會關鍵字</label>
                <input id="guildSearch" placeholder="公會名稱 / 公會ID（留空=全部）" />
              </div>
              <div>
                <label for="guildStatus">公會狀態</label>
                <select id="guildStatus">
                  <option value="">全部</option>
                  <option value="active">生效中</option>
                  <option value="revoked">已註銷</option>
                </select>
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div>
                <label for="guildTake">顯示筆數</label>
                <input id="guildTake" value="10" />
              </div>
              <div>
                <label for="guildMemberRole">成員角色</label>
                <select id="guildMemberRole">
                  <option value="member">一般成員</option>
                  <option value="master">會長</option>
                </select>
              </div>
            </div>
            <div class="row row-2" style="margin-top:12px">
              <div>
                <label for="guildMemberPlayerId">目標玩家 ID</label>
                <input id="guildMemberPlayerId" placeholder="會員ID（加入或移出都用這裡）" />
              </div>
              <div>
                <label for="guildMemberNote">成員操作原因（必填）</label>
                <input id="guildMemberNote" placeholder="例如：玩家要求退會 / 客服依規則調整成員角色" />
              </div>
            </div>
            <div style="margin-top:12px">
              <label for="guildMemberFilter">成員關鍵字</label>
              <input id="guildMemberFilter" placeholder="會員ID / 外部編號 / 暱稱" />
            </div>
            <div style="margin-top:10px">
              <label><input type="checkbox" id="guildMemberActiveOnly" checked /> 只看啟用成員</label>
            </div>
            <div class="btns">
              <button class="ghost compact" id="addGuildMemberBtn" data-write-action="guild-member-add">加入公會</button>
              <button class="danger compact" id="removeGuildMemberBtn" data-write-action="guild-member-remove">移出公會</button>
            </div>
            <div class="footer-note" id="guildActionNote">尚未執行公會寫入操作</div>
          </div>
        </div>
        <div style="height:14px"></div>
        <div class="subsection">
          <h3 class="subsection-title">公會申請歷史</h3>
          <p class="subsection-copy">這裡查看待審、已核准與已駁回的申請紀錄，方便回溯追查。</p>
        </div>
        <div class="row row-2" style="margin-bottom:12px">
          <div>
            <label for="guildRequestFilterType">申請類型（留空=全部）</label>
            <select id="guildRequestFilterType">
              <option value="">全部</option>
              <option value="create_guild">建立公會</option>
              <option value="update_reference_rate">更新參考值</option>
              <option value="revoke_guild">註銷公會</option>
            </select>
          </div>
          <div>
            <label for="guildRequestFilterStatus">申請狀態（留空=全部）</label>
            <select id="guildRequestFilterStatus">
              <option value="">全部</option>
              <option value="pending">待審</option>
              <option value="approved">已核准</option>
              <option value="rejected">已駁回</option>
            </select>
          </div>
          <div>
            <label for="guildReviewNote">審核備註</label>
            <input id="guildReviewNote" placeholder="例如：資料完整可核准 / 缺少佐證，請補件（必填）" />
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
              <h3 class="subsection-title">公會清單</h3>
              <p class="subsection-copy">點選「查看」後，下方會顯示該公會的成員與細節。</p>
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
          <h3 class="subsection-title">公會成員與細節</h3>
          <p class="subsection-copy">這裡顯示單一公會的成員名單、角色、狀態與參考值設定。</p>
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
    const playersMeta = document.getElementById('playersMeta');
    const playerCreatedFrom = document.getElementById('playerCreatedFrom');
    const playerCreatedTo = document.getElementById('playerCreatedTo');
    const playerEditFormPanel = document.getElementById('playerEditFormPanel');
    const jumpToPlayerEditFormBtn = document.getElementById('jumpToPlayerEditFormBtn');
    const playerPrevPageBtn = document.getElementById('playerPrevPageBtn');
    const playerNextPageBtn = document.getElementById('playerNextPageBtn');
    const playerDetail = document.getElementById('playerDetail');
    const playerHistory = document.getElementById('playerHistory');
    const playerHistoryDetail = document.getElementById('playerHistoryDetail');
    const playerRelations = document.getElementById('playerRelations');
    const playerActionFillFormBtn = document.getElementById('playerActionFillFormBtn');
    const playerActionToggleStatusBtn = document.getElementById('playerActionToggleStatusBtn');
    const playerActionReloadContextBtn = document.getElementById('playerActionReloadContextBtn');
    const playerFormModeHint = document.getElementById('playerFormModeHint');
    const playerStatusReason = document.getElementById('playerStatusReason');
    const playerFormId = document.getElementById('playerFormId');
    const playerFormExternalId = document.getElementById('playerFormExternalId');
    const generatePlayerExternalIdBtn = document.getElementById('generatePlayerExternalIdBtn');
    const playerFormNickname = document.getElementById('playerFormNickname');
    const playerFormNote = document.getElementById('playerFormNote');
    const playerFormTags = document.getElementById('playerFormTags');
    const playerUpdateReason = document.getElementById('playerUpdateReason');
    const playerFormStatus = document.getElementById('playerFormStatus');
    const createPlayerBtn = document.getElementById('createPlayerBtn');
    const updatePlayerBtn = document.getElementById('updatePlayerBtn');
    const clearPlayerFormBtn = document.getElementById('clearPlayerFormBtn');
    const keepExternalIdPrefixOnCreate = document.getElementById('keepExternalIdPrefixOnCreate');
    const adminUsersBody = document.getElementById('adminUsersBody');
    const adminUsersMeta = document.getElementById('adminUsersMeta');
    const adminFormEmail = document.getElementById('adminFormEmail');
    const adminFormDisplayName = document.getElementById('adminFormDisplayName');
    const adminFormPassword = document.getElementById('adminFormPassword');
    const adminFormRole = document.getElementById('adminFormRole');
    const adminActionReason = document.getElementById('adminActionReason');
    const adminActionNote = document.getElementById('adminActionNote');
    const createAdminUserBtn = document.getElementById('createAdminUserBtn');
    const disableAdminUserBtn = document.getElementById('disableAdminUserBtn');
    const summaryBox = document.getElementById('summaryBox');
    const summaryHighlights = document.getElementById('summaryHighlights');
    const adminUserDetail = document.getElementById('adminUserDetail');
    const auditBox = document.getElementById('auditBox');
    const auditDetail = document.getElementById('auditDetail');
    const auditEntityFilter = document.getElementById('auditEntityFilter');
    const auditActionFilter = document.getElementById('auditActionFilter');
    const auditAdminFilter = document.getElementById('auditAdminFilter');
    const auditTake = document.getElementById('auditTake');
    const auditCreatedFrom = document.getElementById('auditCreatedFrom');
    const auditCreatedTo = document.getElementById('auditCreatedTo');
    const legacyBox = document.getElementById('legacyBox');
    const rechargeOrdersBody = document.getElementById('rechargeOrdersBody');
    const rechargeOrderDetail = document.getElementById('rechargeOrderDetail');
    const rechargeQuickApproveBtn = document.getElementById('rechargeQuickApproveBtn');
    const rechargeQuickRejectBtn = document.getElementById('rechargeQuickRejectBtn');
    const rechargeQuickReloadBtn = document.getElementById('rechargeQuickReloadBtn');
    const roomCardBalancesBody = document.getElementById('roomCardBalancesBody');
    const roomCardLogsBox = document.getElementById('roomCardLogsBox');
    const roomCardLogDetail = document.getElementById('roomCardLogDetail');
    const roomCardQuickFillPlayerBtn = document.getElementById('roomCardQuickFillPlayerBtn');
    const roomCardQuickCancelFillBtn = document.getElementById('roomCardQuickCancelFillBtn');
    const roomCardQuickReloadBtn = document.getElementById('roomCardQuickReloadBtn');
    const submitRoomCardAdjustBtn = document.getElementById('submitRoomCardAdjust');
    const guildRequestsBody = document.getElementById('guildRequestsBody');
    const guildsBody = document.getElementById('guildsBody');
    const guildMembersBody = document.getElementById('guildMembersBody');
    const guildDetail = document.getElementById('guildDetail');
    const guildActionNote = document.getElementById('guildActionNote');
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
    let lastAuditLogs = [];
    let selectedRechargeOrderId = null;
    let selectedAdminUserId = null;
    let selectedAuditLogId = null;
    let currentAdminUserId = null;
    let currentAdminRole = null;
    let lastRoomCardLogs = [];
    let lastRoomCardBalances = [];
    let selectedRoomCardLogId = null;
    let lastGuilds = [];
    let lastGuildRequests = [];
    let selectedGuildId = null;
    let selectedGuildDetail = null;
    let selectedGuildMemberId = null;
    let selectedPlayerId = null;
    let selectedPlayerDetail = null;
    let lastPlayerHistoryLogs = [];
    let selectedPlayerHistoryLogId = null;
    let roomCardAdjustDraftBackup = null;
    let playerOffset = 0;
    let lastPlayersResult = { items: [], offset: 0, take: 10, total: 0, hasMore: false };
    let playerSearchTimer = null;
    let roomCardSearchTimer = null;
    let guildSearchTimer = null;
    let playerFormHintTimer = null;
    let adminActionNoteTimer = null;
    let rechargeActionNoteTimer = null;
    let guildActionNoteTimer = null;
    let playerFormSubmitPending = false;
    const createPlayerDefaultText = createPlayerBtn ? createPlayerBtn.textContent : '新增會員';
    const updatePlayerDefaultText = updatePlayerBtn ? updatePlayerBtn.textContent : '更新會員';

    function toDateInputValue(date) {
      return date.toISOString().slice(0, 10);
    }

    function setPlayerDateRange(fromDate, toDate) {
      playerCreatedFrom.value = fromDate ? toDateInputValue(fromDate) : '';
      playerCreatedTo.value = toDate ? toDateInputValue(toDate) : '';
    }

    function setAdminActionNote(message, tone = 'neutral') {
      if (!adminActionNote) {
        return;
      }

      if (adminActionNoteTimer) {
        clearTimeout(adminActionNoteTimer);
      }

      const prefix = tone === 'success' ? '成功：' : tone === 'warn' ? '提醒：' : '';
      adminActionNote.textContent = prefix + message;

      if (tone === 'success' || tone === 'warn') {
        adminActionNoteTimer = setTimeout(() => {
          if (adminActionNote) {
            adminActionNote.textContent = '尚未執行管理員寫入操作';
          }
        }, 3200);
      }
    }

    function setRechargeActionNote(message, tone = 'neutral') {
      if (!rechargeActionNote) {
        return;
      }

      if (rechargeActionNoteTimer) {
        clearTimeout(rechargeActionNoteTimer);
      }

      const prefix = tone === 'success' ? '成功：' : tone === 'warn' ? '提醒：' : '';
      rechargeActionNote.textContent = prefix + message;

      if (tone === 'success' || tone === 'warn') {
        rechargeActionNoteTimer = setTimeout(() => {
          if (rechargeActionNote) {
            rechargeActionNote.textContent = '尚未執行核帳寫入操作';
          }
        }, 3200);
      }
    }

    function setGuildActionNote(message, tone = 'neutral') {
      if (!guildActionNote) {
        return;
      }

      if (guildActionNoteTimer) {
        clearTimeout(guildActionNoteTimer);
      }

      const prefix = tone === 'success' ? '成功：' : tone === 'warn' ? '提醒：' : '';
      guildActionNote.textContent = prefix + message;

      if (tone === 'success' || tone === 'warn') {
        guildActionNoteTimer = setTimeout(() => {
          if (guildActionNote) {
            guildActionNote.textContent = '尚未執行公會寫入操作';
          }
        }, 3200);
      }
    }

    function setPlayerFormHintMessage(message, tone) {
      if (!playerFormModeHint) {
        return;
      }

      playerFormModeHint.textContent = message;
      playerFormModeHint.classList.remove('warn', 'success');
      if (tone === 'warn' || tone === 'success') {
        playerFormModeHint.classList.add(tone);
      }
    }

    function setPlayerFormTemporaryHint(message, tone) {
      if (playerFormHintTimer) {
        clearTimeout(playerFormHintTimer);
      }
      setPlayerFormHintMessage(message, tone);
      playerFormHintTimer = setTimeout(() => {
        updatePlayerFormMode();
      }, 1500);
    }

    function setPlayerSubmitPending(pending, actionLabel) {
      playerFormSubmitPending = pending;
      if (createPlayerBtn) {
        createPlayerBtn.textContent = pending && actionLabel === 'create' ? '新增中...' : createPlayerDefaultText;
      }
      if (updatePlayerBtn) {
        updatePlayerBtn.textContent = pending && actionLabel === 'update' ? '更新中...' : updatePlayerDefaultText;
      }
      if (clearPlayerFormBtn) {
        clearPlayerFormBtn.disabled = pending;
      }
      if (generatePlayerExternalIdBtn) {
        generatePlayerExternalIdBtn.disabled = pending;
      }
      updatePlayerFormMode();
    }

    function clearPlayerFieldValidation() {
      playerFormExternalId.classList.remove('field-invalid');
      playerFormNickname.classList.remove('field-invalid');
    }

    function highlightMissingPlayerFields() {
      const externalId = playerFormExternalId.value.trim();
      const nickname = playerFormNickname.value.trim();
      playerFormExternalId.classList.toggle('field-invalid', !externalId);
      playerFormNickname.classList.toggle('field-invalid', !nickname);
    }

    function deriveExternalIdPrefix(externalId) {
      const trimmed = String(externalId || '').trim();
      if (!trimmed) {
        return '';
      }

      const suffixNumberMatch = trimmed.match(/^(.*?)([-_])\\d+$/);
      if (suffixNumberMatch && suffixNumberMatch[1]) {
        return suffixNumberMatch[1] + suffixNumberMatch[2];
      }

      return /[-_]$/.test(trimmed) ? trimmed : (trimmed + '-');
    }

    function resolvePlayerFormNextStep(actionLabel, detail) {
      const text = String(detail || '');
      if (text.includes('編修模式') || text.includes('會員 ID')) {
        return '先按「清除」切回新增模式，再填外部編號與暱稱。';
      }
      if (text.includes('請填寫外部編號')) {
        return '填好外部編號後再送出，必要時可按「自動產生不重複編號」。';
      }
      if (text.includes('請填寫暱稱') || text.includes('暱稱')) {
        return '請在「暱稱」欄位輸入 2-24 字的可見文字。';
      }
      if (text.includes('操作原因') || text.includes('更新原因') || text.includes('reason')) {
        return '請先填寫「操作原因（新增 / 更新會員必填）」再送出。';
      }
      if (text.includes('已存在') || text.includes('曾使用過') || text.includes('不可回收')) {
        return '更換一個新的外部編號，再重新送出。';
      }
      if (actionLabel === '更新會員') {
        return '先從上方清單點選一筆會員帶入，再按更新。';
      }
      return '請檢查必填欄位後再試一次。';
    }

    function getErrorMessage(error) {
      if (error && typeof error === 'object' && 'message' in error && error.message) {
        return String(error.message);
      }

      if (typeof error === 'string' && error) {
        return error;
      }

      return '發生未知錯誤，請稍後再試。';
    }

    function showPlayerFormError(actionLabel, errorMessage, externalId) {
      const detail = formatExternalIdConflictMessage(errorMessage, externalId);
      const nextStep = resolvePlayerFormNextStep(actionLabel, detail);
      alert(actionLabel + '失敗\\n原因：' + detail + '\\n下一步：' + nextStep);
    }

    function clearPlayerForm() {
      selectedPlayerId = null;
      selectedPlayerDetail = null;
      selectedPlayerHistoryLogId = null;
      playerFormId.value = '';
      playerFormExternalId.value = '';
      playerFormNickname.value = '';
      playerFormNote.value = '';
      playerFormTags.value = '';
      playerUpdateReason.value = '';
      playerFormStatus.value = 'active';
      clearPlayerFieldValidation();
      updatePlayerFormMode();
      setPlayerFormTemporaryHint('已回到新增模式，請填外部編號與暱稱。', 'success');
      if (lastPlayersResult && Array.isArray(lastPlayersResult.items)) {
        renderPlayers(lastPlayersResult);
      }
      renderPlayerDetail(null);
      renderPlayerHistory([]);
      renderPlayerRelations({});
    }

    function fillPlayerForm(player) {
      selectedPlayerId = player.id;
      playerFormId.value = player.id;
      playerFormExternalId.value = player.externalId;
      playerFormNickname.value = player.nickname;
      playerFormNote.value = player.note || '';
      playerFormTags.value = player.tags || '';
      playerUpdateReason.value = '';
      playerFormStatus.value = player.status;
      clearPlayerFieldValidation();
      updatePlayerFormMode();
    }

    function updatePlayerFormMode() {
      const isEditMode = Boolean(playerFormId.value.trim());
      playerEditFormPanel.classList.toggle('edit-mode', isEditMode);
      playerEditFormPanel.classList.toggle('create-mode', !isEditMode);

      setPlayerFormHintMessage(
        isEditMode
          ? '目前：編修模式（已帶入系統會員 ID）'
          : '目前：新增模式（不用填系統會員 ID）',
      );

      if (createPlayerBtn && updatePlayerBtn) {
        createPlayerBtn.classList.toggle('ghost', isEditMode);
        createPlayerBtn.classList.toggle('secondary', !isEditMode);
        updatePlayerBtn.classList.toggle('secondary', isEditMode);
        updatePlayerBtn.classList.toggle('ghost', !isEditMode);

        if (!readonlyMode) {
          if (playerFormSubmitPending) {
            createPlayerBtn.disabled = true;
            updatePlayerBtn.disabled = true;
          } else {
            createPlayerBtn.disabled = isEditMode;
            updatePlayerBtn.disabled = !isEditMode;
          }
        }
      }
    }

    function renderPlayerQuickActions(player) {
      const hasPlayer = Boolean(player);
      playerActionFillFormBtn.disabled = !hasPlayer;
      playerActionReloadContextBtn.disabled = !hasPlayer;

      if (!hasPlayer) {
        playerActionToggleStatusBtn.disabled = true;
        playerActionToggleStatusBtn.textContent = '停權 / 復權';
        return;
      }

      const nextStatus = player.status === 'banned' ? 'active' : 'banned';
      playerActionToggleStatusBtn.disabled = false;
      playerActionToggleStatusBtn.dataset.nextStatus = nextStatus;
      playerActionToggleStatusBtn.textContent = nextStatus === 'banned' ? '快速停權' : '快速復權';
    }

    function jumpToPlayerEditForm() {
      if (playerEditFormPanel) {
        playerEditFormPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      playerFormNickname.focus();
    }

    function renderPlayerDetail(player, activitySummary = null) {
      selectedPlayerDetail = player;

      if (!player) {
        playerDetail.textContent = '點選會員可查看單筆詳情';
        renderPlayerQuickActions(null);
        return;
      }

      const fields = [
        ['會員 ID', player.id],
        ['外部編號', player.externalId],
        ['暱稱', player.nickname],
        ['狀態', formatPlayerStatusLabel(player.status)],
        ['備註', player.note || '-'],
        ['標籤', player.tags || '-'],
        ['遊戲幣', formatCoin(player.coinBalance)],
        ['房卡', formatCoin(player.roomCardBalance?.balance ?? 0)],
        ['加入時間', new Date(player.createdAt).toLocaleString('zh-TW')],
        ['最後更新', new Date(player.updatedAt).toLocaleString('zh-TW')],
      ];

      if (activitySummary) {
        fields.push(
          ['最近活動', activitySummary.latestActivityAt || '-'],
          ['最近房卡手動調整', String(activitySummary.recentRoomCardAdjustCount ?? 0) + ' 筆'],
          ['客服判斷', activitySummary.riskHint || '目前看起來正常'],
        );
      }

      playerDetail.innerHTML = '<div class="detail-kv-grid">' +
        fields.map(([label, value]) => {
          return '<div class="detail-kv-item">' +
            '<span class="k">' + escapeHtml(label) + '</span>' +
            '<span class="v">' + escapeHtml(value) + '</span>' +
            '</div>';
        }).join('') +
        '</div>';

      renderPlayerQuickActions(player);
    }

    function renderPlayerHistory(logs) {
      lastPlayerHistoryLogs = logs;

      if (!selectedPlayerId) {
        playerHistory.textContent = '點選會員可查看最近操作紀錄';
        selectedPlayerHistoryLogId = null;
        renderPlayerHistoryDetail(null);
        return;
      }

      if (!logs.length) {
        playerHistory.textContent = '這位會員目前還沒有最近操作紀錄';
        selectedPlayerHistoryLogId = null;
        renderPlayerHistoryDetail(null);
        return;
      }

      if (!selectedPlayerHistoryLogId || !logs.some((log) => log.id === selectedPlayerHistoryLogId)) {
        selectedPlayerHistoryLogId = logs[0].id;
      }

      playerHistory.innerHTML = '<div class="audit-entry-list">' + logs.map((log) => renderPlayerHistoryEntryHtml(log)).join('') + '</div>';
      renderPlayerHistoryDetail(logs.find((log) => log.id === selectedPlayerHistoryLogId) || logs[0]);
    }

    function renderPlayerHistoryEntryHtml(log) {
      const presentation = buildAuditPresentation(log);
      const selectedClass = log.id === selectedPlayerHistoryLogId ? ' selected' : '';
      const previewLines = [
        '實體 ID：' + log.entityId,
        '操作人：' + presentation.operator,
        presentation.metadataLines[0] || '',
      ].filter(Boolean);

      return '<button type="button" class="audit-entry-button' + selectedClass + '" data-player-history-log-id="' + escapeHtml(log.id) + '">' +
        '<strong>' + escapeHtml(presentation.timestamp + '｜' + presentation.title) + '</strong>' +
        '<span>' + escapeHtml(previewLines.join(' ｜ ')) + '</span>' +
        '</button>';
    }

    function renderPlayerHistoryDetail(log) {
      if (!log) {
        playerHistoryDetail.textContent = '點選右側會員歷史事件可查看完整明細';
        return;
      }

      const presentation = buildAuditPresentation(log);
      const detailLines = [
        '時間：' + presentation.timestamp,
        '動作：' + presentation.title,
        '實體：' + log.entityName,
        '實體 ID：' + log.entityId,
        '操作人：' + presentation.operator,
        '摘要：' + presentation.summary,
        ...presentation.metadataLines,
      ];

      playerHistoryDetail.innerHTML = '<div class="audit-detail-lines">' +
        detailLines.map((line) => '<div class="audit-detail-line">' + escapeHtml(line) + '</div>').join('') +
        '</div>';
    }

    function buildPlayerActivitySummary(player, logs, roomCardLogs, rechargeOrders, guilds) {
      const timestamps = [];
      const pushTimestamp = (value) => {
        if (!value) {
          return;
        }

        const time = new Date(value).getTime();
        if (!Number.isNaN(time)) {
          timestamps.push(time);
        }
      };

      pushTimestamp(player.updatedAt);
      logs.forEach((log) => pushTimestamp(log.createdAt));
      roomCardLogs.forEach((log) => pushTimestamp(log.createdAt));
      rechargeOrders.forEach((order) => pushTimestamp(order.createdAt));
      guilds.forEach((guild) => pushTimestamp(guild.updatedAt));

      const latestActivityAt = timestamps.length
        ? new Date(Math.max(...timestamps)).toLocaleString('zh-TW')
        : null;

      const recentRoomCardAdjustLogs = roomCardLogs.filter((log) => log.sourceType === 'admin_adjust');
      const recentRoomCardAdjustCount = recentRoomCardAdjustLogs.length;
      const hasSuspiciousRoomCardPattern = recentRoomCardAdjustCount >= 3;
      const isBanned = String(player?.status || '') === 'banned';

      let riskHint = '目前看起來正常';
      if (isBanned) {
        riskHint = '目前已停權，需留意是否可恢復';
      } else if (hasSuspiciousRoomCardPattern) {
        riskHint = '近期房卡手動調整偏多，建議優先複核';
      } else if (rechargeOrders.some((order) => order.status === 'pending')) {
        riskHint = '有待審核核帳單，先看交易';
      } else if (guilds.length === 0) {
        riskHint = '尚未加入公會，若是遊戲型會員可再確認';
      }

      return {
        latestActivityAt,
        recentRoomCardAdjustCount,
        riskHint,
      };
    }

    function renderPlayerRelations(context) {
      if (!selectedPlayerId) {
        playerRelations.textContent = '點選會員可查看公會 / 房卡 / 核帳摘要';
        return;
      }

      const balance = context.balance || null;
      const roomCardLogs = context.roomCardLogs || [];
      const rechargeOrders = context.rechargeOrders || [];
      const guilds = context.guilds || [];
      const playerAuditLogs = context.playerAuditLogs || [];

      const latestRoomCardLog = roomCardLogs[0] || null;
      const latestRechargeOrder = rechargeOrders[0] || null;
      const latestGuildJoinLog = playerAuditLogs.find((log) => log.action === 'ADD_GUILD_MEMBER') || null;
      const guildSummary = guilds.length
        ? guilds.map((guild) => guild.name + '（' + formatGuildStatusLabel(guild.status) + '）').join('、')
        : '目前無生效中公會';
      const guildJoinSummary = latestGuildJoinLog
        ? [
            new Date(latestGuildJoinLog.createdAt).toLocaleString('zh-TW'),
            formatAdminActor(latestGuildJoinLog.adminUserId),
          ].join(' / ')
        : '尚無加入紀錄';

      const lines = [
        '所屬公會：' + guildSummary,
        '最近加入公會：' + guildJoinSummary,
        '房卡餘額：' + formatCoin(balance?.balance ?? 0),
        '最近房卡異動：' + (latestRoomCardLog
          ? [
              latestRoomCardLog.sourceType,
              String(latestRoomCardLog.changeAmount),
              new Date(latestRoomCardLog.createdAt).toLocaleString('zh-TW'),
            ].join(' / ')
          : '尚無紀錄'),
        '最近核帳：' + (latestRechargeOrder
          ? [
              formatRechargeStatusLabel(latestRechargeOrder.status),
              String(latestRechargeOrder.roomCardAmount),
              new Date(latestRechargeOrder.createdAt).toLocaleString('zh-TW'),
            ].join(' / ')
          : '尚無紀錄'),
      ];

      playerRelations.innerHTML =
        '<div class="audit-detail-lines">' +
        lines.map((line) => '<div class="audit-detail-line">' + escapeHtml(line) + '</div>').join('') +
        '</div>' +
        '<div class="btns" style="margin-top:10px">' +
        '<button class="ghost compact" type="button" data-player-relation-jump="room-cards">看此會員房卡 / 儲值歷史</button>' +
        '<button class="ghost compact" type="button" data-player-relation-jump="guild">看此會員公會加入脈絡</button>' +
        '</div>';
    }

    async function jumpToRoomCardsForSelectedPlayer() {
      if (!selectedPlayerDetail || !selectedPlayerId) {
        alert('請先在會員清單點選一位會員。');
        return;
      }

      const roomCardsSection = document.getElementById('roomCardsSection');
      const roomCardSearchInput = document.getElementById('roomCardSearch');
      const roomCardSourceTypeInput = document.getElementById('roomCardSourceType');
      const roomCardLogTakeInput = document.getElementById('roomCardLogTake');
      const adjustPlayerIdInput = document.getElementById('adjustPlayerId');

      if (roomCardSearchInput) {
        roomCardSearchInput.value = selectedPlayerDetail.externalId || selectedPlayerDetail.nickname || selectedPlayerDetail.id;
      }
      if (roomCardSourceTypeInput) {
        roomCardSourceTypeInput.value = '';
      }
      if (roomCardLogTakeInput && (!roomCardLogTakeInput.value || Number(roomCardLogTakeInput.value) < 20)) {
        roomCardLogTakeInput.value = '20';
      }
      if (adjustPlayerIdInput) {
        adjustPlayerIdInput.value = selectedPlayerId;
      }

      const [balances, logs] = await Promise.all([
        api('/api/room-cards/balances?playerId=' + encodeURIComponent(selectedPlayerId) + '&take=5'),
        api('/api/room-cards/logs?playerId=' + encodeURIComponent(selectedPlayerId) + '&take=20'),
      ]);

      renderRoomCardBalances(balances);
      renderRoomCardLogs(logs);

      if (roomCardsSection) {
        roomCardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    async function jumpToGuildForSelectedPlayer() {
      if (!selectedPlayerDetail || !selectedPlayerId) {
        alert('請先在會員清單點選一位會員。');
        return;
      }

      const guildSection = document.getElementById('guildSection');
      const guildMemberPlayerIdInput = document.getElementById('guildMemberPlayerId');
      const guildMemberFilterInput = document.getElementById('guildMemberFilter');

      if (guildMemberPlayerIdInput) {
        guildMemberPlayerIdInput.value = selectedPlayerId;
      }
      if (guildMemberFilterInput) {
        guildMemberFilterInput.value = selectedPlayerDetail.externalId || selectedPlayerDetail.nickname || '';
      }

      const guilds = await api('/api/guilds?playerId=' + encodeURIComponent(selectedPlayerId) + '&take=10');
      renderGuilds(guilds);

      if (guilds.length) {
        await loadGuildDetail(guilds[0].id);
      } else {
        selectedGuildId = null;
        selectedGuildDetail = null;
        guildDetail.textContent = '此會員目前未加入任何公會';
      }

      const joinLogs = await api('/api/audit-logs?playerId=' + encodeURIComponent(selectedPlayerId) + '&action=ADD_GUILD_MEMBER&take=1');
      const latestJoinLog = joinLogs[0] || null;
      if (latestJoinLog) {
        const joinHint =
          '最近加入紀錄：' +
          new Date(latestJoinLog.createdAt).toLocaleString('zh-TW') +
          ' / 操作人：' +
          formatAdminActor(latestJoinLog.adminUserId);
        guildDetail.textContent = guildDetail.textContent + '\\n' + joinHint;
      }

      if (guildSection) {
        guildSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function backupRoomCardAdjustDraft() {
      if (roomCardAdjustDraftBackup) {
        return;
      }

      roomCardAdjustDraftBackup = {
        playerId: document.getElementById('adjustPlayerId').value,
        changeAmount: document.getElementById('adjustAmount').value,
        note: document.getElementById('adjustNote').value,
      };

      roomCardQuickCancelFillBtn.disabled = false;
    }

    function clearRoomCardAdjustDraftBackup() {
      roomCardAdjustDraftBackup = null;
      roomCardQuickCancelFillBtn.disabled = true;
      updateRoomCardAdjustSubmitState();
    }

    function updateRoomCardAdjustSubmitState() {
      if (!submitRoomCardAdjustBtn) {
        return;
      }

      const playerId = document.getElementById('adjustPlayerId').value.trim();
      const amountText = document.getElementById('adjustAmount').value.trim();
      const note = document.getElementById('adjustNote').value.trim();
      const changeAmount = Number(amountText);
      const hasValidAmount = amountText !== '' && Number.isFinite(changeAmount) && changeAmount !== 0;

      submitRoomCardAdjustBtn.disabled = !playerId || !hasValidAmount || !note;
    }

    function preventEnterKeySubmit(event) {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
    }

    function cancelRoomCardAdjustFill() {
      if (!roomCardAdjustDraftBackup) {
        return;
      }

      document.getElementById('adjustPlayerId').value = roomCardAdjustDraftBackup.playerId;
      document.getElementById('adjustAmount').value = roomCardAdjustDraftBackup.changeAmount;
      document.getElementById('adjustNote').value = roomCardAdjustDraftBackup.note;
      clearRoomCardAdjustDraftBackup();
      updateRoomCardAdjustSubmitState();
    }

    function getUtcStartOfDay(date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    function getUtcEndOfDay(date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
    }

    function getUtcStartOfWeek(date) {
      const start = getUtcStartOfDay(date);
      const day = start.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setUTCDate(start.getUTCDate() + diff);
      return start;
    }

    function getUtcStartOfMonth(date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }

    function applyPreferredSectionOrder() {
      const stack = document.querySelector('.section-stack');
      if (!stack) {
        return;
      }

      const orderedIds = [
        'playersSection',
        'roomCardsSection',
        'guildSection',
        'rechargeSection',
        'adminUsersSection',
        'summarySection',
      ];

      orderedIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section) {
          stack.appendChild(section);
        }
      });
    }

    function formatCoin(value) {
      return String(value);
    }

    function formatPlayerStatusLabel(status) {
      const labels = {
        active: '啟用',
        banned: '停權',
      };
      return labels[status] || status || '-';
    }

    function formatRechargeStatusLabel(status) {
      const labels = {
        pending: '待審',
        confirmed: '已核准',
        rejected: '已駁回',
      };
      return labels[status] || status || '-';
    }

    function formatGuildStatusLabel(status) {
      const labels = {
        active: '生效中',
        revoked: '已註銷',
      };
      return labels[status] || status || '-';
    }

    function formatGuildRequestStatusLabel(status) {
      const labels = {
        pending: '待審',
        approved: '已核准',
        rejected: '已駁回',
      };
      return labels[status] || status || '-';
    }

    function formatGuildRequestTypeLabel(requestType) {
      const labels = {
        create_guild: '建立公會',
        update_reference_rate: '更新參考值',
        revoke_guild: '註銷公會',
      };
      return labels[requestType] || requestType || '-';
    }

    function formatGuildMemberRoleLabel(role) {
      const labels = {
        member: '一般成員',
        master: '會長',
      };
      return labels[role] || role || '-';
    }

    function formatAdminActor(adminUserId) {
      if (!adminUserId) {
        return '-';
      }

      const adminUser = lastAdminUsers.find((item) => item.id === adminUserId);
      if (!adminUser) {
        return adminUserId;
      }

      return adminUser.displayName + '（' + adminUser.role + '）';
    }

    function formatAuditActionLabel(action) {
      const actionLabels = {
        LIST_AUDIT: '查看稽核紀錄',
        VIEW_PLAYER: '查看玩家',
        CREATE_PLAYER: '建立會員',
        UPDATE_PLAYER: '更新會員資料',
        UPDATE_PLAYER_STATUS: '變更會員狀態',
        CREATE_ADMIN_USER: '建立管理員',
        DISABLE_ADMIN_USER: '停用管理員',
        SUBMIT_RECHARGE_ORDER: '送出核帳申請',
        CONFIRM_RECHARGE_ORDER: '核准核帳',
        REJECT_RECHARGE_ORDER: '駁回核帳',
        ADJUST_ROOM_CARD_BALANCE: '手動調整房卡',
        SUBMIT_GUILD_APPROVAL_REQUEST: '送出公會申請',
        APPROVE_GUILD_APPROVAL_REQUEST: '核准公會申請',
        REJECT_GUILD_APPROVAL_REQUEST: '駁回公會申請',
        ADD_GUILD_MEMBER: '加入公會成員',
        UPDATE_GUILD_MEMBER_ROLE: '調整公會成員角色',
        REMOVE_GUILD_MEMBER: '移出公會成員',
      };

      return actionLabels[action] || action;
    }

    function formatAuditFieldLabel(key) {
      const labels = {
        externalId: '外部編號',
        nickname: '暱稱',
        status: '狀態',
        email: '帳號',
        displayName: '姓名',
        role: '角色',
        isActive: '啟用狀態',
        credentialSet: '密碼已設定',
        playerId: '會員 ID',
        amount: '金額',
        roomCardAmount: '房卡數量',
        reviewNote: '審核備註',
        note: '備註',
        balance: '房卡餘額',
        changeAmount: '異動數量',
        guildId: '公會 ID',
        requestType: '申請類型',
        selfTouchReferenceRate: '自摸參考值',
        selfTouchReferenceVisible: '自摸是否顯示',
        winReferenceRate: '胡牌參考值',
        winReferenceVisible: '胡牌是否顯示',
      };

      return labels[key] || key;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatAuditValue(value) {
      if (value == null) {
        return '-';
      }

      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      }

      if (Array.isArray(value)) {
        return value.map((item) => formatAuditValue(item)).join('、');
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    }

    function formatAuditEnumLabel(value) {
      const labels = {
        active: '啟用',
        banned: '停權',
        pending: '待審',
        confirmed: '已核准',
        approved: '已核准',
        rejected: '已駁回',
        revoked: '已註銷',
        member: '一般成員',
        master: '會長',
        disabled: '停用',
      };

      return labels[value] || value;
    }

    function formatAuditFieldValue(key, value) {
      const enumKeys = new Set([
        'status',
        'previousStatus',
        'nextStatus',
        'role',
        'previousRole',
        'nextRole',
      ]);

      if (typeof value === 'string' && enumKeys.has(key)) {
        return formatAuditEnumLabel(value);
      }

      return formatAuditValue(value);
    }

    function formatAuditSummary(summary) {
      if (!summary) {
        return '';
      }

      let text = String(summary);
      const tokenMap = {
        active: '啟用',
        banned: '停權',
        pending: '待審',
        confirmed: '已核准',
        approved: '已核准',
        rejected: '已駁回',
        revoked: '已註銷',
        member: '一般成員',
        master: '會長',
        disabled: '停用',
      };

      Object.entries(tokenMap).forEach(([token, label]) => {
        text = text.replace(new RegExp('\\\\b' + token + '\\\\b', 'g'), label);
      });

      return text;
    }

    function parseAuditMetadata(metadata) {
      if (!metadata) {
        return null;
      }

      if (typeof metadata === 'string') {
        try {
          return JSON.parse(metadata);
        } catch {
          return null;
        }
      }

      return metadata;
    }

    function formatAuditMetadataSummary(metadata) {
      const lines = buildAuditMetadataLines(metadata);
      return lines.length ? lines.join('；') : '';
    }

    function buildAuditMetadataLines(metadata) {
      const parsed = parseAuditMetadata(metadata);
      if (!parsed || typeof parsed !== 'object') {
        return [];
      }

      const lines = [];
      const before = parsed.before && typeof parsed.before === 'object' ? parsed.before : null;
      const after = parsed.after && typeof parsed.after === 'object' ? parsed.after : null;

      if (before || after) {
        const changedParts = [];
        const keys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]);
        keys.forEach((key) => {
          const beforeValue = before ? before[key] : undefined;
          const afterValue = after ? after[key] : undefined;
          if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
            return;
          }

          changedParts.push(
            formatAuditFieldLabel(key) + '：' + formatAuditFieldValue(key, beforeValue) + ' -> ' + formatAuditFieldValue(key, afterValue),
          );
        });

        if (changedParts.length) {
          lines.push('差異：' + changedParts.join('；'));
        }
      }

      if (parsed.requestType) {
        lines.push('申請類型：' + formatGuildRequestTypeLabel(parsed.requestType));
      }

      if (parsed.guildId) {
        lines.push('公會 ID：' + formatAuditValue(parsed.guildId));
      }

      if (parsed.requestPayload && typeof parsed.requestPayload === 'object') {
        const payloadParts = Object.entries(parsed.requestPayload)
          .map(([key, value]) => formatAuditFieldLabel(key) + '：' + formatAuditFieldValue(key, value));
        if (payloadParts.length) {
          lines.push('申請內容：' + payloadParts.join('；'));
        }
      }

      if (parsed.note) {
        lines.push('備註：' + formatAuditValue(parsed.note));
      }

      if (parsed.reviewNote) {
        lines.push('審核備註：' + formatAuditValue(parsed.reviewNote));
      }

      return lines;
    }

    function buildAuditPresentation(log) {
      return {
        timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString('zh-TW') : '-',
        title: formatAuditActionLabel(log.action),
        operator: formatAdminActor(log.adminUserId),
        summary: formatAuditSummary(log.summary),
        metadataLines: buildAuditMetadataLines(log.metadata),
      };
    }

    function renderAuditEntryHtml(log, selectable) {
      const presentation = buildAuditPresentation(log);
      const selectedClass = selectable && log.id === selectedAuditLogId ? ' selected' : '';
      const buttonAttrs = selectable
        ? ' type="button" class="audit-entry-button' + selectedClass + '" data-audit-log-id="' + escapeHtml(log.id) + '"'
        : ' class="audit-entry-button"';
      const previewLines = [
        presentation.summary,
        '操作人：' + presentation.operator,
        presentation.metadataLines[0] || '',
      ].filter(Boolean);

      return '<button' + buttonAttrs + '>' +
        '<strong>' + escapeHtml(presentation.timestamp + '｜' + presentation.title) + '</strong>' +
        '<span>' + escapeHtml(previewLines.join(' ｜ ')) + '</span>' +
        '</button>';
    }

    function renderAuditDetail(log) {
      if (!log) {
        auditDetail.textContent = '點選左側稽核事件可查看完整明細';
        return;
      }

      const presentation = buildAuditPresentation(log);
      const detailLines = [
        '時間：' + presentation.timestamp,
        '動作：' + presentation.title,
        '實體：' + log.entityName,
        '實體 ID：' + log.entityId,
        '操作人：' + presentation.operator,
        '摘要：' + presentation.summary,
        ...presentation.metadataLines,
      ];

      auditDetail.innerHTML = '<div class="audit-detail-lines">' +
        detailLines.map((line) => '<div class="audit-detail-line">' + escapeHtml(line) + '</div>').join('') +
        '</div>';
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
        ['待核帳', summary.totals.pendingRechargeOrders, '需要主管核准的房卡購買單'],
        ['房卡總餘額', summary.totals.roomCardBalance, '所有玩家房卡餘額加總'],
        ['管理員數', summary.totals.adminUsers, 'owner / manager / support 帳號總數'],
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

      const overviewLines = [
        '目前資料來源：' + (summary.legacyChange?.capturedAt ? '已載入總覽資料' : 'mock / safe-dev 觀察模式'),
        '目前重點：玩家 ' + summary.totals.players + ' 人、待核帳 ' + summary.totals.pendingRechargeOrders + ' 筆、房卡總餘額 ' + summary.totals.roomCardBalance,
        '管理員：owner / manager / support 共 ' + summary.totals.adminUsers + ' 人',
        '舊後台異動：' + (legacyChanged ? '有變更' : '目前無明顯變更'),
        '建議操作順序：會員 -> 房卡 -> 公會 -> 核帳 -> 管理 -> 總覽。',
      ];

      summaryBox.textContent = overviewLines.join('\\n');
      summaryHighlights.innerHTML = [
        ['資料來源', readonlyMode ? '目前以 readonly / mock 展示為主，適合看流程與版面。' : '目前可進一步操作寫入流程。'],
        ['舊後台監測', '快照時間：' + legacyCapturedAt + '；異動表：' + legacyChangedTables],
        ['展示重點', '實務巡檢順序：會員 -> 房卡 -> 公會 -> 核帳 -> 管理 -> 總覽。'],
      ].map(([label, value]) => {
        return '<div class="summary-item">' +
          '<strong>' + label + '</strong>' +
          '<span>' + value + '</span>' +
          '</div>';
      }).join('');
    }

    function renderAuditLogs(logs) {
      lastAuditLogs = logs;

      if (!logs.length) {
        selectedAuditLogId = null;
        auditBox.innerHTML = '<div class="muted">沒有稽核紀錄</div>';
        renderAuditDetail(null);
        return;
      }

      if (!selectedAuditLogId || !logs.some((log) => log.id === selectedAuditLogId)) {
        selectedAuditLogId = logs[0].id;
      }

      auditBox.innerHTML = '<div class="audit-entry-list">' + logs.map((log) => renderAuditEntryHtml(log, true)).join('') + '</div>';
      renderAuditDetail(logs.find((log) => log.id === selectedAuditLogId) || logs[0]);
    }

    function renderLegacyMonitor(legacyChange) {
      const hasChanges = legacyChange?.hasChanges ?? false;
      const changedTables = legacyChange?.changedTables || [];
      const capturedAt = legacyChange?.capturedAt
        ? new Date(legacyChange.capturedAt).toLocaleString('zh-TW')
        : '尚無快照';

      const nextSteps = hasChanges
        ? [
            '先回頭看稽核紀錄，確認最近是否剛做過資料調整。',
            '如果變更不在預期內，再去查 legacy tables 的實際差異。',
          ]
        : [
            '目前沒有明顯異動風險。',
            '若要展示，只要說目前 legacy 監測正常即可。',
          ];

      legacyBox.innerHTML =
        '<div class="summary-item">' +
        '<strong>監測狀態</strong>' +
        '<span>' + (hasChanges ? '有異動，需要留意' : '目前穩定，無明顯異動') + '</span>' +
        '</div>' +
        '<div class="summary-item">' +
        '<strong>最近快照</strong>' +
        '<span>' + capturedAt + '</span>' +
        '</div>' +
        '<div class="summary-item">' +
        '<strong>異動表</strong>' +
        '<span>' + (changedTables.length ? changedTables.join('、') : '無') + '</span>' +
        '</div>' +
        '<ul>' + nextSteps.map((step) => '<li>' + step + '</li>').join('') + '</ul>';
    }

    function renderPlayers(result) {
      lastPlayersResult = result;
      const players = result.items || [];

      playersBody.innerHTML = players.map((player) => {
        const statusClass = player.status === 'banned' ? 'banned' : 'active';
        const nextStatus = player.status === 'banned' ? 'active' : 'banned';
        const actionText = player.status === 'banned' ? '復權' : '停權';
        const selectedClass = player.id === selectedPlayerId
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        return '<tr data-player-id="' + player.id + '" data-player-external-id="' + player.externalId + '" data-player-nickname="' + player.nickname + '" data-player-status="' + player.status + '" data-player-note="' + escapeHtml(player.note || '') + '" data-player-tags="' + escapeHtml(player.tags || '') + '"' + selectedClass + '>' +
          '<td>' +
          '<strong>' + player.nickname + '</strong><br>' +
          '<span class="muted">' + player.externalId + '</span><br>' +
          '<span class="muted">ID: ' + player.id + '</span>' +
          '</td>' +
          '<td><span class="pill ' + statusClass + '">' + formatPlayerStatusLabel(player.status) + '</span></td>' +
          '<td>' + formatCoin(player.roomCardBalance?.balance ?? 0) + '</td>' +
          '<td>' +
          '<div class="actions-cell">' +
          '<button class="ghost compact" data-player-action="edit" data-player-id="' + player.id + '">編修</button>' +
          '<button class="secondary compact" data-write-action="player-status" data-player-id="' + player.id + '" data-next-status="' + nextStatus + '">' + actionText + '</button>' +
          '</div>' +
          '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="4" class="muted">沒有資料</td></tr>';

      applyReadonlyState();

      const start = players.length ? result.offset + 1 : 0;
      const end = result.offset + players.length;
      playersMeta.textContent =
        '目前顯示 ' + start + ' - ' + end + ' 筆，共 ' + result.total + ' 筆會員';
      playerPrevPageBtn.disabled = result.offset <= 0;
      playerNextPageBtn.disabled = !result.hasMore;

      if (selectedPlayerId && !players.some((player) => player.id === selectedPlayerId)) {
        renderPlayerDetail(selectedPlayerDetail);
      }
    }

    function renderRechargeOrders(orders) {
      lastRechargeOrders = orders;

      if (!selectedRechargeOrderId || !orders.some((order) => order.id === selectedRechargeOrderId)) {
        selectedRechargeOrderId = orders[0]?.id ?? null;
      }

      rechargeOrdersBody.innerHTML = orders.map((order) => {
        const statusClass = order.status === 'pending' ? 'pending' : order.status;
        const selectedClass = order.id === selectedRechargeOrderId
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        const actions = order.status === 'pending'
          ? '<div class="actions-cell">' +
            '<button class="secondary compact" data-write-action="recharge-review" data-recharge-id="' + order.id + '" data-recharge-action="confirm">核准</button>' +
            '<button class="danger compact" data-write-action="recharge-review" data-recharge-id="' + order.id + '" data-recharge-action="reject">駁回</button>' +
            '</div>'
          : '<span class="muted">-</span>';

        return '<tr data-recharge-id="' + order.id + '"' + selectedClass + '>' +
          '<td><strong>' + order.id + '</strong><br><span class="muted">' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : '-') + '</span></td>' +
          '<td>' + order.playerId + '</td>' +
          '<td>' + order.amount + ' / ' + order.roomCardAmount + '</td>' +
          '<td><span class="pill ' + statusClass + '">' + formatRechargeStatusLabel(order.status) + '</span></td>' +
          '<td>' + actions + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="5" class="muted">沒有核帳訂單</td></tr>';

      applyReadonlyState();

      if (!orders.length) {
        selectedRechargeOrderId = null;
        rechargeOrderDetail.textContent = '點選上方任一核帳單可查看詳情';
        renderRechargeQuickActions(null);
        return;
      }

      const selectedOrder = orders.find((order) => order.id === selectedRechargeOrderId) ?? orders[0];
      selectedRechargeOrderId = selectedOrder.id;
      renderRechargeOrderDetail(selectedOrder);
    }

    function renderRechargeQuickActions(order) {
      const hasOrder = Boolean(order);
      rechargeQuickReloadBtn.disabled = !hasOrder;

      if (!hasOrder) {
        rechargeQuickApproveBtn.disabled = true;
        rechargeQuickRejectBtn.disabled = true;
        return;
      }

      const isPending = order.status === 'pending';
      rechargeQuickApproveBtn.disabled = !isPending;
      rechargeQuickRejectBtn.disabled = !isPending;
      rechargeQuickApproveBtn.dataset.rechargeId = order.id;
      rechargeQuickRejectBtn.dataset.rechargeId = order.id;
    }

    function renderAdminUsers(adminUsers) {
      lastAdminUsers = adminUsers;
      auditAdminFilter.innerHTML = '<option value="">全部</option>' + adminUsers.map((adminUser) => {
        return '<option value="' + adminUser.id + '">' + adminUser.displayName + '（' + adminUser.role + '）</option>';
      }).join('');
      const roleCounts = adminUsers.reduce((acc, adminUser) => {
        acc[adminUser.role] = (acc[adminUser.role] || 0) + 1;
        return acc;
      }, {});
      const roleSummary = Object.entries(roleCounts)
        .map(([role, count]) => role + ' ' + count)
        .join(' / ') || '無';
      adminUsersMeta.textContent =
        '目前共 ' + adminUsers.length + ' 位管理員；角色分布：' + roleSummary +
        (currentAdminUserId ? '；已自動定位目前登入帳號' : '');

      adminUsersBody.innerHTML = adminUsers.map((adminUser) => {
        const isSelected = adminUser.id === selectedAdminUserId;
        const isCurrent = adminUser.id === currentAdminUserId;
        const selectedClass = isSelected
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        return '<tr data-admin-user-id="' + adminUser.id + '"' + selectedClass + '>' +
          '<td><strong>' + adminUser.displayName + '</strong>' + (isCurrent ? '<br><span class="muted">目前登入</span>' : '') + '<br><span class="muted">' + adminUser.email + '</span></td>' +
          '<td><span class="pill ' + (adminUser.isActive ? 'active' : 'banned') + '">' + adminUser.role + '</span><br><span class="muted">' + (adminUser.isActive ? '啟用' : '停用') + '</span></td>' +
          '<td>' + (adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleString('zh-TW') : '-') + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有管理員資料</td></tr>';

      const selectedAdmin =
        adminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) ??
        adminUsers.find((adminUser) => adminUser.id === currentAdminUserId) ??
        adminUsers[0] ??
        null;
      if (selectedAdmin) {
        selectedAdminUserId = selectedAdmin.id;
      }
      renderAdminUserDetail(selectedAdmin);

      if (lastAuditLogs.length) {
        renderAuditLogs(lastAuditLogs);
      }

      updateAdminActionState();
    }

    function updateAdminActionState() {
      const isOwner = currentAdminRole === 'owner';
      const selectedAdmin =
        lastAdminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) || null;
      const canDisableSelectedAdmin =
        isOwner &&
        Boolean(selectedAdmin) &&
        selectedAdmin.id !== currentAdminUserId &&
        selectedAdmin.isActive;

      if (createAdminUserBtn) {
        createAdminUserBtn.disabled = readonlyMode || !isOwner;
        createAdminUserBtn.title = readonlyMode
          ? 'readonly 模式，寫入已停用'
          : isOwner
            ? ''
            : '僅 owner 可建立管理員';
      }

      if (disableAdminUserBtn) {
        disableAdminUserBtn.disabled = readonlyMode || !canDisableSelectedAdmin;
        if (readonlyMode) {
          disableAdminUserBtn.title = 'readonly 模式，寫入已停用';
        } else if (!isOwner) {
          disableAdminUserBtn.title = '僅 owner 可停用管理員';
        } else if (!selectedAdmin) {
          disableAdminUserBtn.title = '請先點選一位管理員';
        } else if (selectedAdmin.id === currentAdminUserId) {
          disableAdminUserBtn.title = '不可停用目前登入帳號';
        } else if (!selectedAdmin.isActive) {
          disableAdminUserBtn.title = '該管理員已停用';
        } else {
          disableAdminUserBtn.title = '';
        }
      }
    }

    function renderAdminUserDetail(adminUser) {
      if (!adminUser) {
        adminUserDetail.textContent = '點選上方管理員可查看細節';
        return;
      }

      const lines = [
        '目前登入：' + (adminUser.id === currentAdminUserId ? '是' : '否'),
        '姓名：' + adminUser.displayName,
        '帳號：' + adminUser.email,
        '角色：' + adminUser.role,
        '狀態：' + (adminUser.isActive ? '啟用' : '停用'),
        '建立時間：' + (adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleString('zh-TW') : '-'),
        '更新時間：' + (adminUser.updatedAt ? new Date(adminUser.updatedAt).toLocaleString('zh-TW') : '-'),
      ];

      adminUserDetail.textContent = lines.join('\\n');
    }

    function renderRechargeOrderDetail(order) {
      if (!order) {
        rechargeOrderDetail.textContent = '點選上方任一核帳單可查看詳情';
        renderRechargeQuickActions(null);
        return;
      }

      const lines = [
        '訂單：' + order.id,
        '玩家：' + order.playerId,
        '狀態：' + formatRechargeStatusLabel(order.status),
        '金額 / 房卡：' + order.amount + ' / ' + order.roomCardAmount,
        '銀行後五碼：' + (order.bankAccountLast5 || '-'),
        '轉帳時間：' + (order.transferredAt ? new Date(order.transferredAt).toLocaleString('zh-TW') : '-'),
        '提交時間：' + (order.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : '-'),
        '憑證備註：' + (order.proofNote || '-'),
        '審核備註：' + (order.reviewNote || '-'),
      ];

      rechargeOrderDetail.textContent = lines.join('\\n');
      renderRechargeQuickActions(order);
    }

    function renderRoomCardBalances(balances) {
      lastRoomCardBalances = balances;
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

      if (!selectedRoomCardLogId || !logs.some((log) => log.id === selectedRoomCardLogId)) {
        selectedRoomCardLogId = logs[0]?.id ?? null;
      }

      roomCardLogsBox.innerHTML = logs.map((log) => {
        const selectedClass = log.id === selectedRoomCardLogId ? ' style="background: rgba(96, 165, 250, 0.12);"' : '';
        return '<div class="log" data-room-card-log-id="' + log.id + '">' +
          '<strong' + selectedClass + '>' + log.sourceType + '</strong> · ' + log.playerId +
          '<small>變動 ' + log.changeAmount + '，餘額 ' + log.balanceAfter + ' · ' + new Date(log.createdAt).toLocaleString('zh-TW') + '</small>' +
          '</div>';
      }).join('') || '<div class="muted">沒有房卡異動紀錄</div>';

      if (!logs.length) {
        selectedRoomCardLogId = null;
        roomCardLogDetail.textContent = '點選下方房卡異動紀錄可查看詳情';
        renderRoomCardQuickActions(null);
        return;
      }

      const selectedLog = logs.find((log) => log.id === selectedRoomCardLogId) ?? logs[0];
      selectedRoomCardLogId = selectedLog.id;
      renderRoomCardLogDetail(selectedLog);
    }

    function renderRoomCardLogDetail(log) {
      if (!log) {
        roomCardLogDetail.textContent = '點選下方房卡異動紀錄可查看詳情';
        renderRoomCardQuickActions(null);
        return;
      }

      const lines = [
        '紀錄：' + log.id,
        '玩家：' + log.playerId,
        '來源：' + log.sourceType,
        '變動：' + log.changeAmount,
        '該筆異動後餘額：' + log.balanceAfter,
        '關聯核帳單：' + (log.relatedRechargeOrderId || '-'),
        '關聯桌號：' + (log.relatedTableId || '-'),
        '操作管理員：' + (log.adminUserId || '-'),
        '備註：' + (log.note || '-'),
        '建立時間：' + (log.createdAt ? new Date(log.createdAt).toLocaleString('zh-TW') : '-'),
      ];

      roomCardLogDetail.textContent = lines.join('\\n');
      renderRoomCardQuickActions(log);
    }

    function renderRoomCardQuickActions(log) {
      const hasLog = Boolean(log);
      roomCardQuickFillPlayerBtn.disabled = !hasLog;
      roomCardQuickCancelFillBtn.disabled = !roomCardAdjustDraftBackup;
      roomCardQuickReloadBtn.disabled = false;

      if (!hasLog) {
        roomCardQuickFillPlayerBtn.dataset.playerId = '';
        return;
      }

      roomCardQuickFillPlayerBtn.dataset.playerId = log.playerId || '';
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
          '<td><span class="pill ' + request.status + '">' + formatGuildRequestTypeLabel(request.requestType) + '</span><br><span class="muted">' + formatGuildRequestStatusLabel(request.status) + '</span></td>' +
          '<td>' + actions + '</td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有公會申請</td></tr>';

      applyReadonlyState();
    }

    function renderGuilds(guilds) {
      lastGuilds = guilds;
      guildsBody.innerHTML = guilds.map((guild) => {
        const selectedClass = guild.id === selectedGuildId ? ' style="background: rgba(94, 234, 212, 0.08);"' : '';
        return '<tr data-guild-id="' + guild.id + '"' + selectedClass + '>' +
          '<td><strong>' + guild.name + '</strong><br><span class="muted">ID: ' + guild.id + '</span></td>' +
          '<td><span class="pill ' + guild.status + '">' + formatGuildStatusLabel(guild.status) + '</span><br><span class="muted">成員 ' + (guild._count?.members ?? 0) + '</span></td>' +
          '<td><div class="actions-cell"><button class="ghost compact" data-guild-id="' + guild.id + '" data-guild-action="view">查看</button></div></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">沒有公會資料</td></tr>';

      applyReadonlyState();
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
        '狀態：' + formatGuildStatusLabel(guild.status),
        '建立方式：' + guild.creationMethod,
        '自摸參考趴數：' + guild.selfTouchReferenceRate + '（顯示：' + guild.selfTouchReferenceVisible + '）',
        '胡牌參考趴數：' + guild.winReferenceRate + '（顯示：' + guild.winReferenceVisible + '）',
        '成員：',
      ];

      guild.members.forEach((member) => {
        lines.push('  - ' + member.player.nickname + ' / ' + member.player.externalId + ' / ' + formatGuildMemberRoleLabel(member.role) + ' / ' + formatPlayerStatusLabel(member.status) + ' / ' + new Date(member.joinedAt).toLocaleString('zh-TW'));
      });

      guildMembersBody.innerHTML = filteredMembers.map((member) => {
        const nextRole = member.role === 'master' ? 'member' : 'master';
        const selectedClass = member.id === selectedGuildMemberId
          ? ' style="background: rgba(96, 165, 250, 0.12);"'
          : '';
        return '<tr data-guild-member-id="' + member.id + '"' + selectedClass + '>' +
          '<td><strong>' + member.player.nickname + '</strong><br><span class="muted">' + member.player.externalId + '</span><br><span class="muted">PlayerID: ' + member.playerId + '</span></td>' +
          '<td><span class="pill ' + member.status + '">' + formatGuildMemberRoleLabel(member.role) + '</span><br><span class="muted">' + formatPlayerStatusLabel(member.status) + '</span></td>' +
          '<td><div class="actions-cell">' +
          '<button class="ghost compact" data-write-action="guild-member-role" data-guild-member-id="' + member.id + '" data-guild-member-next-role="' + nextRole + '">改為 ' + formatGuildMemberRoleLabel(nextRole) + '</button>' +
          '<button class="danger compact" data-write-action="guild-member-remove" data-guild-member-id="' + member.id + '">移出</button>' +
          '</div></td>' +
          '</tr>';
      }).join('') || '<tr><td colspan="3" class="muted">目前沒有成員</td></tr>';

      applyReadonlyState();

      guildDetail.textContent = lines.join('\\n');
    }

    async function loadSummary() {
      const summary = await api('/api/dashboard');
      renderMetrics(summary);
      renderLegacyMonitor(summary.legacyChange || null);
      await loadAuditLogs();
      modeText.textContent = '已登入後台';
    }

    async function loadAuditLogs() {
      const qs = new URLSearchParams();
      const entityName = auditEntityFilter.value.trim();
      const action = auditActionFilter.value.trim();
      const adminUserId = auditAdminFilter.value.trim();
      const createdFrom = auditCreatedFrom.value.trim();
      const createdTo = auditCreatedTo.value.trim();
      const take = auditTake.value.trim() || '8';
      if (entityName) qs.set('entityName', entityName);
      if (action) qs.set('action', action);
      if (adminUserId) qs.set('adminUserId', adminUserId);
      if (createdFrom) qs.set('createdFrom', createdFrom);
      if (createdTo) qs.set('createdTo', createdTo);
      qs.set('take', take);
      const logs = await api('/api/audit-logs?' + qs.toString());
      renderAuditLogs(logs);
    }

    async function loadAdminUsers() {
      const [adminUsers, currentAdmin] = await Promise.all([
        api('/api/admin-users'),
        api('/api/admin-users/me'),
      ]);
      currentAdminUserId = currentAdmin?.id || null;
      currentAdminRole = currentAdmin?.role || null;
      renderAdminUsers(adminUsers);
    }

    async function loadPlayers() {
      const search = document.getElementById('playerSearch').value.trim();
      const status = document.getElementById('playerStatus').value.trim();
      const take = document.getElementById('playerTake').value.trim() || '10';
      const createdFrom = playerCreatedFrom.value;
      const createdTo = playerCreatedTo.value;
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (status) qs.set('status', status);
      if (createdFrom) qs.set('createdFrom', createdFrom);
      if (createdTo) qs.set('createdTo', createdTo);
      qs.set('offset', String(playerOffset));
      qs.set('take', take);
      const result = await api('/api/players?' + qs.toString());
      renderPlayers(result);
    }

    async function loadPlayerContext(playerId) {
      if (!playerId) {
        renderPlayerDetail(null);
        renderPlayerHistory([]);
        renderPlayerRelations({});
        return;
      }

      const [player, logs, balances, roomCardLogs, rechargeOrders, guilds] = await Promise.all([
        api('/api/players/' + playerId),
        api('/api/audit-logs?playerId=' + encodeURIComponent(playerId) + '&take=8'),
        api('/api/room-cards/balances?playerId=' + encodeURIComponent(playerId) + '&take=1'),
        api('/api/room-cards/logs?playerId=' + encodeURIComponent(playerId) + '&take=3'),
        api('/api/recharge-orders?playerId=' + encodeURIComponent(playerId) + '&take=3'),
        api('/api/guilds?playerId=' + encodeURIComponent(playerId) + '&take=3'),
      ]);

      const activitySummary = buildPlayerActivitySummary(player, logs, roomCardLogs, rechargeOrders, guilds);

      renderPlayerDetail(player, activitySummary);
      renderPlayerHistory(logs);
      renderPlayerRelations({
        balance: balances[0] || null,
        roomCardLogs,
        rechargeOrders,
        guilds,
        playerAuditLogs: logs,
      });

      playerDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetPlayerPagination() {
      playerOffset = 0;
    }

    function validatePlayerFormInputs(externalId, nickname) {
      if (!externalId) {
        throw new Error('請填寫外部編號（在「新增 / 編修會員資料」區塊中間欄位）');
      }

      if (!nickname) {
        throw new Error('請填寫暱稱（在「新增 / 編修會員資料」區塊右側欄位）');
      }

      if (externalId.length < 4 || externalId.length > 64) {
        throw new Error('外部編號需為 4-64 字');
      }

      if (!/^[A-Za-z0-9_-]+$/.test(externalId)) {
        throw new Error('外部編號僅允許英數、底線(_)與連字號(-)');
      }

      if (nickname.length < 2 || nickname.length > 24) {
        throw new Error('暱稱需為 2-24 字');
      }

      if (!/\\S/.test(nickname)) {
        throw new Error('暱稱不可為空白');
      }
    }

    async function isExternalIdDuplicated(externalId, excludePlayerId) {
      if (!externalId) {
        return false;
      }

      const qs = new URLSearchParams();
      qs.set('search', externalId);
      qs.set('take', '200');
      const result = await api('/api/players?' + qs.toString());
      const items = Array.isArray(result?.items) ? result.items : [];
      return items.some((player) => player.externalId === externalId && player.id !== excludePlayerId);
    }

    async function ensureExternalIdAvailable(externalId, excludePlayerId) {
      const duplicated = await isExternalIdDuplicated(externalId, excludePlayerId);
      if (duplicated) {
        throw new Error('外部編號「' + externalId + '」目前已存在，請更換。');
      }
    }

    function formatExternalIdConflictMessage(message, externalId) {
      if (!message) {
        return '';
      }

      const text = String(message);

      if (text.includes('曾使用過') || text.includes('不可回收')) {
        return '外部編號「' + externalId + '」曾使用過，依規則不可回收，請改用新編號。';
      }

      if (text.includes('已存在')) {
        return '外部編號「' + externalId + '」目前已存在，請改用其他編號。';
      }

      return text;
    }

    function buildExternalIdCandidate() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return 'wuji-' + yyyy + mm + dd + '-' + random;
    }

    async function generateUniqueExternalId() {
      for (let i = 0; i < 30; i += 1) {
        const candidate = buildExternalIdCandidate();
        // Pre-check to avoid obvious duplicates; backend remains final guard.
        const duplicated = await isExternalIdDuplicated(candidate, '');
        if (!duplicated) {
          return candidate;
        }
      }

      throw new Error('暫時無法產生不重複外部編號，請稍後再試。');
    }

    async function createPlayer() {
      if (playerFormSubmitPending) {
        return;
      }

      setPlayerSubmitPending(true, 'create');
      try {
        const playerId = playerFormId.value.trim();
        const externalId = playerFormExternalId.value.trim();
        const nickname = playerFormNickname.value.trim();
        const note = playerFormNote.value;
        const tags = playerFormTags.value;
        const reason = String(playerUpdateReason?.value || '').trim();
        const status = playerFormStatus.value;
        highlightMissingPlayerFields();

        if (playerId) {
          if (clearPlayerFormBtn) {
            clearPlayerFormBtn.focus();
          }
          setPlayerFormTemporaryHint('目前是編修模式，請先按清除切回新增。', 'warn');
          throw new Error('目前是編修模式（會員 ID 已帶入）。若要新增，請先按「清除」，並在「暱稱」欄位輸入名稱；會員 ID 欄位不用填。');
        }

        validatePlayerFormInputs(externalId, nickname);
        if (!reason) {
          throw new Error('請填寫操作原因（新增/更新會員必填）');
        }
        await ensureExternalIdAvailable(externalId, '');

        await api('/api/players', {
          method: 'POST',
          body: JSON.stringify({ externalId, nickname, note, tags, status, reason }),
        });

        resetPlayerPagination();
        await Promise.all([loadPlayers(), loadSummary(), loadRoomCards()]);
        const keepPrefix = Boolean(keepExternalIdPrefixOnCreate && keepExternalIdPrefixOnCreate.checked);
        const preservedPrefix = keepPrefix ? deriveExternalIdPrefix(externalId) : '';
        clearPlayerForm();
        if (preservedPrefix) {
          playerFormExternalId.value = preservedPrefix;
          playerFormNickname.focus();
        }
        setPlayerFormTemporaryHint('新增成功，可直接繼續新增下一筆。', 'success');
        renderPlayerDetail(null);
        renderPlayerHistory([]);
        renderPlayerRelations({});
      } catch (error) {
        const externalId = playerFormExternalId.value.trim();
        showPlayerFormError('新增會員', getErrorMessage(error), externalId);
      } finally {
        setPlayerSubmitPending(false);
      }
    }

    async function updatePlayer() {
      if (playerFormSubmitPending) {
        return;
      }

      setPlayerSubmitPending(true, 'update');
      try {
        const playerId = playerFormId.value.trim();
        if (!playerId) {
          throw new Error('請先選擇一筆會員資料');
        }

        const externalId = playerFormExternalId.value.trim();
        const nickname = playerFormNickname.value.trim();
        const note = playerFormNote.value;
        const tags = playerFormTags.value;
        const reason = String(playerUpdateReason?.value || '').trim();
        const status = playerFormStatus.value;
        highlightMissingPlayerFields();

        if (!reason) {
          throw new Error('請填寫更新原因（更新會員必填）');
        }

        validatePlayerFormInputs(externalId, nickname);
        await ensureExternalIdAvailable(externalId, playerId);

        await api('/api/players/' + playerId, {
          method: 'PATCH',
          body: JSON.stringify({ externalId, nickname, note, tags, status, reason }),
        });

        await Promise.all([loadPlayers(), loadSummary(), loadRoomCards()]);
        await loadPlayerContext(playerId);
        setPlayerFormTemporaryHint('更新成功，已同步最新會員資料。', 'success');
      } catch (error) {
        const externalId = playerFormExternalId.value.trim();
        showPlayerFormError('更新會員', getErrorMessage(error), externalId);
      } finally {
        setPlayerSubmitPending(false);
      }
    }

    async function createAdminUser() {
      try {
        const email = String(adminFormEmail?.value || '').trim();
        const displayName = String(adminFormDisplayName?.value || '').trim();
        const password = String(adminFormPassword?.value || '');
        const role = String(adminFormRole?.value || 'support');
        const reason = String(adminActionReason?.value || '').trim();

        if (!email) {
          adminFormEmail?.focus();
          throw new Error('請填寫新管理員帳號');
        }

        if (!displayName) {
          adminFormDisplayName?.focus();
          throw new Error('請填寫顯示名稱');
        }

        if (password.length < 8) {
          adminFormPassword?.focus();
          throw new Error('初始密碼至少 8 碼');
        }

        if (!reason) {
          adminActionReason?.focus();
          throw new Error('請先填寫管理員操作原因（必填）');
        }

        await api('/api/admin-users', {
          method: 'POST',
          body: JSON.stringify({ email, displayName, password, role, reason }),
        });

        adminFormEmail.value = '';
        adminFormDisplayName.value = '';
        adminFormPassword.value = '';
        adminFormRole.value = 'support';
        setAdminActionNote('已成功建立管理員帳號。', 'success');
        await Promise.all([loadAdminUsers(), loadSummary(), loadAuditLogs()]);
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatAdminActionErrorMessage(message);
        setAdminActionNote(displayMessage, 'warn');
        alert('建立管理員失敗：' + displayMessage);
      }
    }

    async function disableSelectedAdminUser() {
      try {
        if (!selectedAdminUserId) {
          throw new Error('請先點選一位管理員');
        }

        const selectedAdmin =
          lastAdminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) || null;

        if (!selectedAdmin) {
          throw new Error('找不到已選管理員');
        }

        if (selectedAdmin.id === currentAdminUserId) {
          throw new Error('不可停用目前登入帳號');
        }

        if (!selectedAdmin.isActive) {
          throw new Error('該管理員已停用');
        }

        const reason = String(adminActionReason?.value || '').trim();
        if (!reason) {
          adminActionReason?.focus();
          throw new Error('請先填寫管理員操作原因（必填）');
        }

        const confirmed = confirm('確認要停用管理員「' + selectedAdmin.displayName + '」嗎？');
        if (!confirmed) {
          return;
        }

        await api('/api/admin-users/' + selectedAdmin.id + '/disable', {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        });

        setAdminActionNote('已停用管理員「' + selectedAdmin.displayName + '」。', 'success');
        await Promise.all([loadAdminUsers(), loadSummary(), loadAuditLogs()]);
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatAdminActionErrorMessage(message);
        setAdminActionNote(displayMessage, 'warn');
        alert('停用管理員失敗：' + displayMessage);
      }
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
      await Promise.all([loadSummary(), loadAdminUsers(), loadPlayers(), loadRechargeOrders(), loadRoomCards(), loadGuildRequests(), loadGuilds()]);
    }

    function extractErrorMessage(error) {
      if (error && typeof error === 'object' && 'message' in error && error.message) {
        return String(error.message);
      }

      if (typeof error === 'string' && error) {
        return error;
      }

      return '未知錯誤';
    }

    function formatLoginErrorMessage(error) {
      const message = extractErrorMessage(error);
      const text = message.toLowerCase();
      if (text.includes('invalid email or password') || text.includes('unauthorized') || text.includes('401')) {
        return '帳號或密碼錯誤';
      }

      return message;
    }

    function formatAdminActionErrorMessage(message) {
      if (!message) {
        return '未知錯誤';
      }

      if (message.includes('reason') || message.includes('原因')) {
        return '請先填寫管理員操作原因（必填）。';
      }

      const lower = message.toLowerCase();
      if (lower.includes('admin email already exists')) {
        return '此管理員帳號已存在，請更換 Email。';
      }

      if (message.includes('不可停用目前登入帳號')) {
        return '不可停用目前登入的管理員帳號。';
      }

      if (message.includes('該管理員已停用')) {
        return '該管理員已是停用狀態，無需重複停用。';
      }

      if (lower.includes('not found')) {
        return '找不到指定的管理員，請重新整理後再試。';
      }

      return message;
    }

    function formatGuildActionErrorMessage(message) {
      if (!message) {
        return '未知錯誤';
      }

      if (message.includes('note') || message.includes('reviewNote') || message.includes('原因')) {
        return '請先填寫原因（必填）。';
      }

      if (message.includes('請先選一個公會')) {
        return '請先從右側公會清單點選「查看」後再操作。';
      }

      if (message.includes('找不到該公會成員')) {
        return '找不到目標成員，請先點選該成員或重新整理公會明細。';
      }

      return message;
    }

    function formatRechargeActionErrorMessage(message) {
      if (!message) {
        return '未知錯誤';
      }

      if (message.includes('核帳審核需填寫原因') || message.includes('reviewNote') || message.includes('請先填寫審核原因')) {
        return '請先填寫審核原因（必填）。';
      }

      return message;
    }

    async function toggleStatus(id, status, nickname = '') {
      try {
        const actionLabel = status === 'banned' ? '停權' : '復權';
        const defaultReason = actionLabel === '停權'
          ? '客服複核後先行停權，待進一步確認'
          : '客服複核後恢復權限';
        const reason = String(playerStatusReason?.value || '').trim();

        if (!reason) {
          alert('請先填寫「停權 / 復權原因（必填）」再送出。');
          if (playerStatusReason) {
            playerStatusReason.focus();
          }
          return;
        }

        const displayName = nickname || selectedPlayerDetail?.nickname || id;
        const confirmed = confirm(
          '確認要將會員「' + displayName + '」' + actionLabel + '嗎？\\n原因：' + reason,
        );
        if (!confirmed) {
          return;
        }

        if (!playerStatusReason.value.trim()) {
          playerStatusReason.value = defaultReason;
        }

        await api('/api/players/' + id + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status, reason }),
        });
        await Promise.all([refreshAll(), loadPlayerContext(id)]);
      } catch (error) {
        alert('操作失敗：' + error.message);
      }
    }

    async function reviewRechargeOrder(orderId, action) {
      try {
        const reviewNoteInput = document.getElementById('rechargeReviewNote');
        const reviewNote = reviewNoteInput.value.trim();
        if (!reviewNote) {
          reviewNoteInput.focus();
          throw new Error('請先填寫審核原因（必填）');
        }

        await api('/api/recharge-orders/' + orderId + '/' + action, {
          method: 'POST',
          body: JSON.stringify({ reviewNote }),
        });
        setRechargeActionNote(
          action === 'confirm' ? '核帳已核准並完成處理。' : '核帳已駁回。',
          'success',
        );
        await Promise.all([loadSummary(), loadRechargeOrders(), loadRoomCards()]);
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatRechargeActionErrorMessage(message);
        setRechargeActionNote(displayMessage, 'warn');
        alert('核帳失敗：' + displayMessage);
      }
    }

    async function submitRoomCardAdjust() {
      try {
        const playerId = document.getElementById('adjustPlayerId').value.trim();
        const changeAmount = Number(document.getElementById('adjustAmount').value.trim());
        const noteInput = document.getElementById('adjustNote');
        const note = noteInput.value.trim();

        if (!playerId) {
          throw new Error('請先填寫調整玩家 ID');
        }

        if (!Number.isFinite(changeAmount) || changeAmount === 0) {
          throw new Error('調整數量需為非 0 的數字');
        }

        if (!note) {
          noteInput.focus();
          throw new Error('請先填寫調整原因（必填）');
        }

        const confirmed = confirm(
          '確認要調整玩家「' + playerId + '」的房卡數量為 ' + changeAmount + ' 嗎？',
        );
        if (!confirmed) {
          return;
        }

        await api('/api/room-cards/adjust', {
          method: 'POST',
          body: JSON.stringify({ playerId, changeAmount, note }),
        });

        await Promise.all([loadSummary(), loadRoomCards(), loadPlayers()]);
        clearRoomCardAdjustDraftBackup();
      } catch (error) {
        const message = extractErrorMessage(error);
        let displayMessage = message;
        if (message.includes('調整房卡需填寫原因') || message.includes('note 不可為空白') || message.includes('note must')) {
          displayMessage = '請先填寫調整原因（必填）。';
        } else if (message.includes('changeAmount') && message.includes('should not be equal to 0')) {
          displayMessage = '調整數量不可為 0';
        } else if (message.includes('playerId')) {
          displayMessage = '請先填寫有效的調整玩家 ID';
        }

        alert('調整失敗：' + displayMessage);
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

        setGuildActionNote('公會申請已送出，待主管審核。', 'success');
        await Promise.all([loadGuildRequests(), loadGuilds(), loadSummary()]);
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatGuildActionErrorMessage(message);
        setGuildActionNote(displayMessage, 'warn');
        alert('公會申請失敗：' + displayMessage);
      }
    }

    async function reviewGuildRequest(requestId, action) {
      try {
        const reviewNoteInput = document.getElementById('guildReviewNote');
        const reviewNote = reviewNoteInput.value.trim();
        if (!reviewNote) {
          reviewNoteInput.focus();
          throw new Error('請先填寫公會審核原因（必填）');
        }

        await api('/api/guild-approvals/' + requestId + '/' + action, {
          method: 'POST',
          body: JSON.stringify({ reviewNote }),
        });

        setGuildActionNote(
          action === 'approve' ? '公會申請已核准。' : '公會申請已駁回。',
          'success',
        );
        await Promise.all([loadGuildRequests(), loadGuilds(), loadSummary()]);
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatGuildActionErrorMessage(message);
        setGuildActionNote(displayMessage, 'warn');
        alert('公會申請審核失敗：' + displayMessage);
      }
    }

    async function addGuildMember() {
      try {
        if (!selectedGuildId) {
          throw new Error('請先選一個公會');
        }

        const playerId = document.getElementById('guildMemberPlayerId').value.trim();
        const role = document.getElementById('guildMemberRole').value;
        const noteInput = document.getElementById('guildMemberNote');
        const note = noteInput.value.trim();
        if (!note) {
          noteInput.focus();
          throw new Error('請先填寫成員操作原因（必填）');
        }

        await api('/api/guilds/' + selectedGuildId + '/members', {
          method: 'POST',
          body: JSON.stringify({ playerId, role, note }),
        });

        setGuildActionNote('已完成加入公會成員。', 'success');
        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatGuildActionErrorMessage(message);
        setGuildActionNote(displayMessage, 'warn');
        alert('加入公會失敗：' + displayMessage);
      }
    }

    async function updateGuildMemberRole(memberId, role) {
      try {
        if (!selectedGuildId) {
          throw new Error('請先選一個公會');
        }

        const noteInput = document.getElementById('guildMemberNote');
        const note = noteInput.value.trim();
        if (!note) {
          noteInput.focus();
          throw new Error('請先填寫成員操作原因（必填）');
        }

        await api('/api/guilds/' + selectedGuildId + '/members/' + memberId + '/role', {
          method: 'PATCH',
          body: JSON.stringify({ role, note }),
        });

        setGuildActionNote('已完成公會成員角色調整。', 'success');
        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatGuildActionErrorMessage(message);
        setGuildActionNote(displayMessage, 'warn');
        alert('調整成員角色失敗：' + displayMessage);
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

        if (!note) {
          document.getElementById('guildMemberNote').focus();
          throw new Error('請先填寫成員操作原因（必填）');
        }

        if (!targetMemberId) {
          throw new Error('找不到該公會成員');
        }

        await api('/api/guilds/' + selectedGuildId + '/members/' + targetMemberId + '/remove', {
          method: 'POST',
          body: JSON.stringify({ note }),
        });

        setGuildActionNote('已完成移出公會成員。', 'success');
        await loadGuildDetail(selectedGuildId);
        await loadSummary();
      } catch (error) {
        const message = extractErrorMessage(error);
        const displayMessage = formatGuildActionErrorMessage(message);
        setGuildActionNote(displayMessage, 'warn');
        alert('移出公會失敗：' + displayMessage);
      }
    }

    const loginBtn = document.getElementById('loginBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    let loginPending = false;

    async function performLogin() {
      if (loginPending) {
        return;
      }

      loginPending = true;
      const loginBtnDefaultText = loginBtn.textContent || '登入';
      loginBtn.disabled = true;
      loginBtn.textContent = '登入中...';

      try {
        const account = emailInput.value.trim();
        const password = passwordInput.value;
        const result = await api('/api/auth/login', {
          method: 'POST',
          // Backend DTO still uses the "email" field name for compatibility.
          body: JSON.stringify({ email: account, password }),
        });
        localStorage.setItem('wuji_token', result.accessToken);
        authNote.textContent = '已登入：' + result.admin.displayName + ' (' + result.admin.role + ')';
        modeText.textContent = '已登入後台';

        try {
          await refreshAll();
        } catch (error) {
          authNote.textContent = '已登入，但資料載入失敗：' + extractErrorMessage(error);
        }
      } catch (error) {
        localStorage.removeItem('wuji_token');
        modeText.textContent = '等待登入';
        authNote.textContent = '登入失敗：' + formatLoginErrorMessage(error);
      } finally {
        loginPending = false;
        loginBtn.disabled = false;
        loginBtn.textContent = loginBtnDefaultText;
      }
    }

    loginBtn.addEventListener('click', performLogin);
    [emailInput, passwordInput].forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') {
          return;
        }
        event.preventDefault();
        performLogin();
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      localStorage.removeItem('wuji_token');
      authNote.textContent = '已登出';
      modeText.textContent = '等待登入';
      metrics.innerHTML = '';
      playersBody.innerHTML = '';
      summaryBox.textContent = '尚未載入';
      auditBox.innerHTML = '';
      auditDetail.textContent = '點選左側稽核事件可查看完整明細';
      playerHistory.textContent = '點選會員可查看最近操作紀錄';
      playerHistoryDetail.textContent = '點選右側會員歷史事件可查看完整明細';
      renderPlayerQuickActions(null);
      lastAuditLogs = [];
      selectedAuditLogId = null;
      lastPlayerHistoryLogs = [];
      selectedPlayerHistoryLogId = null;
      currentAdminRole = null;
      updateAdminActionState();
    });

    applyPreferredSectionOrder();

    document.getElementById('refreshSummary').addEventListener('click', () => {
      refreshAll().catch((error) => {
        authNote.textContent = '資料重新整理失敗：' + extractErrorMessage(error);
      });
    });
    document.getElementById('applyAuditFiltersBtn').addEventListener('click', loadAuditLogs);
    document.getElementById('clearAuditFiltersBtn').addEventListener('click', () => {
      auditEntityFilter.value = '';
      auditActionFilter.value = '';
      auditAdminFilter.value = '';
      auditTake.value = '8';
      auditCreatedFrom.value = '';
      auditCreatedTo.value = '';
      loadAuditLogs();
    });
    document.querySelectorAll('[data-section-jump]').forEach((button) => {
      button.addEventListener('click', () => {
        const sectionId = button.getAttribute('data-section-jump');
        const section = sectionId ? document.getElementById(sectionId) : null;
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    document.getElementById('refreshAdminUsers').addEventListener('click', loadAdminUsers);
    createAdminUserBtn.addEventListener('click', createAdminUser);
    disableAdminUserBtn.addEventListener('click', disableSelectedAdminUser);
    document.getElementById('refreshPlayers').addEventListener('click', loadPlayers);
    playerActionFillFormBtn.addEventListener('click', () => {
      if (!selectedPlayerDetail) {
        return;
      }

      fillPlayerForm({
        id: selectedPlayerDetail.id,
        externalId: selectedPlayerDetail.externalId,
        nickname: selectedPlayerDetail.nickname,
        status: selectedPlayerDetail.status,
      });
      jumpToPlayerEditForm();
    });
    jumpToPlayerEditFormBtn.addEventListener('click', () => {
      if (!selectedPlayerDetail) {
        alert('請先在下方會員清單點選一筆會員。');
        return;
      }

      fillPlayerForm({
        id: selectedPlayerDetail.id,
        externalId: selectedPlayerDetail.externalId,
        nickname: selectedPlayerDetail.nickname,
        status: selectedPlayerDetail.status,
      });
      jumpToPlayerEditForm();
    });
    playerActionToggleStatusBtn.addEventListener('click', () => {
      if (!selectedPlayerDetail || !selectedPlayerId) {
        return;
      }

      const nextStatus = playerActionToggleStatusBtn.dataset.nextStatus || (selectedPlayerDetail.status === 'banned' ? 'active' : 'banned');
      toggleStatus(selectedPlayerId, nextStatus, selectedPlayerDetail.nickname);
    });
    playerActionReloadContextBtn.addEventListener('click', () => {
      if (!selectedPlayerId) {
        return;
      }

      loadPlayerContext(selectedPlayerId).catch((error) => {
        playerDetail.textContent = '載入會員詳情失敗：' + error.message;
        playerHistory.textContent = '載入會員紀錄失敗：' + error.message;
        playerRelations.textContent = '載入會員關聯摘要失敗：' + error.message;
      });
    });
    playerHistory.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-player-history-log-id]') : null;
      const logId = target?.getAttribute('data-player-history-log-id');
      if (!logId) {
        return;
      }

      selectedPlayerHistoryLogId = logId;
      renderPlayerHistory(lastPlayerHistoryLogs);
    });
    playerRelations.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement
        ? event.target.closest('[data-player-relation-jump]')
        : null;
      const jumpTarget = target?.getAttribute('data-player-relation-jump');
      if (!jumpTarget) {
        return;
      }

      if (jumpTarget === 'room-cards') {
        jumpToRoomCardsForSelectedPlayer().catch((error) => {
          alert('載入房卡歷史失敗：' + extractErrorMessage(error));
        });
        return;
      }

      if (jumpTarget === 'guild') {
        jumpToGuildForSelectedPlayer().catch((error) => {
          alert('載入公會脈絡失敗：' + extractErrorMessage(error));
        });
      }
    });
    auditBox.addEventListener('click', (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-audit-log-id]') : null;
      const auditLogId = target?.getAttribute('data-audit-log-id');
      if (!auditLogId) {
        return;
      }

      selectedAuditLogId = auditLogId;
      renderAuditLogs(lastAuditLogs);
    });
    createPlayerBtn.addEventListener('click', createPlayer);
    updatePlayerBtn.addEventListener('click', updatePlayer);
    clearPlayerFormBtn.addEventListener('click', clearPlayerForm);
    playerFormExternalId.addEventListener('input', () => {
      if (playerFormExternalId.value.trim()) {
        playerFormExternalId.classList.remove('field-invalid');
      }
    });
    playerFormNickname.addEventListener('input', () => {
      if (playerFormNickname.value.trim()) {
        playerFormNickname.classList.remove('field-invalid');
      }
    });
    playerEditFormPanel.addEventListener('keydown', (event) => {
      if (playerFormSubmitPending) {
        return;
      }

      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLButtonElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      event.preventDefault();
      const isEditMode = Boolean(playerFormId.value.trim());
      if (isEditMode) {
        updatePlayer();
        return;
      }

      createPlayer();
    });
    generatePlayerExternalIdBtn.addEventListener('click', async () => {
      try {
        const externalId = await generateUniqueExternalId();
        playerFormExternalId.value = externalId;
        playerFormExternalId.classList.remove('field-invalid');
        playerFormNickname.focus();
      } catch (error) {
        alert('產生外部編號失敗：' + error.message);
      }
    });
    document.getElementById('playerSearch').addEventListener('input', () => {
      resetPlayerPagination();
      clearTimeout(playerSearchTimer);
      playerSearchTimer = setTimeout(loadPlayers, 250);
    });
    document.getElementById('playerStatus').addEventListener('change', () => {
      resetPlayerPagination();
      clearTimeout(playerSearchTimer);
      playerSearchTimer = setTimeout(loadPlayers, 250);
    });
    document.getElementById('playerTake').addEventListener('change', () => {
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerCreatedFrom').addEventListener('change', () => {
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerCreatedTo').addEventListener('change', () => {
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerJoinedTodayBtn').addEventListener('click', () => {
      const now = new Date();
      setPlayerDateRange(getUtcStartOfDay(now), getUtcEndOfDay(now));
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerJoinedWeekBtn').addEventListener('click', () => {
      const now = new Date();
      setPlayerDateRange(getUtcStartOfWeek(now), getUtcEndOfDay(now));
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerJoinedMonthBtn').addEventListener('click', () => {
      const now = new Date();
      setPlayerDateRange(getUtcStartOfMonth(now), getUtcEndOfDay(now));
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('clearPlayerDateFilters').addEventListener('click', () => {
      setPlayerDateRange(null, null);
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerTagVipBtn').addEventListener('click', () => {
      document.getElementById('playerSearch').value = 'VIP';
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerTagRiskBtn').addEventListener('click', () => {
      document.getElementById('playerSearch').value = '高風險';
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('playerTagTestBtn').addEventListener('click', () => {
      document.getElementById('playerSearch').value = '測試帳號';
      resetPlayerPagination();
      loadPlayers();
    });
    document.getElementById('clearPlayerTagFilterBtn').addEventListener('click', () => {
      document.getElementById('playerSearch').value = '';
      resetPlayerPagination();
      loadPlayers();
    });
    playerPrevPageBtn.addEventListener('click', () => {
      playerOffset = Math.max(0, playerOffset - lastPlayersResult.take);
      loadPlayers();
    });
    playerNextPageBtn.addEventListener('click', () => {
      if (!lastPlayersResult.hasMore) {
        return;
      }

      playerOffset += lastPlayersResult.take;
      loadPlayers();
    });
    document.getElementById('refreshRechargeOrders').addEventListener('click', loadRechargeOrders);
    rechargeQuickApproveBtn.addEventListener('click', () => {
      const orderId = rechargeQuickApproveBtn.dataset.rechargeId || selectedRechargeOrderId;
      if (!orderId) {
        return;
      }

      if (!confirm('確認要核准訂單「' + orderId + '」嗎？')) {
        return;
      }

      reviewRechargeOrder(orderId, 'confirm');
    });
    rechargeQuickRejectBtn.addEventListener('click', () => {
      const orderId = rechargeQuickRejectBtn.dataset.rechargeId || selectedRechargeOrderId;
      if (!orderId) {
        return;
      }

      if (!confirm('確認要駁回訂單「' + orderId + '」嗎？')) {
        return;
      }

      reviewRechargeOrder(orderId, 'reject');
    });
    rechargeQuickReloadBtn.addEventListener('click', () => {
      loadRechargeOrders();
    });
    document.getElementById('rechargeStatus').addEventListener('change', loadRechargeOrders);
    document.getElementById('rechargeTake').addEventListener('change', loadRechargeOrders);
    document.getElementById('refreshRoomCards').addEventListener('click', loadRoomCards);
    roomCardQuickFillPlayerBtn.addEventListener('click', () => {
      const playerId = roomCardQuickFillPlayerBtn.dataset.playerId;
      if (!playerId) {
        return;
      }

      backupRoomCardAdjustDraft();
      document.getElementById('adjustPlayerId').value = playerId;
      document.getElementById('adjustAmount').focus();
      document.getElementById('adjustAmount').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateRoomCardAdjustSubmitState();
    });
    roomCardQuickCancelFillBtn.addEventListener('click', cancelRoomCardAdjustFill);
    roomCardQuickReloadBtn.addEventListener('click', loadRoomCards);
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
    document.getElementById('adjustPlayerId').addEventListener('input', updateRoomCardAdjustSubmitState);
    document.getElementById('adjustAmount').addEventListener('input', updateRoomCardAdjustSubmitState);
    document.getElementById('adjustNote').addEventListener('input', updateRoomCardAdjustSubmitState);
    document.getElementById('adjustPlayerId').addEventListener('keydown', preventEnterKeySubmit);
    document.getElementById('adjustAmount').addEventListener('keydown', preventEnterKeySubmit);
    document.getElementById('adjustNote').addEventListener('keydown', preventEnterKeySubmit);
    updateRoomCardAdjustSubmitState();
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
    document.getElementById('guildStatus').addEventListener('change', () => {
      clearTimeout(guildSearchTimer);
      guildSearchTimer = setTimeout(loadGuilds, 250);
    });
    document.getElementById('guildTake').addEventListener('change', loadGuilds);
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
        const row = event.target instanceof HTMLElement ? event.target.closest('[data-player-id]') : null;
        const playerId = row?.getAttribute('data-player-id');
        const externalId = row?.getAttribute('data-player-external-id');
        const nickname = row?.getAttribute('data-player-nickname');
        const status = row?.getAttribute('data-player-status');
        if (playerId && externalId && nickname && status) {
          fillPlayerForm({
            id: playerId,
            externalId,
            nickname,
            status,
            note: row?.getAttribute('data-player-note'),
            tags: row?.getAttribute('data-player-tags'),
          });
          loadPlayerContext(playerId).catch((error) => {
            playerDetail.textContent = '載入會員詳情失敗：' + error.message;
            playerHistory.textContent = '載入會員紀錄失敗：' + error.message;
            playerRelations.textContent = '載入會員關聯摘要失敗：' + error.message;
          });
        }
        return;
      }

      const editPlayerId = target.dataset.playerId;
      const editAction = target.dataset.playerAction;

      if (editPlayerId && editAction === 'edit') {
        const row = target.closest('[data-player-id]');
        const externalId = row?.getAttribute('data-player-external-id');
        const nickname = row?.getAttribute('data-player-nickname');
        const status = row?.getAttribute('data-player-status');
        if (externalId && nickname && status) {
          fillPlayerForm({
            id: editPlayerId,
            externalId,
            nickname,
            status,
            note: row?.getAttribute('data-player-note'),
            tags: row?.getAttribute('data-player-tags'),
          });
          jumpToPlayerEditForm();
          loadPlayerContext(editPlayerId).catch((error) => {
            playerDetail.textContent = '載入會員詳情失敗：' + error.message;
            playerHistory.textContent = '載入會員紀錄失敗：' + error.message;
            playerRelations.textContent = '載入會員關聯摘要失敗：' + error.message;
          });
        }
        return;
      }

      const playerId = target.dataset.playerId;
      const nextStatus = target.dataset.nextStatus;

      if (playerId && nextStatus) {
        const row = target.closest('[data-player-id]');
        const nickname = row?.getAttribute('data-player-nickname') || '';
        toggleStatus(playerId, nextStatus, nickname);
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
        const row = target.closest('[data-recharge-id]');
        if (!row) {
          return;
        }

        const orderId = row.getAttribute('data-recharge-id');
        if (!orderId) {
          return;
        }

        selectedRechargeOrderId = orderId;
        renderRechargeOrders(lastRechargeOrders);
        const selectedOrder = lastRechargeOrders.find((order) => order.id === orderId) ?? null;
        renderRechargeOrderDetail(selectedOrder);
        return;
      }

      const rechargeId = target.dataset.rechargeId;
      const rechargeAction = target.dataset.rechargeAction;

      if (rechargeId && rechargeAction) {
        selectedRechargeOrderId = rechargeId;
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
      renderRoomCardLogs(lastRoomCardLogs);
      const selectedLog = lastRoomCardLogs.find((log) => log.id === logId) ?? null;
      renderRoomCardLogDetail(selectedLog);
    });

    applyReadonlyState();
    updatePlayerFormMode();
    renderPlayerQuickActions(null);
    renderRechargeQuickActions(null);
    renderRoomCardQuickActions(null);
    updateGuildRequestFormVisibility();

    if (localStorage.getItem('wuji_token')) {
      authNote.textContent = '已載入本機 token';
      modeText.textContent = '已登入後台';
      refreshAll().catch((error) => {
        authNote.textContent = '已載入 token，但資料載入失敗：' + extractErrorMessage(error);
      });
    }
  </script>
</body>
</html>`;
  }
}
