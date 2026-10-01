import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type TestServer } from './helpers/server';

let api: TestServer;
beforeAll(async () => {
  api = await startServer();
});
afterAll(async () => {
  await api.stop();
});

// Error response bodies are NOT part of the contract (status codes are).
describe('GET /customers', () => {
  it('lists all customers ordered by name', async () => {
    const res = await api.get('/customers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body.map((c: any) => c.name)).toEqual([
      'Amira Haddad',
      'Emma Schneider',
      'Isabel Costa',
      'Jonas Weber',
      'Luca Romano',
      'Mia Kowalski',
      'Noah Jansen',
      'Sophie Martin',
    ]);
  });

  it('returns id, name, email, phone and createdAt for each customer', async () => {
    const res = await api.get('/customers');
    expect(Object.keys(res.body[0]).sort()).toEqual(['createdAt', 'email', 'id', 'name', 'phone']);
  });

  it('searches by name', async () => {
    const res = await api.get('/customers?search=sophie');
    expect(res.status).toBe(200);
    expect(res.body.map((c: any) => c.name)).toEqual(['Sophie Martin']);
  });

  it('searches by email', async () => {
    const res = await api.get('/customers?search=weber@');
    expect(res.body.map((c: any) => c.name)).toEqual(['Jonas Weber']);
  });
});

describe('GET /customers/:id', () => {
  it('returns one customer', async () => {
    const res = await api.get('/customers/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      name: 'Emma Schneider',
      email: 'emma.schneider@example.com',
      phone: '+49 30 5550101',
      createdAt: '2026-03-02T10:15:00.000Z',
    });
  });

  it('returns 404 for an unknown customer', async () => {
    const res = await api.get('/customers/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /customers', () => {
  it('creates a customer, trimming the name and lowercasing the email', async () => {
    const res = await api.post('/customers', { name: '  Lea Fischer ', email: 'Lea.Fischer@Example.com' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Lea Fischer',
      email: 'lea.fischer@example.com',
      phone: null,
    });
    expect(typeof res.body.id).toBe('number');
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);

    const fetched = await api.get(`/customers/${res.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.email).toBe('lea.fischer@example.com');
  });

  it('stores the phone number when given', async () => {
    const res = await api.post('/customers', { name: 'Tom Berg', email: 'tom@example.com', phone: '+49 40 5550199' });
    expect(res.status).toBe(201);
    expect(res.body.phone).toBe('+49 40 5550199');
  });

  it.each([
    ['a missing name', { email: 'x@example.com' }],
    ['a non-string name', { name: 42, email: 'x@example.com' }],
    ['a missing email', { name: 'No Email' }],
    ['an email without @', { name: 'Bad Email', email: 'nope' }],
    ['a non-string phone', { name: 'Bad Phone', email: 'x@example.com', phone: 12345 }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await api.post('/customers', body);
    expect(res.status).toBe(400);
  });
});
