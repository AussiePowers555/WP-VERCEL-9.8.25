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
import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart, Bar, XAxis, YAxis } from "@/components/ui/chart"
import DashboardStatsServer, { DashboardStatsSkeleton } from './dashboard-stats-server';

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

// Server component for fleet chart
async function FleetChartServer() {
  await ensureDatabaseInitialized();
  const bikes = await (DatabaseService as any).getBikesAsync?.();
  
  // Calculate fleet status distribution
  const statusCounts = bikes.reduce((acc: Record<string, number>, bike: any) => {
    const status = bike.status || 'Available';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { status: "Available", count: statusCounts.Available || 0, fill: "var(--color-available)" },
    { status: "Rented", count: statusCounts.Rented || 0, fill: "var(--color-rented)" },
    { status: "Maintenance", count: statusCounts.Maintenance || 0, fill: "var(--color-maintenance)" },
  ];

  const chartConfig = {
    count: { label: "Count" },
    available: { label: "Available", color: "hsl(var(--chart-1))" },
    rented: { label: "Rented", color: "hsl(var(--chart-2))" },
    maintenance: { label: "Maintenance", color: "hsl(var(--chart-4))" },
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Fleet Status</CardTitle>
        <CardDescription>Current distribution of the bike fleet.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              axisLine={false}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={5} />
          </BarChart>
        </ChartContainer>
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

function FleetChartSkeleton() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="h-6 w-28 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

// Main dashboard page with ISR and streaming SSR
export default function DashboardPage() {
  return (
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
        
        <Suspense fallback={<FleetChartSkeleton />}>
          <FleetChartServer />
        </Suspense>
      </div>
    </div>
  )
}
