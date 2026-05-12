// ── NAVEGAÇÃO ──
    function showPanel(id, el) {
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
      document.getElementById(id).classList.add('active');
      el.classList.add('active');
      window.scrollTo(0, 0);
    }

    // ── CHECKLIST ──
    function toggleCheck(el) {
      el.classList.toggle('done');
      saveChecks();
    }
    function saveChecks() {
      var s = {};
      document.querySelectorAll('.checklist').forEach(function (c) {
        s[c.id] = Array.from(c.querySelectorAll('.check-item')).map(function (i) { return i.classList.contains('done'); });
      });
      try { localStorage.setItem('cesar2025', JSON.stringify(s)); } catch (e) { }
    }
    function loadChecks() {
      try {
        var s = JSON.parse(localStorage.getItem('cesar2025') || '{}');
        document.querySelectorAll('.checklist').forEach(function (c) {
          if (s[c.id]) {
            var items = c.querySelectorAll('.check-item');
            s[c.id].forEach(function (done, i) { if (done && items[i]) items[i].classList.add('done'); });
          }
        });
      } catch (e) { }
    }
    loadChecks();

    // ── TOAST ──
    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
      setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; }, 3500);
    }

    // ── SERVICE WORKER ──
    var swReg = null;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function (reg) {
        swReg = reg;
      }).catch(function (e) { console.log('SW erro:', e); });
    }

    // ── NOTIFICAÇÕES ──
    var LEMBRETES = [
      { h: 17, m: 50, title: '⚡ Hora de estudar!', body: '18h chegando — prepara o ambiente.' },
      { h: 21, m: 25, title: '🇩🇪 Alemão em 5min', body: '21h30 — 30min de alemão. Imóvel. Vai!' },
      { h: 21, m: 55, title: '🌙 Encerrando', body: '22h chegando — anota o que aprendeu hoje.' },
    ];

    function agendarLembretes() {
      LEMBRETES.forEach(function (l) {
        var agora = new Date();
        var alvo = new Date();
        alvo.setHours(l.h, l.m, 0, 0);
        if (alvo <= agora) alvo.setDate(alvo.getDate() + 1);
        var diff = alvo - agora;
        setTimeout(function () {
          dispararNotif(l.title, l.body);
          setInterval(function () { dispararNotif(l.title, l.body); }, 86400000);
        }, diff);
      });
    }

    function dispararNotif(title, body) {
      if (!swReg || Notification.permission !== 'granted') return;
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg.active) reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title: title, body: body, tag: title });
      });
    }

    async function ativarNotificacoes() {
      if (!('Notification' in window)) { showToast('Navegador não suporta notificações'); return; }
      var perm = await Notification.requestPermission();
      if (perm === 'granted') {
        agendarLembretes();
        var btn = document.getElementById('notif-btn');
        btn.textContent = '✅ Lembretes ativos';
        btn.style.background = 'rgba(34,197,94,.15)';
        btn.style.borderColor = 'rgba(34,197,94,.4)';
        btn.style.color = '#6366f1';
        showToast('Lembretes ativados! 17h50, 21h25 e 21h55.');
      } else {
        showToast('Permita notificações nas configurações.');
      }
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      agendarLembretes();
      var btn = document.getElementById('notif-btn');
      if (btn) { btn.textContent = '✅ Lembretes ativos'; btn.style.background = 'rgba(34,197,94,.15)'; btn.style.borderColor = 'rgba(34,197,94,.4)'; btn.style.color = '#6366f1'; }
    }

    // ── PWA INSTALL ──
    var deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('install-btn').style.display = 'flex';
    });
    window.addEventListener('appinstalled', function () {
      document.getElementById('install-btn').style.display = 'none';
      deferredPrompt = null;
      showToast('✅ App instalado!');
    });
    function installApp() {
      if (!deferredPrompt) { showToast('Abra no Chrome e use "Adicionar à tela inicial"'); return; }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
    }

    // ── ACADEMIA TRACKER ──
    function getWeekKey() {
      var d = new Date();
      var jan1 = new Date(d.getFullYear(), 0, 1);
      var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      return d.getFullYear() + '-W' + week;
    }

    function setGymDone(el, done) {
      var chk = el.querySelector('.gym-check');
      if (done) {
        el.style.background = 'rgba(249,115,22,.15)';
        el.style.borderColor = 'rgba(249,115,22,.5)';
        chk.style.background = '#f97316';
        chk.style.borderColor = '#f97316';
        chk.textContent = '✓';
        el.dataset.done = 'true';
      } else {
        el.style.background = 'var(--s2)';
        el.style.borderColor = 'var(--border2)';
        chk.style.background = 'transparent';
        chk.style.borderColor = 'var(--border2)';
        chk.textContent = '';
        el.dataset.done = 'false';
      }
    }

    function toggleGym(el, day) {
      var isDone = el.dataset.done === 'true';
      setGymDone(el, !isDone);
      saveGym();
      updateGymStreak();
    }

    function saveGym() {
      var data = {};
      document.querySelectorAll('#gym-days > div').forEach(function (el) {
        data[el.dataset.day] = el.dataset.done === 'true';
      });
      try { localStorage.setItem(getWeekKey(), JSON.stringify(data)); } catch (e) { }
    }

    function loadGym() {
      try {
        var data = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
        document.querySelectorAll('#gym-days > div').forEach(function (el) {
          if (data[el.dataset.day]) setGymDone(el, true);
        });
        updateGymStreak();
      } catch (e) { }
    }

    function updateGymStreak() {
      var count = 0;
      document.querySelectorAll('#gym-days > div').forEach(function (el) {
        if (el.dataset.done === 'true') count++;
      });
      var streak = document.getElementById('gym-streak');
      var msg = document.getElementById('gym-msg');
      if (streak) {
        streak.textContent = count + '/7';
        streak.style.color = count === 7 ? '#6366f1' : count >= 5 ? '#fbbf24' : '#fb923c';
      }
      if (msg) {
        if (count === 0) msg.textContent = 'Toque nos dias que treinou 💪';
        else if (count < 3) msg.textContent = 'Bom começo! Continua. 🔥';
        else if (count < 5) msg.textContent = 'Na metade! Tá indo bem. 💪';
        else if (count < 7) msg.textContent = 'Quase semana cheia! Falta pouco! 🚀';
        else msg.textContent = '🏆 Semana cheia! Você é fera, Cesar!';
      }
    }

    function resetGym() {
      document.querySelectorAll('#gym-days > div').forEach(function (el) {
        setGymDone(el, false);
      });
      saveGym();
      updateGymStreak();
    }

    loadGym();

    // ── CERTIFICAÇÕES TRACKER ──
    // CERT TOGGLE
    var certState = {};
    function toggleCert(el, track) {
      var id = el.dataset.id;
      var isDone = el.classList.contains('done');
      if (isDone) {
        el.classList.remove('done');
        certState[id] = false;
      } else {
        el.classList.add('done');
        certState[id] = true;
      }
      saveCerts();
      updateProgress();
    }

    function saveCerts() {
      try { localStorage.setItem('cesar-certs-2025', JSON.stringify(certState)); } catch (e) { }
    }

    function loadCerts() {
      try {
        var s = JSON.parse(localStorage.getItem('cesar-certs-2025') || '{}');
        certState = s;
        Object.keys(s).forEach(function (id) {
          if (s[id]) {
            var el = document.querySelector('[data-id="' + id + '"]');
            if (el) el.classList.add('done');
          }
        });
      } catch (e) { }
      updateProgress();
    }

    // PROGRESS
    var tracks = {
      linux: ['lpic1', 'lpic2', 'lpic-devops', 'rhcsa', 'rhce'],
      cont: ['dca'],
      aws: ['awscp', 'awssaa', 'awssysops', 'awsdop'],
      gcp: ['gcpace', 'gcpdevops', 'gcparch'],
      k8s: ['kcna', 'kcsa', 'ckad', 'cka', 'cks', 'pca', 'kca'],
      iac: ['terraform', 'ansible', 'gitlab'],
      sec: ['ccna', 'secplus', 'ejpt', 'devsecops-exin', 'cks-sec', 'awssec'],
      astro: ['pca-prom', 'argocd', 'istio']
    };

    function updateProgress() {
      var total = 0, done = 0;
      Object.keys(tracks).forEach(function (key) {
        var certs = tracks[key];
        var d = certs.filter(function (id) { return certState[id]; }).length;
        var pct = Math.round(d / certs.length * 100);
        var pfEl = document.getElementById('pf-' + key);
        var pvEl = document.getElementById('pv-' + key);
        if (pfEl) pfEl.style.width = pct + '%';
        if (pvEl) pvEl.textContent = pct + '%';
        total += certs.length;
        done += d;
      });
      // update home stat
      var statDone = document.querySelector('#cert-home .stat-num[style*="22c55e"]');
      if (statDone) statDone.textContent = done;
    }

    loadCerts();

    // ── PLANNER DIÁRIO ──────────────────────────────────────

    var PL_SUBJECTS = [
      {id:'devops',    label:'DevOps / K8s / Docker',      color:'#818cf8'},
      {id:'redes',     label:'Redes / TCP-IP / Seg',       color:'#c084fc'},
      {id:'aws',       label:'AWS',                        color:'#fbbf24'},
      {id:'gcp',       label:'Google Cloud (GCP)',         color:'#60a5fa'},
      {id:'eda',       label:'Algoritmos + ED (C/Py/Java)',color:'#fb923c'},
      {id:'python',    label:'Python',                     color:'#60a5fa'},
      {id:'java',      label:'Java / Spring / OCP',        color:'#f87171'},
      {id:'ingles',    label:'Ingles',                     color:'#38bdf8'},
      {id:'alemao',    label:'Alemao',                     color:'#4ade80'},
      {id:'pos',       label:'Pos FIAP / Cybersec',        color:'#f87171'},
      {id:'sysdesign', label:'System Design',              color:'#f472b6'},
      {id:'linux',     label:'Linux / RHCSA / Shell',         color:'#fb923c'},
      {id:'sql',       label:'SQL / Banco de Dados',              color:'#06b6d4'},
    ];
    var PL_SUBJ_MAP = {};
    PL_SUBJECTS.forEach(function(s){ PL_SUBJ_MAP[s.id]=s; });

    // Alemao group conversation schedule (fixed dates)
    // Iniciantes = 1h, Intermediario = 1h
    var ALEMAO_SCHEDULE = {
      '2026-05-12': {time:'16:00', dur:60, level:'Iniciantes'},
      '2026-05-14': {time:'14:00', dur:60, level:'Iniciantes'},
      '2026-05-15': {time:'14:00', dur:60, level:'Intermediario'},
      '2026-05-19': {time:'16:00', dur:60, level:'Iniciantes'},
      '2026-05-21': {time:'14:00', dur:60, level:'Iniciantes'},
      '2026-05-22': {time:'14:00', dur:60, level:'Intermediario'},
      '2026-05-26': {time:'16:00', dur:60, level:'Iniciantes'},
      '2026-05-28': {time:'14:00', dur:60, level:'Iniciantes'},
      '2026-05-29': {time:'14:00', dur:60, level:'Intermediario'},
    };

    function plHHMM(m){ return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
    function plDurLbl(m){ return m>=60?Math.floor(m/60)+'h'+(m%60>0?String(m%60).padStart(2,'0'):''):m+'min'; }
    function plTimeToMins(hhmm){ var p=hhmm.split(':'); return parseInt(p[0])*60+parseInt(p[1]); }

    // Build schedule for a given date key
    // Morning: 07:00-12:00 (3x 1h30 study + 2x 15min break)
    // Rest: 12:00-14:00 locked
    // Afternoon: 14:00 -> 18:40, fitting study slots around fixed events
    // Fixed events: Alemao (specific dates), Ingles (Mon+Wed 18:00-18:40)
    // Sunday: full rest
    function buildScheduleForDate(dateKey) {
      var slots = [];
      var d = plParseKey(dateKey);
      var dow = d.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat

      if (dow === 0) {
        // SUNDAY - full rest
        slots.push({type:'rest', start:7*60, dur:13*60+40, label:'DOMINGO - IGREJA + FAMILIA', icon:'prayer'});
        return slots;
      }

      var isMonWed = (dow === 1 || dow === 3);
      var alemaoInfo = ALEMAO_SCHEDULE[dateKey] || null;

      // Helper: insert study+break pair starting at cur, stopping before wall
      // Returns new cur position
      function addStudyBlock(cur, wall) {
        if (cur + 90 > wall) return cur; // no room
        slots.push({type:'study', start:cur, dur:90});
        var afterStudy = cur + 90;
        var afterBreak = afterStudy + 15;
        if (afterBreak <= wall) {
          slots.push({type:'break', start:afterStudy, dur:15, label:'Intervalo'});
          return afterBreak;
        }
        return afterStudy;
      }

      // Helper: fill study blocks from cur up to (but not including) wall
      function fillStudy(cur, wall) {
        var c = cur;
        for (var i = 0; i < 10; i++) {
          var next = addStudyBlock(c, wall);
          if (next === c) break;
          c = next;
        }
        return c;
      }

      // ── MORNING 07:00 – 12:00 ──
      // Exactly: 07:00-08:30 study, 08:30-08:45 break, 08:45-10:15 study, 10:15-10:30 break, 10:30-12:00 study
      slots.push({type:'study', start:7*60,       dur:90});
      slots.push({type:'break', start:7*60+90,    dur:15, label:'Intervalo'});
      slots.push({type:'study', start:7*60+105,   dur:90});
      slots.push({type:'break', start:7*60+195,   dur:15, label:'Intervalo'});
      slots.push({type:'study', start:7*60+210,   dur:90});
      // = 07:00 08:30 08:45 10:15 10:30 12:00 ✓

      // ── DESCANSO 12:00 – 14:00 ──
      slots.push({type:'rest', start:12*60, dur:120, label:'ALMOCO E DESCANSO', icon:'lunch'});

      // ── AFTERNOON 14:00 – 18:40 ──
      var afternoonEnd = 18*60 + 40;
      var cur = 14*60;

      // Collect all fixed afternoon events, sorted by start
      var fixedEvents = [];

      if (alemaoInfo) {
        var aStart = plTimeToMins(alemaoInfo.time);
        if (aStart >= 14*60 && aStart < afternoonEnd) {
          fixedEvents.push({
            type:'fixed',
            start: aStart,
            dur: alemaoInfo.dur,
            label:'ALEMAO - Grupo de Conversacao (' + alemaoInfo.level + ')',
            icon:'alemao',
            subject:'alemao'
          });
        }
      }

      if (isMonWed) {
        fixedEvents.push({
          type:'fixed',
          start: 18*60,
          dur: 40,
          label:'INGLES - Aula ao vivo (Seg/Qua)',
          icon:'ingles',
          subject:'ingles'
        });
      }

      // Sort fixed events by start time
      fixedEvents.sort(function(a,b){return a.start - b.start;});

      // Fill study blocks around fixed events
      fixedEvents.forEach(function(ev) {
        // Fill study up to this event
        cur = fillStudy(cur, ev.start);
        // Small gap filler if needed
        if (cur < ev.start) {
          var gapDur = ev.start - cur;
          if (gapDur >= 5) {
            slots.push({type:'gap', start:cur, dur:gapDur});
          }
          cur = ev.start;
        }
        // Insert fixed event
        slots.push(ev);
        cur = ev.start + ev.dur;
      });

      // Fill remaining study time after last fixed event until 18:40
      fillStudy(cur, afternoonEnd);

      return slots;
    }

        var plCurrentKey = plTodayKey();
    var plDayData = {};
    var plHistFilter = 'all';
    var plInited = false;

    function plTodayKey(){
      var d=new Date(); return d.toISOString().slice(0,10);
    }
    function plParseKey(k){
      var p=k.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]);
    }
    function plFormatDate(k){
      var d=plParseKey(k);
      var M=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
      return String(d.getDate()).padStart(2,'0')+' '+M[d.getMonth()]+' '+d.getFullYear();
    }
    function plFormatWeekday(k){
      var d=plParseKey(k);
      return ['DOMINGO','SEGUNDA-FEIRA','TERCA-FEIRA','QUARTA-FEIRA','QUINTA-FEIRA','SEXTA-FEIRA','SABADO'][d.getDay()];
    }

    function plGetStudyBlocks(key) {
      if (!plDayData[key]) plDayData[key] = {blocks:[]};
      return plDayData[key].blocks;
    }

    function plStorageKey(dateKey){ return 'cesar-planner-'+dateKey; }
    function plSaveToLS(key){
      try{ localStorage.setItem(plStorageKey(key), JSON.stringify(plDayData[key])); }catch(e){}
    }
    function plLoadFromLS(key){
      try{
        var raw=localStorage.getItem(plStorageKey(key));
        if(raw){ plDayData[key]=JSON.parse(raw); return true; }
      }catch(e){}
      return false;
    }
    function plLoadAllHistory(){
      var prefix='cesar-planner-';
      try{
        for(var i=0;i<localStorage.length;i++){
          var k=localStorage.key(i);
          if(k && k.indexOf(prefix)===0){
            var dateKey=k.slice(prefix.length);
            if(!plDayData[dateKey]){
              try{ plDayData[dateKey]=JSON.parse(localStorage.getItem(k)||'null'); }catch(e){}
            }
          }
        }
      }catch(e){}
    }

    function initPlanner(){
      plLoadAllHistory();
      plLoadFromLS(plCurrentKey);
      plRender();
      plInited=true;
    }

    function plRender(){
      document.getElementById('pl-weekday').textContent = plFormatWeekday(plCurrentKey);
      document.getElementById('pl-date').textContent = plFormatDate(plCurrentKey);

      var schedule = buildScheduleForDate(plCurrentKey);
      var savedBlocks = plGetStudyBlocks(plCurrentKey);
      // Index saved blocks by slot index (study slots only, ordered)
      var studyIdx = 0;

      var grid = document.getElementById('pl-blocks');
      grid.innerHTML = '';

      schedule.forEach(function(slot) {
        var div = document.createElement('div');
        var timeEnd = slot.start + slot.dur;

        if (slot.type === 'rest') {
          div.className = 'pl-block pl-block-rest';
          div.innerHTML =
            '<div class="pl-time" style="background:rgba(16,185,129,.08);">' +
              '<div class="pl-time-s" style="font-size:11px;color:#6366f1;">'+plHHMM(slot.start)+'</div>' +
              '<div class="pl-time-e">'+plHHMM(timeEnd)+'</div>' +
              '<div class="pl-time-d" style="color:#6366f1;">'+plDurLbl(slot.dur)+'</div>' +
            '</div>' +
            '<div class="pl-body" style="background:rgba(16,185,129,.05);">' +
              '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;letter-spacing:2px;color:#6366f1;">' +
                (slot.icon==='prayer'?'&#x1F64F; ':'&#x1F37D; ') + slot.label +
              '</span>' +
            '</div>';
          grid.appendChild(div);
          return;
        }

        if (slot.type === 'fixed') {
          var fixColor = slot.subject === 'alemao' ? '#4ade80' : '#38bdf8';
          var fixBg = slot.subject === 'alemao' ? 'rgba(34,197,94,.08)' : 'rgba(14,165,233,.08)';
          var fixBorder = slot.subject === 'alemao' ? 'rgba(34,197,94,.3)' : 'rgba(14,165,233,.3)';
          div.className = 'pl-block';
          div.style.borderColor = fixBorder;
          div.innerHTML =
            '<div class="pl-time" style="background:'+fixBg+';">' +
              '<div class="pl-time-s" style="color:'+fixColor+';">'+plHHMM(slot.start)+'</div>' +
              '<div class="pl-time-e">'+plHHMM(timeEnd)+'</div>' +
              '<div class="pl-time-d" style="color:'+fixColor+';">'+plDurLbl(slot.dur)+'</div>' +
            '</div>' +
            '<div class="pl-body" style="background:'+fixBg+';">' +
              '<span class="pl-tag vis ptag-'+slot.subject+'" style="display:inline-block">'+slot.subject.toUpperCase()+'</span>' +
              '<span style="font-family:IBM Plex Mono,monospace;font-size:11px;letter-spacing:1px;color:'+fixColor+';flex:1;">'+slot.label+'</span>' +
              '<span style="font-family:IBM Plex Mono,monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">FIXO</span>' +
            '</div>';
          grid.appendChild(div);
          return;
        }

        if (slot.type === 'break') {
          div.className = 'pl-block is-break';
          div.innerHTML =
            '<div class="pl-time"><div class="pl-time-s" style="font-size:11px;">'+plHHMM(slot.start)+'</div><div class="pl-time-e">'+plHHMM(timeEnd)+'</div><div class="pl-time-d">'+plDurLbl(slot.dur)+'</div></div>' +
            '<div class="pl-body"><span class="pl-break-lbl">// '+slot.label+' &middot; agua, alongamento</span></div>';
          grid.appendChild(div);
          return;
        }

        if (slot.type === 'gap') {
          div.className = 'pl-block is-break';
          div.innerHTML =
            '<div class="pl-time"><div class="pl-time-s" style="font-size:11px;">'+plHHMM(slot.start)+'</div><div class="pl-time-e">'+plHHMM(timeEnd)+'</div><div class="pl-time-d">'+plDurLbl(slot.dur)+'</div></div>' +
            '<div class="pl-body"><span class="pl-break-lbl">// Preparacao &middot; revisao rapida, organizar material</span></div>';
          grid.appendChild(div);
          return;
        }

        // type === 'study'
        var si = studyIdx;
        var b = savedBlocks[si] || {si:si, start:slot.start, dur:slot.dur, subject:'', topic:'', notes:'', rating:0, done:false};
        if (!savedBlocks[si]) savedBlocks[si] = b;
        b.start = slot.start; b.dur = slot.dur; // always sync time

        div.className = 'pl-block' + (b.done ? ' is-done' : '');
        var timeHTML =
          '<div class="pl-time">' +
            '<div class="pl-time-s">'+plHHMM(slot.start)+'</div>' +
            '<div class="pl-time-e">'+plHHMM(timeEnd)+'</div>' +
            '<div class="pl-time-d">'+plDurLbl(slot.dur)+'</div>' +
          '</div>';

        var body = document.createElement('div');
        body.className = 'pl-body';
        div.innerHTML = timeHTML;
        div.appendChild(body);

        // Tag
        var tag = document.createElement('span');
        tag.className = 'pl-tag' + (b.subject ? ' vis ptag-'+b.subject : '');
        tag.id = 'pl-tag-'+si;
        tag.textContent = b.subject ? (PL_SUBJ_MAP[b.subject] ? PL_SUBJ_MAP[b.subject].label.split('/')[0].trim() : b.subject).toUpperCase() : '';
        body.appendChild(tag);

        // Select
        var sel = document.createElement('select');
        sel.className = 'pl-sel'; sel.id = 'pl-sel-'+si;
        var opts = '<option value="">-- materia --</option>';
        PL_SUBJECTS.forEach(function(s){ opts += '<option value="'+s.id+'"'+(b.subject===s.id?' selected':'')+'>'+s.label+'</option>'; });
        sel.innerHTML = opts;
        (function(idx){ sel.addEventListener('change', function(){
          var val = this.value; savedBlocks[idx].subject = val;
          var t = document.getElementById('pl-tag-'+idx);
          if (t) { if(val){t.className='pl-tag vis ptag-'+val;t.textContent=(PL_SUBJ_MAP[val]?PL_SUBJ_MAP[val].label.split('/')[0].trim():val).toUpperCase();}else{t.className='pl-tag';t.textContent='';} }
          plUpdateStats();
        }); })(si);
        body.appendChild(sel);

        // Input
        var inp = document.createElement('input');
        inp.type='text'; inp.className='pl-inp'; inp.placeholder='topico estudado...';
        inp.value = b.topic||''; inp.id = 'pl-inp-'+si;
        (function(idx){ inp.addEventListener('input', function(){ savedBlocks[idx].topic=this.value; }); })(si);
        body.appendChild(inp);

        // Stars
        var sw = document.createElement('div'); sw.className = 'pl-stars';
        for (var r=1;r<=5;r++) {
          var star = document.createElement('span');
          star.className = 'pl-star'+(r<=b.rating?' on':'');
          star.innerHTML = '&#9733;';
          star.setAttribute('data-r',r); star.setAttribute('data-si',si);
          star.addEventListener('click', function(){
            var rv=parseInt(this.getAttribute('data-r')); var sv=parseInt(this.getAttribute('data-si'));
            savedBlocks[sv].rating=rv;
            this.parentElement.querySelectorAll('.pl-star').forEach(function(s,i){s.classList.toggle('on',i<rv);});
          });
          sw.appendChild(star);
        }
        body.appendChild(sw);

        // Done toggle
        var tog = document.createElement('div');
        tog.className = 'pl-check'+(b.done?' on':''); tog.innerHTML='&#10003;'; tog.id='pl-check-'+si;
        (function(idx){ tog.addEventListener('click', function(){
          savedBlocks[idx].done=!savedBlocks[idx].done;
          this.classList.toggle('on',savedBlocks[idx].done);
          this.closest('.pl-block').classList.toggle('is-done',savedBlocks[idx].done);
          plUpdateStats();
        }); })(si);
        body.appendChild(tog);

        // Notes
        var nw = document.createElement('div'); nw.style.cssText='width:100%;display:flex;flex-direction:column;';
        var nt = document.createElement('span'); nt.className='pl-notes-toggle';
        nt.innerHTML = (b.notes?'&#9660;':'&#9658;')+' ANOTACOES';
        var na = document.createElement('textarea'); na.className='pl-notes'+(b.notes?' vis':'');
        na.placeholder='anotacoes, duvidas, links...'; na.rows=2; na.value=b.notes||''; na.id='pl-notes-'+si;
        (function(idx){ na.addEventListener('input', function(){ savedBlocks[idx].notes=this.value; }); })(si);
        nt.addEventListener('click', function(){ na.classList.toggle('vis'); this.innerHTML=(na.classList.contains('vis')?'&#9660;':'&#9658;')+' ANOTACOES'; });
        nw.appendChild(nt); nw.appendChild(na);
        body.appendChild(nw);

        grid.appendChild(div);
        studyIdx++;
      });

      plUpdateStats();
    }

    function plUpdateStats(){
      var savedBlocks = plGetStudyBlocks(plCurrentKey);
      var done = savedBlocks.filter(function(b){return b&&b.done;}).length;
      var total = savedBlocks.filter(function(b){return b;}).length;
      var pct = total ? Math.round(done/total*100) : 0;
      var el=document.getElementById('pl-prog'); if(el) el.style.width=pct+'%';
      var de=document.getElementById('pl-done'); if(de) de.textContent=done;
      var te=document.getElementById('pl-total'); if(te) te.textContent=total;
      var he=document.getElementById('pl-hours'); if(he) he.textContent=(done*1.5).toFixed(1)+'h';
    }

    function plSaveDay(){
      var savedBlocks = plGetStudyBlocks(plCurrentKey);
      var schedule = buildScheduleForDate(plCurrentKey);
      var si = 0;
      schedule.forEach(function(slot){
        if(slot.type!=='study') return;
        var sel=document.getElementById('pl-sel-'+si);
        var inp=document.getElementById('pl-inp-'+si);
        var notes=document.getElementById('pl-notes-'+si);
        if(sel && savedBlocks[si]) savedBlocks[si].subject=sel.value;
        if(inp && savedBlocks[si]) savedBlocks[si].topic=inp.value;
        if(notes && savedBlocks[si]) savedBlocks[si].notes=notes.value;
        si++;
      });
      plSaveToLS(plCurrentKey);
      showToast('Dia salvo! Historico atualizado.');
    }

    function plClearDay(){
      if(!confirm('Limpar dados de hoje?')) return;
      delete plDayData[plCurrentKey];
      localStorage.removeItem(plStorageKey(plCurrentKey));
      plRender();
    }

    function plChangeDay(delta){
      var d=plParseKey(plCurrentKey); d.setDate(d.getDate()+delta);
      plCurrentKey=d.toISOString().slice(0,10);
      plLoadFromLS(plCurrentKey);
      plRender();
    }

    function plGoToday(){
      plCurrentKey=plTodayKey();
      plLoadFromLS(plCurrentKey);
      plRender();
    }

    // ── HISTORICO ──────────────────────────────────────────
    function renderHistory(){
      plLoadAllHistory();
      renderStats();
      var keys=Object.keys(plDayData).filter(function(k){
        var blocks=(plDayData[k]&&plDayData[k].blocks)||[];
        var hasData=blocks.some(function(b){return b&&(b.subject||b.topic||b.done);});
        if(!hasData) return false;
        if(plHistFilter==='all') return true;
        return blocks.some(function(b){return b&&b.subject===plHistFilter;});
      }).sort(function(a,b){return b.localeCompare(a);});

      var list=document.getElementById('ph-list');
      if(!list) return;
      if(keys.length===0){
        list.innerHTML='<div class="ph-empty">NENHUM HISTORICO ENCONTRADO<br>SALVE UM DIA NO PLANNER PARA COMECAR</div>';
        return;
      }

      list.innerHTML=keys.map(function(key){
        var blocks=(plDayData[key]&&plDayData[key].blocks)||[];
        var done=blocks.filter(function(b){return b&&b.done;});
        var studyH=(done.length*1.5).toFixed(1);
        var subjects=[]; blocks.forEach(function(b){ if(b&&b.subject&&subjects.indexOf(b.subject)<0) subjects.push(b.subject); });
        var miniPills=subjects.map(function(sid){
          var s=PL_SUBJ_MAP[sid];
          return '<span class="ph-mini ptag-'+sid+'">'+(s?s.label.split('/')[0].trim():sid).toUpperCase()+'</span>';
        }).join('');
        var filtered=blocks.filter(function(b){return b&&(b.subject||b.topic)&&(plHistFilter==='all'||b.subject===plHistFilter);});
        var rows=filtered.map(function(b){
          var stars=b.rating>0?'&#9733;'.repeat(b.rating):'';
          return '<div class="ph-row">'
            +'<div class="ph-row-time">'+plHHMM(b.start)+'</div>'
            +'<div style="flex:1"><div class="ph-row-subj">'+(b.subject?(PL_SUBJ_MAP[b.subject]&&PL_SUBJ_MAP[b.subject].label)||b.subject:'--')+'</div>'
            +(b.topic?'<div class="ph-row-topic">'+b.topic+'</div>':'')
            +(b.notes?'<div class="ph-row-topic" style="font-style:italic">'+b.notes+'</div>':'')
            +'</div>'
            +'<div class="ph-row-stars">'+stars+'</div>'
            +(b.done?'<span style="color:var(--accent);font-size:12px">&#10003;</span>':'')
            +'</div>';
        }).join('');
        return '<div class="ph-entry-day">'
          +'<div class="ph-day-hdr" onclick="this.nextElementSibling.classList.toggle(\'open\')">'
          +'<div><div class="ph-day-date">'+plFormatDate(key)+' &middot; '+plFormatWeekday(key)+'</div>'
          +'<div class="ph-day-meta">'+done.length+' blocos &middot; '+studyH+'h de estudo</div></div>'
          +'<div class="ph-day-pills">'+miniPills+'</div>'
          +'</div>'
          +'<div class="ph-day-body">'+(rows||'<div class="ph-empty" style="padding:14px">Nada neste filtro.</div>')+'</div>'
          +'</div>';
      }).join('');
    }

    function phFilter(f, btn){
      plHistFilter=f;
      document.querySelectorAll('.ph-filter').forEach(function(b){b.classList.remove('on');});
      btn.classList.add('on');
      renderHistory();
    }

    function renderStats(){
      plLoadAllHistory();
      var allBlocks=[];
      Object.keys(plDayData).forEach(function(k){ var b=(plDayData[k]&&plDayData[k].blocks)||[]; allBlocks=allBlocks.concat(b); });
      var done=allBlocks.filter(function(b){return b&&b.done;});
      var totalH=(done.length*1.5).toFixed(1);
      var totalDays=Object.keys(plDayData).filter(function(k){ return (plDayData[k]&&plDayData[k].blocks||[]).some(function(b){return b&&b.done;}); }).length;
      var ratedBlocks=done.filter(function(b){return b.rating>0;});
      var avgR=ratedBlocks.length>0?(ratedBlocks.reduce(function(s,b){return s+(b.rating||0);},0)/ratedBlocks.length).toFixed(1):'--';
      var uniqSubj=[];
      done.forEach(function(b){if(b.subject&&uniqSubj.indexOf(b.subject)<0)uniqSubj.push(b.subject);});

      var sg=document.getElementById('ps-grid');
      if(sg) sg.innerHTML=
        '<div class="ps-card"><div class="ps-lbl">TOTAL HORAS</div><div class="ps-val">'+totalH+'h</div><div class="ps-sub">'+done.length+' blocos de 1h30</div></div>'+
        '<div class="ps-card"><div class="ps-lbl">DIAS ESTUDADOS</div><div class="ps-val">'+totalDays+'</div><div class="ps-sub">com ao menos 1 bloco</div></div>'+
        '<div class="ps-card"><div class="ps-lbl">AVALIACAO MEDIA</div><div class="ps-val">'+avgR+'</div><div class="ps-sub">produtividade percebida</div></div>'+
        '<div class="ps-card"><div class="ps-lbl">MATERIAS</div><div class="ps-val">'+uniqSubj.length+'</div><div class="ps-sub">diferentes estudadas</div></div>';

      var counts={};
      done.forEach(function(b){ if(b.subject) counts[b.subject]=(counts[b.subject]||0)+1; });
      var maxC=1; Object.keys(counts).forEach(function(k){if(counts[k]>maxC)maxC=counts[k];});
      var sb=document.getElementById('ps-bars');
      if(sb){
        var rows=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).map(function(sid){
          var cnt=counts[sid]; var s=PL_SUBJ_MAP[sid]; var pct=Math.round(cnt/maxC*100); var h=(cnt*1.5).toFixed(1);
          return '<div class="ps-bar-row"><div class="ps-bar-name">'+(s?s.label.split('/')[0].trim():sid).toUpperCase()+'</div>'
            +'<div class="ps-bar-track"><div class="ps-bar-fill" style="width:'+pct+'%;background:'+(s?s.color:'var(--pick)')+'"></div></div>'
            +'<div class="ps-bar-cnt">'+h+'h &middot; '+cnt+'x</div></div>';
        }).join('');
        sb.innerHTML=rows||'<div class="ph-empty" style="padding:8px">Nenhum dado ainda.</div>';
      }
    }
