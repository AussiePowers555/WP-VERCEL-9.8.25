
import { Suspense } from 'react';
import CasesListServer, { CasesListSkeleton } from './cases-list-server';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

// Server component with dynamic rendering
export default function CasesPage() {
  return (
    <Suspense fallback={<CasesListSkeleton />}>
      <CasesListServer />
    </Suspense>
  );
}