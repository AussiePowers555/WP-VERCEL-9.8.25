# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 15.3.3 (stale) Turbopack":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 15.3.3 (stale) Turbopack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: Ecmascript file had an error
  - img
  - text: ./src/app/(app)/cases/cases-list-client.tsx (375:24)
  - button "Open in editor":
    - img
  - text: "Ecmascript file had an error 373 | // Status filter per-workspace (unique key per active workspace) 374 | const statusKey = `cases:statusFilter:${workspaceIdCtx || 'MAIN'}`; > 375 | const [statusFilter, setStatusFilter] = useSessionStorage<Case['status'] | 'ALL'>(statusKey, 'ALL'); | ^^^^^^^^^^^^^^^ 376 | 377 | const filteredAndSortedCases = hydratedCases 378 | .filter(c => { the name `setStatusFilter` is defined multiple times"
- contentinfo:
  - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```