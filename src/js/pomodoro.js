// pomodoro.js — timer 50/10 com log no store
import { Store } from './store.js';

let timer = null;
let endsAt = null;
let mode = 'idle'; // idle | focus | break
let currentTrack = null;

export function initPomodoro() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pomo]');
    if (!btn) return;
    const minutes = parseInt(btn.dataset.pomo, 10) || 50;
    startPomodoro(Math.min(50, minutes));
  });
}

function startPomodoro(minutes) {
  if (mode !== 'idle') {
    if (!confirm('Pomodoro em andamento. Resetar?')) return;
    stop();
  }
  mode = 'focus';
  endsAt = Date.now() + minutes * 60_000;
  showOverlay(minutes);
  tick();
}

function tick() {
  clearTimeout(timer);
  const remain = Math.max(0, endsAt - Date.now());
  updateOverlay(remain);
  if (remain <= 0) {
    finishCurrentMode();
    return;
  }
  timer = setTimeout(tick, 1000);
}

function finishCurrentMode() {
  if (mode === 'focus') {
    Store.logPomodoro({ minutes: 50, type: 'focus', track: currentTrack });
    notify('🎯 Foco concluído! Pausa de 10min.');
    mode = 'break';
    endsAt = Date.now() + 10 * 60_000;
    tick();
  } else {
    notify('⚡ Pausa concluída. Próximo ciclo!');
    stop();
  }
}

function stop() {
  clearTimeout(timer);
  mode = 'idle';
  endsAt = null;
  hideOverlay();
}

function showOverlay(minutes) {
  let el = document.getElementById('pomo-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pomo-overlay';
    el.innerHTML = `
      <div class="pomo-card">
        <div class="pomo-mode">FOCO</div>
        <div class="pomo-time">--:--</div>
        <div class="pomo-actions">
          <button id="pomo-stop">parar</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#pomo-stop').onclick = stop;
  }
  el.style.display = 'flex';
}

function updateOverlay(remainMs) {
  const el = document.getElementById('pomo-overlay');
  if (!el) return;
  const m = Math.floor(remainMs / 60_000);
  const s = Math.floor((remainMs % 60_000) / 1000);
  el.querySelector('.pomo-time').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  el.querySelector('.pomo-mode').textContent = mode === 'focus' ? 'FOCO' : 'PAUSA';
}

function hideOverlay() {
  const el = document.getElementById('pomo-overlay');
  if (el) el.style.display = 'none';
}

function notify(text) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Roadmap', { body: text });
  }
}
