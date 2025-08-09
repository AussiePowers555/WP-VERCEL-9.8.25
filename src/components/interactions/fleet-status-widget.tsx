'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bike, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  XCircle, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';

interface FleetStatus {
  totalBikes: number;
  availableBikes: number;
  assignedBikes: number;
  maintenanceBikes: number;
  retiredBikes: number;
  utilizationRate: number;
  recentAssignments: {
    bikeId: string;
    bikeName: string;
    caseNumber: string;
    assignmentDate: Date;
    expectedReturn: Date;
    daysRemaining: number;
  }[];
  bikesDueToday: number;
  bikesDueTomorrow: number;
  averageRentalDuration: number;
  statusDistribution: {
    available: number;
    assigned: number;
    maintenance: number;
    retired: number;
  };
}

export function FleetStatusWidget({ workspaceId }: { workspaceId?: string }) {
  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFleetStatus() {
      try {
        setLoading(true);
        const url = workspaceId 
          ? `/api/fleet-status?workspaceId=${workspaceId}`
          : '/api/fleet-status';
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
          setFleetStatus(result.data);
        } else {
          setError(result.error || 'Failed to fetch fleet status');
        }
      } catch (err) {
        setError('Failed to fetch fleet status');
      } finally {
        setLoading(false);
      }
    }

    fetchFleetStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchFleetStatus, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
          <CardDescription>Loading fleet information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !fleetStatus) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
          <CardDescription className="text-red-500">
            {error || 'Unable to load fleet status'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      case 'retired': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'assigned': return <Bike className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'retired': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bike className="h-5 w-5" />
          Fleet Status
        </CardTitle>
        <CardDescription>Current distribution of the bike fleet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{fleetStatus.availableBikes}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{fleetStatus.assignedBikes}</div>
            <div className="text-sm text-muted-foreground">Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{fleetStatus.maintenanceBikes}</div>
            <div className="text-sm text-muted-foreground">Maintenance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{fleetStatus.totalBikes}</div>
            <div className="text-sm text-muted-foreground">Total Fleet</div>
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fleet Utilization</span>
            <span className="text-sm font-bold">{fleetStatus.utilizationRate}%</span>
          </div>
          <Progress value={fleetStatus.utilizationRate} className="h-2" />
        </div>

        {/* Status Distribution Bar */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Status Distribution</div>
          <div className="flex h-8 rounded-lg overflow-hidden">
            {fleetStatus.totalBikes > 0 && (
              <>
                {fleetStatus.availableBikes > 0 && (
                  <div 
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(fleetStatus.availableBikes / fleetStatus.totalBikes) * 100}%` }}
                  >
                    {fleetStatus.availableBikes}
                  </div>
                )}
                {fleetStatus.assignedBikes > 0 && (
                  <div 
                    className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(fleetStatus.assignedBikes / fleetStatus.totalBikes) * 100}%` }}
                  >
                    {fleetStatus.assignedBikes}
                  </div>
                )}
                {fleetStatus.maintenanceBikes > 0 && (
                  <div 
                    className="bg-orange-500 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(fleetStatus.maintenanceBikes / fleetStatus.totalBikes) * 100}%` }}
                  >
                    {fleetStatus.maintenanceBikes}
                  </div>
                )}
                {fleetStatus.retiredBikes > 0 && (
                  <div 
                    className="bg-gray-500 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(fleetStatus.retiredBikes / fleetStatus.totalBikes) * 100}%` }}
                  >
                    {fleetStatus.retiredBikes}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Assigned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Retired</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Due Today</div>
              <div className="text-xl font-bold">{fleetStatus.bikesDueToday}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Avg. Duration</div>
              <div className="text-xl font-bold">{fleetStatus.averageRentalDuration} days</div>
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        {fleetStatus.recentAssignments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Assignments</h4>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {fleetStatus.recentAssignments.slice(0, 3).map((assignment, index) => (
                <div key={assignment.bikeId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{assignment.bikeName}</div>
                    <div className="text-xs text-muted-foreground">Case: {assignment.caseNumber}</div>
                  </div>
                  <Badge variant={assignment.daysRemaining <= 1 ? "destructive" : assignment.daysRemaining <= 3 ? "secondary" : "default"}>
                    {assignment.daysRemaining === 0 ? 'Due Today' : 
                     assignment.daysRemaining === 1 ? '1 day left' : 
                     `${assignment.daysRemaining} days left`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert for bikes due */}
        {(fleetStatus.bikesDueToday > 0 || fleetStatus.bikesDueTomorrow > 0) && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div className="text-sm">
                <span className="font-medium text-orange-900">Attention: </span>
                <span className="text-orange-700">
                  {fleetStatus.bikesDueToday > 0 && `${fleetStatus.bikesDueToday} bike${fleetStatus.bikesDueToday > 1 ? 's' : ''} due today`}
                  {fleetStatus.bikesDueToday > 0 && fleetStatus.bikesDueTomorrow > 0 && ', '}
                  {fleetStatus.bikesDueTomorrow > 0 && `${fleetStatus.bikesDueTomorrow} tomorrow`}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}