# Governed organization operations

The production-boundary workflow is \`/api/governed-programs\`: proposal → separated-role approval → conflict-checked schedule → completion → reconciliation. Programs involving minors reject uncleared volunteers, and communications require a recorded consent basis. Every request is scoped by bearer auth and \`x-tenant-id\`; roles live in \`organization_memberships\`.

Calendar, messaging, accounting, background-check, payment, and member-import work is recorded in \`organization_outbox\` with retry/failure states. Provider adapters, sensitive-belief retention rules, safeguarding policy, and financial sign-off remain organization-specific launch blockers.

## Safe lifecycle

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Run `scripts/bootstrap.sh` once to install locked dependencies.
3. Run `scripts/migrate.sh` explicitly against the intended database.
4. Provision tenant memberships through an audited administrator process.
5. Run `./start.sh`; it never installs, seeds, migrates, starts PostgreSQL, or kills ports.

Legacy seed data is demo-only. Where `scripts/seed-demo.sh` exists it requires `CONFIRM_DEMO_SEED=yes` and refuses production. External provider calls and production data were not exercised by this implementation.
