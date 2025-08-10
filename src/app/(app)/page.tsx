import { Suspense } from 'react';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import DashboardStatsServer, { DashboardStatsSkeleton } from './dashboard-stats-server';
import DashboardClient from './dashboard-client';
// import FleetStatusWrapper from '@/components/dashboard/fleet-status-wrapper';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

// Server component for recent cases table
async function RecentCasesServer() {
  await ensureDatabaseInitialized();
  const cases = await (DatabaseService as any).getCasesAsync?.();
  const contacts = await (DatabaseService as any).getContactsAsync?.();
  
  // Get the 4 most recent cases
  const recentCases = cases
    .sort((a: any, b: any) => new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime())
    .slice(0, 4);

  const getContactName = (contactId?: string) => {
    if (!contactId) return '-';
    const contact = contacts.find((c: any) => c.id === contactId);
    return contact?.name || '-';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New Matter': return 'outline';
      case 'Closed': case 'Paid': return 'default';
      case 'Demands Sent': case 'Awaiting Settlement': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Cases</CardTitle>
        <CardDescription>An overview of the most recently updated cases.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Assigned Lawyer</TableHead>
              <TableHead>Assigned Rental Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentCases.map((case_: any) => (
              <TableRow key={case_.caseNumber}>
                <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                <TableCell>{case_.clientName}</TableCell>
                <TableCell>{getContactName(case_.assigned_lawyer_id)}</TableCell>
                <TableCell>{getContactName(case_.assigned_rental_company_id)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(case_.status)}>
                    {case_.status}
                  </Badge>
                </TableCell>
                <TableCell>{typeof case_.lastUpdated === 'string' ? case_.lastUpdated : new Date(case_.lastUpdated).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


// Loading skeletons
function RecentCasesSkeleton() {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 p-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


// Main dashboard page with ISR and streaming SSR
export default function DashboardPage() {
  return (
    <DashboardClient>
      <div className="flex flex-col gap-6">
        {/* Dashboard stats with streaming */}
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsServer />
        </Suspense>

        {/* Recent cases and fleet chart with streaming */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Suspense fallback={<RecentCasesSkeleton />}>
            <RecentCasesServer />
          </Suspense>
          
          {/* Fleet Status removed - component not found */}
          {/* <div className="lg:col-span-2">
            <FleetStatusWrapper />
          </div> */}
        </div>
      </div>
    </DashboardClient>
  )
}
