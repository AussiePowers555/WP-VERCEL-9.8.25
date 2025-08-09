
// Database implementation with PostgreSQL and SQLite support
import { Pool, Client } from 'pg';
import type {
  Case,
  Contact,
  Workspace,
  UserAccount,
  UserWithWorkspace,
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  BikeFrontend,
  SignatureToken,
  DigitalSignature,
  RentalAgreement,
  Bike
} from './database-schema';
import { SchemaTransformers } from './database-schema';
import type { IDatabaseService } from './database-interface';
// Removed SQLite fallback. Postgres (Neon) is the single source of truth.

// Postgres-only configuration

// Database connection pool
let pool: Pool | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Initialize PostgreSQL connection pool
function initializePool() {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Use direct connection instead of pooler to avoid TLS certificate issues in development
  // In production, you may want to use the pooler URL for better performance
  const connectionUrl = process.env.NODE_ENV === 'production' && databaseUrl.includes('-pooler.') 
    ? databaseUrl 
    : databaseUrl.replace('-pooler.', '.');
  
  pool = new Pool({
    connectionString: connectionUrl,
    max: 5, // Reduced max connections
    min: 1, // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
    ssl: {
      rejectUnauthorized: false // Allow self-signed certificates in development
    }
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  pool.on('connect', () => {
    console.log('✅ PostgreSQL pool connection established');
  });

  return pool;
}

// Initialize database with tables and seed data
export async function initializeDatabase() {
  if (typeof window !== 'undefined') {
    throw new Error('Database initialization must be performed server-side only');
  }

  if (isInitializing && initializationPromise) {
    console.log('⏳ Database initialization in progress, waiting...');
    return initializationPromise;
  }

  if (pool) {
    console.log('✅ Database already initialized, reusing connection');
    return;
  }

  isInitializing = true;
  
  initializationPromise = (async () => {
    try {
      console.log('🔧 Initializing PostgreSQL database...');
      
      // Test basic connectivity first
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      
      initializePool();
      
      // Wait a moment for pool to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await createTables();
      await seedInitialData();
      
      console.log('✅ PostgreSQL database initialized successfully');
      isInitializing = false;
    } catch (error) {
      isInitializing = false;
      initializationPromise = null;
      console.error('❌ Database initialization failed:', error);
      
      // Clean up pool on failure
      if (pool) {
        try {
          await (pool as any).end();
          pool = null;
        } catch (cleanupError) {
          console.error('Error cleaning up pool:', cleanupError);
        }
      }
      
      throw error;
    }
  })();
  
  return initializationPromise;
}

async function createTables() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`🔌 Attempting to connect to database (${4 - retries}/3)...`);
      client = await pool.connect();
      break;
    } catch (error) {
      retries--;
      const err: any = error as any;
      console.warn(`⚠️ Database connection attempt failed. Retries left: ${retries}`, err?.message);
      
      if (retries === 0) {
        const errFinal: any = error as any;
        throw new Error(`Failed to connect to database after 3 attempts: ${errFinal?.message}`);
      }
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!client) {
    throw new Error('Unable to establish database connection');
  }
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_number VARCHAR(255) UNIQUE NOT NULL,
        workspace_id UUID,
        status VARCHAR(255) NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50),
        client_email VARCHAR(255),
        client_street_address TEXT,
        client_suburb VARCHAR(255),
        client_state VARCHAR(10),
        client_postcode VARCHAR(10),
        client_claim_number VARCHAR(255),
        client_insurance_company VARCHAR(255),
        client_insurer VARCHAR(255),
        client_vehicle_rego VARCHAR(50),
        at_fault_party_name VARCHAR(255) NOT NULL,
        at_fault_party_phone VARCHAR(50),
        at_fault_party_email VARCHAR(255),
        at_fault_party_street_address TEXT,
        at_fault_party_suburb VARCHAR(255),
        at_fault_party_state VARCHAR(10),
        at_fault_party_postcode VARCHAR(10),
        at_fault_party_claim_number VARCHAR(255),
        at_fault_party_insurance_company VARCHAR(255),
        at_fault_party_insurer VARCHAR(255),
        at_fault_party_vehicle_rego VARCHAR(50),
        rental_company VARCHAR(255),
        lawyer VARCHAR(255),
        assigned_lawyer_id UUID,
        assigned_rental_company_id UUID,
        invoiced DECIMAL(10,2) DEFAULT 0,
        reserve DECIMAL(10,2) DEFAULT 0,
        agreed DECIMAL(10,2) DEFAULT 0,
        paid DECIMAL(10,2) DEFAULT 0,
        accident_date DATE,
        accident_time TIME,
        accident_description TEXT,
        accident_diagram TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contacts table (email unique)
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        type VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255) UNIQUE,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Workspaces table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        contact_id UUID NOT NULL,
        type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )
    `);

    // User accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        contact_id UUID,
        workspace_id UUID,
        first_login BOOLEAN DEFAULT TRUE,
        remember_login BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
      )
    `);

    // Signature tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS signature_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token VARCHAR(255) UNIQUE NOT NULL,
        case_id UUID NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        form_data TEXT,
        form_link TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        signed_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        jotform_submission_id VARCHAR(255),
        pdf_url TEXT,
        document_url TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Case interactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_number VARCHAR(255) NOT NULL,
        source VARCHAR(255) NOT NULL,
        method VARCHAR(100) NOT NULL,
        situation TEXT NOT NULL,
        action TEXT NOT NULL,
        outcome TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Digital signatures table
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_signatures (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID NOT NULL,
        signature_token_id UUID,
        signature_data TEXT NOT NULL,
        signer_name VARCHAR(255) NOT NULL,
        terms_accepted BOOLEAN DEFAULT FALSE,
        signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rental agreements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rental_agreements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID NOT NULL,
        signature_id UUID,
        rental_details TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        signed_at TIMESTAMP WITH TIME ZONE,
        signed_by VARCHAR(255),
        pdf_url TEXT,
        pdf_path TEXT,
        pdf_generated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bikes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bikes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        registration VARCHAR(50),
        registration_expires DATE,
        service_center VARCHAR(255),
        service_center_contact_id UUID,
        delivery_street VARCHAR(255),
        delivery_suburb VARCHAR(255),
        delivery_state VARCHAR(10),
        delivery_postcode VARCHAR(10),
        last_service_date DATE,
        service_notes TEXT,
        status VARCHAR(50) DEFAULT 'Available',
        location VARCHAR(255) DEFAULT 'Main Warehouse',
        daily_rate DECIMAL(10,2) DEFAULT 85.00,
        daily_rate_a DECIMAL(10,2) DEFAULT 85.00,
        daily_rate_b DECIMAL(10,2) DEFAULT 95.00,
        image_url TEXT,
        image_hint TEXT,
        assignment VARCHAR(255) DEFAULT '-',
        assigned_case_id VARCHAR(255),
        assignment_start_date DATE,
        assignment_end_date DATE,
        workspace_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL
      )
    `);

    // Signed documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS signed_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        sha256_hash VARCHAR(64) NOT NULL,
        signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        signed_by VARCHAR(255) NOT NULL,
        signature_data TEXT NOT NULL,
        ip_address INET NOT NULL,
        user_agent TEXT NOT NULL,
        encryption_key_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases (case_number);
      CREATE INDEX IF NOT EXISTS idx_cases_workspace_id ON cases (workspace_id);
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts (email);
      CREATE INDEX IF NOT EXISTS idx_signature_tokens_token ON signature_tokens (token);
      CREATE INDEX IF NOT EXISTS idx_signature_tokens_case_id ON signature_tokens (case_id);
      CREATE INDEX IF NOT EXISTS idx_bikes_status ON bikes (status);
    `);

    console.log('✅ Database tables and indexes created');
  } finally {
    client.release();
  }
}

async function seedInitialData() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();
  
  try {
    // Check if data already exists
    const contactResult = await client.query('SELECT COUNT(*) as count FROM contacts');
    const contactCount = parseInt(contactResult.rows[0].count);
    
    const caseResult = await client.query('SELECT COUNT(*) as count FROM cases');
    const caseCount = parseInt(caseResult.rows[0].count);
    
    const userResult = await client.query('SELECT COUNT(*) as count FROM user_accounts');
    const userCount = parseInt(userResult.rows[0].count);
    
    if (contactCount > 0 && caseCount > 0 && userCount > 0) {
      console.log('📊 Database already has data - skipping seed');
      return;
    }

    console.log('🌱 Seeding initial data...');
    
    // Seed contacts
    if (contactCount === 0) {
      console.log('🌱 Seeding contacts...');
      await seedContacts(client);
    }
    
    // Seed workspaces
    const workspaceResult = await client.query('SELECT COUNT(*) as count FROM workspaces');
    const workspaceCount = parseInt(workspaceResult.rows[0].count);
    if (workspaceCount === 0) {
      console.log('🌱 Seeding workspaces...');
      await seedWorkspaces(client);
    }
    
    // Seed developer users
    if (userCount === 0) {
      console.log('🌱 Seeding developer accounts...');
      await seedDeveloperAccounts(client);
    }
    
    // Seed cases
    if (caseCount === 0) {
      console.log('🌱 Seeding cases...');
      await seedCases(client);
    }
  } finally {
    client.release();
  }
}

async function seedContacts(client: any) {
  // Generate consistent UUIDs for seeding
  const davidContactId = '550e8400-e29b-41d4-a716-446655440001';
  const smithLawyersId = '550e8400-e29b-41d4-a716-446655440002';
  const davisLegalId = '550e8400-e29b-41d4-a716-446655440003';
  const citywideRentalsId = '550e8400-e29b-41d4-a716-446655440004';

  const contacts = [
    {
      id: davidContactId,
      name: 'David',
      company: 'Not At Fault',
      type: 'Rental Company',
      phone: '0413063463',
      email: 'whitepointer2016@gmail.com',
      address: '123 Business Street, Sydney NSW 2000'
    },
    {
      id: smithLawyersId,
      name: 'Smith & Co Lawyers',
      company: 'Smith & Co Legal',
      type: 'Lawyer',
      phone: '02 9876 5432',
      email: 'contact@smithlegal.com.au',
      address: '456 Legal Avenue, Sydney NSW 2000'
    },
    {
      id: davisLegalId,
      name: 'Davis Legal',
      company: 'Davis & Associates',
      type: 'Lawyer',
      phone: '02 8765 4321',
      email: 'info@davislegal.com.au',
      address: '789 Law Street, Melbourne VIC 3000'
    },
    {
      id: citywideRentalsId,
      name: 'City Wide Rentals',
      company: 'City Wide Vehicle Rentals',
      type: 'Rental Company',
      phone: '1300 555 666',
      email: 'bookings@citywiderentals.com.au',
      address: '321 Rental Avenue, Brisbane QLD 4000'
    }
  ];

  for (const contact of contacts) {
    await client.query(`
      INSERT INTO contacts (id, name, company, type, phone, email, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [contact.id, contact.name, contact.company, contact.type, contact.phone, contact.email, contact.address]);
  }
  console.log('✅ Initial contacts seeded');
}

async function seedWorkspaces(client: any) {
  // Use the same contact ID as defined in seedContacts
  const davidContactId = '550e8400-e29b-41d4-a716-446655440001';
  const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';

  const workspaces = [
    {
      id: davidWorkspaceId,
      name: 'David - Not At Fault Workspace',
      contactId: davidContactId
    }
  ];

  for (const workspace of workspaces) {
    await client.query(`
      INSERT INTO workspaces (id, name, contact_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `, [workspace.id, workspace.name, workspace.contactId]);
  }
  console.log('✅ Initial workspaces seeded');
}

async function seedDeveloperAccounts(client: any) {
  console.log('🌱 Creating developer accounts (CRITICAL for authentication)...');
  
  // Import CryptoJS for password hashing
  const CryptoJS = require('crypto-js');
  const hashPassword = (password: string): string => {
    return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
  };
  
  // Use proper UUIDs for user accounts
  const adminDavidId = '550e8400-e29b-41d4-a716-446655440201';
  const adminMichaelId = '550e8400-e29b-41d4-a716-446655440202';
  const workspaceUserTestId = '550e8400-e29b-41d4-a716-446655440203';
  const davidWorkspaceId = '550e8400-e29b-41d4-a716-446655440101';
  
  const developerUsers = [
    {
      id: adminDavidId,
      email: 'whitepointer2016@gmail.com',
      password_hash: hashPassword('Tr@ders84'),
      role: 'developer',
      status: 'active',
      first_login: false,
      remember_login: true
    },
    {
      id: adminMichaelId,
      email: 'michaelalanwilson@gmail.com',
      password_hash: hashPassword('Tr@ders84'),
      role: 'developer',
      status: 'active',
      first_login: false,
      remember_login: true
    },
    {
      id: workspaceUserTestId,
      email: 'aussiepowers555@gmail.com',
      password_hash: hashPassword('abc123'),
      role: 'workspace_user',
      status: 'active',
      first_login: true,
      remember_login: false
    }
  ];

  for (const user of developerUsers) {
    try {
      await client.query(`
        INSERT INTO user_accounts (id, email, password_hash, role, status, first_login, remember_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `, [user.id, user.email, user.password_hash, user.role, user.status, user.first_login, user.remember_login]);
    } catch (e) {
      // ignore duplicates
    }
  }

  // Attach workspace user to David workspace
  try {
    await client.query(`
      UPDATE user_accounts 
      SET workspace_id = $1 
      WHERE id = $2
    `, [davidWorkspaceId, workspaceUserTestId]);
  } catch (e) {
    // ignore if update fails
  }

  console.log('✅ Developer and test workspace accounts created/verified successfully');
}

async function seedCases(client: any) {
  console.log('🌱 Creating initial case data...');
  
  // Generate proper UUIDs for cases
  const case001Id = '550e8400-e29b-41d4-a716-446655440301';
  const case002Id = '550e8400-e29b-41d4-a716-446655440302';
  
  const initialCases = [
    {
      id: case001Id,
      caseNumber: '2025-001',
      status: 'Invoiced',
      lastUpdated: new Date().toISOString(),
      clientName: 'John Smith',
      clientPhone: '555-1111',
      clientEmail: 'john.s@example.com',
      clientStreetAddress: '123 Main St',
      clientSuburb: 'Anytown',
      clientState: 'NSW',
      clientPostcode: '2000',
      clientClaimNumber: 'C001',
      clientInsuranceCompany: 'AllState',
      clientInsurer: '',
      clientVehicleRego: 'ABC123',
      atFaultPartyName: 'Jane Doe',
      atFaultPartyPhone: '555-2222',
      atFaultPartyEmail: 'jane.d@example.com',
      atFaultPartyStreetAddress: '456 Oak Ave',
      atFaultPartySuburb: 'Otherville',
      atFaultPartyState: 'NSW',
      atFaultPartyPostcode: '2001',
      atFaultPartyClaimNumber: 'AF001',
      atFaultPartyInsuranceCompany: 'Geico',
      atFaultPartyInsurer: '',
      atFaultPartyVehicleRego: 'XYZ789',
      invoiced: 5500,
      reserve: 5000,
      agreed: 5000,
      paid: 2500,
      rentalCompany: 'PBikeRescue Rentals',
      lawyer: 'Smith & Co Lawyers'
    },
    {
      id: case002Id,
      caseNumber: '2025-002',
      status: 'Active',
      lastUpdated: new Date().toISOString(),
      clientName: 'Sarah Johnson',
      clientPhone: '555-3333',
      clientEmail: 'sarah.j@example.com',
      clientStreetAddress: '789 High Street',
      clientSuburb: 'Downtown',
      clientState: 'VIC',
      clientPostcode: '3000',
      clientClaimNumber: 'C002',
      clientInsuranceCompany: 'RACV',
      clientInsurer: '',
      clientVehicleRego: 'DEF456',
      atFaultPartyName: 'Mike Brown',
      atFaultPartyPhone: '555-4444',
      atFaultPartyEmail: 'mike.b@example.com',
      atFaultPartyStreetAddress: '321 Queen St',
      atFaultPartySuburb: 'Suburbs',
      atFaultPartyState: 'VIC',
      atFaultPartyPostcode: '3001',
      atFaultPartyClaimNumber: 'AF002',
      atFaultPartyInsuranceCompany: 'AAMI',
      atFaultPartyInsurer: '',
      atFaultPartyVehicleRego: 'GHI789',
      invoiced: 3200,
      reserve: 3000,
      agreed: 3000,
      paid: 0,
      accidentDate: '2025-07-30',
      accidentTime: '14:30',
      accidentDescription: 'Rear end collision at traffic lights',
      rentalCompany: 'PBikeRescue Rentals',
      lawyer: 'Davis Legal'
    }
  ];

  for (const caseData of initialCases) {
    await client.query(`
      INSERT INTO cases (
        id, case_number, status, last_updated, client_name, client_phone, client_email,
        client_street_address, client_suburb, client_state, client_postcode,
        client_claim_number, client_insurance_company, client_insurer, client_vehicle_rego,
        at_fault_party_name, at_fault_party_phone, at_fault_party_email,
        at_fault_party_street_address, at_fault_party_suburb, at_fault_party_state,
        at_fault_party_postcode, at_fault_party_claim_number, at_fault_party_insurance_company,
        at_fault_party_insurer, at_fault_party_vehicle_rego,
        invoiced, reserve, agreed, paid, accident_date, accident_time, accident_description,
        rental_company, lawyer, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      ON CONFLICT (case_number) DO NOTHING
    `, [
      caseData.id, caseData.caseNumber, caseData.status, caseData.lastUpdated,
      caseData.clientName, caseData.clientPhone, caseData.clientEmail,
      caseData.clientStreetAddress, caseData.clientSuburb, caseData.clientState, caseData.clientPostcode,
      caseData.clientClaimNumber, caseData.clientInsuranceCompany, caseData.clientInsurer, caseData.clientVehicleRego,
      caseData.atFaultPartyName, caseData.atFaultPartyPhone, caseData.atFaultPartyEmail,
      caseData.atFaultPartyStreetAddress, caseData.atFaultPartySuburb, caseData.atFaultPartyState,
      caseData.atFaultPartyPostcode, caseData.atFaultPartyClaimNumber, caseData.atFaultPartyInsuranceCompany,
      caseData.atFaultPartyInsurer, caseData.atFaultPartyVehicleRego,
      caseData.invoiced, caseData.reserve, caseData.agreed, caseData.paid, 
      caseData.accidentDate || null, caseData.accidentTime || null, caseData.accidentDescription || null,
      caseData.rentalCompany, caseData.lawyer, new Date().toISOString()
    ]);
  }

  console.log('✅ CRITICAL: Initial case data restored');
}

// Helper function to ensure server-side execution
function ensureServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations must be performed server-side only. Use API routes instead.');
  }
  if (!pool) {
    throw new Error('Database not initialized');
  }
}

// Helper function to map database row to Case interface
function mapDbRowToCase(row: any): Case {
  return {
    id: row.id,
    case_number: row.case_number,
    workspace_id: row.workspace_id,
    status: row.status,
    last_updated: row.last_updated?.toISOString() || row.created_at?.toISOString(),

    // Client details (canonical)
    client_name: row.client_name,
    client_phone: row.client_phone,
    client_email: row.client_email,
    client_street_address: row.client_street_address,
    client_suburb: row.client_suburb,
    client_state: row.client_state,
    client_postcode: row.client_postcode,
    client_claim_number: row.client_claim_number,
    client_insurance_company: row.client_insurance_company,
    client_insurer: row.client_insurer,
    client_vehicle_rego: row.client_vehicle_rego,

    // At-fault party details (canonical)
    at_fault_party_name: row.at_fault_party_name,
    at_fault_party_phone: row.at_fault_party_phone,
    at_fault_party_email: row.at_fault_party_email,
    at_fault_party_street_address: row.at_fault_party_street_address,
    at_fault_party_suburb: row.at_fault_party_suburb,
    at_fault_party_state: row.at_fault_party_state,
    at_fault_party_postcode: row.at_fault_party_postcode,
    at_fault_party_claim_number: row.at_fault_party_claim_number,
    at_fault_party_insurance_company: row.at_fault_party_insurance_company,
    at_fault_party_insurer: row.at_fault_party_insurer,
    at_fault_party_vehicle_rego: row.at_fault_party_vehicle_rego,

    // Assignments and financial
    assigned_lawyer_id: row.assigned_lawyer_id,
    assigned_rental_company_id: row.assigned_rental_company_id,
    invoiced: parseFloat(row.invoiced) || 0,
    reserve: parseFloat(row.reserve) || 0,
    agreed: parseFloat(row.agreed) || 0,
    paid: parseFloat(row.paid) || 0,

    // Accident details
    accident_date: row.accident_date?.toISOString()?.split('T')[0] || row.accident_date,
    accident_time: row.accident_time,
    accident_description: row.accident_description,
    accident_diagram: row.accident_diagram,

    // Timestamps
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Map database row to frontend-friendly format
function mapDbRowToCaseFrontend(row: any): CaseFrontend {
  const dbCase = mapDbRowToCase(row);
  return SchemaTransformers.caseDbToFrontend(dbCase);
}

// PostgreSQL implementation
const PostgreSQLService = {
  // Workspace filtering methods
  getCasesForUser: async (userId: string): Promise<CaseFrontend[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        SELECT c.* FROM cases c 
        JOIN user_accounts u ON u.id = $1
        WHERE (u.workspace_id IS NULL OR u.workspace_id = c.workspace_id)
        ORDER BY c.created_at DESC
      `, [userId]);
      
      return result.rows.map(mapDbRowToCaseFrontend);
    } finally {
      client.release();
    }
  },

  getUserWorkspace: async (userId: string): Promise<UserWithWorkspace | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        SELECT u.*, w.name as workspace_name, c.type as contact_type
        FROM user_accounts u
        LEFT JOIN workspaces w ON u.workspace_id = w.id
        LEFT JOIN contacts c ON w.contact_id = c.id
        WHERE u.id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  getWorkspaceById: async (workspaceId: string): Promise<Workspace | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Case methods
  createCase: async (caseData: any): Promise<any> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const generatedCaseNumber = `CASE-${Date.now().toString().slice(-6)}`;
      const caseNumber = caseData.caseNumber || caseData.case_number || generatedCaseNumber;
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO cases (
          case_number, status, last_updated, client_name, client_email, client_phone,
          client_street_address, client_suburb, client_state, client_postcode,
          client_claim_number, client_insurance_company, client_insurer, client_vehicle_rego,
          at_fault_party_name, at_fault_party_email, at_fault_party_phone,
          at_fault_party_street_address, at_fault_party_suburb, at_fault_party_state, at_fault_party_postcode,
          at_fault_party_claim_number, at_fault_party_insurance_company, at_fault_party_insurer, at_fault_party_vehicle_rego,
          rental_company, lawyer, assigned_lawyer_id, assigned_rental_company_id,
          invoiced, reserve, agreed, paid,
          accident_date, accident_time, accident_description,
          workspace_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)
        RETURNING *
      `, [
        caseNumber,
        caseData.status || 'New Matter',
        now,
        caseData.clientName || caseData.client_name,
        caseData.clientEmail || caseData.client_email,
        caseData.clientPhone || caseData.client_phone,
        caseData.clientStreetAddress || caseData.client_street_address,
        caseData.clientSuburb || caseData.client_suburb,
        caseData.clientState || caseData.client_state,
        caseData.clientPostcode || caseData.client_postcode,
        caseData.clientClaimNumber || caseData.client_claim_number,
        caseData.clientInsuranceCompany || caseData.client_insurance_company,
        caseData.clientInsurer || caseData.client_insurer,
        caseData.clientVehicleRego || caseData.client_vehicle_rego || '',
        caseData.atFaultPartyName || caseData.at_fault_party_name,
        caseData.atFaultPartyEmail || caseData.at_fault_party_email,
        caseData.atFaultPartyPhone || caseData.at_fault_party_phone,
        caseData.atFaultPartyStreetAddress || caseData.at_fault_party_street_address,
        caseData.atFaultPartySuburb || caseData.at_fault_party_suburb,
        caseData.atFaultPartyState || caseData.at_fault_party_state,
        caseData.atFaultPartyPostcode || caseData.at_fault_party_postcode,
        caseData.atFaultPartyClaimNumber || caseData.at_fault_party_claim_number,
        caseData.atFaultPartyInsuranceCompany || caseData.at_fault_party_insurance_company,
        caseData.atFaultPartyInsurer || caseData.at_fault_party_insurer,
        caseData.atFaultPartyVehicleRego || caseData.at_fault_party_vehicle_rego || '',
        caseData.rentalCompany || caseData.rental_company,
        caseData.lawyer,
        caseData.assignedLawyerId || caseData.assigned_lawyer_id || null,
        caseData.assignedRentalCompanyId || caseData.assigned_rental_company_id || null,
        caseData.invoiced || 0,
        caseData.reserve || 0,
        caseData.agreed || 0,
        caseData.paid || 0,
        caseData.accidentDate || caseData.accident_date || null,
        caseData.accidentTime || caseData.accident_time || null,
        caseData.accidentDescription || caseData.accident_description || '',
        caseData.workspaceId || caseData.workspace_id || null,
        now
      ]);

      return mapDbRowToCaseFrontend(result.rows[0]);
    } finally {
      client.release();
    }
  },

  getAllCases: async (): Promise<CaseFrontend[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM cases ORDER BY last_updated DESC');
      return result.rows.map(mapDbRowToCaseFrontend);
    } finally {
      client.release();
    }
  },

  getCaseById: async (id: string): Promise<CaseFrontend | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM cases WHERE id = $1', [id]);
      return result.rows[0] ? mapDbRowToCaseFrontend(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  getCaseByCaseNumber: async (caseNumber: string): Promise<CaseFrontend | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM cases WHERE case_number = $1', [caseNumber]);
      return result.rows[0] ? mapDbRowToCaseFrontend(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  updateCase: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      // Map frontend field names to database column names
      const dbFieldMap: { [key: string]: string } = {
        'clientEmail': 'client_email',
        'clientPhone': 'client_phone',
        'clientName': 'client_name',
        'status': 'status',
        'lastUpdated': 'last_updated'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = dbFieldMap[key] || key;
        setFields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      setFields.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());
      paramCount++;

      values.push(id); // for WHERE clause

      await client.query(`
        UPDATE cases
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },

  deleteCase: async (id: string): Promise<boolean> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM cases WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  },

  // Contact methods
  getAllContacts: async (): Promise<ContactFrontend[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM contacts ORDER BY name');
      return result.rows.map(SchemaTransformers.contactDbToFrontend);
    } finally {
      client.release();
    }
  },

  createContact: async (contactData: any): Promise<Contact> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO contacts (name, company, type, phone, email, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [contactData.name, contactData.company, contactData.type,
          contactData.phone, contactData.email, contactData.address]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  getContactById: async (id: string): Promise<ContactFrontend | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM contacts WHERE id = $1', [id]);
      return result.rows[0] ? SchemaTransformers.contactDbToFrontend(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  updateContact: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      setFields.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());
      paramCount++;

      values.push(id);

      await client.query(`
        UPDATE contacts
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },

  deleteContact: async (id: string): Promise<boolean> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM contacts WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  },

  // Workspace methods
  getAllWorkspaces: async (): Promise<WorkspaceFrontend[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM workspaces ORDER BY name');
      return result.rows.map(SchemaTransformers.workspaceDbToFrontend);
    } finally {
      client.release();
    }
  },

  createWorkspace: async (workspaceData: any): Promise<Workspace> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO workspaces (name, contact_id, type)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [workspaceData.name, workspaceData.contact_id, workspaceData.type]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  updateWorkspace: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      await client.query(`
        UPDATE workspaces
        SET name = $1, contact_id = $2, type = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [updates.name, updates.contact_id, updates.type, id]);
    } finally {
      client.release();
    }
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      await client.query('DELETE FROM workspaces WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  // User Account methods
  getAllUserAccounts: async (): Promise<UserAccount[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM user_accounts ORDER BY email');
      return result.rows;
    } finally {
      client.release();
    }
  },

  createUserAccount: async (userData: any): Promise<UserAccount> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO user_accounts (email, password_hash, role, status, contact_id, workspace_id, first_login, remember_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [userData.email, userData.password_hash, userData.role,
          userData.status, userData.contact_id, userData.workspace_id, userData.first_login, userData.remember_login]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  getUserByEmail: async (email: string): Promise<UserAccount | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM user_accounts WHERE email = $1', [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  updateUserAccount: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      values.push(id);

      await client.query(`
        UPDATE user_accounts
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },

  // Signature Token methods
  createSignatureToken: async (tokenData: any): Promise<SignatureToken> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const now = new Date().toISOString();
      const result = await client.query(`
        INSERT INTO signature_tokens (
          token, case_id, client_email, document_type, form_data,
          form_link, status, expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        tokenData.token, tokenData.case_id, tokenData.client_email,
        tokenData.document_type, tokenData.form_data, tokenData.form_link,
        tokenData.status, tokenData.expires_at,
        tokenData.created_at || now, tokenData.updated_at || now
      ]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  getSignatureTokenByToken: async (token: string): Promise<SignatureToken | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM signature_tokens WHERE token = $1', [token]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  getSignatureToken: async (token: string): Promise<SignatureToken | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM signature_tokens WHERE token = $1', [token]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  getSignatureTokensForCase: async (caseId: string): Promise<SignatureToken[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM signature_tokens WHERE case_id = $1', [caseId]);
      return result.rows;
    } finally {
      client.release();
    }
  },

  updateSignatureToken: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      setFields.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());
      paramCount++;

      values.push(id);

      await client.query(`
        UPDATE signature_tokens
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },

  // Bike methods
  getAllBikes: async (): Promise<Bike[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        SELECT
          id,
          make,
          model,
          COALESCE(image_url, '') as image_url,
          status,
          location,
          assignment,
          created_at,
          updated_at
        FROM bikes
        ORDER BY make, model
      `);
      return result.rows;
    } finally {
      client.release();
    }
  },

  getBikes: async (workspaceId?: string): Promise<BikeFrontend[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      let query = `
        SELECT
          id,
          make,
          model,
          registration,
          registration_expires,
          service_center,
          service_center_contact_id,
          delivery_street,
          delivery_suburb,
          delivery_state,
          delivery_postcode,
          last_service_date,
          service_notes,
          status,
          location,
          daily_rate,
          daily_rate_a,
          daily_rate_b,
          image_url,
          image_hint,
          assignment,
          assigned_case_id,
          assignment_start_date,
          assignment_end_date,
          workspace_id,
          created_at,
          updated_at
        FROM bikes
      `;
      
      let values: any[] = [];
      if (workspaceId) {
        query += ` WHERE workspace_id = $1 OR workspace_id IS NULL`;
        values = [workspaceId];
      }
      
      query += ` ORDER BY make, model`;
      
      const result = await client.query(query, values);
      return result.rows.map((row: any) => SchemaTransformers.bikeDbToFrontend(row));
    } finally {
      client.release();
    }
  },

  getBikeById: async (id: string): Promise<BikeFrontend | null> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        SELECT
          id,
          make,
          model,
          registration,
          registration_expires,
          service_center,
          service_center_contact_id,
          delivery_street,
          delivery_suburb,
          delivery_state,
          delivery_postcode,
          last_service_date,
          service_notes,
          status,
          location,
          daily_rate,
          daily_rate_a,
          daily_rate_b,
          image_url,
          image_hint,
          assignment,
          assigned_case_id,
          assignment_start_date,
          assignment_end_date,
          workspace_id,
          created_at,
          updated_at
        FROM bikes
        WHERE id = $1
      `, [id]);
      
      return result.rows[0] ? SchemaTransformers.bikeDbToFrontend(result.rows[0]) : null;
    } finally {
      client.release();
    }
  },

  createBike: async (bikeData: Omit<BikeFrontend, 'id'>): Promise<BikeFrontend> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const now = new Date().toISOString();
      const result = await client.query(`
        INSERT INTO bikes (
          make, model, registration, registration_expires, service_center,
          service_center_contact_id, delivery_street, delivery_suburb, delivery_state, delivery_postcode,
          last_service_date, service_notes, status, location, daily_rate,
          daily_rate_a, daily_rate_b, image_url, image_hint, assignment,
          assigned_case_id, assignment_start_date, assignment_end_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *
      `, [
        bikeData.make, bikeData.model, bikeData.registration, bikeData.registrationExpires,
        bikeData.serviceCenter, bikeData.serviceCenterContactId || null, bikeData.deliveryStreet, bikeData.deliverySuburb,
        bikeData.deliveryState, bikeData.deliveryPostcode, bikeData.lastServiceDate,
        bikeData.serviceNotes, bikeData.status, bikeData.location, bikeData.dailyRate,
        bikeData.dailyRateA || bikeData.dailyRate || 85, bikeData.dailyRateB || 95,
        bikeData.imageUrl, bikeData.imageHint, bikeData.assignment,
        bikeData.assignedCaseId || null, bikeData.assignmentStartDate || null, 
        bikeData.assignmentEndDate || null, now
      ]);
      
      return SchemaTransformers.bikeDbToFrontend(result.rows[0]);
    } finally {
      client.release();
    }
  },

  updateBike: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Only update fields that are provided
      if (updates.make !== undefined) {
        updateFields.push(`make = $${paramIndex++}`);
        values.push(updates.make);
      }
      if (updates.model !== undefined) {
        updateFields.push(`model = $${paramIndex++}`);
        values.push(updates.model);
      }
      if (updates.registration !== undefined) {
        updateFields.push(`registration = $${paramIndex++}`);
        values.push(updates.registration);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.location !== undefined) {
        updateFields.push(`location = $${paramIndex++}`);
        values.push(updates.location);
      }
      if (updates.assignment !== undefined) {
        updateFields.push(`assignment = $${paramIndex++}`);
        values.push(updates.assignment);
      }
      if (updates.assigned_case_id !== undefined) {
        updateFields.push(`assigned_case_id = $${paramIndex++}`);
        values.push(updates.assigned_case_id);
      }
      if (updates.assignment_start_date !== undefined) {
        updateFields.push(`assignment_start_date = $${paramIndex++}`);
        values.push(updates.assignment_start_date);
      }
      if (updates.assignment_end_date !== undefined) {
        updateFields.push(`assignment_end_date = $${paramIndex++}`);
        values.push(updates.assignment_end_date);
      }
      if (updates.service_center_contact_id !== undefined) {
        updateFields.push(`service_center_contact_id = $${paramIndex++}`);
        values.push(updates.service_center_contact_id);
      }
      if (updates.image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        values.push(updates.image_url);
      }
      if (updates.daily_rate !== undefined) {
        updateFields.push(`daily_rate = $${paramIndex++}`);
        values.push(updates.daily_rate);
      }
      if (updates.daily_rate_a !== undefined) {
        updateFields.push(`daily_rate_a = $${paramIndex++}`);
        values.push(updates.daily_rate_a);
      }
      if (updates.daily_rate_b !== undefined) {
        updateFields.push(`daily_rate_b = $${paramIndex++}`);
        values.push(updates.daily_rate_b);
      }
      if (updates.service_notes !== undefined) {
        updateFields.push(`service_notes = $${paramIndex++}`);
        values.push(updates.service_notes);
      }

      // Always update the timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      if (updateFields.length > 1) { // More than just the timestamp update
        const query = `UPDATE bikes SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
        await client.query(query, values);
      }
    } finally {
      client.release();
    }
  },

  deleteBike: async (id: string): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      await client.query('DELETE FROM bikes WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  },

  bulkInsertBikes: async (bikes: any[]): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const bike of bikes) {
        await client.query(`
          INSERT INTO bikes (
            id, make, model, registration, registration_expires, service_center,
            service_center_contact_id, delivery_street, delivery_suburb, delivery_state, delivery_postcode,
            last_service_date, service_notes, status, location, daily_rate,
            daily_rate_a, daily_rate_b, image_url, image_hint, assignment,
            assigned_case_id, assignment_start_date, assignment_end_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (id) DO UPDATE SET
            make = EXCLUDED.make,
            model = EXCLUDED.model,
            registration = EXCLUDED.registration,
            registration_expires = EXCLUDED.registration_expires,
            service_center = EXCLUDED.service_center,
            service_center_contact_id = EXCLUDED.service_center_contact_id,
            delivery_street = EXCLUDED.delivery_street,
            delivery_suburb = EXCLUDED.delivery_suburb,
            delivery_state = EXCLUDED.delivery_state,
            delivery_postcode = EXCLUDED.delivery_postcode,
            last_service_date = EXCLUDED.last_service_date,
            service_notes = EXCLUDED.service_notes,
            status = EXCLUDED.status,
            location = EXCLUDED.location,
            daily_rate = EXCLUDED.daily_rate,
            daily_rate_a = EXCLUDED.daily_rate_a,
            daily_rate_b = EXCLUDED.daily_rate_b,
            image_url = EXCLUDED.image_url,
            image_hint = EXCLUDED.image_hint,
            assignment = EXCLUDED.assignment,
            updated_at = CURRENT_TIMESTAMP
        `, [
          bike.id, bike.make, bike.model, bike.registration, bike.registrationExpires,
          bike.serviceCenter, bike.serviceCenterContactId || null, bike.deliveryStreet, bike.deliverySuburb, bike.deliveryState,
          bike.deliveryPostcode, bike.lastServiceDate, bike.serviceNotes, bike.status,
          bike.location, bike.dailyRate, bike.dailyRateA || bike.dailyRate || 85, 
          bike.dailyRateB || 95, bike.imageUrl, bike.imageHint, bike.assignment,
          bike.assignedCaseId || null, bike.assignmentStartDate || null, bike.assignmentEndDate || null
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Bulk inserted ${bikes.length} bikes`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Case deletion methods
  deleteAllCases: async (): Promise<number> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM cases');
      return result.rowCount ?? 0;
    } finally {
      client.release();
    }
  },

  deleteSignatureTokensByCase: async (caseId: string): Promise<number> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM signature_tokens WHERE case_id = $1', [caseId]);
      return result.rowCount ?? 0;
    } finally {
      client.release();
    }
  },

  deleteDigitalSignaturesByCase: async (caseId: string): Promise<number> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM digital_signatures WHERE case_id = $1', [caseId]);
      return result.rowCount ?? 0;
    } finally {
      client.release();
    }
  },

  // Generate unique signature token
  generateSignatureToken: async (caseId: string, clientEmail: string, documentType: string, formData: any = {}): Promise<string> => {
    ensureServerSide();
    const token = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await DatabaseService.createSignatureToken({
      token,
      case_id: caseId,
      client_email: clientEmail,
      document_type: documentType,
      form_data: formData,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    });

    return token;
  },

  // Case interaction methods
  createCaseInteraction: async (interactionData: any): Promise<any> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO case_interactions (
          case_number, source, method, situation, action, outcome, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        interactionData.caseNumber, interactionData.source, interactionData.method,
        interactionData.situation, interactionData.action, interactionData.outcome,
        interactionData.timestamp
      ]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  getCaseInteractions: async (caseNumber: string): Promise<any[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM case_interactions WHERE case_number = $1 ORDER BY timestamp DESC',
        [caseNumber]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  updateCaseInteraction: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      setFields.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());
      paramCount++;

      values.push(id);

      await client.query(`
        UPDATE case_interactions
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },

  deleteCaseInteraction: async (id: string): Promise<boolean> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM case_interactions WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  },

  // Digital Signature methods
  createDigitalSignature: async (signatureData: any): Promise<DigitalSignature> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO digital_signatures (case_id, signature_token_id, signature_data, signer_name, terms_accepted, signed_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        signatureData.case_id, signatureData.signature_token_id, signatureData.signature_data,
        signatureData.signer_name, signatureData.terms_accepted, signatureData.signed_at,
        signatureData.ip_address, signatureData.user_agent
      ]);

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Get all documents for a case
  getCaseDocuments: async (caseId: string): Promise<any[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        SELECT
          st.document_type,
          st.pdf_url,
          st.status,
          st.completed_at,
          ds.signer_name,
          ds.signed_at
        FROM signature_tokens st
        LEFT JOIN digital_signatures ds ON st.id = ds.signature_token_id
        WHERE st.case_id = $1
        ORDER BY st.created_at DESC
      `, [caseId]);
      return result.rows;
    } finally {
      client.release();
    }
  },

  createRentalAgreement: async (agreementData: any): Promise<RentalAgreement> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const now = new Date().toISOString();
      const result = await client.query(`
        INSERT INTO rental_agreements (
          case_id, hirer_name, phone, email, address,
          vehicle_details, rental_period, daily_rate, total_cost,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        agreementData.caseId, agreementData.hirerName, agreementData.phone,
        agreementData.email, agreementData.address, agreementData.vehicleDetails,
        agreementData.rentalPeriod, agreementData.dailyRate, agreementData.totalCost,
        agreementData.status || 'draft', now
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Signed Document methods
  createDocument: async (docData: any): Promise<any> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO signed_documents (
          id, case_id, document_type, file_name, file_path, file_size,
          sha256_hash, signed_at, signed_by, signature_data, ip_address,
          user_agent, encryption_key_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        docData.id, docData.caseId, docData.documentType, docData.fileName,
        docData.filePath, docData.fileSize, docData.sha256Hash, docData.signedAt,
        docData.signedBy, docData.signatureData, docData.ipAddress,
        docData.userAgent, docData.encryptionKeyId
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  },
  
  getDocumentById: async (id: string): Promise<any> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM signed_documents WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },
  
  getDocumentsForCase: async (caseId: string): Promise<any[]> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('SELECT * FROM signed_documents WHERE case_id = $1 ORDER BY signed_at DESC', [caseId]);
      return result.rows;
    } finally {
      client.release();
    }
  },
  
  updateDocument: async (id: string, updates: any): Promise<void> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const setFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        setFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }

      values.push(id);

      await client.query(`
        UPDATE signed_documents 
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    } finally {
      client.release();
    }
  },
  
  deleteDocument: async (id: string): Promise<boolean> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      const result = await client.query('DELETE FROM signed_documents WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  },

  // Auto-provision workspace and user for contact
  provisionWorkspaceAndUser: async (contact: Contact): Promise<{ workspace: Workspace, user: UserAccount, tempPassword: string }> => {
    ensureServerSide();
    const client = await pool!.connect();
    
    try {
      await client.query('BEGIN');

      // Generate password
      const tempPassword = Math.random().toString(36).slice(-10);
      
      // Hash password
      const CryptoJS = require('crypto-js');
      const passwordHash = CryptoJS.SHA256(tempPassword + 'salt_pbr_2024').toString();
      
      // Create workspace
      const workspaceName = `${contact.type}: ${contact.name} Workspace`;
      const workspaceResult = await client.query(`
        INSERT INTO workspaces (name, contact_id, type)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [workspaceName, contact.id, contact.type]);
      
      const workspace = workspaceResult.rows[0];
      
      // Create user account
      const userResult = await client.query(`
        INSERT INTO user_accounts (email, password_hash, role, status,
                                   contact_id, workspace_id, first_login)
        VALUES ($1, $2, 'workspace_user', 'active', $3, $4, true)
        RETURNING *
      `, [contact.email, passwordHash, contact.id, workspace.id]);
      
      const user = userResult.rows[0];
      
      await client.query('COMMIT');
      
      return { workspace, user, tempPassword };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Additional methods needed by API routes
  getCaseDetails: async (caseId: string): Promise<CaseFrontend | null> => {
    ensureServerSide();
    return DatabaseService.getCaseById(caseId);
  },

  // Async wrapper methods for ISR compatibility
  getCasesAsync: async (workspaceId?: string | null): Promise<CaseFrontend[]> => {
    ensureServerSide();
    return DatabaseService.getAllCases();
  },

  getBikesAsync: async (workspaceId?: string | null): Promise<BikeFrontend[]> => {
    ensureServerSide();
    return DatabaseService.getBikes(workspaceId || undefined);
  },

  getContactsAsync: async (): Promise<ContactFrontend[]> => {
    ensureServerSide();
    return DatabaseService.getAllContacts();
  },

  getWorkspacesAsync: async (): Promise<WorkspaceFrontend[]> => {
    ensureServerSide();
    return DatabaseService.getAllWorkspaces();
  },

  createDocumentRecord: async (docData: any): Promise<any> => {
    ensureServerSide();
    const newDoc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...docData,
      uploaded_date: new Date().toISOString()
    };
    return DatabaseService.createDocument(newDoc);
  },

  addDocumentToCase: async (caseId: string, documentId: string): Promise<boolean> => {
    ensureServerSide();
    // For PostgreSQL implementation, this could update a document relationship table
    // For now, we'll just log the association
    console.log(`Document ${documentId} associated with case ${caseId}`);
    return true;
  },

  createAuditLog: async (logData: any): Promise<void> => {
    ensureServerSide();
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    // Store audit logs (could be added to a separate table if needed)
    console.log('Audit log created:', auditLog);
  },
};

// Initialize database when module is imported (server-side only)
let dbInitialized = false;

export async function ensureDatabaseInitialized() {
  // If called on client-side, throw a helpful error
  if (typeof window !== 'undefined') {
    throw new Error('Database operations must be performed server-side only. Use API routes instead.');
  }
  
  // Only initialize on server-side
  if (!dbInitialized) {
    try {
      console.log('🔄 Ensuring PostgreSQL database is initialized...');
      await initializeDatabase();
      dbInitialized = true;
      console.log('✅ PostgreSQL database initialization confirmed');
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL database:', error);
      throw error;
    }
  } else {
    console.log('✅ PostgreSQL database already confirmed initialized');
  }
}

export { pool as db };

// Export the appropriate database service based on environment
export const DatabaseService = PostgreSQLService as unknown as IDatabaseService;
