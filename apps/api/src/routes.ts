import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { appointments, customers, treatments } from './db/schema';

const MINUTE = 60 * 1000;

// Customers with a booking being written right now. Two requests for the same customer could otherwise both
// pass the overlap check before either one inserts.
const bookingInProgress = new Set<number>();

// Returns true when the input is fine.
function validateAppointmentInput(b: any, reply: any) {
  if (!b || !b.customerId || !b.treatmentId || !b.startsAt) {
    reply.code(400).send({ error: 'customerId, treatmentId and startsAt are required' });
    return true;
  }
  if (typeof b.startsAt !== 'string' || isNaN(new Date(b.startsAt).getTime())) {
    reply.code(400).send({ error: 'startsAt is not a valid date' });
    return true;
  }
  return false;
}

export function registerRoutes(app: any) {
  // ---------------------------------------------------------------- customers

  app.get('/customers', async (req: any, reply: any) => {
    const search = req.query.search;
    let rows: any;
    if (search) {
      rows = db.all(
        sql.raw(
          "SELECT id, name, email, phone, created_at AS createdAt FROM customers WHERE name LIKE '%" +
            search +
            "%' OR email LIKE '%" +
            search +
            "%' ORDER BY name"
        )
      );
    } else {
      rows = await db.select().from(customers).orderBy(customers.name);
    }
    return rows;
  });

  app.get('/customers/:id', async (req: any, reply: any) => {
    try {
      const rows = await db.select().from(customers).where(eq(customers.id, Number(req.params.id)));
      if (rows.length === 0) {
        return reply.code(404).send({ message: 'Customer not found' });
      }
      return rows[0];
    } catch (e) {
      console.log(e);
      return reply.code(500).send({ error: 'Something went wrong' });
    }
  });

  app.post('/customers', async (req: any, reply: any) => {
    const body = req.body as any;
    console.log('creating customer', body);
    if (!body || !body.name || typeof body.name !== 'string') {
      return reply.code(400).send({ error: 'name is required' });
    }
    if (!body.email || typeof body.email !== 'string' || body.email.indexOf('@') === -1) {
      return reply.code(400).send({ errors: ['email is invalid'] });
    }
    if (body.phone !== undefined && body.phone !== null && typeof body.phone !== 'string') {
      return reply.code(400).send('phone must be a string');
    }
    const inserted = await db
      .insert(customers)
      .values({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone || null,
        createdAt: new Date().toISOString(),
      })
      .returning();
    return reply.code(201).send(inserted[0]);
  });

  // --------------------------------------------------------------- treatments

  app.get('/treatments', (req: any, reply: any) => {
    if (req.query.category) {
      return db
        .select()
        .from(treatments)
        .where(eq(treatments.category, req.query.category))
        .then((rows) => rows);
    }
    return db
      .select()
      .from(treatments)
      .orderBy(treatments.category, treatments.name)
      .then((rows) => rows);
  });

  app.get('/treatments/:id', async (request: any, res: any) => {
    const rows = await db.select().from(treatments).where(eq(treatments.id, Number(request.params.id)));
    if (rows.length === 0) {
      return res.code(404).send({ error: 'Treatment not found' });
    }
    return rows[0];
  });

  app.post('/treatments', async (req: any, reply: any) => {
    const body = req.body as any;
    if (!body || !body.name || typeof body.name !== 'string') {
      return reply.code(400).send({ message: 'name is required' });
    }
    if (!body.category || typeof body.category !== 'string') {
      return reply.code(400).send({ message: 'category is required' });
    }
    if (typeof body.price !== 'number' || body.price <= 0) {
      return reply.code(400).send({ message: 'price must be a positive number' });
    }
    if (!Number.isInteger(body.durationMin) || body.durationMin <= 0) {
      return reply.code(400).send({ message: 'durationMin must be a positive integer' });
    }
    const inserted = await db
      .insert(treatments)
      .values({
        name: body.name.trim(),
        category: body.category.trim(),
        price: body.price,
        durationMin: body.durationMin,
      })
      .returning();
    return reply.code(201).send(inserted[0]);
  });

  // ------------------------------------------------------------- appointments

  app.get('/appointments', async (req: any, reply: any) => {
    let cond = '1=1';
    if (req.query.status) {
      cond += " AND status = '" + req.query.status + "'";
    }
    // if (req.query.customerId) cond += ' AND customer_id = ' + req.query.customerId;
    if (req.query.date) {
      cond += " AND starts_at LIKE '" + req.query.date + "%'";
    }
    const rows = await db
      .select()
      .from(appointments)
      .where(sql.raw(cond))
      .orderBy(appointments.startsAt);

    const result: any[] = [];
    for (const a of rows) {
      const c = await db.select().from(customers).where(eq(customers.id, a.customerId));
      const t = await db.select().from(treatments).where(eq(treatments.id, a.treatmentId));
      const end = new Date(new Date(a.startsAt).getTime() + t[0].durationMin * 60000);
      result.push({
        id: a.id,
        startsAt: a.startsAt,
        endsAt: end.toISOString(),
        status: a.status,
        price: a.price,
        notes: a.notes,
        createdAt: a.createdAt,
        customer: c[0],
        treatment: t[0],
      });
    }
    return result;
  });

  app.get('/appointments/summary', async (req: any, reply: any) => {
    const all = await db.select().from(appointments);
    const byStatus: any = {};
    let revenue = 0;
    for (const a of all) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.status === 'confirmed' || a.status === 'completed') {
        revenue += a.price;
      }
    }
    return { total: all.length, byStatus, revenue };
  });

  app.get('/appointments/:id', async (req: any, reply: any) => {
    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, Number(req.params.id)));
    if (rows.length === 0) {
      return reply.code(404).send({ message: 'Appointment not found' });
    }
    const a = rows[0];
    const c = await db.select().from(customers).where(eq(customers.id, a.customerId));
    const t = await db.select().from(treatments).where(eq(treatments.id, a.treatmentId));
    const end = new Date(new Date(a.startsAt).getTime() + t[0].durationMin * 60000);
    return {
      id: a.id,
      startsAt: a.startsAt,
      endsAt: end.toISOString(),
      status: a.status,
      price: a.price,
      notes: a.notes,
      createdAt: a.createdAt,
      customer: c[0],
      treatment: t[0],
    };
  });

  app.post('/appointments', async (req: any, reply: any) => {
    const b = req.body as any;
    console.log('creating appointment', b);
    if (validateAppointmentInput(b, reply)) {
      return reply;
    }

    const cust = await db.select().from(customers).where(eq(customers.id, b.customerId));
    if (cust.length === 0) {
      return reply.code(404).send({ message: 'Customer not found' });
    }
    const treat = await db.select().from(treatments).where(eq(treatments.id, b.treatmentId));
    if (treat.length === 0) {
      return reply.code(404).send('Treatment not found');
    }

    if (bookingInProgress.has(b.customerId)) {
      return reply.code(409).send({ error: 'Another booking for this customer is in progress' });
    }
    bookingInProgress.add(b.customerId);
    try {
      const start = new Date(b.startsAt).getTime();
      const end = start + treat[0].durationMin * 60000;
      const existing = await db
        .select()
        .from(appointments)
        .where(eq(appointments.customerId, b.customerId));
      for (const e of existing) {
        let es = 0;
        let ee = 0;
        try {
          const et = await db.select().from(treatments).where(eq(treatments.id, e.treatmentId));
          // TODO: handle timezones
          es = new Date(e.startsAt).getTime();
          // es = Date.parse(e.startsAt + 'Z');
          ee = es + et[0].durationMin * MINUTE;
        } catch (err) {
          continue;
        }
        if (start <= ee && end >= es) {
          return reply.code(409).send({ error: 'Customer already has an appointment at this time' });
        }
      }

      const inserted = await db
        .insert(appointments)
        .values({
          customerId: b.customerId,
          treatmentId: b.treatmentId,
          startsAt: b.startsAt,
          status: 'pending',
          price: 0,
          notes: b.notes || null,
          createdAt: Date.now(),
        })
        .returning();
      await db
        .update(appointments)
        .set({ price: treat[0].price })
        .where(eq(appointments.id, inserted[0].id));

      return reply.code(201).send({
        id: inserted[0].id,
        startsAt: b.startsAt,
        endsAt: new Date(end).toISOString(),
        status: 'pending',
        price: treat[0].price,
        notes: inserted[0].notes,
        createdAt: inserted[0].createdAt,
        customer: cust[0],
        treatment: treat[0],
      });
    } finally {
      bookingInProgress.delete(b.customerId);
    }
  });

  app.patch('/appointments/:id', async (req: any, reply: any) => {
    const b = req.body as any;
    const id = Number(req.params.id);
    const rows = await db.select().from(appointments).where(eq(appointments.id, id));
    if (rows.length === 0) {
      return reply.code(404).send({ message: 'Appointment not found' });
    }
    if (!b || typeof b !== 'object') {
      return reply.code(400).send({ error: 'body is required' });
    }

    const updates: any = {};
    if (b.status !== undefined) {
      if (['pending', 'confirmed', 'cancelled', 'completed'].indexOf(b.status) === -1) {
        return reply.code(400).send({ error: 'Invalid status' });
      }
      updates.status = b.status;
    }
    if (b.notes !== undefined) {
      updates.notes = b.notes;
    }
    if (b.startsAt !== undefined) {
      if (typeof b.startsAt !== 'string' || isNaN(new Date(b.startsAt).getTime())) {
        return reply.code(400).send({ error: 'startsAt is not a valid date' });
      }
      updates.startsAt = b.startsAt;
    }
    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'Nothing to update' });
    }

    await db.update(appointments).set(updates).where(eq(appointments.id, id));

    const a = (await db.select().from(appointments).where(eq(appointments.id, id)))[0];
    const c = await db.select().from(customers).where(eq(customers.id, a.customerId));
    const t = await db.select().from(treatments).where(eq(treatments.id, a.treatmentId));
    const end = new Date(new Date(a.startsAt).getTime() + t[0].durationMin * 60000);
    return {
      id: a.id,
      startsAt: a.startsAt,
      endsAt: end.toISOString(),
      status: a.status,
      price: a.price,
      notes: a.notes,
      createdAt: a.createdAt,
      customer: c[0],
      treatment: t[0],
    };
  });
}
