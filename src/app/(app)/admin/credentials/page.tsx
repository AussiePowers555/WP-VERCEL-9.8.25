'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EnhancedCredentialsModal } from '@/components/enhanced-credentials-modal';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Building2,
  User
} from 'lucide-react';

interface UserCredential {
  id: string;
  email: string;
  name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  created_at: string;
  last_login: string | null;
  first_login: boolean;
  status: string;
  password?: string;
}

export default function CredentialsManagementPage() {
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserCredential | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter out admin users
        const nonAdminUsers = data.filter((u: any) => u.role !== 'admin');
        setUsers(nonAdminUsers);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.workspace_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const getStatusBadge = (user: UserCredential) => {
    if (user.status === 'inactive') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Inactive
        </Badge>
      );
    }
    
    if (!user.last_login) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Never Logged In
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  const handleRegeneratePassword = async (user: UserCredential) => {
    if (!confirm(`Generate a new password for ${user.email}?`)) return;

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        // Show the credentials modal with the new password
        setSelectedUser({
          ...user,
          password: data.tempPassword
        });
        setShowCredentialsModal(true);
        toast.success('New password generated');
        fetchUsers();
      } else {
        toast.error('Failed to generate new password');
      }
    } catch (error) {
      console.error('Error generating password:', error);
      toast.error('Failed to generate new password');
    }
  };

  const getStatistics = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active' && u.last_login).length;
    const neverLoggedIn = users.filter(u => !u.last_login).length;
    const inactive = users.filter(u => u.status === 'inactive').length;

    return { total, active, neverLoggedIn, inactive };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Credential Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user credentials and access
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Never Logged In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.neverLoggedIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by email, name, or workspace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>User Credentials ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user access and regenerate passwords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search
              </div>
            ) : (
              filteredUsers.map(user => (
                <Card key={user.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {user.name || user.email}
                          </h3>
                          {getStatusBadge(user)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.workspace_name && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {user.workspace_name}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                          {user.last_login && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3" />
                              Last login: {new Date(user.last_login).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegeneratePassword(user)}
                          title="Generate new password"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          New Password
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credentials Modal */}
      {showCredentialsModal && selectedUser && (
        <EnhancedCredentialsModal
          open={showCredentialsModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowCredentialsModal(false);
              setSelectedUser(null);
            }
          }}
          credentials={{
            username: selectedUser.email,
            password: selectedUser.password || '',
            multipleUsers: [{
              email: selectedUser.email,
              password: selectedUser.password || '',
              name: selectedUser.name,
              workspace: selectedUser.workspace_name || '',
              url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9015'}/login`
            }]
          }}
        />
      )}
    </div>
  );
}