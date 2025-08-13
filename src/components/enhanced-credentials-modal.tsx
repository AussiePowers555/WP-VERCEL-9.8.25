"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Check, 
  Copy, 
  Printer, 
  CheckCircle,
  Share2,
  MessageSquare,
  QrCode,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CredentialsData {
  workspaceName?: string;
  username: string;
  password: string;
  email?: string;
  loginUrl?: string;
  workspaceId?: string;
  userId?: string;
  multipleUsers?: Array<{
    userId?: string;
    email: string;
    name: string;
    password: string;
    workspace: string;
    url: string;
  }>;
}

interface EnhancedCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: CredentialsData | null;
  onDistributed?: (method: string, notes?: string) => void;
}

export function EnhancedCredentialsModal({
  open,
  onOpenChange,
  credentials,
  onDistributed,
}: EnhancedCredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [distributionNotes, setDistributionNotes] = useState("");
  const [isDistributed, setIsDistributed] = useState(false);
  const [distributionMethod, setDistributionMethod] = useState<string>("");
  const { toast } = useToast();

  if (!credentials) return null;

  const loginUrl = credentials.loginUrl || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/login`
      : 'http://localhost:9015/login');

  // Copy individual field to clipboard
  const copyField = async (field: string, value: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for older browsers or mobile
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          throw new Error('Copy failed');
        } finally {
          textArea.remove();
        }
      }
      
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      
      toast({
        title: `${field} copied`,
        description: `${field} has been copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the text manually",
        variant: "destructive",
      });
    }
  };

  // Copy all credentials in formatted text
  const copyAllCredentials = async () => {
    let credentialsText = '';
    
    if (credentials.multipleUsers && credentials.multipleUsers.length > 0) {
      // Format multiple users' credentials
      credentialsText = `Bulk User Credentials Created
================================
Workspace: ${credentials.multipleUsers[0].workspace}
Login URL: ${credentials.multipleUsers[0].url}

Users Created:
--------------
${credentials.multipleUsers.map((user, index) => `
${index + 1}. ${user.name}
   Email: ${user.email}
   Password: ${user.password}
`).join('\n')}

Please distribute these credentials securely to each user.`;
    } else {
      // Single user format
      credentialsText = `
${credentials.workspaceName ? `Workspace: ${credentials.workspaceName}\n` : ''}
Login Credentials
================
Login URL: ${loginUrl}
Username: ${credentials.username || credentials.email}
Password: ${credentials.password}

Please save these credentials securely.
${credentials.workspaceName ? `You now have access to the ${credentials.workspaceName} workspace.` : ''}
    `.trim();
    }

    await copyField("All Credentials", credentialsText);
  };

  // Copy as JSON format
  const copyAsJson = async () => {
    let jsonData;
    
    if (credentials.multipleUsers && credentials.multipleUsers.length > 0) {
      jsonData = JSON.stringify({
        workspace: credentials.multipleUsers[0].workspace,
        loginUrl: credentials.multipleUsers[0].url,
        users: credentials.multipleUsers.map(user => ({
          email: user.email,
          name: user.name,
          password: user.password
        })),
        timestamp: new Date().toISOString()
      }, null, 2);
    } else {
      jsonData = JSON.stringify({
        workspace: credentials.workspaceName,
        loginUrl,
        username: credentials.username || credentials.email,
        password: credentials.password,
        timestamp: new Date().toISOString()
      }, null, 2);
    }

    await copyField("JSON", jsonData);
  };

  // Export as CSV for bulk users
  const exportAsCSV = async () => {
    if (!credentials.multipleUsers || credentials.multipleUsers.length === 0) return;
    
    const csvHeader = 'Name,Email,Password,Workspace,Login URL';
    const csvRows = credentials.multipleUsers.map(user =>
      `"${user.name}","${user.email}","${user.password}","${user.workspace}","${user.url}"`
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    await copyField("CSV", csvContent);
  };

  // Print credentials
  const printCredentials = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups to print credentials",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Credentials - ${credentials.workspaceName || 'User'}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { 
            color: #333; 
            margin: 0 0 10px 0;
          }
          .credentials {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .field {
            margin: 15px 0;
            padding: 10px;
            background: white;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .value {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #000;
            word-break: break-all;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Login Credentials</h1>
          ${credentials.workspaceName ? `<p>Workspace: <strong>${credentials.workspaceName}</strong></p>` : ''}
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="credentials">
          <div class="field">
            <div class="label">Login URL</div>
            <div class="value">${loginUrl}</div>
          </div>
          
          <div class="field">
            <div class="label">Username</div>
            <div class="value">${credentials.username || credentials.email}</div>
          </div>
          
          <div class="field">
            <div class="label">Password</div>
            <div class="value">${credentials.password}</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Important:</strong></p>
          <ul>
            <li>Please store these credentials securely</li>
            <li>You may be required to change your password on first login</li>
            <li>Do not share these credentials with unauthorized persons</li>
          </ul>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Print dialog opened",
      description: "Credentials ready for printing",
    });
  };

  // Mark as distributed
  const markAsDistributed = async (method: string) => {
    try {
      // Make API call to track the distribution
      const response = await fetch('/api/credentials/track-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: credentials.userId || credentials.workspaceId, // Use userId if available, fallback to workspaceId
          workspaceId: credentials.workspaceId,
          recipientEmail: credentials.email,
          recipientName: credentials.workspaceName,
          distributionMethod: method,
          distributionNotes,
          credentialsData: {
            url: loginUrl,
            username: credentials.username || credentials.email,
            workspace: credentials.workspaceName
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track distribution');
      }

      setDistributionMethod(method);
      setIsDistributed(true);
      
      if (onDistributed) {
        onDistributed(method, distributionNotes);
      }
      
      toast({
        title: "Marked as distributed",
        description: `Credentials distributed via ${method}`,
      });
      
      // Close modal after brief delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Error tracking distribution:', error);
      toast({
        title: "Error",
        description: "Failed to record distribution. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate WhatsApp share URL
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`
Login Credentials:
URL: ${loginUrl}
Username: ${credentials.username || credentials.email}
Password: ${credentials.password}
    `.trim());
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
    markAsDistributed('WhatsApp');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {credentials.multipleUsers && credentials.multipleUsers.length > 0
              ? `${credentials.multipleUsers.length} Users Created Successfully!`
              : 'User Created Successfully!'}
          </DialogTitle>
          <DialogDescription>
            {credentials.multipleUsers && credentials.multipleUsers.length > 0
              ? `${credentials.multipleUsers.length} user accounts created for ${credentials.multipleUsers[0].workspace}`
              : credentials.workspaceName
                ? `User account created for ${credentials.workspaceName}`
                : 'New user account has been created'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isDistributed ? (
            <>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  Copy these credentials and share them securely with the user.
                  They are not sent via email.
                </AlertDescription>
              </Alert>

              {/* Credential Fields */}
              {credentials.multipleUsers && credentials.multipleUsers.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Workspace
                    </Label>
                    <Input
                      value={credentials.multipleUsers[0].workspace}
                      readOnly
                      className="font-mono bg-muted"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Login URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={credentials.multipleUsers[0].url}
                        readOnly
                        className="font-mono bg-muted"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyField("URL", credentials.multipleUsers?.[0]?.url || '')}
                      >
                        {copiedField === "URL" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Users Created ({credentials.multipleUsers.length})
                    </Label>
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Password</th>
                          </tr>
                        </thead>
                        <tbody>
                          {credentials.multipleUsers.map((user, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{user.name}</td>
                              <td className="p-2 font-mono text-xs">{user.email}</td>
                              <td className="p-2 font-mono text-xs bg-yellow-50">{user.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.workspaceName && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Workspace
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={credentials.workspaceName}
                          readOnly
                          className="font-mono bg-muted"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Login URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={loginUrl}
                        readOnly
                        className="font-mono bg-muted"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyField("URL", loginUrl)}
                      >
                        {copiedField === "URL" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Username
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={credentials.username || credentials.email || ''}
                        readOnly
                        className="font-mono bg-muted"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyField("Username", credentials.username || credentials.email || '')}
                      >
                        {copiedField === "Username" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Password
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={credentials.password}
                        readOnly
                        className="font-mono bg-yellow-50 border-yellow-200"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyField("Password", credentials.password)}
                      >
                        {copiedField === "Password" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  onClick={copyAllCredentials}
                  className="w-full"
                >
                  {copiedField === "All Credentials" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={printCredentials}
                  className="w-full"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                
                {credentials.multipleUsers && credentials.multipleUsers.length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={exportAsCSV}
                    className="w-full"
                  >
                    {copiedField === "CSV" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        CSV Copied!
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Copy as CSV
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={copyAsJson}
                    className="w-full"
                  >
                    {copiedField === "JSON" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        JSON Copied!
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Copy as JSON
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={shareViaWhatsApp}
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Distribution Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Distribution Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Sent via WhatsApp to John on 13/08/2025"
                  value={distributionNotes}
                  onChange={(e) => setDistributionNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Credentials marked as distributed via {distributionMethod}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isDistributed ? (
            <>
              <Button
                variant="outline"
                onClick={() => markAsDistributed("Manual")}
                className="w-full sm:w-auto"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Mark as Shared
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}