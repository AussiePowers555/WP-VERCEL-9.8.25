import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { DatabaseService } from "@/lib/database";
import { z } from "zod";

const bulkCreateSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(1),
    workspaceId: z.string().uuid(),
  })),
});

function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = bulkCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { users } = validationResult.data;
    const createdUsers = [];
    const errors = [];
    const db = DatabaseService;

    // Get workspace details for the first user (assuming all users are for the same workspace)
    const workspaceId = users[0].workspaceId;
    const workspace = await db.getWorkspaceById(workspaceId);
    
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Process each user
    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(userData.email);
        if (existingUser) {
          errors.push({
            email: userData.email,
            error: "User already exists"
          });
          continue;
        }

        // Generate password
        const password = generatePassword();

        // Create user with workspace access
        const newUser = await db.createUserAccount({
          email: userData.email,
          password_hash: password, // In production, this should be hashed
          role: 'workspace_user',
          workspace_id: userData.workspaceId, // Set workspace directly on user
          status: 'active',
          first_login: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        createdUsers.push({
          userId: newUser.id,
          email: userData.email,
          name: userData.name,
          password,
          workspace: workspace.name,
          url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9015/login',
        });

        // Track credential distribution (simplified - skip if not available)
        // This is handled by the UI when displaying credentials

      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Failed to create user'
        });
      }
    }

    return NextResponse.json({
      success: true,
      createdUsers,
      errors,
      summary: {
        total: users.length,
        created: createdUsers.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Bulk user creation error:', error);
    return NextResponse.json(
      { error: "Failed to create users", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}