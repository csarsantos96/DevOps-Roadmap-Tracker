import { setupPlannerCloudGlobals } from './planner-cloud.js';

setupPlannerCloudGlobals();

async function loadLegacyContent() {
  const app = document.getElementById('app');

  if (!app) {
    console.error('[bootstrap] Elemento #app não encontrado no index.html');
    return;
  }

  try {
    const response = await fetch('/src/views/index-content.html', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Erro ao carregar index-content.html: ${response.status}`);
    }

    const html = await response.text();

    app.innerHTML = html;

    await loadLegacyScript();

  } catch (error) {
    console.error('[bootstrap] Erro ao iniciar app:', error);

    app.innerHTML = `
      <div style="
        padding: 32px;
        color: #f87171;
        font-family: monospace;
      ">
        <h2>Erro ao carregar aplicação</h2>
        <pre>${error.message}</pre>
      </div>
    `;
  }
}

function loadLegacyScript() {
  return new Promise((resolve, reject) => {
    const oldScript = document.querySelector('script[data-legacy-script]');

    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');

    script.src = '/src/js/index-legacy.js';
    script.defer = true;
    script.dataset.legacyScript = 'true';

    script.onload = () => {
      console.log('[bootstrap] index-legacy.js carregado');
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Falha ao carregar src/js/index-legacy.js'));
    };

    document.body.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', loadLegacyContent);