import { NextResponse } from 'next/server';

const API = 'http://localhost:4000';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(API + '/appointments/' + id, {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(API + '/appointments/' + id, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
