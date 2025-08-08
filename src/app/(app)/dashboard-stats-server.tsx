import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Bike, Banknote, Shield } from "lucide-react";

// Server component that fetches dashboard stats at build time
export default async function DashboardStatsServer() {
  // Ensure database is initialized
  await ensureDatabaseInitialized();
  
  // Fetch data at build time (will be cached for 5 minutes)
  const cases = await DatabaseService.getCasesAsync();
  const bikes = await DatabaseService.getBikesAsync();
  
  // Calculate dashboard statistics
  const totalCases = cases.length;
  const availableBikes = bikes.filter(bike => bike.status === 'Available').length;
  const totalBikes = bikes.length;
  const overdueAmount = cases
    .filter(c => c.status === 'Awaiting Settlement' || c.status === 'Demands Sent')
    .reduce((sum, c) => sum + (c.invoiced - c.paid), 0);
  const overdueCases = cases.filter(c => c.status === 'Awaiting Settlement' || c.status === 'Demands Sent').length;
  const activeClaims = cases.filter(c => c.status === 'Settlement Agreed' || c.status === 'Awaiting Settlement').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCases}</div>
          <p className="text-xs text-muted-foreground">Active rental cases</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bikes Available</CardTitle>
          <Bike className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableBikes} / {totalBikes}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((availableBikes / totalBikes) * 100)}% availability
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${overdueAmount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across {overdueCases} cases</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Insurance Claims</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClaims}</div>
          <p className="text-xs text-muted-foreground">Awaiting settlement</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton for dashboard stats
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}