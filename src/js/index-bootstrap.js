// Carrega o HTML antigo que foi desmembrado do index.html
// e só depois injeta o script com as funções globais usadas nos onclick.
async function bootLegacyApp() {
  const root = document.getElementById('legacy-app');

  const response = await fetch('./src/views/index-content.html', { cache: 'no-store' });

  if (!response.ok) {
    root.innerHTML = '<div style="padding:40px;color:#ef4444">Erro ao carregar a interface.</div>';
    throw new Error('Falha ao carregar index-content.html');
  }

  root.innerHTML = await response.text();

  const script = document.createElement('script');
  script.src = './src/js/index-legacy.js';
  script.defer = false;
  document.body.appendChild(script);
}

bootLegacyApp().catch((error) => {
  console.error('[bootstrap]', error);
});
