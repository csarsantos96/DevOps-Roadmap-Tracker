// app.js — entry point + router por hash + event delegation
import { initSchedule } from './schedule.js';
import { loadAllTracks, loadCerts } from './data.js';
import { Store } from './store.js';
import { renderHome } from '../views/home.js';
import { renderTrack } from '../views/track.js';
import { renderTracksList, renderCertsList } from '../views/lists.js';
import { renderWeek, attachWeekHandlers } from '../views/week.js';
import { initPomodoro } from './pomodoro.js';
import { initNotifications } from './notifications.js';

const app = document.getElementById('app');
const ctx = { tracks: [], manifest: null, certs: null };

async function boot() {
  await initSchedule();
  // Cachear template e eventos pra acesso em home.js
  const sched = (await import('./schedule.js')).getSchedule();
  window.__schedule_template = sched.weekday_template;
  window.__schedule_fiap_events = sched.fiap_events;

  const { manifest, tracks } = await loadAllTracks();
  ctx.tracks = tracks;
  ctx.manifest = manifest;
  ctx.certs = await loadCerts();

  // Foco inicial em Docker se for primeira execução
  // (usuário pediu Docker como prioridade até terminar)
  if (!Store.getFocus().track_id && !Store.getSetting('focus_initialized')) {
    // Foco em Docker até 31 de maio (4 semanas)
    Store.setFocus('docker', '2026-05-31T23:59:59');
    Store.setSetting('focus_initialized', true);
  }

  initPomodoro();
  initNotifications();
  attachEventDelegation();
  renderRoute();
  window.addEventListener('hashchange', renderRoute);

  // re-render every minute to update "now block"
  setInterval(() => {
    if (currentRoute() === 'home') renderRoute();
  }, 60000);

  // PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }
}

function currentRoute() {
  const h = location.hash.slice(1);
  if (!h || h === 'home') return 'home';
  if (h === 'week') return 'week';
  if (h === 'tracks') return 'tracks';
  if (h === 'certs') return 'certs';
  if (h.startsWith('track/')) return 'track-detail';
  return 'home';
}

function renderRoute() {
  const route = currentRoute();
  setActiveTab(route);

  if (route === 'home') {
    app.innerHTML = renderHome(ctx);
  } else if (route === 'week') {
    app.innerHTML = renderWeek(ctx);
    attachWeekHandlers(renderRoute);
  } else if (route === 'tracks') {
    app.innerHTML = renderTracksList(ctx.tracks, ctx.manifest);
  } else if (route === 'certs') {
    app.innerHTML = renderCertsList(ctx.certs, ctx.tracks);
  } else if (route === 'track-detail') {
    const id = location.hash.slice(1).replace('track/', '');
    const t = ctx.tracks.find(x => x.id === id);
    if (t) app.innerHTML = renderTrack(t, ctx);
    else { location.hash = 'tracks'; }
  }

  app.scrollTop = 0;
  window.scrollTo(0, 0);
}

function setActiveTab(route) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.route === route ||
      (route === 'track-detail' && t.dataset.route === 'tracks'));
  });
}

function attachEventDelegation() {
  app.addEventListener('click', (e) => {
    // navegar pra trilha
    const tile = e.target.closest('[data-track]');
    if (tile && !e.target.closest('[data-topic],[data-exercise],[data-checkpoint],[data-toggle-cert]')) {
      location.hash = 'track/' + tile.dataset.track;
      return;
    }

    // toggle topic
    const topic = e.target.closest('[data-topic]');
    if (topic) {
      const done = Store.toggleTopic(topic.dataset.topic);
      topic.classList.toggle('done', done);
      updateTrackHeader();
      return;
    }

    // toggle exercise
    const ex = e.target.closest('[data-exercise]');
    if (ex) {
      const done = Store.toggleExercise(ex.dataset.exercise);
      ex.classList.toggle('done', done);
      updateTrackHeader();
      return;
    }

    // toggle checkpoint
    const cp = e.target.closest('[data-checkpoint]');
    if (cp) {
      const done = Store.toggleCheckpoint(cp.dataset.checkpoint);
      cp.classList.toggle('done', done);
      updateTrackHeader();
      return;
    }

    // toggle cert
    const certBtn = e.target.closest('[data-toggle-cert]');
    if (certBtn) {
      e.stopPropagation();
      const id = certBtn.dataset.toggleCert;
      const done = Store.toggleCert(id);
      certBtn.classList.toggle('on', done);
      certBtn.textContent = done ? '✓' : '○';
      certBtn.closest('.cert-card')?.classList.toggle('taken', done);
      return;
    }

    // toggle module collapse
    const modHead = e.target.closest('[data-toggle-module]');
    if (modHead) {
      const mod = modHead.closest('.module');
      mod?.classList.toggle('expanded');
      return;
    }
  });
}

function updateTrackHeader() {
  // re-renderiza apenas headers e barras sem trocar a view inteira
  const route = currentRoute();
  if (route === 'track-detail') {
    // simples: re-render
    renderRoute();
  } else if (route === 'home') {
    renderRoute();
  }
}

// expor no window para botões inline
window.App = {
  exportData: () => Store.export(),
  importData: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { await Store.importFromFile(f); }
      catch (err) { alert('Falha ao importar: ' + err.message); }
    };
    input.click();
  },
  reset: () => Store.reset()
};

boot().catch(err => {
  console.error(err);
  app.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444">Falha ao carregar: ${err.message}</div>`;
});
