'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Key,
  Folder,
  FileText,
  Download,
  Upload,
  LogIn,
  LogOut,
  Settings,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  actor_email?: string;
  actor_role?: string;
  target_type?: string;
  target_name?: string;
  details?: Record<string, any>;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

export default function ActivityTimelinePage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since the audit logging is console-based
      // In production, this would fetch from the audit_logs table
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          action: 'user.login',
          actor_email: 'admin@company.com',
          actor_role: 'admin',
          target_type: 'user',
          target_name: 'admin@company.com',
          status: 'success',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          action: 'credential.generate',
          actor_email: 'admin@company.com',
          actor_role: 'admin',
          target_type: 'user',
          target_name: 'newuser@company.com',
          details: { credentialType: 'temporary' },
          status: 'success',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: '3',
          action: 'workspace.create',
          actor_email: 'admin@company.com',
          actor_role: 'admin',
          target_type: 'workspace',
          target_name: 'Marketing Team',
          status: 'success',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: '4',
          action: 'user.password_change',
          actor_email: 'user@company.com',
          actor_role: 'user',
          target_type: 'user',
          target_name: 'user@company.com',
          status: 'success',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '5',
          action: 'security.alert',
          actor_email: 'unknown',
          target_type: 'system',
          details: { 
            alertType: 'multiple_failed_logins',
            description: 'Multiple failed login attempts detected'
          },
          status: 'warning',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '6',
          action: 'export.data',
          actor_email: 'admin@company.com',
          actor_role: 'admin',
          details: {
            exportType: 'users',
            recordCount: 50
          },
          status: 'success',
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      toast.error('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith('user.login')) return <LogIn className="h-4 w-4" />;
    if (action.startsWith('user.logout')) return <LogOut className="h-4 w-4" />;
    if (action.startsWith('user.password')) return <Key className="h-4 w-4" />;
    if (action.startsWith('user.')) return <User className="h-4 w-4" />;
    if (action.startsWith('credential.')) return <Key className="h-4 w-4" />;
    if (action.startsWith('workspace.')) return <Folder className="h-4 w-4" />;
    if (action.startsWith('case.')) return <FileText className="h-4 w-4" />;
    if (action.startsWith('export.')) return <Download className="h-4 w-4" />;
    if (action.startsWith('import.')) return <Upload className="h-4 w-4" />;
    if (action.startsWith('security.')) return <Shield className="h-4 w-4" />;
    if (action.startsWith('system.')) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user.create': 'User Created',
      'user.update': 'User Updated',
      'user.delete': 'User Deleted',
      'user.login': 'User Login',
      'user.logout': 'User Logout',
      'user.password_change': 'Password Changed',
      'user.password_reset': 'Password Reset',
      'workspace.create': 'Workspace Created',
      'workspace.update': 'Workspace Updated',
      'workspace.delete': 'Workspace Deleted',
      'workspace.share': 'Workspace Shared',
      'case.create': 'Case Created',
      'case.update': 'Case Updated',
      'case.delete': 'Case Deleted',
      'case.assign': 'Case Assigned',
      'credential.generate': 'Credentials Generated',
      'credential.distribute': 'Credentials Distributed',
      'credential.view': 'Credentials Viewed',
      'export.data': 'Data Exported',
      'import.data': 'Data Imported',
      'security.alert': 'Security Alert',
      'system.error': 'System Error'
    };
    return labels[action] || action;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = !filter || 
      activity.actor_email?.toLowerCase().includes(filter.toLowerCase()) ||
      activity.target_name?.toLowerCase().includes(filter.toLowerCase()) ||
      activity.action.toLowerCase().includes(filter.toLowerCase());
    
    const matchesType = selectedType === 'all' || activity.action.startsWith(selectedType);
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    
    return matchesFilter && matchesType && matchesStatus;
  });

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'user', label: 'User' },
    { value: 'credential', label: 'Credentials' },
    { value: 'workspace', label: 'Workspace' },
    { value: 'case', label: 'Cases' },
    { value: 'security', label: 'Security' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Timeline</h1>
          <p className="text-muted-foreground">
            Monitor all system activities and security events
          </p>
        </div>
        <Button onClick={fetchActivities} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">In the last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.length > 0 
                ? Math.round((activities.filter(a => a.status === 'success').length / activities.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {activities.filter(a => a.status === 'success').length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failures</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.status === 'failure').length}
            </div>
            <p className="text-xs text-muted-foreground">Failed operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.action.startsWith('security.')).length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by user, target, or action..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredActivities.length} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getActionLabel(activity.action)}</span>
                      {getStatusIcon(activity.status)}
                      <Badge variant={
                        activity.status === 'success' ? 'default' :
                        activity.status === 'failure' ? 'destructive' : 'secondary'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.actor_email && (
                        <span>
                          by <span className="font-medium">{activity.actor_email}</span>
                          {activity.actor_role && ` (${activity.actor_role})`}
                        </span>
                      )}
                      {activity.target_name && (
                        <span>
                          {' → '}
                          <span className="font-medium">{activity.target_name}</span>
                        </span>
                      )}
                    </div>
                    {activity.details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {JSON.stringify(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activity.created_at), 'PPpp')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}