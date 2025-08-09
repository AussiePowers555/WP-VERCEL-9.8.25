import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { importedBikes } from '@/data/imported-bikes';
import type { BikeFrontend as Bike } from '@/lib/database-schema';
import { requireAuth, getUserFromRequest } from '@/lib/server-auth';

// Transform database row to Bike interface
function transformDbBikeToFrontend(dbBike: any): Bike {
  return {
    id: dbBike.id,
    make: dbBike.make,
    model: dbBike.model,
    registration: dbBike.registration,
    registrationExpires: dbBike.registration_expires || '',
    serviceCenter: dbBike.service_center,
    serviceCenterContactId: dbBike.service_center_contact_id,
    deliveryStreet: dbBike.delivery_street,
    deliverySuburb: dbBike.delivery_suburb,
    deliveryState: dbBike.delivery_state,
    deliveryPostcode: dbBike.delivery_postcode,
    lastServiceDate: dbBike.last_service_date || '',
    serviceNotes: dbBike.service_notes,
    status: dbBike.status || 'Available',
    location: dbBike.location || 'Main Warehouse',
    dailyRate: dbBike.daily_rate,
    dailyRateA: dbBike.daily_rate_a || dbBike.daily_rate || 85,
    dailyRateB: dbBike.daily_rate_b || 95,
    imageUrl: dbBike.image_url || 'https://placehold.co/300x200.png',
    imageHint: dbBike.image_hint || 'motorcycle sport',
    assignment: dbBike.assignment || '-',
    assignedCaseId: dbBike.assigned_case_id,
    assignmentStartDate: dbBike.assignment_start_date,
    assignmentEndDate: dbBike.assignment_end_date
  };
}

// Transform frontend bike to database format
function transformFrontendBikeToDb(bike: any): any {
  return {
    ...bike,
    registration_expires: bike.registrationExpires,
    service_center: bike.serviceCenter,
    service_center_contact_id: bike.serviceCenterContactId,
    delivery_street: bike.deliveryStreet,
    delivery_suburb: bike.deliverySuburb,
    delivery_state: bike.deliveryState,
    delivery_postcode: bike.deliveryPostcode,
    last_service_date: bike.lastServiceDate,
    service_notes: bike.serviceNotes,
    daily_rate: bike.dailyRate,
    daily_rate_a: bike.dailyRateA,
    daily_rate_b: bike.dailyRateB,
    image_url: bike.imageUrl,
    image_hint: bike.imageHint,
    assigned_case_id: bike.assignedCaseId,
    assignment_start_date: bike.assignmentStartDate,
    assignment_end_date: bike.assignmentEndDate
  };
}

export async function GET(request: NextRequest) {
  try {
    // If database is not configured (e.g., preview without env vars), return seed
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set. Serving seeded bikes list for preview environment.');
      return NextResponse.json(importedBikes.map((b) => {
        try { return transformDbBikeToFrontend(b as any); } catch { return b as any; }
      }));
    }

    await ensureDatabaseInitialized();

    // Best-effort auth (do not block list rendering if cookie not yet hydrated)
    const authUser = await getUserFromRequest(request).catch(() => null);
    const userRole = (authUser as any)?.role || 'workspace_user';
    const workspaceId = (authUser as any)?.workspaceId || (authUser as any)?.workspace_id;

    // Get bikes filtered by workspace if user is workspace-scoped
    let bikes: any[] | undefined;
    try {
      if (((userRole as any) === 'workspace' || (userRole as any) === 'workspace_user') && workspaceId) {
        bikes = await (DatabaseService as any).getBikes?.(workspaceId);
      } else {
        bikes = await (DatabaseService as any).getBikes?.();
      }
    } catch (innerErr) {
      console.warn('⚠️ getBikes failed, falling back to empty list:', (innerErr as any)?.message);
      bikes = [];
    }

    if (!Array.isArray(bikes)) {
      bikes = [];
    }

    // If no bikes in database, import seed for admin/developer
    if (bikes.length === 0 && (userRole === 'admin' || userRole === 'developer')) {
      try {
        console.log('No bikes in database, importing initial seed...');
        await (DatabaseService as any).bulkInsertBikes?.(importedBikes);
        bikes = (await (DatabaseService as any).getBikes?.()) || [];
      } catch (seedErr) {
        console.warn('⚠️ Bike seed failed, serving inline seed only:', (seedErr as any)?.message);
        bikes = importedBikes as any[];
      }
    }

    // Transform bikes to frontend format (idempotent for already-frontend shaped items)
    const transformedBikes = (bikes as any[]).map((b) => {
      try { return transformDbBikeToFrontend(b); } catch { return b; }
    });

    return NextResponse.json(transformedBikes);
  } catch (error) {
    console.error('Error fetching bikes (outer):', error);
    // Never block the UI — return empty list
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Authenticate user - fixed to use proper return type
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { user } = authResult;
    const userId = user.id;
    const userRole = user.role;
    const workspaceId = user.workspace_id;
    
    const bikeData = await request.json();
    
    // Transform to database format
    const dbBikeData = transformFrontendBikeToDb(bikeData);
    
    // Set workspace_id for workspace users
    if ((userRole as any) === 'workspace' && workspaceId) {
      dbBikeData.workspace_id = workspaceId;
    }
    
    const newBike = await (DatabaseService as any).createBike?.(dbBikeData);
    
    // Transform back to frontend format
    const transformedBike = transformDbBikeToFrontend(newBike);
    
    return NextResponse.json(transformedBike, { status: 201 });
  } catch (error) {
    console.error('Error creating bike:', error);
    return NextResponse.json({ error: 'Failed to create bike' }, { status: 500 });
  }
}