import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
//   firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// export const workoutPlans = pgTable('workout_plans', {
//   id: serial('id').primaryKey(),
//   userId: integer('user_id').references(() => users.id).notNull(),
//   title: text('title').notNull(),
//   fitnessLevel: text('fitness_level').notNull(),
//   goal: text('goal').notNull(),
//   days: jsonb('days').notNull(),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
//   updatedAt: timestamp('updated_at').defaultNow().notNull(),
// });

// export const exercises = pgTable('exercises', {
//   id: serial('id').primaryKey(),
//   name: text('name').notNull(),
//   gifUrl: text('gif_url').notNull(),
//   createdAt: timestamp('created_at').defaultNow().notNull(),
//   updatedAt: timestamp('updated_at').defaultNow().notNull(),
// }); 