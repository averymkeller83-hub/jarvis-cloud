export function getAdminPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#030712">
  <title>JARVIS — Admin</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:-apple-system,'SF Pro Display',system-ui,sans-serif;background:#030712;color:#e2e8f0;min-height:100vh;-webkit-font-smoothing:antialiased}
    :root{--bg:#030712;--surface:#0f172a;--surface-2:#1e293b;--border:rgba(56,189,248,0.1);--border-b:rgba(56,189,248,0.25);--primary:#38bdf8;--primary-glow:rgba(56,189,248,0.15);--text:#f1f5f9;--dim:#94a3b8;--muted:#64748b;--danger:#f87171;--success:#34d399;--warn:#f59e0b;--mono:'SF Mono',ui-monospace,monospace}
    .shell{max-width:1100px;margin:0 auto;padding:20px}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
    .top-bar h1{font-size:20px;font-weight:600;letter-spacing:0.15em;color:var(--primary)}
    .top-bar a{color:var(--muted);font-size:13px;text-decoration:none}
    .top-bar a:hover{color:var(--dim)}
    .tabs{display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--border)}
    .tab{padding:8px 16px;font-family:var(--mono);font-size:12px;letter-spacing:0.08em;color:var(--muted);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;transition:color 0.15s,border-color 0.15s}
    .tab:hover{color:var(--dim)}
    .tab.active{color:var(--primary);border-bottom-color:var(--primary)}
    .panel{display:none}.panel.active{display:block}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
    .stat{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px}
    .stat-label{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;color:var(--muted);margin-bottom:4px}
    .stat-value{font-size:28px;font-weight:700;color:var(--text)}
    .stat-value.founding{color:var(--warn)}
    .stat-value.ok{color:var(--success)}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{font-family:var(--mono);font-size:10px;letter-spacing:0.1em;color:var(--muted);text-align:left;padding:8px 10px;border-bottom:1px solid var(--border)}
    td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.03);color:var(--dim)}
    tr:hover td{background:rgba(56,189,248,0.02)}
    .badge{display:inline-block;font-family:var(--mono);font-size:9px;letter-spacing:0.08em;padding:2px 6px;border-radius:4px}
    .badge-pro{background:linear-gradient(135deg,rgba(56,189,248,0.15),rgba(129,140,248,0.15));color:var(--primary)}
    .badge-free{background:rgba(100,116,139,0.15);color:var(--muted)}
    .badge-founding{background:rgba(245,158,11,0.15);color:var(--warn)}
    .badge-admin{background:rgba(248,113,113,0.15);color:var(--danger)}
    .badge-locked{background:rgba(248,113,113,0.1);color:var(--danger)}
    .btn{font-family:var(--mono);font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--dim);cursor:pointer;transition:all 0.15s}
    .btn:hover{border-color:var(--border-b);color:var(--text)}
    .btn-danger{border-color:rgba(248,113,113,0.3);color:var(--danger)}
    .btn-danger:hover{background:rgba(248,113,113,0.1)}
    .btn-primary{border-color:var(--border-b);color:var(--primary)}
    .btn-primary:hover{background:var(--primary-glow)}
    .search-bar{display:flex;gap:8px;margin-bottom:16px}
    .search-bar input,.search-bar select{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none;font-family:inherit}
    .search-bar input:focus,.search-bar select:focus{border-color:var(--border-b)}
    .search-bar input{flex:1}
    .detail-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px}
    .detail-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
    .detail-row:last-child{border-bottom:none}
    .detail-label{font-family:var(--mono);font-size:11px;color:var(--muted)}
    .detail-value{font-size:13px;color:var(--text)}
    .detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .back-link{font-family:var(--mono);font-size:11px;color:var(--muted);cursor:pointer;margin-bottom:12px;display:inline-block}
    .back-link:hover{color:var(--dim)}
    .pager{display:flex;gap:8px;justify-content:center;margin-top:16px}
    .audit-detail{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--mono);font-size:11px}
    .toggle-sm{position:relative;width:36px;height:20px;display:inline-block;vertical-align:middle}
    .toggle-sm input{opacity:0;width:0;height:0}
    .toggle-sm span{position:absolute;inset:0;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:background 0.2s}
    .toggle-sm span::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--muted);transition:transform 0.2s,background 0.2s}
    .toggle-sm input:checked+span{background:var(--primary-glow);border-color:var(--border-b)}
    .toggle-sm input:checked+span::after{transform:translateX(16px);background:var(--primary)}
    .empty{text-align:center;padding:40px;color:var(--muted);font-size:13px}
  </style>
</head>
<body>
<div class="shell">
  <div class="top-bar">
    <h1>JARVIS ADMIN</h1>
    <a href="/">&larr; Back to JARVIS</a>
  </div>
  <div class="tabs">
    <button class="tab active" data-tab="overview">OVERVIEW</button>
    <button class="tab" data-tab="users">USERS</button>
    <button class="tab" data-tab="audit">AUDIT LOG</button>
    <button class="tab" data-tab="sessions">SESSIONS</button>
    <button class="tab" data-tab="config">CONFIG</button>
  </div>
  <div id="overview" class="panel active"><div class="stats" id="stats-grid"></div></div>
  <div id="users" class="panel">
    <div class="search-bar">
      <input type="text" id="user-search" placeholder="Search by name or email...">
      <button class="btn btn-primary" id="user-search-btn">SEARCH</button>
    </div>
    <div id="user-list"></div>
    <div id="user-detail" style="display:none"></div>
  </div>
  <div id="audit" class="panel">
    <div class="search-bar">
      <input type="text" id="audit-user" placeholder="User ID">
      <select id="audit-action">
        <option value="">All Actions</option>
        <option value="signup">signup</option>
        <option value="login">login</option>
        <option value="login_failed">login_failed</option>
        <option value="logout">logout</option>
        <option value="chat_message">chat_message</option>
        <option value="plan_change">plan_change</option>
        <option value="founding_member_granted">founding_member_granted</option>
        <option value="push_subscribe">push_subscribe</option>
        <option value="terms_accepted">terms_accepted</option>
        <option value="account_locked">account_locked</option>
      </select>
      <button class="btn btn-primary" id="audit-search-btn">SEARCH</button>
    </div>
    <div id="audit-list"></div>
  </div>
  <div id="sessions" class="panel"><div id="session-list"></div></div>
  <div id="config" class="panel">
    <div class="detail-card">
      <h3 style="font-size:14px;color:var(--text);margin-bottom:12px;">Founding Member Program</h3>
      <div class="detail-row">
        <span class="detail-label">ENABLED</span>
        <label class="toggle-sm"><input type="checkbox" id="cfg-founding-enabled"><span></span></label>
      </div>
      <div class="detail-row">
        <span class="detail-label">MAX SLOTS</span>
        <input type="number" id="cfg-max-slots" style="width:80px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-size:13px;text-align:right;outline:none">
      </div>
      <div style="margin-top:12px"><button class="btn btn-primary" id="cfg-save">SAVE CONFIG</button></div>
    </div>
  </div>
</div>
<script>
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};
  function api(url,opts){return fetch(url,Object.assign({credentials:'same-origin'},opts||{})).then(function(r){return r.json()})}
  function esc(s){if(!s)return'';var d=document.createElement('span');d.textContent=s;return d.textContent}
  function ts(unix){return unix?new Date(unix*1000).toLocaleString():'\\u2014'}

  function el(tag,attrs,children){
    var e=document.createElement(tag);
    if(attrs)Object.keys(attrs).forEach(function(k){
      if(k==='onclick')e.addEventListener('click',attrs[k]);
      else if(k==='className')e.className=attrs[k];
      else e.setAttribute(k,attrs[k]);
    });
    if(typeof children==='string')e.textContent=children;
    else if(Array.isArray(children))children.forEach(function(c){if(c)e.appendChild(c)});
    return e;
  }

  function clearEl(id){var e=$(id);while(e.firstChild)e.removeChild(e.firstChild);return e}

  document.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click',function(){
      document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active')});
      document.querySelectorAll('.panel').forEach(function(x){x.classList.remove('active')});
      t.classList.add('active');
      $(t.dataset.tab).classList.add('active');
      var m={overview:loadStats,users:loadUsers,audit:loadAudit,sessions:loadSessions,config:loadConfig};
      if(m[t.dataset.tab])m[t.dataset.tab]();
    });
  });

  function buildTable(headers,rows){
    var tbl=el('table');
    var thead=el('tr');
    headers.forEach(function(h){thead.appendChild(el('th',null,h))});
    tbl.appendChild(thead);
    rows.forEach(function(r){tbl.appendChild(r)});
    return tbl;
  }

  function badge(text,cls){return el('span',{className:'badge '+cls},text)}

  // Overview
  function loadStats(){
    api('/api/admin/stats').then(function(d){
      var g=clearEl('stats-grid');
      [{l:'TOTAL USERS',v:d.users,c:''},{l:'ACTIVE SESSIONS',v:d.activeSessions,c:'ok'},{l:'FOUNDING MEMBERS',v:d.foundingMembers+' / '+d.foundingMaxSlots,c:'founding'},{l:'FOUNDING PROGRAM',v:d.foundingEnabled?'ACTIVE':'DISABLED',c:d.foundingEnabled?'ok':''}].forEach(function(s){
        var box=el('div',{className:'stat'},[el('div',{className:'stat-label'},s.l),el('div',{className:'stat-value'+(s.c?' '+s.c:'')},String(s.v))]);
        g.appendChild(box);
      });
    });
  }
  loadStats();

  // Users
  var userPage=1;
  function loadUsers(page){
    userPage=page||1;
    $('user-detail').style.display='none';
    $('user-list').style.display='block';
    var search=$('user-search').value;
    var url='/api/admin/users?page='+userPage+(search?'&search='+encodeURIComponent(search):'');
    api(url).then(function(d){
      var container=clearEl('user-list');
      if(!d.users.length){container.appendChild(el('div',{className:'empty'},'No users found.'));return}
      var rows=d.users.map(function(u){
        var flags=el('td');
        if(u.foundingMember)flags.appendChild(badge('FOUNDER','badge-founding'));
        if(u.isAdmin){flags.appendChild(document.createTextNode(' '));flags.appendChild(badge('ADMIN','badge-admin'))}
        if(u.lockedUntil&&u.lockedUntil>Date.now()/1000){flags.appendChild(document.createTextNode(' '));flags.appendChild(badge('LOCKED','badge-locked'))}
        var planCls=u.plan==='pro'?'badge-pro':'badge-free';
        var viewBtn=el('button',{className:'btn',onclick:function(){viewUser(u.id)}},'VIEW');
        var tr=el('tr',null,[el('td',null,String(u.id)),el('td',null,esc(u.name)),el('td',null,esc(u.email||'\\u2014')),el('td',null,[badge(u.plan.toUpperCase(),planCls)]),flags,el('td',null,ts(u.createdAt)),el('td',null,[viewBtn])]);
        return tr;
      });
      container.appendChild(buildTable(['ID','NAME','EMAIL','PLAN','FLAGS','JOINED',''],rows));
      var pager=el('div',{className:'pager'});
      if(userPage>1)pager.appendChild(el('button',{className:'btn',onclick:function(){loadUsers(userPage-1)}},'PREV'));
      if(d.users.length===d.limit)pager.appendChild(el('button',{className:'btn',onclick:function(){loadUsers(userPage+1)}},'NEXT'));
      container.appendChild(pager);
    });
  }
  $('user-search-btn').addEventListener('click',function(){loadUsers(1)});
  $('user-search').addEventListener('keydown',function(e){if(e.key==='Enter')loadUsers(1)});

  function viewUser(id){
    $('user-list').style.display='none';
    var det=$('user-detail');
    det.style.display='block';
    api('/api/admin/users/'+id).then(function(d){
      var u=d.user;
      var locked=u.lockedUntil&&u.lockedUntil>Date.now()/1000;
      var container=clearEl('user-detail');
      var back=el('span',{className:'back-link',onclick:function(){loadUsers(userPage)}},'\\u2190 Back to users');
      container.appendChild(back);
      var card=el('div',{className:'detail-card'});
      var fields=[['ID',u.id],['NAME',u.name],['EMAIL',u.email||'\\u2014'],['PLAN',u.plan.toUpperCase()],['FOUNDING MEMBER',u.foundingMember?'YES':'NO'],['ADMIN',u.isAdmin?'YES':'NO'],['LOCKED',locked?'LOCKED until '+ts(u.lockedUntil):'NO'],['ACTIVE SESSIONS',d.activeSessions],['TIMEZONE',u.timezone||'\\u2014'],['TERMS ACCEPTED',ts(u.termsAcceptedAt)],['JOINED',ts(u.createdAt)]];
      fields.forEach(function(f){
        var row=el('div',{className:'detail-row'},[el('span',{className:'detail-label'},f[0]),el('span',{className:'detail-value'},String(f[1]))]);
        card.appendChild(row);
      });
      var actions=el('div',{className:'detail-actions'},[
        el('button',{className:'btn btn-primary',onclick:function(){api('/api/admin/users/'+u.id+'/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'pro'})}).then(function(){viewUser(u.id)})}},'SET PRO'),
        el('button',{className:'btn',onclick:function(){api('/api/admin/users/'+u.id+'/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'free'})}).then(function(){viewUser(u.id)})}},'SET FREE'),
        el('button',{className:'btn',onclick:function(){api('/api/admin/users/'+u.id+'/founding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({founding:!u.foundingMember})}).then(function(){viewUser(u.id)})}},u.foundingMember?'REVOKE FOUNDING':'GRANT FOUNDING'),
        el('button',{className:'btn btn-danger',onclick:function(){if((!locked||confirm('Unlock this account?'))&&(locked||confirm('Lock this account?')))api('/api/admin/users/'+u.id+'/lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lock:!locked})}).then(function(){viewUser(u.id)})}},locked?'UNLOCK':'LOCK ACCOUNT'),
        el('button',{className:'btn btn-danger',onclick:function(){if(confirm('Kill all sessions for this user?'))api('/api/admin/users/'+u.id+'/kill-sessions',{method:'POST'}).then(function(){viewUser(u.id)})}},'KILL SESSIONS'),
        el('button',{className:'btn',onclick:function(){
          document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active')});
          document.querySelectorAll('.panel').forEach(function(x){x.classList.remove('active')});
          document.querySelector('[data-tab="audit"]').classList.add('active');
          $('audit').classList.add('active');
          $('audit-user').value=u.id;
          loadAudit(1);
        }},'VIEW AUDIT LOG')
      ]);
      card.appendChild(actions);
      container.appendChild(card);
    });
  }

  // Audit
  var auditPage=1;
  function loadAudit(page){
    auditPage=page||1;
    var uid=$('audit-user').value;
    var action=$('audit-action').value;
    var url='/api/admin/audit?page='+auditPage;
    if(uid)url+='&user_id='+uid;
    if(action)url+='&action='+action;
    api(url).then(function(d){
      var container=clearEl('audit-list');
      if(!d.entries.length){container.appendChild(el('div',{className:'empty'},'No audit entries found.'));return}
      var rows=d.entries.map(function(e){
        var detailTd=el('td',{className:'audit-detail',title:esc(e.detail||'')},esc(e.detail||'\\u2014'));
        return el('tr',null,[el('td',{style:'white-space:nowrap'},ts(e.created_at)),el('td',null,String(e.user_id||'\\u2014')),el('td',null,[badge(e.action,'badge-free')]),detailTd,el('td',{style:'font-family:var(--mono);font-size:11px'},esc(e.ip||'\\u2014'))]);
      });
      container.appendChild(buildTable(['TIME','USER','ACTION','DETAIL','IP'],rows));
      var pager=el('div',{className:'pager'});
      if(auditPage>1)pager.appendChild(el('button',{className:'btn',onclick:function(){loadAudit(auditPage-1)}},'PREV'));
      if(d.entries.length===d.limit)pager.appendChild(el('button',{className:'btn',onclick:function(){loadAudit(auditPage+1)}},'NEXT'));
      container.appendChild(pager);
    });
  }
  $('audit-search-btn').addEventListener('click',function(){loadAudit(1)});

  // Sessions
  function loadSessions(){
    api('/api/admin/sessions').then(function(d){
      var container=clearEl('session-list');
      if(!d.sessions.length){container.appendChild(el('div',{className:'empty'},'No active sessions.'));return}
      var rows=d.sessions.map(function(s){
        var killBtn=el('button',{className:'btn btn-danger',onclick:function(){if(confirm('Kill this session?'))api('/api/admin/sessions/'+s.sessionId+'/kill',{method:'POST'}).then(function(){loadSessions()})}},'KILL');
        return el('tr',null,[el('td',null,esc(s.userName)+' (#'+s.userId+')'),el('td',null,esc(s.email||'\\u2014')),el('td',null,ts(s.createdAt)),el('td',null,ts(s.expiresAt)),el('td',null,[killBtn])]);
      });
      container.appendChild(buildTable(['USER','EMAIL','CREATED','EXPIRES',''],rows));
    });
  }

  // Config
  function loadConfig(){
    api('/api/admin/stats').then(function(d){
      $('cfg-founding-enabled').checked=d.foundingEnabled;
      $('cfg-max-slots').value=d.foundingMaxSlots;
    });
  }
  $('cfg-save').addEventListener('click',function(){
    api('/api/admin/config/founding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({maxSlots:parseInt($('cfg-max-slots').value),enabled:$('cfg-founding-enabled').checked})}).then(function(){loadStats();alert('Config saved.')});
  });
})();
</script>
</body>
</html>`;
}
