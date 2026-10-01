import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { appointments, customers, treatments } from '../db/schema';
import { sendEmail } from '../mailer';

const EVERY_MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// Emails the customer once, during the 24 hours before a confirmed appointment.
async function sendDueReminders() {
  const due = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.status, 'confirmed'), isNull(appointments.reminderSentAt)));

  for (const a of due) {
    const startsIn = new Date(a.startsAt).getTime() - Date.now();
    if (startsIn < 0 || startsIn > DAY) continue;

    const c = await db.select().from(customers).where(eq(customers.id, a.customerId));
    const t = await db.select().from(treatments).where(eq(treatments.id, a.treatmentId));
    await sendEmail(
      c[0].email,
      'See you tomorrow',
      'Hi ' + c[0].name + ', this is a reminder of your ' + t[0].name + ' on ' + new Date(a.startsAt).toLocaleString()
    );
    await db.update(appointments).set({ reminderSentAt: Date.now() }).where(eq(appointments.id, a.id));
  }
}

export function startReminderJob() {
  setInterval(() => {
    sendDueReminders().catch((e) => console.log('reminders failed', e));
  }, EVERY_MINUTE);
}
