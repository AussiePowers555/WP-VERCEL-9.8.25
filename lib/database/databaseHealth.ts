import { DatabaseService } from './DatabaseService';

export async function logDatabaseHealth() {
  try {
    console.log('[DB HEALTH] Checking database connection...');
    
    // 1. Verify database initialization
    console.log(`[DB HEALTH] Initialized: ${DatabaseService.isInitialized()}`);
    
    // 2. Verify tables exist
    const tables = await DatabaseService.getTableList();
    console.log('[DB HEALTH] Tables:', tables);
    
    // 3. Verify case table structure
    if (tables.includes('cases')) {
      const columns = await DatabaseService.getTableColumns('cases');
      console.log('[DB HEALTH] Cases table columns:', columns);
    }
    
    // 4. Verify basic query
    const testQuery = await DatabaseService.rawQuery('SELECT 1 + 1 AS result');
    console.log('[DB HEALTH] Test query result:', testQuery);
    
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
