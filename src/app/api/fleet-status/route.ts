import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    // Query to get all bikes with their assignment details
    const bikesQuery = workspaceId 
      ? `SELECT 
          b.id,
          b.make,
          b.model,
          b.status,
          b.assignment,
          b.assigned_case_id as "assignedCaseId",
          b.assignment_start_date as "assignmentStartDate",
          b.assignment_end_date as "assignmentEndDate"
        FROM bikes b
        WHERE b.workspace_id = $1
        ORDER BY b.assignment_start_date DESC NULLS LAST`
      : `SELECT 
          b.id,
          b.make,
          b.model,
          b.status,
          b.assignment,
          b.assigned_case_id as "assignedCaseId",
          b.assignment_start_date as "assignmentStartDate",
          b.assignment_end_date as "assignmentEndDate"
        FROM bikes b
        ORDER BY b.assignment_start_date DESC NULLS LAST`;
    
    const bikesResult = workspaceId 
      ? await sql.query(bikesQuery, [workspaceId])
      : await sql.query(bikesQuery);
    
    const bikes = bikesResult.rows || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count bikes by status
    const statusCounts = bikes.reduce((acc: Record<string, number>, bike: any) => {
      acc[bike.status] = (acc[bike.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get assigned bikes with case details
    const assignedBikes = bikes.filter((bike: any) => bike.status === 'assigned' && bike.assignedCaseId);
    
    // Calculate recent assignments (last 5)
    const recentAssignments = assignedBikes
      .filter((bike: any) => bike.assignmentStartDate)
      .slice(0, 5)
      .map((bike: any) => {
        const startDate = new Date(bike.assignmentStartDate);
        const endDate = bike.assignmentEndDate ? new Date(bike.assignmentEndDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          bikeId: bike.id,
          bikeName: `${bike.make} ${bike.model}`,
          caseNumber: bike.assignedCaseId || 'N/A',
          assignmentDate: startDate,
          expectedReturn: endDate,
          daysRemaining: Math.max(0, daysRemaining)
        };
      });
    
    // Count bikes due today and tomorrow
    const bikesDueToday = assignedBikes.filter((bike: any) => {
      if (!bike.assignmentEndDate) return false;
      const endDate = new Date(bike.assignmentEndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() === today.getTime();
    }).length;
    
    const bikesDueTomorrow = assignedBikes.filter((bike: any) => {
      if (!bike.assignmentEndDate) return false;
      const endDate = new Date(bike.assignmentEndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() === tomorrow.getTime();
    }).length;
    
    // Calculate average rental duration (default to 7 if no data)
    const averageRentalDuration = 7;
    
    const totalBikes = bikes.length;
    const availableBikes = statusCounts['available'] || 0;
    const assignedBikesCount = statusCounts['assigned'] || 0;
    const maintenanceBikes = statusCounts['maintenance'] || 0;
    const retiredBikes = statusCounts['retired'] || 0;
    
    // Calculate utilization rate (assigned / (total - retired))
    const activeBikes = totalBikes - retiredBikes;
    const utilizationRate = activeBikes > 0 ? (assignedBikesCount / activeBikes) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totalBikes,
        availableBikes,
        assignedBikes: assignedBikesCount,
        maintenanceBikes,
        retiredBikes,
        utilizationRate: Math.round(utilizationRate),
        recentAssignments,
        bikesDueToday,
        bikesDueTomorrow,
        averageRentalDuration,
        statusDistribution: {
          available: availableBikes,
          assigned: assignedBikesCount,
          maintenance: maintenanceBikes,
          retired: retiredBikes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching fleet status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch fleet status' 
    }, { status: 500 });
  }
}