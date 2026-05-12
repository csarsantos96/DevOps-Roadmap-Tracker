// middleware.js — Basic Auth para proteger todo o site
// Roda no Vercel Edge antes de qualquer arquivo estático ou API ser servido.

import { NextResponse } from 'next/server';

export const config = {
  // Aplica em tudo, exceto rotas internas da Vercel/Next e o favicon.
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

    if (user === USER && pass === PASS) {
      // Credenciais ok → deixa passar para o destino real
      return NextResponse.next();
    }
  }

  // Sem credenciais ou credenciais erradas → pede login
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Cesar Roadmap", charset="UTF-8"',
    },
  });
}