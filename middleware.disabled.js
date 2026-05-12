// middleware.js — Basic Auth para proteger todo o site
// Roda no Vercel Edge antes de qualquer arquivo estático ou API ser servido.

export const config = {
  matcher: ['/((?!_next|_vercel|favicon.ico).*)'],
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;

  if (auth) {
    
    const encoded = auth.split(' ')[1] || '';
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');

  if (auth) {
    try {
      const [scheme, encoded] = auth.split(' ');

      if (scheme === 'Basic' && encoded) {
        const decoded = atob(encoded);
        const separatorIndex = decoded.indexOf(':');

        const user = decoded.slice(0, separatorIndex);
        const pass = decoded.slice(separatorIndex + 1);

        if (user === USER && pass === PASS) {
          // Credenciais ok → deixa a requisição seguir normalmente
          return;
        }
      }
    } catch (error) {
      // Credencial malformada → cai no 401 abaixo
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Cesar Roadmap", charset="UTF-8"',
    },
  });
}