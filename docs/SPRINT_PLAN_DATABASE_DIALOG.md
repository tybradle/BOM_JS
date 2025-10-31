# Database Management Dialog Sprint Plan

## Objective
Deliver a landing-page database management dialog that allows administrators to:

- Export the active SQLite database as a zipped archive for backup.
- Import a zipped SQLite backup, including automated safety backups and validation of schema compatibility.
- Launch Prisma Studio locally (including in packaged Electron builds).
- Surface existing database archives so users can quickly restore pre-populated datasets.

The feature must operate consistently across development and Electron runtimes, safeguard against data loss, and provide clear user feedback.

## Assumptions & Constraints
- Packaged Electron apps ship with the SQLite database inside the `resources/db` directory; API code must resolve the runtime path accordingly.
- During development the authoritative `custom.db` lives at the repo root in `db/custom.db`; any legacy copies under `prisma/db` are deprecated and should remain empty.
- All import/export operations will use `.zip` containers that include a single SQLite database file named `custom.db`.
- The Prisma schema will remain unchanged during import; incompatible database files should be rejected with a meaningful error.
- Prisma Studio access is acceptable for production/Electron users, but the launch endpoint should only start one instance and return its URL.
- Existing sample or backup databases may reside under `db/backups` or `Samples/`. The dialog should discover these locations at runtime.

## Sprint Breakdown

### Sprint 1 – Backend Foundations
**Goals**
- Introduce helper utilities to resolve database paths for both dev and production builds.
- Implement API endpoints for exporting and importing zipped database archives.
- Ensure imports create timestamped safety backups and perform schema validation (e.g., Prisma migration status or sanity queries).

**Deliverables**
- `src/lib/db-path.ts` (or similar) utility for resolving live DB and backup directories.
- `src/app/api/database/export/route.ts` returning a `application/zip` stream with a timestamped filename.
- `src/app/api/database/import/route.ts` handling multipart zip upload, validating archive contents, creating pre-import backups, swapping the database atomically, and reconnecting Prisma.
- Automated tests/scripts:
  - Node-level test (e.g., `scripts/test-database-transfer.ts`) verifying export → unzip → sqlite integrity.
  - Validation that importing a mismatched schema triggers an error (mock by altering table structure inside the zip).

**Validation & Tests**
- Unit tests around helper utilities (path resolution, zip validation) using Jest or Vitest (aligned with project tooling).
- Integration script invoked via `npm run test-db-transfer` to simulate export/import round-trip and assert row counts survive.
- Manual checklist documenting failure cases: missing file, wrong extension, corrupt zip.

### Sprint 2 – UI & State Integration
**Goals**
- Expose new API capabilities through Zustand actions and a dedicated dialog on the landing page.
- Provide affordances for exporting, importing (with file validation + confirmation flow), launching Prisma Studio, and listing discovered archives.

**Deliverables**
- `DatabaseToolsDialog` React component embedded in `LandingPage.tsx` nav.
- Zustand store additions: `downloadDatabaseArchive`, `uploadDatabaseArchive`, `launchPrismaStudio`, `fetchAvailableArchives`.
- Toast-driven UX for success/failure, progress indicators during uploads, and warning dialogs for destructive actions.

**Validation & Tests**
- Cypress/Playwright smoke test (or React Testing Library component tests) covering dialog open, export trigger, and import form validation (accept only `.zip`, require confirmation).
- Manual verification steps ensuring Prisma Studio launch button opens a URL and gracefully handles already-running instances.
- Accessibility review: keyboard navigation, focus traps, ARIA labels in dialog and file input.

### Sprint 3 – Archive Discovery & Documentation
**Goals**
- Surface existing database archives (from `db/backups`, `Samples/Import Sample`, etc.) within the dialog for quick restore.
- Document workflow for operators, including safety practices and troubleshooting.

**Deliverables**
- Backend endpoint `GET /api/database/archives` enumerating available `.zip` files from configured directories, including metadata (name, location, timestamp, size).
- UI list within the dialog allowing users to download or import these archives directly.
- Documentation updates:
  - `docs/DATABASE_MANAGEMENT_DIALOG.md` describing usage, limitations, and recovery steps.
  - README snippet referencing the new feature.

**Validation & Tests**
- Automated test ensuring archive discovery skips oversized or invalid files and sorts by recency.
- Manual test verifying importing a sample archive populates expected projects/parts.
- QA checklist to run before release that covers end-to-end restore from a provided sample database.

## Risks & Mitigations
- **Data Loss Risk:** Mitigated by automatic timestamped backups before import and clear warnings in the UI.
- **Schema Drift:** Import flow should run a sanity query (e.g., `PRAGMA table_info`) and fail fast if the schema differs.
- **Electron Path Differences:** Centralized path resolution utility and tests that mimic packaged paths reduce deployment surprises.
- **Long-Running Prisma Studio:** Store PID and kill on server shutdown; return informative error if already running.

## Next Steps
1. Confirm acceptance of sprint plan and clarify any open questions (e.g., archive discovery directories, automated test tooling preference).
2. Schedule Sprint 1 implementation focusing on backend safety and automated validation.
3. Proceed sequentially through sprints, ensuring exit criteria/tests pass before moving forward.
