import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const resp = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: cookies().toString() },
    cache: 'no-store'
  });

  const body = await resp.text();
  const next = new NextResponse(body, { status: resp.status });

  const setCookie = resp.headers.get('set-cookie');
  if (setCookie) next.headers.set('set-cookie', setCookie);
  const ctype = resp.headers.get('content-type');
  if (ctype) next.headers.set('content-type', ctype);

  return next;
}
