import { NextResponse } from 'next/server';

const API = 'http://localhost:4000';

export async function GET() {
  const res = await fetch(API + '/treatments', {
    headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
