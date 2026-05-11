// views/track.js — detalhe profundo de uma trilha
import { Store } from '../js/store.js';
import { trackProgress, moduleProgress } from '../js/progress.js';

export function renderTrack(track, ctx) {
  const tp = trackProgress(track);
  return `
    <div class="track-hero" style="--c:${track.color}">
      <button class="back-btn" onclick="history.back()">← voltar</button>
      <div class="track-hero-icon">${track.icon}</div>
      <h1 class="track-hero-title">${track.name}</h1>
      <div class="track-hero-tagline">${track.tagline || ''}</div>
      <div class="track-hero-stats">
        <span>📊 ${tp.pct}% · ${tp.done}/${tp.total}</span>
        <span>⏱ ${track.estimated_hours}h estimadas</span>
        <span>🎯 ${(track.feeds_certs || []).length} certs ligadas</span>
      </div>
      <div class="track-bar"><div class="track-fill" style="width:${tp.pct}%"></div></div>
    </div>

    <div class="section">
      ${track.source_courses?.length ? `
        <div class="track-meta">
          <strong>Fontes:</strong> ${track.source_courses.join(' · ')}
        </div>` : ''}

      ${(track.modules || []).map((m, i) => renderModule(m, i + 1)).join('')}

      ${(track.projects || []).length > 0 ? `
        <div class="sec-label">// projetos portfólio</div>
        ${track.projects.map(p => renderProject(p)).join('')}
      ` : ''}
    </div>
  `;
}

function renderModule(module, num) {
  const p = moduleProgress(module);
  const collapsed = p.pct === 100 ? '' : 'expanded';
  return `
    <div class="module ${collapsed}" data-module="${module.id}">
      <div class="module-head" data-toggle-module="${module.id}">
        <div class="module-num">M${String(num).padStart(2, '0')}</div>
        <div class="module-title-block">
          <div class="module-name">${module.name}</div>
          ${module.source ? `<div class="module-source">${module.source}</div>` : ''}
        </div>
        <div class="module-pct">${p.pct}%</div>
      </div>
      <div class="module-bar"><div class="module-fill" style="width:${p.pct}%"></div></div>

      <div class="module-body">
        ${(module.topics || []).length ? `
          <div class="sub-label">tópicos · ${module.estimated_minutes}min total</div>
          ${module.topics.map(t => renderTopic(t)).join('')}
        ` : ''}

        ${(module.exercises || []).length ? `
          <div class="sub-label">exercícios</div>
          ${module.exercises.map(e => renderExercise(e)).join('')}
        ` : ''}

        ${module.checkpoint ? `
          <div class="sub-label">checkpoint</div>
          ${renderCheckpoint(module)}
        ` : ''}
      </div>
    </div>
  `;
}

function renderTopic(topic) {
  const done = Store.isTopicDone(topic.id);
  return `
    <div class="check-item ${done ? 'done' : ''}" data-topic="${topic.id}">
      <span class="check-box"></span>
      <span class="check-label">${topic.name}</span>
      <span class="check-meta">${topic.minutes}min</span>
    </div>
  `;
}

function renderExercise(ex) {
  const done = Store.isExerciseDone(ex.id);
  const typeIcon = { lab: '🧪', drill: '🎯', leetcode: '💻', shell: '⌨️', design: '📐', input: '👂', output: '🗣' }[ex.type] || '📝';
  return `
    <div class="check-item ex ${done ? 'done' : ''}" data-exercise="${ex.id}">
      <span class="check-box"></span>
      <span class="check-icon">${typeIcon}</span>
      <span class="check-label">${ex.name}</span>
    </div>
  `;
}

function renderCheckpoint(module) {
  const id = module.id + ':checkpoint';
  const done = Store.isCheckpointDone(id);
  return `
    <div class="check-item cp ${done ? 'done' : ''}" data-checkpoint="${id}">
      <span class="check-box cp-box">★</span>
      <span class="check-label">${module.checkpoint}</span>
    </div>
  `;
}

function renderProject(p) {
  return `
    <div class="project-card">
      <div class="project-head">
        <span class="project-name">${p.name}</span>
        <span class="project-level">${p.level || ''}</span>
      </div>
      <div class="project-tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="project-desc">${p.description}</div>
      ${p.deliverables ? `
        <ul class="project-deliv">
          ${p.deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}
