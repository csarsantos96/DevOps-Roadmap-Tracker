// schedule.js — motor que sabe o que está acontecendo agora
import { loadJSON } from './data.js';

let schedule = null;
let phasesIndex = null;

export async function initSchedule() {
  schedule = await loadJSON('./src/data/schedule.json');
  phasesIndex = schedule.phases;
  return schedule;
}

export function getSchedule() { return schedule; }

// retorna a fase ativa baseada na data atual
export function getCurrentPhase(now = new Date()) {
  if (!phasesIndex) return null;
  for (const p of phasesIndex) {
    const start = new Date(p.start + 'T00:00:00');
    const end = new Date(p.end + 'T23:59:59');
    if (now >= start && now <= end) return { ...p, status: 'active' };
  }
  // próxima futura (compare datas, não strings)
  const future = phasesIndex.find(p => new Date(p.start + 'T00:00:00') > now);
  if (future) return { ...future, status: 'upcoming' };
  // todas terminaram — retorna a última como concluída
  const last = phasesIndex[phasesIndex.length - 1];
  return last ? { ...last, status: 'done' } : null;
}

export function phaseStatus(phase, now = new Date()) {
  const start = new Date(phase.start + 'T00:00:00');
  const end = new Date(phase.end + 'T23:59:59');
  if (now < start) return 'upcoming';
  if (now > end) return 'done';
  return 'active';
}

// retorna o bloco "de agora" considerando dia da semana e horário
export function getCurrentBlock(now = new Date()) {
  if (!schedule) return null;
  const dow = now.getDay(); // 0..6
  const tpl = schedule.weekday_template[String(dow)];
  if (!tpl) return null;

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // primeiro: eventos fixos de hoje (têm prioridade absoluta)
  const fixedToday = schedule.fixed_events.filter(ev => {
    if (ev.weekday !== undefined && ev.weekday !== dow) return false;
    if (ev.weekdays && !ev.weekdays.includes(dow)) return false;
    if (ev.until && now > new Date(ev.until + 'T23:59:59')) return false;
    return true;
  });

  for (const ev of fixedToday) {
    const [sh, sm] = ev.start_time.split(':').map(Number);
    const [eh, em] = ev.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (minutesNow >= startMin && minutesNow < endMin) {
      return { type: 'fixed', event: ev, weekday: dow };
    }
  }

  // depois: blocos do template
  for (const block of tpl.blocks) {
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (minutesNow >= startMin && minutesNow < endMin) {
      return { type: 'block', block, weekday: dow, weekdayName: tpl.name };
    }
  }

  return { type: 'idle', weekday: dow, weekdayName: tpl.name };
}

// próximo evento fixo (hoje ou nos próximos dias)
export function getNextFixedEvent(now = new Date(), maxDaysAhead = 7) {
  if (!schedule) return null;
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  for (let dayOffset = 0; dayOffset <= maxDaysAhead; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dow = d.getDay();

    const candidates = schedule.fixed_events.filter(ev => {
      if (ev.weekday !== undefined && ev.weekday !== dow) return false;
      if (ev.weekdays && !ev.weekdays.includes(dow)) return false;
      if (ev.until && d > new Date(ev.until + 'T23:59:59')) return false;
      return true;
    });

    for (const ev of candidates) {
      const [sh, sm] = ev.start_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      if (dayOffset === 0 && startMin <= minutesNow) continue;
      return { event: ev, dayOffset, weekday: dow, date: d };
    }
  }
  return null;
}

// trilha sugerida pra um bloco genérico, baseada na fase
// hint priority: track_id explícito > plano semanal > foco da semana > hint da fase
export function suggestTrackForBlock(block, currentPhase, opts = {}) {
  // 1. trilha fixa do template (alemão, inglês)
  if (block.track_id) return block.track_id;

  // 2. plano semanal personalizado (configurado pelo user na tela "Minha Semana")
  if (opts.weeklyPlanTrack) return opts.weeklyPlanTrack;

  // 3. eventos especiais de PICK (sábado)
  if (block.track_hint === 'pick_live' || block.track_hint === 'pick_recovery') {
    return 'kubernetes';
  }

  if (!currentPhase) return null;

  const weights = currentPhase.weight_per_track || {};
  const tracks = currentPhase.primary_tracks || [];
  const morning = currentPhase.morning_focus || [];
  const afternoon = currentPhase.afternoon_focus || [];
  if (tracks.length === 0) return null;

  const pickByWeight = (candidates) => {
    let best = null, bestWeight = -1;
    for (const t of candidates) {
      const w = weights[t] ?? 0;
      if (w > bestWeight) { best = t; bestWeight = w; }
    }
    return best;
  };

  // 4. foco da semana — se ativo e a trilha está na fase, prioriza ela
  if (opts.focusTrack && tracks.includes(opts.focusTrack)) {
    // foco força essa trilha em qualquer bloco genérico (manhã, tarde, lab)
    if (['morning_primary', 'afternoon_primary', 'afternoon_secondary',
         'primary', 'secondary', 'lab'].includes(block.track_hint)) {
      return opts.focusTrack;
    }
  }

  // 5. hints normais
  if (block.track_hint === 'morning_primary' && morning.length > 0) {
    return pickByWeight(morning) || morning[0];
  }
  if (block.track_hint === 'afternoon_primary' && afternoon.length > 0) {
    return pickByWeight(afternoon) || afternoon[0];
  }
  if (block.track_hint === 'afternoon_secondary' && afternoon.length > 1) {
    const sorted = [...afternoon].sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
    return sorted[1] || sorted[0];
  }
  if (block.track_hint === 'review') return tracks[0];
  if (block.track_hint === 'lab') {
    const prefer = ['docker', 'kubernetes', 'eda', 'c', 'python', 'java', 'go', 'aws', 'gcp'];
    return prefer.find(t => tracks.includes(t)) || tracks[0];
  }
  if (block.track_hint === 'primary') return pickByWeight(tracks) || tracks[0];
  if (block.track_hint === 'secondary') {
    const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    return sorted[1]?.[0] || tracks[1] || tracks[0];
  }
  return null;
}

// eventos FIAP do mês
export function getFiapEventsThisWeek(now = new Date()) {
  if (!schedule || !schedule.fiap_events) return [];
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return schedule.fiap_events.filter(ev => {
    const d = new Date(ev.date + 'T' + ev.time);
    return d >= now && d <= end;
  });
}

// dias até deadline da fase atual
export function daysToDeadline(phase, now = new Date()) {
  const end = new Date(phase.end + 'T23:59:59');
  const ms = end - now;
  return Math.ceil(ms / 86400000);
}
