import { NextResponse } from 'next/server';

const API = 'http://localhost:4000';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const res = await fetch(API + '/appointments' + url.search, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(API + '/appointments', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
