// views/lists.js — listas de trilhas e certificações
import { Store } from '../js/store.js';
import { trackProgress, certProgress } from '../js/progress.js';

export function renderTracksList(tracks, manifest) {
  return `
    <div class="hero-small">
      <div class="hero-eye">TRILHAS DE CONTEÚDO</div>
      <div class="hero-title-sm">${tracks.length} trilhas · do shell ao Kubestronaut</div>
    </div>
    <div class="section">
      ${(manifest.groups || []).map(g => `
        <div class="group">
          <div class="group-name" style="--c:${g.color}">${g.name}</div>
          <div class="track-grid">
            ${g.tracks.map(tid => {
              const t = tracks.find(x => x.id === tid);
              return t ? renderTrackCard(t) : '';
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTrackCard(track) {
  const p = trackProgress(track);
  return `
    <div class="track-card" data-track="${track.id}" style="--c:${track.color}">
      <div class="track-card-head">
        <span class="track-card-icon">${track.icon}</span>
        <span class="track-card-name">${track.name}</span>
      </div>
      <div class="track-card-tagline">${track.tagline || ''}</div>
      <div class="track-card-bar"><div class="track-card-fill" style="width:${p.pct}%"></div></div>
      <div class="track-card-meta">
        <span>${p.pct}% · ${track.modules.length} módulos</span>
        <span>${track.estimated_hours}h</span>
      </div>
    </div>
  `;
}

export function renderCertsList(certs, allTracks) {
  // group certs por target_phase
  const groups = {
    fase1: [], fase2: [], fase3: [], fase4: [], fase5: [], 'post-2026': [], '2026': []
  };
  for (const c of certs.certs) {
    const k = c.target_phase || 'post-2026';
    if (!groups[k]) groups[k] = [];
    groups[k].push(c);
  }

  const phaseLabels = {
    fase1: '⚡ Fase 1 — Arrancada (Mai 2026)',
    fase2: '🧱 Fase 2 — Base Programador (Jun-Jul 2026)',
    fase3: '☁️ Fase 3 — Cloud + Java (Ago-Set 2026)',
    fase4: '🐍 Fase 4 — Java + Portfolio (Out-Nov 2026)',
    fase5: '🎄 Fase 5 — Go + Encerramento (Dez 2026)',
    '2026': '🎯 2026 — em paralelo',
    'post-2026': '🚀 Pós-2026 / Astronaut'
  };

  return `
    <div class="hero-small">
      <div class="hero-eye">CERTIFICAÇÕES</div>
      <div class="hero-title-sm">${certs.certs.length} certs · cada uma puxa de várias trilhas</div>
    </div>
    <div class="section">
      ${Object.entries(groups).filter(([k, v]) => v.length > 0).map(([k, v]) => `
        <div class="cert-group">
          <div class="cert-group-name">${phaseLabels[k] || k}</div>
          ${v.map(c => renderCertCard(c, allTracks)).join('')}
        </div>
      `).join('')}

      <div class="kubestronaut-block">
        <div class="ks-title">🚀 ${certs.kubestronaut_path.name}</div>
        <div class="ks-desc">${certs.kubestronaut_path.description}</div>
        <div class="ks-steps">
          ${certs.kubestronaut_path.steps.map((sid, i) => {
            const c = certs.certs.find(x => x.id === sid);
            const done = Store.isCertDone(sid);
            return `<div class="ks-step ${done ? 'done' : ''}">${String(i + 1).padStart(2, '0')} · ${c?.name || sid}</div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCertCard(cert, allTracks) {
  const p = certProgress(cert, allTracks);
  const taken = p.done;
  return `
    <div class="cert-card ${taken ? 'taken' : ''} ${cert.is_top ? 'top' : ''}" data-cert="${cert.id}" style="--c:${cert.color || '#7c6dfa'}">
      <div class="cert-head">
        <span class="cert-icon">${cert.icon || '🏆'}</span>
        <div class="cert-title-block">
          <div class="cert-name">${cert.name} ${cert.is_main_goal ? '🔥' : ''}</div>
          <div class="cert-code">${cert.code || ''}</div>
        </div>
        <button class="cert-toggle ${taken ? 'on' : ''}" data-toggle-cert="${cert.id}">${taken ? '✓' : '○'}</button>
      </div>
      <div class="cert-bar"><div class="cert-fill" style="width:${p.ready_pct}%"></div></div>
      <div class="cert-meta">
        <span>preparação: ${p.ready_pct}%</span>
        <span>${cert.estimated_prep_hours || '?'}h</span>
        ${cert.exam_cost_usd ? `<span>$${cert.exam_cost_usd}</span>` : ''}
      </div>
      ${cert.requires_modules?.length ? `
        <div class="cert-mods">
          <strong>requer:</strong> ${cert.requires_modules.map(m => `<span class="mod-chip">${m}</span>`).join(' ')}
        </div>
      ` : ''}
      ${cert.requires_certs?.length ? `
        <div class="cert-prereq"><strong>pré-req cert:</strong> ${cert.requires_certs.join(', ')}</div>
      ` : ''}
      ${cert.notes ? `<div class="cert-notes">${cert.notes}</div>` : ''}
    </div>
  `;
}
