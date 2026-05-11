// week.js — planejador semanal editável
import { Store } from '../js/store.js';
import { getSchedule, getCurrentPhase, suggestTrackForBlock } from '../js/schedule.js';

export function renderWeek(ctx) {
  const { tracks } = ctx;
  const schedule = getSchedule();
  const phase = getCurrentPhase();
  const focus = Store.getFocus();
  const focusActive = Store.isFocusActive();

  const tpl = schedule.weekday_template;
  const weekdayOrder = ['1', '2', '3', '4', '5', '6', '0']; // seg → dom
  const weekdayNames = {
    '1': 'Segunda', '2': 'Terça', '3': 'Quarta', '4': 'Quinta',
    '5': 'Sexta', '6': 'Sábado', '0': 'Domingo'
  };

  return `
    <section class="week-view">
      <h1 class="page-title">📅 Minha Semana</h1>
      <p class="page-sub">Defina o que estudar em cada bloco. O app vai sugerir baseado na sua escolha.</p>

      ${renderFocusCard(focus, focusActive, tracks, phase)}

      <div class="week-grid">
        ${weekdayOrder.map(dow => renderDayCard(dow, weekdayNames[dow], tpl[dow], tracks, phase, focus, focusActive)).join('')}
      </div>

      <div class="week-actions">
        <button class="btn-secondary" id="reset-week">🔄 Resetar para sugestões automáticas</button>
      </div>
    </section>
  `;
}

function renderFocusCard(focus, focusActive, tracks, phase) {
  const focusTrack = focus.track_id ? tracks.find(t => t.id === focus.track_id) : null;

  if (focusActive && focusTrack) {
    return `
      <div class="focus-card focus-active" style="--accent:${focusTrack.color}">
        <div class="focus-tag">🎯 FOCO DA SEMANA</div>
        <div class="focus-title">${focusTrack.icon} ${focusTrack.name}</div>
        <div class="focus-desc">Esta trilha terá prioridade nos blocos genéricos manhã/tarde.</div>
        <div class="focus-actions">
          <button class="btn-link" id="change-focus">Trocar foco</button>
          <button class="btn-link btn-link-danger" id="clear-focus">Remover foco</button>
        </div>
      </div>
    `;
  }

  // sem foco — mostrar selector
  const phaseTracks = (phase?.primary_tracks || []).map(id => tracks.find(t => t.id === id)).filter(Boolean);
  return `
    <div class="focus-card focus-empty">
      <div class="focus-tag">🎯 DEFINIR FOCO</div>
      <div class="focus-title">Quer focar em uma trilha esta semana?</div>
      <div class="focus-desc">Selecione e ela será priorizada em todos os blocos genéricos.</div>
      <select id="focus-selector" class="focus-select">
        <option value="">— Sem foco específico —</option>
        ${phaseTracks.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderDayCard(dow, name, day, tracks, phase, focus, focusActive) {
  if (!day) return '';
  const focusTrack = focusActive ? focus.track_id : null;

  if (day.type === 'sacred') {
    return `
      <div class="day-card day-sacred">
        <div class="day-header"><h3>${name}</h3><span class="day-tag">🕊️ Sagrado</span></div>
        <div class="day-rest">Descanso, igreja e família. Sem culpa.</div>
      </div>
    `;
  }

  return `
    <div class="day-card">
      <div class="day-header">
        <h3>${name}</h3>
        ${day.type === 'light' ? '<span class="day-tag">💆 Leve</span>' : ''}
        ${day.type === 'saturday' ? '<span class="day-tag">📚 PICK</span>' : ''}
      </div>
      <div class="day-blocks">
        ${day.blocks.map((block, idx) => renderBlockEditor(dow, idx, block, tracks, phase, focusTrack)).join('')}
      </div>
    </div>
  `;
}

function renderBlockEditor(dow, blockIdx, block, tracks, phase, focusTrack) {
  // suggestion atual
  const userTrack = Store.getBlockTrack('default', dow, blockIdx);
  const suggestedId = suggestTrackForBlock(block, phase, {
    weeklyPlanTrack: userTrack,
    focusTrack
  });
  const track = suggestedId ? tracks.find(t => t.id === suggestedId) : null;

  // bloco fixo (alemão/inglês) — não editável
  if (block.track_id || block.track_hint === 'rest') {
    return `
      <div class="block-row block-fixed" style="--accent:${track?.color || '#666'}">
        <div class="block-time">${block.start} <span class="block-arrow">→</span> ${block.end}</div>
        <div class="block-info">
          <div class="block-label">${block.label}</div>
          ${track ? `<div class="block-track-fixed">${track.icon} ${track.name} <span class="badge-fixed">FIXO</span></div>` : ''}
        </div>
      </div>
    `;
  }

  // bloco genérico — editável
  const phaseTracks = (phase?.primary_tracks || []).map(id => tracks.find(t => t.id === id)).filter(Boolean);

  return `
    <div class="block-row" style="--accent:${track?.color || '#7c6dfa'}">
      <div class="block-time">${block.start} <span class="block-arrow">→</span> ${block.end}</div>
      <div class="block-info">
        <div class="block-label">${block.label}</div>
        <select class="block-select" data-dow="${dow}" data-block="${blockIdx}">
          <option value="">— sugestão automática —</option>
          ${phaseTracks.map(t => `
            <option value="${t.id}" ${userTrack === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>
          `).join('')}
        </select>
        ${track ? `<div class="block-suggestion">→ ${track.icon} ${track.name}${userTrack ? '' : ' (auto)'}</div>` : ''}
      </div>
    </div>
  `;
}

// hookup interatividade depois do render
export function attachWeekHandlers(rerender) {
  // selectors de bloco
  document.querySelectorAll('.block-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const dow = e.target.dataset.dow;
      const blockIdx = parseInt(e.target.dataset.block, 10);
      const trackId = e.target.value || null;
      Store.setBlockTrack('default', dow, blockIdx, trackId);
      rerender();
    });
  });

  // foco selector
  const focusSel = document.getElementById('focus-selector');
  if (focusSel) {
    focusSel.addEventListener('change', (e) => {
      if (e.target.value) {
        // foco até o fim da semana atual (próximo domingo)
        const now = new Date();
        const dow = now.getDay();
        const daysUntilSunday = (7 - dow) % 7 || 7;
        const sunday = new Date(now);
        sunday.setDate(now.getDate() + daysUntilSunday);
        sunday.setHours(23, 59, 59);
        Store.setFocus(e.target.value, sunday.toISOString());
        rerender();
      }
    });
  }

  // limpar foco
  const clearBtn = document.getElementById('clear-focus');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      Store.clearFocus();
      rerender();
    });
  }

  // trocar foco — abre selector novamente
  const changeBtn = document.getElementById('change-focus');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      Store.clearFocus();
      rerender();
    });
  }

  // reset semana
  const resetBtn = document.getElementById('reset-week');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Resetar todas as escolhas da semana? Voltará pras sugestões automáticas.')) {
        Store.clearWeeklyPlan('default');
        rerender();
      }
    });
  }
}
