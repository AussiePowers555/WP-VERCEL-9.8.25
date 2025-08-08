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
import { Check, Copy, Mail } from "lucide-react";
import { sendWelcomeEmail } from "@/lib/brevo";
import { useToast } from "@/hooks/use-toast";

interface CredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: {
    contactName: string;
    workspaceName: string;
    username: string;
    tempPassword: string;
    contactEmail: string;
  } | null;
}

export function CredentialsModal({
  open,
  onOpenChange,
  credentials,
}: CredentialsModalProps) {
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  if (!credentials) return null;

  const loginUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/login`
    : 'http://localhost:9015/login';

  const copyAllCredentials = async () => {
    const credentialsText = `
Workspace User Created!

Login URL: ${loginUrl}
Username: ${credentials.username}
Temporary Password: ${credentials.tempPassword}

Please login and change your password on first use.
    `.trim();

    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Credentials copied",
        description: "Login details have been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the credentials manually",
        variant: "destructive",
      });
    }
  };

  const handleSendWelcomeEmail = async () => {
    setSendingEmail(true);
    try {
      const result = await sendWelcomeEmail({
        to: credentials.contactEmail,
        contactName: credentials.contactName,
        workspaceName: credentials.workspaceName,
        username: credentials.username,
        tempPassword: credentials.tempPassword,
      });

      if (result.success) {
        toast({
          title: "Welcome email sent",
          description: `Email sent successfully to ${credentials.contactEmail}`,
        });
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace User Created!</DialogTitle>
          <DialogDescription>
            A workspace and user account have been created for {credentials.contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Please share these credentials securely with the user. They will be required to change their password on first login.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Login URL</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{loginUrl}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Username</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{credentials.username}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Temporary Password</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{credentials.tempPassword}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={copyAllCredentials}
            className="w-full sm:w-auto"
          >
            {copied ? (
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
            onClick={handleSendWelcomeEmail}
            disabled={sendingEmail}
            className="w-full sm:w-auto"
          >
            <Mail className="mr-2 h-4 w-4" />
            {sendingEmail ? "Sending..." : "Send Welcome Email"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}