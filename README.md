# Venue Backoffice

Welcome, and thanks for taking the time to do this exercise.

This repo is the starting point for your take-home. It's the backoffice a beauty and wellness venue (a salon, spa
or barber) uses to run its day: the appointment calendar, its customers and the treatments it offers.

The code works, but it's messy, and that's on purpose. Part of the exercise is deciding what to fix, what to leave
alone and how to tell the difference. The brief that came with your invitation describes what we'd like you to
do. This README covers the repo itself: how to run it, the business rules and how the API is tested.

## What's in the repo

- `apps/api`: the API, in TypeScript with Fastify, Drizzle ORM and SQLite.
- `apps/web`: the web app, in Next.js (App Router) and React. Its route handlers act as a backend-for-frontend
  (BFF) in front of the API.

## Getting started

```bash
corepack enable
yarn install
yarn dev        # API on http://localhost:4000, web app on http://localhost:3000
```

You'll find the Node version in `.nvmrc`. The SQLite database is stored in `apps/api/data/`. The dev server
reloads the sample data every time it starts, so if you want your changes to survive a restart, set
`SEED_ON_BOOT=false`.

| Command | What it does |
| --- | --- |
| `yarn dev` | Starts the API and the web app |
| `yarn test` | Runs the API tests, including the characterization suite |
| `yarn verify` | Runs `tsc`, ESLint, knip, jscpd and the tests, and reports every result |
| `yarn db:generate` | Generates a Drizzle migration from `apps/api/src/db/schema.ts` |
| `yarn db:migrate` | Applies pending migrations |
| `yarn db:seed` | Replaces the data with the sample data |

Our test suites start the API by running the package scripts `db:migrate`, `db:seed` and `start`, in that order.
Please keep those three script names working.

`yarn verify` fails on the starting code, and we expect that. Read its output as a hint about the state of the
code rather than a gate you have to pass. If you leave something failing, just tell us what and why.

## How the venue works

These are the business rules. If the code and the rules disagree, the rules are right.

- An **appointment** books one **customer** for one **treatment** at a given start time. It ends when the
  treatment's duration is up. The price, in euros, is copied from the treatment when the appointment is booked.
- An appointment is `pending`, `confirmed`, `completed` or `cancelled`. It normally goes from pending to confirmed
  to completed. **Cancelling is final**: a cancelled appointment can't be brought back.
- A customer can't be double-booked, so two of their appointments must never overlap. Back-to-back is fine: one
  can end at 10:30 and the next start at 10:30. **Cancelled appointments don't count.**
- An appointment's `notes` are for staff only. A customer must never see them.
- A customer gets **exactly one** reminder email in the 24 hours before a confirmed appointment.
- The API uses ISO 8601 timestamps in UTC. Appointments imported from the venue's previous booking system are
  different: they are stored as `YYYY-MM-DD HH:mm` in the venue's local time (Europe/Berlin), and some of them
  spell the status `canceled`.

## The API contract and the characterization tests

The tests in `apps/api/test/characterization` record how the API behaves today. Each run starts the real server
against a freshly seeded database and talks to it only over HTTP, so the tests keep working however you
reorganise the code inside.

- For successful requests, both the status code and the response body are part of the contract. For errors,
  only the status code is. Error bodies aren't part of it, and right now they're inconsistent.
- If you find behaviour that breaks one of the business rules, fix it, but not in the middle of a refactor.
  Make the fix its own commit, with a test that would have caught the bug.
- The suite is a safety net, not a full specification. Plenty of the code isn't covered.
- The suite runs the API with `TZ=UTC`, so you'll get the same results on any machine.

## How it runs in production

The backoffice runs on Kubernetes, and each app ships as its own container image.

- The API and the web app each run as **three replicas** behind a load balancer. Any request can reach any
  replica, and a pod can be stopped or moved at any time.
- Every merge to `main` goes out as a rolling update, so for a while the old and the new version run side by side.
- All the API replicas share one database. You'll be working with a local SQLite file, but please treat the
  database as shared and external, the way it is in production.
