import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type TestServer } from './helpers/server';

let api: TestServer;
beforeAll(async () => {
  api = await startServer();
});
afterAll(async () => {
  await api.stop();
});

describe('GET /treatments', () => {
  it('lists treatments ordered by category, then name', async () => {
    const res = await api.get('/treatments');
    expect(res.status).toBe(200);
    expect(res.body.map((t: any) => t.name)).toEqual([
      'Eyebrow Shape & Tint',
      'Hydrating Facial',
      "Men's Haircut",
      'Root Colour',
      "Women's Cut & Blow-dry",
      'Deep Tissue Massage',
      'Classic Pedicure',
      'Gel Manicure',
    ]);
  });

  it('filters by category', async () => {
    const res = await api.get('/treatments?category=Nails');
    expect(res.status).toBe(200);
    expect(res.body.map((t: any) => t.name).sort()).toEqual(['Classic Pedicure', 'Gel Manicure']);
  });
});

describe('GET /treatments/:id', () => {
  it('returns one treatment', async () => {
    const res = await api.get('/treatments/4');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 4, name: 'Gel Manicure', category: 'Nails', price: 39.99, durationMin: 45 });
  });

  it('returns 404 for an unknown treatment', async () => {
    const res = await api.get('/treatments/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /treatments', () => {
  it('creates a treatment', async () => {
    const res = await api.post('/treatments', {
      name: ' Scalp Massage ',
      category: 'Massage',
      price: 24.5,
      durationMin: 20,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Scalp Massage', category: 'Massage', price: 24.5, durationMin: 20 });
    expect(typeof res.body.id).toBe('number');
  });

  it.each([
    ['a missing name', { category: 'Hair', price: 10, durationMin: 10 }],
    ['a missing category', { name: 'X', price: 10, durationMin: 10 }],
    ['a zero price', { name: 'X', category: 'Hair', price: 0, durationMin: 10 }],
    ['a string price', { name: 'X', category: 'Hair', price: '10', durationMin: 10 }],
    ['a fractional duration', { name: 'X', category: 'Hair', price: 10, durationMin: 1.5 }],
    ['a negative duration', { name: 'X', category: 'Hair', price: 10, durationMin: -5 }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await api.post('/treatments', body);
    expect(res.status).toBe(400);
  });
});
