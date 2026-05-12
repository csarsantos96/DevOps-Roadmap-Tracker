// views/home.js — tela "Hoje" (prioridade #1 conforme escolha do user)
import { getCurrentBlock, getCurrentPhase, getNextFixedEvent, getSchedule, suggestTrackForBlock, daysToDeadline, getFiapEventsThisWeek } from '../js/schedule.js';
import { Store } from '../js/store.js';
import { trackProgress, todayStreak } from '../js/progress.js';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function renderHome(ctx) {
  const { tracks, certs } = ctx;
  const now = new Date();
  const phase = getCurrentPhase(now);
  const block = getCurrentBlock(now);
  const nextEvent = getNextFixedEvent(now);
  const fiapWeek = getFiapEventsThisWeek(now);
  const fiapDeadline = getNextFiapDeadline(now);
  const streak = todayStreak(Store.getPomodoroSessions());
  const focus = Store.getFocus();
  const focusActive = Store.isFocusActive();

  return `
    <div class="hero">
      <div class="hero-eye">${formatNowLabel(now)}</div>
      <div class="hero-title">CESAR<span class="g">'S</span> ROADMAP</div>
      ${phase ? renderPhaseStrip(phase, now) : ''}
    </div>

    <div class="section">
      ${fiapDeadline ? renderDeadlineCard(fiapDeadline, now) : ''}
      ${focusActive ? renderFocusBadge(focus, tracks) : ''}
      ${renderNowCard(block, phase, tracks, focus, focusActive, now)}
      ${nextEvent ? renderNextEvent(nextEvent, now) : ''}
      ${fiapWeek.length > 0 ? renderFiapWeek(fiapWeek) : ''}
      ${renderLangPanel(now)}

      <div class="sec-label">// progresso geral</div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-num">${streak}</div><div class="stat-lbl">streak (dias)</div></div>
        <div class="stat-box"><div class="stat-num">${countTopicsDone(tracks)}</div><div class="stat-lbl">tópicos done</div></div>
        <div class="stat-box"><div class="stat-num">${certs.certs.filter(c => Store.isCertDone(c.id)).length}/${certs.certs.length}</div><div class="stat-lbl">certs</div></div>
      </div>

      <div class="sec-label">// trilhas — abrir para mergulhar</div>
      <div class="track-grid">
        ${tracks.map(t => renderTrackTile(t)).join('')}
      </div>
    </div>
  `;
}

function getNextFiapDeadline(now) {
  // Pegar deadlines do schedule cacheado
  try {
    if (!window.__schedule_fiap_events) return null;
    const upcoming = window.__schedule_fiap_events.filter(ev => {
      if (!ev.is_deadline) return false;
      const evDate = new Date(ev.date + 'T' + ev.time);
      return evDate >= now;
    });
    return upcoming[0] || null;
  } catch (e) { return null; }
}

function renderDeadlineCard(deadline, now) {
  const evDate = new Date(deadline.date + 'T' + deadline.time);
  const days = Math.ceil((evDate - now) / 86400000);
  const urgent = days <= 7;
  return `
    <div class="deadline-card" style="${urgent ? 'animation: pulse-urgent 2s infinite' : ''}">
      <div>
        <div class="deadline-tag">🚨 DEADLINE PRÓXIMO</div>
        <div class="deadline-title">${deadline.title.replace('🚨 DEADLINE — ', '')}</div>
      </div>
      <div class="deadline-time">${days} ${days === 1 ? 'dia' : 'dias'}</div>
    </div>
  `;
}

function renderFocusBadge(focus, tracks) {
  const t = tracks.find(x => x.id === focus.track_id);
  if (!t) return '';
  return `
    <div class="focus-badge" style="--accent:${t.color}">
      🎯 Foco da semana: <strong>${t.icon} ${t.name}</strong>
      <a href="#week" class="focus-edit">editar</a>
    </div>
  `;
}

function formatNowLabel(now) {
  return `${WEEKDAYS[now.getDay()].toUpperCase()} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function renderPhaseStrip(phase, now) {
  const days = daysToDeadline(phase, now);
  const status = phase.status === 'upcoming' ? `começa em ${Math.ceil((new Date(phase.start) - now) / 86400000)} dias` : `${days}d até ${phase.end}`;
  return `
    <div class="phase-strip">
      <span class="phase-icon">${phase.icon || ''}</span>
      <span class="phase-name">${phase.name}</span>
      <span class="phase-meta">${status}</span>
    </div>
  `;
}

function renderNowCard(block, phase, tracks, focus, focusActive, now) {
  if (!block) return '';

  if (block.type === 'fixed') {
    const ev = block.event;
    const isLang = ev.track === 'alemao' || ev.track === 'ingles';
    const langKey = isLang ? `${ev.id}:${toDateStr(now)}` : null;
    const langDone = langKey ? Store.isLangEventDone(langKey) : false;
    return `
      <div class="now-card now-fixed ${langDone ? 'now-lang-done' : ''}" style="--accent:${ev.color || '#a78bfa'}">
        <div class="now-tag">🔒 AGORA · FIXO</div>
        <div class="now-title">${ev.title}</div>
        <div class="now-desc">${ev.description || ''}</div>
        <div class="now-time">${ev.start_time} → ${ev.end_time}</div>
        ${isLang ? `
          <button class="lang-check-btn lang-check-now ${langDone ? 'lang-checked' : ''}"
                  data-lang-key="${langKey}">
            ${langDone ? '✓ Feita!' : '○ Marcar como feita'}
          </button>
        ` : ''}
      </div>
    `;
  }

  if (block.type === 'block') {
    // detectar domingo sagrado / blocos de descanso
    if (block.block.track_hint === 'rest' || block.block.duration_min === 0) {
      return `
        <div class="now-card now-idle">
          <div class="now-tag">🕊️ DESCANSO SAGRADO</div>
          <div class="now-title">${block.block.label}</div>
          <div class="now-desc">Igreja, família, descanso. Sem culpa.</div>
        </div>
      `;
    }

    // Buscar plano semanal customizado pra este bloco
    const dow = String(now.getDay());
    const blockIdx = findBlockIdx(block.block, dow);
    const userTrack = blockIdx !== null ? Store.getBlockTrack('default', dow, blockIdx) : null;

    const trackId = suggestTrackForBlock(block.block, phase, {
      focusTrack: focusActive ? focus.track_id : null,
      weeklyPlanTrack: userTrack
    });
    const track = tracks.find(t => t.id === trackId);

    const reasonText = userTrack
      ? '(do seu plano semanal)'
      : (focusActive && focus.track_id === trackId ? '(foco da semana)' : '');

    return `
      <div class="now-card" style="--accent:${track?.color || '#7c6dfa'}">
        <div class="now-tag">▶ AGORA</div>
        <div class="now-title">${block.block.label}</div>
        ${track ? `<div class="now-track" data-track="${track.id}">→ Sugestão: ${track.icon} ${track.name} <span class="now-reason">${reasonText}</span></div>` : ''}
        <div class="now-time">${block.block.start} → ${block.block.end} · ${block.block.duration_min}min</div>
        <button class="btn-pomo" data-pomo="${block.block.duration_min}">▶ Iniciar Pomodoro 50/10</button>
      </div>
    `;
  }

  return `
    <div class="now-card now-idle">
      <div class="now-tag">DESCANSO</div>
      <div class="now-title">Sem bloco programado agora</div>
      <div class="now-desc">${block.weekdayName} · entre blocos. Hidrata, alonga.</div>
    </div>
  `;
}

// helper pra encontrar índice do bloco no template do dia
function findBlockIdx(block, dow) {
  // o block original passado tem start/end que conferem com o template
  // não temos acesso direto ao schedule aqui, então usamos start como chave
  // o renderWeek faz o mapping via dataset, e o store usa o índice
  // pra simplificar, vamos ler o schedule via cache
  if (!window.__schedule_template) return null;
  const tpl = window.__schedule_template[dow];
  if (!tpl) return null;
  return tpl.blocks.findIndex(b => b.start === block.start && b.end === block.end);
}

function renderNextEvent(next, now) {
  const ev = next.event;
  const labelDay = next.dayOffset === 0 ? 'hoje' : next.dayOffset === 1 ? 'amanhã' : `em ${next.dayOffset} dias`;
  return `
    <div class="next-card">
      <div class="next-tag">⏭ PRÓXIMO FIXO · ${labelDay}</div>
      <div class="next-title">${ev.title}</div>
      <div class="next-time">${WEEKDAYS[next.weekday]} ${ev.start_time}</div>
    </div>
  `;
}

function renderFiapWeek(events) {
  return `
    <div class="fiap-card">
      <div class="fiap-tag">📅 EVENTOS FIAP — próximos 7 dias</div>
      ${events.map(e => `<div class="fiap-item">· ${formatDate(e.date)} ${e.time} — ${e.title}</div>`).join('')}
    </div>
  `;
}

function renderTrackTile(track) {
  const p = trackProgress(track);
  return `
    <div class="track-tile" data-track="${track.id}" style="--c:${track.color}">
      <div class="track-tile-head">
        <span class="track-icon">${track.icon}</span>
        <span class="track-name">${track.name}</span>
      </div>
      <div class="track-tile-bar"><div class="track-tile-fill" style="width:${p.pct}%"></div></div>
      <div class="track-tile-meta">${p.done}/${p.total} · ${p.pct}%</div>
    </div>
  `;
}

function countTopicsDone(tracks) {
  let n = 0;
  for (const t of tracks) {
    for (const m of t.modules) {
      for (const tp of (m.topics || [])) if (Store.isTopicDone(tp.id)) n++;
    }
  }
  return n;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function renderLangPanel(now) {
  const schedule = getSchedule();
  if (!schedule) return '';

  const { fixed_events } = schedule;
  const langTracks = ['alemao', 'ingles'];
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const todayStr = toDateStr(now);

  // segunda-feira da semana atual
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const items = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayDow = d.getDay();
    const dateStr = toDateStr(d);
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    for (const ev of fixed_events) {
      if (!langTracks.includes(ev.track)) continue;
      if (ev.weekday !== dayDow) continue;
      if (ev.until && d > new Date(ev.until + 'T23:59:59')) continue;
      items.push({ ev, d, dateStr, isToday, isPast, key: `${ev.id}:${dateStr}`, dayLabel: isToday ? 'Hoje' : DAYS[dayDow] });
    }
  }

  if (items.length === 0) return '';

  return `
    <div class="sec-label">// aulas ao vivo — semana</div>
    <div class="lang-panel">
      ${items.map(({ ev, isPast, isToday, key, dayLabel, d }) => {
        const done = Store.isLangEventDone(key);
        const stateClass = done ? 'lang-done' : isPast ? 'lang-missed' : isToday ? 'lang-today' : '';
        return `
          <div class="lang-item ${stateClass}" style="--accent:${ev.color || '#a78bfa'}">
            <div class="lang-item-main">
              <span class="lang-item-day">${dayLabel} ${d.getDate()}</span>
              <span class="lang-item-title">${ev.title}</span>
              <span class="lang-item-time">${ev.start_time}–${ev.end_time}</span>
              ${done ? '<span class="lang-badge lang-badge-done">feita</span>' : isPast ? '<span class="lang-badge lang-badge-miss">faltou</span>' : ''}
            </div>
            <button class="lang-check-btn ${done ? 'lang-checked' : ''}"
                    data-lang-key="${key}"
                    aria-label="${done ? 'Desmarcar' : 'Marcar como feita'}">
              ${done ? '✓' : '○'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
