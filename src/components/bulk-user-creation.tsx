'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, Copy, Trash2, Users, Download, CheckCircle2, XCircle, Upload, FileText } from 'lucide-react';
import { EnhancedCredentialsModal } from '@/components/enhanced-credentials-modal';
import { parseUserCSV, downloadCSV } from '@/lib/csv-utils';

interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace?: string;
  password?: string;
  selected: boolean;
  status: 'pending' | 'creating' | 'success' | 'error';
  errorMessage?: string;
}

interface BulkUserCreationProps {
  workspaceId?: string;
  workspaceName?: string;
  onComplete?: () => void;
}

export function BulkUserCreation({ workspaceId, workspaceName, onComplete }: BulkUserCreationProps) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse email input (supports comma, semicolon, or newline separated)
  const parseEmails = (input: string): string[] => {
    const emails = input
      .split(/[,;\n]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.filter(email => emailRegex.test(email));
  };

  // Handle CSV file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const parsedUsers = await parseUserCSV(text);
      
      if (parsedUsers.length === 0) {
        toast.error('No valid users found in CSV file');
        return;
      }

      // Check for duplicates
      const existingEmails = users.map(u => u.email.toLowerCase());
      const uniqueNewUsers = parsedUsers.filter(
        user => !existingEmails.includes(user.email.toLowerCase())
      );

      if (uniqueNewUsers.length === 0) {
        toast.warning('All users from CSV already in the list');
        return;
      }

      // Add new users from CSV
      const newUsers: UserEntry[] = uniqueNewUsers.map(user => ({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: user.email.toLowerCase(),
        name: user.name || user.email.split('@')[0],
        role: user.role || 'workspace_user',
        workspace: user.workspace || workspaceName || '',
        selected: false,
        status: 'pending'
      }));

      setUsers([...users, ...newUsers]);
      toast.success(`Imported ${newUsers.length} user(s) from CSV`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file');
    }
  };

  // Trigger file upload dialog
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    // Generate CSV string for template
    const headers = ['Email', 'Name', 'Role', 'Workspace Name'];
    const sampleRows = [
      ['john.doe@example.com', 'John Doe', 'workspace_user', 'Sample Workspace'],
      ['jane.smith@example.com', 'Jane Smith', 'rental_company', 'Another Workspace'],
      ['bob.jones@example.com', 'Bob Jones', 'workspace_user', 'Sample Workspace']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'user-import-template.csv');
    toast.success('Sample template downloaded');
  };

  // Add emails to the list
  const handleAddEmails = () => {
    const newEmails = parseEmails(emailInput);
    
    if (newEmails.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }

    // Check for duplicates
    const existingEmails = users.map(u => u.email.toLowerCase());
    const uniqueNewEmails = newEmails.filter(
      email => !existingEmails.includes(email.toLowerCase())
    );

    if (uniqueNewEmails.length === 0) {
      toast.warning('All emails already in the list');
      return;
    }

    // Add new users
    const newUsers: UserEntry[] = uniqueNewEmails.map(email => ({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      name: email.split('@')[0], // Default name from email
      role: 'workspace_user',
      workspace: workspaceName || '',
      selected: false,
      status: 'pending'
    }));

    setUsers([...users, ...newUsers]);
    setEmailInput('');
    toast.success(`Added ${newUsers.length} email(s) to the list`);
  };

  // Generate password for a user
  const generatePassword = (): string => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Toggle selection for a user
  const toggleUserSelection = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, selected: !user.selected } : user
    ));
  };

  // Toggle select all
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setUsers(users.map(user => ({ ...user, selected: newSelectAll })));
  };

  // Remove selected users
  const handleRemoveSelected = () => {
    const selectedCount = users.filter(u => u.selected).length;
    if (selectedCount === 0) {
      toast.error('No users selected');
      return;
    }

    setUsers(users.filter(user => !user.selected));
    setSelectAll(false);
    toast.success(`Removed ${selectedCount} user(s)`);
  };

  // Update user field
  const updateUser = (userId: string, field: keyof UserEntry, value: any) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  // Create selected users
  const handleCreateUsers = async () => {
    const selectedUsers = users.filter(u => u.selected);
    
    if (selectedUsers.length === 0) {
      toast.error('No users selected for creation');
      return;
    }

    setIsCreating(true);
    const credentials: any[] = [];

    // Process each user
    for (const user of selectedUsers) {
      try {
        // Update status to creating
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, status: 'creating' } : u
        ));

        // Generate password
        const password = generatePassword();

        // Create user via API
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            role: user.role,
            workspace_id: workspaceId || null,
            password: password
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create user');
        }

        const result = await response.json();

        // Update user with success
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, status: 'success', password } : u
        ));

        // Add to credentials list
        credentials.push({
          userId: result.user.id,
          email: user.email,
          name: user.name,
          password: password,
          workspace: workspaceName || 'Main Workspace',
          url: `${window.location.origin}/login`
        });

      } catch (error) {
        // Update user with error
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { 
            ...u, 
            status: 'error', 
            errorMessage: error instanceof Error ? error.message : 'Unknown error' 
          } : u
        ));
      }
    }

    setIsCreating(false);

    // Show results
    const successCount = credentials.length;
    const errorCount = selectedUsers.length - successCount;

    if (successCount > 0) {
      setCreatedCredentials(credentials);
      setShowCredentials(true);
      toast.success(`Successfully created ${successCount} user(s)`);
    }

    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} user(s)`);
    }
  };

  // Copy all credentials
  const handleCopyAllCredentials = () => {
    const selectedUsers = users.filter(u => u.selected && u.status === 'success');
    
    if (selectedUsers.length === 0) {
      toast.error('No successfully created users to copy');
      return;
    }

    const credentialsText = selectedUsers.map(user => 
      `Email: ${user.email}\nPassword: ${user.password}\nWorkspace: ${user.workspace || 'Main'}\nURL: ${window.location.origin}/login`
    ).join('\n\n---\n\n');

    navigator.clipboard.writeText(credentialsText);
    toast.success('All credentials copied to clipboard');
  };

  // Export credentials as CSV
  const handleExportCSV = () => {
    const selectedUsers = users.filter(u => u.selected && u.status === 'success');
    
    if (selectedUsers.length === 0) {
      toast.error('No successfully created users to export');
      return;
    }

    const csv = [
      ['Email', 'Password', 'Name', 'Workspace', 'Login URL'].join(','),
      ...selectedUsers.map(user => [
        user.email,
        user.password || '',
        user.name,
        user.workspace || 'Main',
        `${window.location.origin}/login`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credentials-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Credentials exported as CSV');
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-input">Add Email Addresses</Label>
            <Textarea
              id="email-input"
              placeholder="Enter email addresses (comma, semicolon, or newline separated)&#10;Example:&#10;user1@example.com&#10;user2@example.com, user3@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAddEmails}
              disabled={!emailInput.trim()}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to List
            </Button>
            <Button
              onClick={handleImportClick}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* User List */}
      {users.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">
                  Select All ({users.filter(u => u.selected).length}/{users.length})
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveSelected}
                  disabled={users.filter(u => u.selected).length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAllCredentials}
                  disabled={users.filter(u => u.selected && u.status === 'success').length === 0}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={users.filter(u => u.selected && u.status === 'success').length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* User Table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user.id} className="text-sm">
                      <td className="p-3">
                        <Checkbox
                          checked={user.selected}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="p-3 font-mono">{user.email}</td>
                      <td className="p-3">
                        <Input
                          value={user.name}
                          onChange={(e) => updateUser(user.id, 'name', e.target.value)}
                          className="h-8 w-32"
                          disabled={user.status !== 'pending'}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {user.status === 'pending' && (
                            <span className="text-muted-foreground">Ready</span>
                          )}
                          {user.status === 'creating' && (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Creating...</span>
                            </>
                          )}
                          {user.status === 'success' && (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Created</span>
                            </>
                          )}
                          {user.status === 'error' && (
                            <>
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">Failed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {user.password && (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.password}
                          </code>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCreateUsers}
                disabled={isCreating || users.filter(u => u.selected && u.status === 'pending').length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Users...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Selected Users
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Credentials Modal */}
      {showCredentials && createdCredentials.length > 0 && (
        <EnhancedCredentialsModal
          open={showCredentials}
          onOpenChange={(open) => {
            if (!open) {
              setShowCredentials(false);
              if (onComplete) onComplete();
            }
          }}
          credentials={{
            workspaceName: workspaceName || 'Main Workspace',
            username: `Multiple Users (${createdCredentials.length})`,
            password: 'See individual credentials',
            loginUrl: `${window.location.origin}/login`,
            userId: '',
            workspaceId: workspaceId || '',
            multipleUsers: createdCredentials
          }}
        />
      )}
    </div>
  );
}