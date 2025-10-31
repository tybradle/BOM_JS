# Database Management Dialog

The landing page hosts an administrative **Database Tools** dialog that centralizes backup, restore, and inspection workflows for the local SQLite database (`db/custom.db`).

## Capabilities

- **Export Database** – streams the active SQLite database as a `.zip` archive. Archives are timestamped (e.g., `custom_2025-10-31_14-20-00.zip`).
- **Import Database (Upload)** – accepts a `.zip` archive produced by the export action. Before replacing the database, the current file is automatically backed up to `db/backups/<name>_preimport_<timestamp>.db`.
- **Available Archives** – enumerates archives found under:
  - `db/backups/`
  - `Samples/Import Sample/`
  - the Electron resources directory (`resources/db/backups`) in packaged builds

  Listed archives can be re-imported in-place or downloaded directly.
- **Launch Prisma Studio** – spawns `npx prisma studio --browser none --port 5555` and opens the returned URL, enabling direct inspection of the database. Only one Studio process runs at a time.

## Usage Workflow

1. **Open the Dialog**
   - Header button → **Database Tools**
   - Hero button → **Database Tools**
2. **Exporting**
   - Click **Export Database** to trigger a download of the current database as a zipped archive.
3. **Importing from Upload**
   - Select a `.zip` file via the file picker.
   - Confirm the replacement prompt; the previous database is backed up automatically.
4. **Importing from Existing Archive**
   - Use the **Refresh** button to list recently created archives.
   - Click **Import** beside an entry to restore it, or **Download** to fetch another copy.
5. **Prisma Studio**
   - Click **Launch Prisma Studio** to open the external UI in a browser tab.

## Safety Mechanisms

- **Schema Validation** – Imports run `PRAGMA integrity_check` and verify that required tables (`User`, `BOMProject`, `Location`, `BOMItem`, `BOMExport`) exist before swapping the database.
- **Automatic Backups** – Successful imports create timestamped safety copies of the existing database in `db/backups/`.
- **Path Guardrails** – Importing from an existing archive is restricted to known directories; arbitrary filesystem paths are rejected.
- **File Size Limits** – Uploads above 150 MB and discovered archives above 500 MB are skipped.

## Developer Notes

- The dialog relies on new API routes:
  - `GET /api/database/export`
  - `POST /api/database/import` (supports file upload or `archivePath` form fields)
  - `GET /api/database/archives`
  - `GET /api/database/archive?path=<encoded>`
  - `POST /api/database/studio`
- Zustand actions (`fetchDatabaseArchives`, `downloadDatabaseArchive`, `uploadDatabaseArchive`, `importDatabaseArchivePath`, `launchPrismaStudio`) encapsulate API calls and error handling.
- Archive discovery lives in `src/lib/database/archives.ts` and is shared across routes.
- Electron builds resolve archive directories within `process.resourcesPath` in addition to the project root.

## Manual Testing Checklist

1. Export database → verify archive downloads and appears under "Available Archives".
2. Import uploaded archive → confirm toast success, projects list refresh, and backup file creation.
3. Import existing archive entry → ensure database swaps, backup created, archive list refreshes.
4. Download archive entry → confirm zip file downloads via `GET /api/database/archive`.
5. Launch Prisma Studio → ensure only one instance launches and URL opens in browser.
6. Attempt to upload non-zip or oversized file → expect validation error.

## Automation

- `npm run test-db-transfer` – round-trip export/import smoke test (requires `db/custom.db`).
- `npm run test-db-archives` – validates archive discovery ordering and path guards.

Keep the archives directory tidy by pruning stale backups; large sets of archives will still render in the dialog but could clutter the UI.
