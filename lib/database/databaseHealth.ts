import { DatabaseService } from '@/lib/database';

export async function logDatabaseHealth() {
  try {
    console.log('[DB HEALTH] Checking database connection...');
    
    // 1. Verify by fetching cases
    const cases = await DatabaseService.getAllCases();
    console.log(`[DB HEALTH] Found ${cases.length} cases`);
    
    // 2. Verify contacts
    const contacts = await DatabaseService.getAllContacts();
    console.log(`[DB HEALTH] Found ${contacts.length} contacts`);
    
    console.log('[DB HEALTH] Database connection is healthy');
  } catch (error: unknown) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[DB HEALTH ERROR]', error);
    throw new Error(`Database health check failed: ${errorMessage}`);
  }
}
