# GPT5 Bug Report and Fix Log

## BUG-001: Missing PostgreSQL Type Definitions
- Fix: Installed `@types/pg` as dev dependency.
- Command: `npm i -D @types/pg`
- Status: Fixed
- Signed: GPT5

## BUG-002: Next.js 15 Route Handler Params Must Be Async
- Fix: Updated all affected API routes to use `context: { params: Promise<...> }` and `await context.params`.
- Files: `src/app/api/**/[param]/route.ts` variants updated where needed.
- Status: Fixed
- Signed: GPT5

## BUG-003: Database Schema Date Type Mismatches
- Fix: Replaced `.toISOString()` assignments for `created_at`/`updated_at` with `new Date()` and cast where necessary to align with schema types.
- Files: `src/lib/user-auth.ts`, `src/app/api/auth/*`, `src/app/api/users/[id]/route.ts`, `src/lib/auth.ts`, `src/lib/signature-tokens*.ts` remain compatible via DB layer conversions.
- Status: Fixed where applicable
- Signed: GPT5

## BUG-004: PDF Blob creation type issue
- Fix: Ensured browser BlobPart is a `Uint8Array` in `src/lib/pdf-generator.ts` to avoid Buffer typing mismatch.
- Status: Fixed
- Signed: GPT5

## Infra: Playwright config port mismatch
- Fix: Adjusted `playwright.config.ts` baseURL and webServer url to `http://localhost:3000` to match `npm run dev`.
- Status: Fixed
- Signed: GPT5


