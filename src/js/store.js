// store.js — localStorage + sincronização com Upstash Redis
const STORE_VERSION = 4;
const STORE_KEY = 'cesar-roadmap-v4';

const defaultState = {
  version: STORE_VERSION,
  topics: {},
  exercises: {},
  checkpoints: {},
  certs: {},
  pomodoro_sessions: [],
  gym: {},
  weekly_plan: {},
  weekly_completion: {},
  lang_events: {},
  focus: { track_id: null, until: null, mode: 'priority' },
  settings: {
    notifications_enabled: false,
    last_seen: null
  }
};

let state = { ...defaultState };

async function saveToCloud(currentState) {
  try {
    await fetch('/api/planner', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: 'weekly',
        data: currentState,
      }),
    });
  } catch (e) {
    console.warn('Cloud save failed:', e);
  }
}

async function loadFromCloud() {
  try {
    const res = await fetch('/api/planner?scope=weekly');

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.warn('Cloud load failed:', e);
    return null;
  }
}

async function loadState() {
  try {
    const cloud = await loadFromCloud();

    if (cloud) {
      state = { ...defaultState, ...cloud };
      return;
    }

    const raw = localStorage.getItem(STORE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed.version === STORE_VERSION) {
        state = { ...defaultState, ...parsed };
        return;
      }

      state = migrateState(parsed);
      return;
    }

    state = migrateLegacy();
  } catch (e) {
    console.warn('Store load failed, using default:', e);
    state = { ...defaultState };
  }
}

function migrateLegacy() {
  const merged = { ...defaultState };

  try {
    const oldChecks = JSON.parse(localStorage.getItem('cesar-checks-2025') || '{}');
    const oldTopics = JSON.parse(localStorage.getItem('cesar-topics-2025') || '{}');
    const oldCerts = JSON.parse(localStorage.getItem('cesar-certs-2025') || '{}');

    merged.topics = { ...oldChecks, ...oldTopics };
    merged.certs = oldCerts;
  } catch (e) {}

  return merged;
}

function migrateState(old) {
  return { ...defaultState, ...old, version: STORE_VERSION };
}

function save() {
  try {
    state.settings.last_seen = new Date().toISOString();

    // backup local
    localStorage.setItem(STORE_KEY, JSON.stringify(state));

    // sync cloud
    saveToCloud(state);
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

await loadState();

export const Store = {
  // topics
  isTopicDone: (id) => !!state.topics[id],
  toggleTopic(id) {
    state.topics[id] = !state.topics[id];
    save();
    return state.topics[id];
  },

  // exercises
  isExerciseDone: (id) => !!state.exercises[id],
  toggleExercise(id) {
    state.exercises[id] = !state.exercises[id];
    save();
    return state.exercises[id];
  },

  // checkpoints
  isCheckpointDone: (id) => !!state.checkpoints[id],
  toggleCheckpoint(id) {
    state.checkpoints[id] = !state.checkpoints[id];
    save();
    return state.checkpoints[id];
  },

  // certs
  isCertDone: (id) => !!state.certs[id],
  toggleCert(id) {
    state.certs[id] = !state.certs[id];
    save();
    return state.certs[id];
  },

  // pomodoro log
  logPomodoro(session) {
    state.pomodoro_sessions.push({ ...session, ts: Date.now() });

    if (state.pomodoro_sessions.length > 1000) {
      state.pomodoro_sessions.shift();
    }

    save();
  },

  getPomodoroSessions: () => state.pomodoro_sessions.slice(),

  // gym
  setGymDay(weekKey, day, done) {
    state.gym[weekKey] = state.gym[weekKey] || {};
    state.gym[weekKey][day] = done;
    save();
  },

  getGymWeek: (weekKey) => state.gym[weekKey] || {},

  // foco da semana
  getFocus: () => ({ ...state.focus }),

  setFocus(trackId, until = null, mode = 'priority') {
    state.focus = { track_id: trackId, until, mode };
    save();
  },

  clearFocus() {
    state.focus = { track_id: null, until: null, mode: 'priority' };
    save();
  },

  isFocusActive() {
    if (!state.focus.track_id) return false;
    if (!state.focus.until) return true;

    return new Date(state.focus.until) > new Date();
  },

  // plano semanal
  getWeeklyPlan(weekKey = 'default') {
    return state.weekly_plan[weekKey] || {};
  },

  setBlockTrack(weekKey, weekday, blockIdx, trackId) {
    state.weekly_plan[weekKey] = state.weekly_plan[weekKey] || {};

    const key = `${weekday}:${blockIdx}`;

    if (trackId === null || trackId === '') {
      delete state.weekly_plan[weekKey][key];
    } else {
      state.weekly_plan[weekKey][key] = trackId;
    }

    save();
  },

  getBlockTrack(weekKey, weekday, blockIdx) {
    const plan = state.weekly_plan[weekKey] || state.weekly_plan.default || {};
    return plan[`${weekday}:${blockIdx}`] || null;
  },

  clearWeeklyPlan(weekKey = 'default') {
    delete state.weekly_plan[weekKey];
    save();
  },

  // marcação de bloco completo
  isBlockDone(dateStr, weekday, blockIdx) {
    const key = `${dateStr}:${weekday}:${blockIdx}`;
    return !!state.weekly_completion[key];
  },

  toggleBlockDone(dateStr, weekday, blockIdx) {
    const key = `${dateStr}:${weekday}:${blockIdx}`;
    state.weekly_completion[key] = !state.weekly_completion[key];
    save();

    return state.weekly_completion[key];
  },

  // frequência de aulas de idiomas
  isLangEventDone: (key) => !!state.lang_events[key],

  toggleLangEvent(key) {
    state.lang_events[key] = !state.lang_events[key];
    save();

    return state.lang_events[key];
  },

  // settings
  getSetting: (k) => state.settings[k],

  setSetting(k, v) {
    state.settings[k] = v;
    save();
  },

  // export / import
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  },

  async importFromFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed.version) {
      throw new Error('Arquivo inválido');
    }

    state = parsed.version === STORE_VERSION ? parsed : migrateState(parsed);

    save();
    location.reload();
  },

  reset() {
    if (!confirm('Apagar todo o progresso? Faça export antes!')) return;

    state = { ...defaultState };

    save();
    location.reload();
  }
};

export function getRawState() {
  return state;
}