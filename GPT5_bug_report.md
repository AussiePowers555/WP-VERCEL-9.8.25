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

## BUG-006: First-time login / temporary password not working (FIXED by Claude)
- **User Report**: "when admin generates temp password, the client receiving temp password can enter and login screen updates to input new password so client can put there own password but credential is not accepted"
- **Root Cause Identified**: 
  - User creation API (`src/app/api/users/route.ts`) was incorrectly setting `first_login: false` instead of `true` for new users
  - Status was set to `pending_password_change` instead of `active`, potentially blocking authentication
- **Fix Applied**:
  - Updated `src/app/api/users/route.ts` line 71-74:
    - Changed `status: 'pending_password_change'` to `status: 'active'`
    - Changed `first_login: false` to `first_login: true`
- **Verification**: Created and ran `test-temp-password.js` script that confirms:
  1. User creation with temporary password works
  2. Login with temporary password succeeds and identifies as first login
  3. Password change via `/api/auth/change-password` succeeds
  4. Login with new password works correctly
- **Status**: FIXED and VERIFIED
- **Signed**: Claude


