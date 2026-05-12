// src/js/planner-cloud.js

export async function savePlannerDay(dateKey, data) {
  try {
    const res = await fetch('/api/planner', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        date: dateKey,
        data,
      }),
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn('[planner-cloud] Falha ao salvar:', error);
    return null;
  }
}

export async function loadPlannerDay(dateKey) {
  try {
    const res = await fetch(`/api/planner?date=${dateKey}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn('[planner-cloud] Falha ao carregar dia:', error);
    return null;
  }
}

export async function loadPlannerDates() {
  try {
    const res = await fetch('/api/planner', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }

    const json = await res.json();

    if (Array.isArray(json.dates)) {
      return json.dates;
    }

    if (Array.isArray(json.keys)) {
      return json.keys
        .filter((key) => key.startsWith('planner:'))
        .map((key) => key.replace('planner:', ''))
        .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));
    }

    return [];
  } catch (error) {
    console.warn('[planner-cloud] Falha ao listar datas:', error);
    return [];
  }
}

export function setupPlannerCloudGlobals() {
  window.PlannerCloud = {
    saveDay: savePlannerDay,
    loadDay: loadPlannerDay,
    loadDates: loadPlannerDates,
  };
}