"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function FirstLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Do not redirect away on initial mount.
  // On first load, auth context may not be hydrated yet which caused a flash back to /login.
  // We allow password change form to render regardless and rely on the httpOnly cookie for auth.

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check password complexity (at least one uppercase, one lowercase, one number or special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number or special character");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: password,
          isFirstLogin: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast({
        title: "Password changed successfully",
        description: "Your password has been updated. Redirecting to dashboard...",
      });

      // Redirect to dashboard after successful password change
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Password change error:", error);
      setError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Welcome! Please set a new password for your account to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number/special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating Password..." : "Set Password"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Password Requirements:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains at least one uppercase letter (A-Z)</li>
              <li>• Contains at least one lowercase letter (a-z)</li>
              <li>• Contains at least one number or special character</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}