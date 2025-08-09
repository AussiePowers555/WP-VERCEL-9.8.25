/**
 * SQLite database implementation for local development
 */
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Case,
  Contact,
  Workspace,
  UserAccount,
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  BikeFrontend,
  Bike
} from './database-schema';
import { SchemaTransformers } from './database-schema';

// Create or open SQLite database
const dbPath = path.join(process.cwd(), 'data', 'pbike-rescue.db');
let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      initTables();
      console.log('✅ SQLite database connected:', dbPath);
    } catch (error) {
      console.error('Failed to open SQLite database:', error);
      throw error;
    }
  }
  return db;
}

function initTables() {
  const db = getDb();
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_phone TEXT,
      client_address TEXT,
      client_suburb TEXT,
      client_state TEXT,
      client_postcode TEXT,
      client_drivers_licence TEXT,
      accident_date TEXT,
      accident_location TEXT,
      accident_description TEXT,
      at_fault_name TEXT,
      at_fault_phone TEXT,
      at_fault_email TEXT,
      at_fault_address TEXT,
      at_fault_rego TEXT,
      at_fault_claim_number TEXT,
      at_fault_insurance_id TEXT,
      insurance_claim_number TEXT,
      date_of_loss TEXT,
      excess_amount REAL DEFAULT 0,
      assigned_bike_id TEXT,
      status TEXT DEFAULT 'NAC',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      settled_date TEXT,
      invoiced_amount REAL DEFAULT 0,
      settled_amount REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      outstanding_amount REAL DEFAULT 0,
      workspace_id TEXT DEFAULT 'MAIN'
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      contact_type TEXT,
      workspace_id TEXT DEFAULT 'MAIN',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT DEFAULT 'workspace',
      workspace_id TEXT,
      contact_id TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS bikes (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      registration TEXT UNIQUE NOT NULL,
      vin TEXT,
      status TEXT DEFAULT 'available',
      assigned_case TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create default admin user if not exists
    INSERT OR IGNORE INTO users (id, email, password, role) 
    VALUES ('admin', 'admin@example.com', '$2a$10$YourHashedPasswordHere', 'admin');

    -- Create MAIN workspace if not exists
    INSERT OR IGNORE INTO workspaces (id, name) 
    VALUES ('MAIN', 'Main Workspace');
  `);
}

export const SQLiteDatabase = {
  // Workspace filtering methods (simplified for SQLite)
  async getCasesForUser(userId: string): Promise<CaseFrontend[]> {
    // For SQLite, just return all cases for now
    return this.getAllCases();
  },

  async getUserWorkspace(userId: string): Promise<any> {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) return null;
    
    const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(user.workspace_id || 'MAIN');
    return { ...user, workspace };
  },

  // Case operations
  async getAllCases(): Promise<CaseFrontend[]> {
    const db = getDb();
    const cases = db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all() as Case[];
    return cases.map(c => SchemaTransformers.caseDbToFrontend(c));
  },

  async getCaseById(id: string): Promise<CaseFrontend | null> {
    const db = getDb();
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Case;
    return caseData ? SchemaTransformers.caseDbToFrontend(caseData) : null;
  },

  async getCaseByCaseNumber(caseNumber: string): Promise<CaseFrontend | null> {
    const db = getDb();
    const caseData = db.prepare('SELECT * FROM cases WHERE case_number = ?').get(caseNumber) as Case;
    return caseData ? SchemaTransformers.caseDbToFrontend(caseData) : null;
  },

  async createCase(caseData: Partial<Case>): Promise<Case | null> {
    const db = getDb();
    const id = caseData.id || `case_${Date.now()}`;
    const caseNumber = caseData.case_number || generateCaseNumber();
    
    const stmt = db.prepare(`
      INSERT INTO cases (id, case_number, client_name, client_email, client_phone, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id,
        caseNumber,
        caseData.client_name || '',
        caseData.client_email || '',
        caseData.client_phone || '',
        caseData.workspace_id || 'MAIN'
      );
      
      return db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Case;
    } catch (error) {
      console.error('Error creating case:', error);
      return null;
    }
  },

  async deleteCase(id: string): Promise<boolean> {
    const db = getDb();
    const result = db.prepare('DELETE FROM cases WHERE id = ?').run(id);
    return result.changes > 0;
  },

  async updateCase(id: string, updates: Partial<CaseFrontend>): Promise<void> {
    const db = getDb();
    const dbUpdates = SchemaTransformers.caseFrontendToDb({ ...updates, id } as CaseFrontend);
    
    const fields = Object.keys(dbUpdates)
      .filter(k => k !== 'id')
      .map(k => `${k} = ?`);
    
    if (fields.length === 0) return;
    
    const values = Object.keys(dbUpdates)
      .filter(k => k !== 'id')
      .map(k => (dbUpdates as any)[k]);
    
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE cases 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(...values);
  },

  // Contact operations
  async getAllContacts(): Promise<ContactFrontend[]> {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY name').all() as Contact[];
    return contacts.map(c => SchemaTransformers.contactDbToFrontend(c));
  },

  async getContactById(id: string): Promise<ContactFrontend | null> {
    const db = getDb();
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact;
    return contact ? SchemaTransformers.contactDbToFrontend(contact) : null;
  },

  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    const db = getDb();
    const data = contactData as any;
    const id = data.id || `contact_${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO contacts (id, name, email, phone, company, contact_type, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.company || '',
      data.contact_type || '',
      data.workspace_id || 'MAIN'
    );
    
    return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact;
  },

  async updateContact(id: string, updates: any): Promise<void> {
    const db = getDb();
    const fields = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => `${k} = ?`);
    
    if (fields.length === 0) return;
    
    const values = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => updates[k]);
    
    values.push(id);
    
    db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  async deleteContact(id: string): Promise<boolean> {
    const db = getDb();
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // User operations
  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserAccount;
  },

  async createUser(userData: Partial<UserAccount>): Promise<UserAccount | null> {
    const db = getDb();
    const data = userData as any;
    const id = data.id || `user_${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, role, workspace_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        id,
        data.email || '',
        data.password || '',
        data.role || 'workspace',
        data.workspace_id || 'MAIN'
      );
      
      return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserAccount;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  // Bike operations  
  async getAllBikes(): Promise<BikeFrontend[]> {
    const db = getDb();
    const bikes = db.prepare('SELECT * FROM bikes ORDER BY make, model').all() as Bike[];
    return bikes.map(b => SchemaTransformers.bikeDbToFrontend(b));
  },

  async getBikeById(id: string): Promise<BikeFrontend | null> {
    const db = getDb();
    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(id) as Bike;
    return bike ? SchemaTransformers.bikeDbToFrontend(bike) : null;
  },

  // Workspace operations
  async getAllWorkspaces(): Promise<WorkspaceFrontend[]> {
    const db = getDb();
    const workspaces = db.prepare('SELECT * FROM workspaces ORDER BY name').all() as Workspace[];
    return workspaces.map(w => SchemaTransformers.workspaceDbToFrontend(w));
  },

  async getWorkspaceById(id: string): Promise<WorkspaceFrontend | null> {
    const db = getDb();
    const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as Workspace;
    return workspace ? SchemaTransformers.workspaceDbToFrontend(workspace) : null;
  },

  async createWorkspace(workspaceData: Partial<Workspace>): Promise<Workspace> {
    const db = getDb();
    const data = workspaceData as any;
    const id = data.id || `workspace_${Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT INTO workspaces (id, name, address, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name || '',
      data.address || '',
      data.phone || '',
      data.email || ''
    );
    
    return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as Workspace;
  },

  async updateWorkspace(id: string, updates: any): Promise<void> {
    const db = getDb();
    const fields = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => `${k} = ?`);
    
    if (fields.length === 0) return;
    
    const values = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => updates[k]);
    
    values.push(id);
    
    db.prepare(`UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  async deleteWorkspace(id: string): Promise<void> {
    const db = getDb();
    db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  },

  // User account operations
  async getAllUserAccounts(): Promise<UserAccount[]> {
    const db = getDb();
    return db.prepare('SELECT * FROM users ORDER BY email').all() as UserAccount[];
  },

  async createUserAccount(userData: Partial<UserAccount>): Promise<UserAccount> {
    return this.createUser(userData) as Promise<UserAccount>;
  },

  async getUserAccountById(id: string): Promise<UserAccount | null> {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserAccount;
  },

  async updateUserAccount(id: string, updates: any): Promise<void> {
    const db = getDb();
    const fields = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => `${k} = ?`);
    
    if (fields.length === 0) return;
    
    const values = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => updates[k]);
    
    values.push(id);
    
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  async deleteUserAccount(id: string): Promise<void> {
    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  // Additional methods for async operations compatibility
  async getCasesAsync(): Promise<CaseFrontend[]> {
    return this.getAllCases();
  },

  async getContactsAsync(): Promise<ContactFrontend[]> {
    return this.getAllContacts();
  },

  async getBikesAsync(): Promise<BikeFrontend[]> {
    return this.getAllBikes();
  },

  async getWorkspacesAsync(): Promise<WorkspaceFrontend[]> {
    return this.getAllWorkspaces();
  },

  // Signature token methods  
  async createSignatureToken(tokenData: any): Promise<any> {
    const db = getDb();
    const id = tokenData.id || uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO signature_tokens (
        id, token, case_id, type, status, 
        created_at, expires_at, accessed_at, signed_at,
        email, phone, ip_address, user_agent, form_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      tokenData.token || uuidv4(),
      tokenData.case_id || tokenData.caseId,
      tokenData.type || 'rental_agreement',
      tokenData.status || 'pending',
      tokenData.created_at || new Date().toISOString(),
      tokenData.expires_at || tokenData.expiresAt,
      tokenData.accessed_at || tokenData.accessedAt,
      tokenData.signed_at || tokenData.signedAt,
      tokenData.email || '',
      tokenData.phone || '',
      tokenData.ip_address || tokenData.ipAddress || '',
      tokenData.user_agent || tokenData.userAgent || '',
      JSON.stringify(tokenData.form_data || tokenData.formData || {})
    );
    
    return db.prepare('SELECT * FROM signature_tokens WHERE id = ?').get(id);
  },

  async getSignatureToken(token: string): Promise<any> {
    const db = getDb();
    const result = db.prepare('SELECT * FROM signature_tokens WHERE token = ?').get(token) as any;
    if (result && result.form_data) {
      result.form_data = JSON.parse(result.form_data);
    }
    return result;
  },

  async updateSignatureToken(token: string, updates: any): Promise<void> {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];
    
    // Map camelCase to snake_case for database columns
    const fieldMap: Record<string, string> = {
      caseId: 'case_id',
      expiresAt: 'expires_at',
      accessedAt: 'accessed_at',
      signedAt: 'signed_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      formData: 'form_data'
    };
    
    Object.keys(updates).forEach(key => {
      if (key !== 'token') {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        
        if (key === 'formData' || key === 'form_data') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    });
    
    if (fields.length === 0) return;
    
    values.push(token);
    db.prepare(`UPDATE signature_tokens SET ${fields.join(', ')} WHERE token = ?`).run(...values);
  },

  async getSignatureTokensForCase(caseId: string): Promise<any[]> {
    const db = getDb();
    const results = db.prepare('SELECT * FROM signature_tokens WHERE case_id = ? ORDER BY created_at DESC').all(caseId);
    return results.map((r: any) => {
      if (r.form_data) {
        r.form_data = JSON.parse(r.form_data);
      }
      return r;
    });
  },

  // Bike methods
  async getBikes(): Promise<BikeFrontend[]> {
    return this.getAllBikes();
  },

  updateBike(id: string, updates: any): void {
    const db = getDb();
    const fields = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => {
        // Map camelCase to snake_case
        const fieldMap: Record<string, string> = {
          registrationExpires: 'registration_expires',
          serviceCenter: 'service_center',
          serviceCenterContactId: 'service_center_contact_id',
          deliveryStreet: 'delivery_street',
          deliverySuburb: 'delivery_suburb',
          deliveryState: 'delivery_state',
          deliveryPostcode: 'delivery_postcode',
          lastServiceDate: 'last_service_date',
          serviceNotes: 'service_notes',
          dailyRate: 'daily_rate',
          dailyRateA: 'daily_rate_a',
          dailyRateB: 'daily_rate_b',
          imageUrl: 'image_url',
          imageHint: 'image_hint',
          assignedCaseId: 'assigned_case_id',
          assignmentStartDate: 'assignment_start_date',
          assignmentEndDate: 'assignment_end_date'
        };
        return fieldMap[k] || k;
      })
      .map(k => `${k} = ?`);
    
    if (fields.length === 0) return;
    
    const values = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => updates[k]);
    
    values.push(id);
    
    db.prepare(`UPDATE bikes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  deleteBike(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM bikes WHERE id = ?').run(id);
  },

  bulkInsertBikes(bikes: any[]): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO bikes (
        id, make, model, registration, registration_expires,
        service_center, service_center_contact_id, delivery_street, 
        delivery_suburb, delivery_state, delivery_postcode,
        last_service_date, service_notes, status, location,
        daily_rate, daily_rate_a, daily_rate_b, image_url, image_hint,
        assignment, assigned_case_id, assignment_start_date, assignment_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((bikes: any[]) => {
      for (const bike of bikes) {
        stmt.run(
          bike.id || uuidv4(),
          bike.make,
          bike.model,
          bike.registration,
          bike.registrationExpires || bike.registration_expires,
          bike.serviceCenter || bike.service_center,
          bike.serviceCenterContactId || bike.service_center_contact_id,
          bike.deliveryStreet || bike.delivery_street,
          bike.deliverySuburb || bike.delivery_suburb,
          bike.deliveryState || bike.delivery_state,
          bike.deliveryPostcode || bike.delivery_postcode,
          bike.lastServiceDate || bike.last_service_date,
          bike.serviceNotes || bike.service_notes,
          bike.status || 'Available',
          bike.location || 'Main Warehouse',
          bike.dailyRate || bike.daily_rate || 85,
          bike.dailyRateA || bike.daily_rate_a || 85,
          bike.dailyRateB || bike.daily_rate_b || 95,
          bike.imageUrl || bike.image_url || 'https://placehold.co/300x200.png',
          bike.imageHint || bike.image_hint || 'motorcycle sport',
          bike.assignment || '-',
          bike.assignedCaseId || bike.assigned_case_id,
          bike.assignmentStartDate || bike.assignment_start_date,
          bike.assignmentEndDate || bike.assignment_end_date
        );
      }
    });
    
    insertMany(bikes);
  }
};

function generateCaseNumber(): string {
  const now = new Date();
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000);
  return `${week}${month}${random}`;
}