'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Loader2 } from 'lucide-react';
import { EnhancedCredentialsModal } from '@/components/enhanced-credentials-modal';

interface Workspace {
  id: string;
  name: string;
  type?: string;
}

interface Contact {
  id: string;
  name: string;
  company?: string;
  type: string;
}

interface UserCreateFormProps {
  onClose: () => void;
  onUserCreated: () => void;
}

export default function UserCreateForm({ onClose, onUserCreated }: UserCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    workspace_id: '',
    contact_id: '',
    send_email: true
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
    email?: string;
    workspaceName?: string;
    userId?: string;
    workspaceId?: string;
  } | null>(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchContacts();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          workspace_id: formData.workspace_id || null,
          contact_id: formData.contact_id || null
        })
      });

      const data = await response.json();

      if (data.success && data.credentials) {
        // Get workspace name if selected
        const workspace = workspaces.find(w => w.id === formData.workspace_id);
        
        // Show credentials in enhanced modal
        setCreatedCredentials({
          username: data.credentials.email,
          password: data.credentials.password,
          email: data.credentials.email,
          workspaceName: workspace?.name,
          userId: data.user?.id,
          workspaceId: formData.workspace_id || undefined
        });
        setShowCredentialsModal(true);
        
        // Reset form
        setFormData({
          email: '',
          role: '',
          workspace_id: '',
          contact_id: '',
          send_email: false
        });
        
        // Notify parent after modal is closed
        onUserCreated();
      } else {
        // Show error in toast or alert
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>
                Create a new user account for PBike Rescue
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="rental_company">Rental Company</SelectItem>
                  <SelectItem value="workspace_user">Workspace User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workspace">Workspace (Optional)</Label>
              <Select
                value={formData.workspace_id}
                onValueChange={(value) => setFormData({ ...formData, workspace_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No workspace restriction</SelectItem>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Leave blank for admin users or users with access to all data
              </p>
            </div>

            <div>
              <Label htmlFor="contact">Associated Contact (Optional)</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No associated contact</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`} - {contact.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_email"
                checked={formData.send_email}
                onCheckedChange={(checked) => setFormData({ ...formData, send_email: !!checked })}
                disabled
              />
              <Label htmlFor="send_email" className="text-sm text-muted-foreground">
                Email sending disabled (credentials shown on screen)
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Enhanced Credentials Modal */}
      <EnhancedCredentialsModal
        open={showCredentialsModal}
        onOpenChange={(open) => {
          setShowCredentialsModal(open);
          if (!open) {
            setCreatedCredentials(null);
            onClose();
          }
        }}
        credentials={createdCredentials}
        onDistributed={(method, notes) => {
          console.log(`Credentials distributed via ${method}`, notes);
        }}
      />
    </div>
  );
}