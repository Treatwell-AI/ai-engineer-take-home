import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  createdAt: text('created_at').notNull(),
});

export const treatments = sqliteTable('treatments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  durationMin: integer('duration_min').notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull(),
  treatmentId: integer('treatment_id').notNull(),
  startsAt: text('starts_at').notNull(),
  status: text('status').notNull(),
  price: real('price').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  reminderSentAt: integer('reminder_sent_at'),
});
