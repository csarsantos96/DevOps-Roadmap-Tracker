// middleware.js — Basic Auth para proteger todo o site na Vercel Edge

export const config = {
  matcher: ['/((?!_next|_vercel|favicon.ico).*)'],
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;

  if (!USER || !PASS) {
    return new Response('Basic Auth environment variables are missing', {
      status: 500,
    });
  }

  if (auth) {
    try {
      const [scheme, encoded] = auth.split(' ');

      if (scheme === 'Basic' && encoded) {
        const decoded = atob(encoded);
        const separatorIndex = decoded.indexOf(':');

        const user = decoded.slice(0, separatorIndex);
        const pass = decoded.slice(separatorIndex + 1);

        if (user === USER && pass === PASS) {
          return;
        }
      }
    } catch (error) {
      // Header inválido cai no 401
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Cesar Roadmap", charset="UTF-8"',
    },
  });
}