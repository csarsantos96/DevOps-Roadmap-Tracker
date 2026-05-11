// progress.js — calcula % de cada trilha e cert
import { Store } from './store.js';

export function moduleProgress(module) {
  const total = (module.topics?.length || 0) + (module.exercises?.length || 0) + (module.checkpoint ? 1 : 0);
  if (total === 0) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  for (const t of (module.topics || [])) if (Store.isTopicDone(t.id)) done++;
  for (const e of (module.exercises || [])) if (Store.isExerciseDone(e.id)) done++;
  if (module.checkpoint && Store.isCheckpointDone(module.id + ':checkpoint')) done++;
  return { done, total, pct: Math.round(done / total * 100) };
}

export function trackProgress(track) {
  let done = 0, total = 0;
  for (const m of track.modules) {
    const p = moduleProgress(m);
    done += p.done;
    total += p.total;
  }
  return { done, total, pct: total === 0 ? 0 : Math.round(done / total * 100) };
}

export function moduleIsDone(module) {
  return moduleProgress(module).pct === 100;
}

// progresso de cert: % é a média de progresso dos módulos requeridos
export function certProgress(cert, allTracks) {
  if (!cert.requires_modules || cert.requires_modules.length === 0) {
    return { ready_pct: 0, done: Store.isCertDone(cert.id) };
  }

  let total = 0, done = 0;
  for (const moduleRef of cert.requires_modules) {
    // moduleRef pode ser "docker.1", "k8s.5", "system-design.2", etc.
    // O trackId é tudo antes do ÚLTIMO ponto (na verdade do primeiro, mas IDs não têm ponto extra)
    // Mais robusto: encontra a track cujo módulo tenha esse id exato
    let track = null, module = null;
    for (const t of allTracks) {
      const m = (t.modules || []).find(m => m.id === moduleRef);
      if (m) { track = t; module = m; break; }
    }
    if (!module) continue;
    const p = moduleProgress(module);
    total += p.total;
    done += p.done;
  }
  return {
    ready_pct: total === 0 ? 0 : Math.round(done / total * 100),
    done: Store.isCertDone(cert.id)
  };
}

export function todayStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  const days = new Set();
  for (const s of sessions) {
    const d = new Date(s.ts).toISOString().slice(0, 10);
    days.add(d);
  }
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }
  return streak;
}
