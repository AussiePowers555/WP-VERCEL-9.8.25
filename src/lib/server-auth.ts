import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { DatabaseService } from './database';
import type { UserWithWorkspace } from './database-schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  workspaceId?: string;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verify user still exists in database
    const user = await DatabaseService.getUserByEmail(decoded.email);
    if (!user || user.status !== 'active') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspace_id
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function createToken(user: { id: string; email: string; role: string; workspaceId?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Server-side authentication and authorization utilities
 * For protecting API routes with workspace-based access control
 */

export interface AuthResult {
  success: boolean;
  user?: UserWithWorkspace;
  error?: string;
}

/**
 * Extract user information from request headers
 * In a production app, this would validate JWT tokens or session cookies
 * For now, we'll use a simple header-based approach
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // In a real app, you would ensure the database is initialized here if needed,
    // but for JWT-based auth, we primarily rely on the token and then DB lookup.
    // await ensureDatabaseInitialized(); // This might not be needed if DB is always available

    const user = await getUserFromRequest(request);

    if (!user) {
      console.log('❌ [AUTH DEBUG] No valid authentication token found');
      return { success: false, error: 'Authentication required' };
    }

    // Get full workspace info if user has workspace_id
    let userWithWorkspace: UserWithWorkspace | undefined = undefined;
    if (user.workspaceId) {
      const workspace = await (DatabaseService as any).getWorkspaceById?.(user.workspaceId);
      if (workspace) {
        userWithWorkspace = {
          id: user.id,
          email: user.email,
          role: user.role as any,
          workspace_id: user.workspaceId!, // Ensure consistency with UserWithWorkspace
          workspace: workspace
        };
      } else {
        // Handle case where workspaceId is present but workspace not found
        console.warn(`Workspace with ID ${user.workspaceId} not found for user ${user.email}`);
        // Decide if this should be an error or if the user can still proceed without workspace data
      }
    } else {
       // If user has no workspace_id, create a UserWithWorkspace object without workspace details
       userWithWorkspace = {
         id: user.id,
         email: user.email,
         role: user.role as any,
         workspace_id: undefined,
         workspace: undefined
       } as any;
    }
    
    // Ensure userWithWorkspace is defined before returning
    if (!userWithWorkspace) {
       // This case might happen if getUserFromRequest succeeded but workspace lookup failed and we decided to error out
       // Or if the initial user object itself was incomplete.
       // For now, let's assume if getUserFromRequest succeeds, we can construct a partial userWithWorkspace.
       // If user.workspaceId was present but workspace was not found, userWithWorkspace might still be undefined here.
       // Let's refine: if user is found, we should always return a UserWithWorkspace structure,
       // even if workspace is null/undefined.

       // Re-construct userWithWorkspace to ensure it always exists if user exists
       const workspaceData = user.workspaceId ? await (DatabaseService as any).getWorkspaceById?.(user.workspaceId) : undefined;
       userWithWorkspace = {
           id: user.id,
           email: user.email,
           role: user.role as any,
           workspace_id: user.workspaceId || undefined,
           workspace: workspaceData
       };
    }


    console.log('✅ [AUTH DEBUG] User authenticated successfully:', userWithWorkspace);
    
    return { success: true, user: userWithWorkspace };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Check if user can access cases based on their workspace
 */
export function canAccessCase(user: UserWithWorkspace, caseWorkspaceId?: string): boolean {
  // Admin users can access all cases
  if (user.role === 'admin' || user.role === 'developer') {
    return true;
  }
  
  // Workspace users can only access cases in their workspace or unassigned cases
  if (user.workspace_id) {
    return !caseWorkspaceId || caseWorkspaceId === user.workspace_id;
  }
  
  // Users without workspace can only access unassigned cases
  return !caseWorkspaceId;
}

/**
 * Filter cases based on user's workspace access
 */
export function filterCasesForUser(user: UserWithWorkspace, cases: any[]): any[] {
  // Admin users see all cases
  if (user.role === 'admin' || user.role === 'developer') {
    return cases;
  }
  
  // Filter based on workspace access - handle both formats
  return cases.filter(caseItem => canAccessCase(user, caseItem.workspace_id || caseItem.workspaceId));
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<{ user: UserWithWorkspace } | Response> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success || !authResult.user) {
    return new Response(
      JSON.stringify({ error: authResult.error || 'Authentication required' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return { user: authResult.user };
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: NextRequest): Promise<{ user: UserWithWorkspace } | Response> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult; // Return the error response
  }
  
  const { user } = authResult;
  
  if (user.role !== 'admin' && user.role !== 'developer') {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }), 
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return { user };
}

/**
 * Check if user can access specific workspace
 */
export function canAccessWorkspace(user: UserWithWorkspace, workspaceId: string): boolean {
  // Admin users can access any workspace
  if (user.role === 'admin' || user.role === 'developer') {
    return true;
  }
  
  // Workspace users can only access their own workspace
  return user.workspace_id === workspaceId;
}