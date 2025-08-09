"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RequireWorkspace from "@/components/RequireWorkspace";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user } = useAuth();
  const { name, role, id } = useWorkspace();
  const router = useRouter();

  // Simple debug logging
  React.useEffect(() => {
    console.log('Admin Page loaded. User role:', role);
  }, []);

  // Redirect non-admin users
  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page requires administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/cases')} className="w-full">
              Go to Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RequireWorkspace>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage system settings and workspace access</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {role === 'admin' ? 'Administrator' : 'User'}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Current Workspace</CardTitle>
              <CardDescription>Your active workspace context</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {role}
                </p>
                {id && (
                  <p className="text-sm text-muted-foreground">
                    ID: {id}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{user?.name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground">ID: {user?.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="destructive" 
                className="w-full justify-start mb-4"
                onClick={() => {
                  alert('JavaScript is working! User: ' + (user?.name || 'No user'));
                }}
              >
                🔧 Test JavaScript (Click Me First)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  console.log('Manage Workspaces clicked');
                  try {
                    router.push('/workspaces');
                  } catch (error) {
                    console.error('Router error:', error);
                    alert('Navigation error: ' + error);
                  }
                }}
              >
                Manage Workspaces
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/contacts')}
              >
                Manage Contacts
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/cases')}
              >
                View All Cases
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Management</CardTitle>
            <CardDescription>
              As an administrator, you can switch between workspaces to view cases from different perspectives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Current View</p>
                <p className="text-sm text-muted-foreground">
                  {name === 'Main Workspace' 
                    ? 'Viewing all cases across all workspaces' 
                    : `Viewing cases for ${name}`
                  }
                </p>
              </div>
              <Button 
                variant="default"
                onClick={() => router.push('/workspaces')}
              >
                Switch Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireWorkspace>
  );
}