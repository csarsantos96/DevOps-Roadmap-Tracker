// data.js — carrega JSONs e mantém cache
const cache = new Map();

export async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export async function loadAllTracks() {
  const manifest = await loadJSON('./src/data/tracks.json');
  const tracks = await Promise.all(
    manifest.tracks.map(id => loadJSON(`./src/data/tracks/${id}.json`))
  );
  return { manifest, tracks };
}

export async function loadCerts() {
  return loadJSON('./src/data/certs.json');
}
