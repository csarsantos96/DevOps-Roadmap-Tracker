const routes = {
  home: {
    view: '/src/views/home.html',
    init: null,
  },
};

export async function navigateTo(page) {
  const route = routes[page] || routes.home;

  const res = await fetch(route.view);

  if (!res.ok) {
    document.querySelector('#app').innerHTML = `<p>Erro ao carregar ${page}</p>`;
    return;
  }

  const html = await res.text();
  document.querySelector('#app').innerHTML = html;

  if (route.init) {
    await route.init();
  }
}