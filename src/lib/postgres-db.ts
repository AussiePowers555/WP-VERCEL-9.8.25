/**
 * PostgreSQL Database Service
 * Single source of truth for all database operations
 * Using Neon PostgreSQL
 */

import { Pool, PoolClient } from 'pg';
import type {
  Case,
  UserAccount,
  Bike,
  Contact,
  Workspace,
  DigitalSignature,
  SignatureToken,
  RentalAgreement,
  SignedDocument,
  CaseInteraction
} from './postgres-schema';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to get a client from the pool
async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Case Operations
 */
export const CaseService = {
  async findAll(): Promise<Case[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM cases ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<Case | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM cases WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async findByCaseNumber(caseNumber: string): Promise<Case | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM cases WHERE case_number = $1', [caseNumber]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async create(caseData: Partial<Case>): Promise<Case> {
    const client = await getClient();
    try {
      const fields = Object.keys(caseData);
      const values = Object.values(caseData);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO cases (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async update(id: string, updates: Partial<Case>): Promise<Case | null> {
    const client = await getClient();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
      
      const query = `
        UPDATE cases
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async delete(id: string): Promise<boolean> {
    const client = await getClient();
    try {
      const result = await client.query('DELETE FROM cases WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }
};

/**
 * User Operations
 */
export const UserService = {
  async findAll(): Promise<UserAccount[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM user_accounts ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<UserAccount | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM user_accounts WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async findByEmail(email: string): Promise<UserAccount | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM user_accounts WHERE email = $1', [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async create(userData: Partial<UserAccount>): Promise<UserAccount> {
    const client = await getClient();
    try {
      const query = `
        INSERT INTO user_accounts (id, email, password_hash, role, status, first_login, remember_login)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        userData.email,
        userData.password_hash,
        userData.role || 'workspace_user',
        userData.status || 'active',
        userData.first_login ?? true,
        userData.remember_login ?? false
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async updateLastLogin(id: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('UPDATE user_accounts SET last_login = NOW() WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }
};

/**
 * Bike Operations
 */
export const BikeService = {
  async findAll(): Promise<Bike[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM bikes ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findAvailable(): Promise<Bike[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM bikes WHERE status = $1', ['Available']);
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<Bike | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM bikes WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async assignToCase(bikeId: string, caseNumber: string): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Update bike status
      await client.query(
        'UPDATE bikes SET status = $1, assignment = $2, updated_at = NOW() WHERE id = $3',
        ['Assigned', caseNumber, bikeId]
      );
      
      // Update case with bike assignment
      await client.query(
        'UPDATE cases SET assigned_bike = $1, updated_at = NOW() WHERE case_number = $2',
        [bikeId, caseNumber]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async returnBike(bikeId: string): Promise<boolean> {
    const client = await getClient();
    try {
      const result = await client.query(
        'UPDATE bikes SET status = $1, assignment = NULL, updated_at = NOW() WHERE id = $2',
        ['Available', bikeId]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }
};

/**
 * Contact Operations
 */
export const ContactService = {
  async findAll(): Promise<Contact[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM contacts ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findByType(type: string): Promise<Contact[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM contacts WHERE type = $1 ORDER BY name', [type]);
      return result.rows;
    } finally {
      client.release();
    }
  },

  async create(contactData: Partial<Contact>): Promise<Contact> {
    const client = await getClient();
    try {
      const query = `
        INSERT INTO contacts (id, name, company, type, phone, email, address)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        contactData.name,
        contactData.company,
        contactData.type,
        contactData.phone,
        contactData.email,
        contactData.address
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
};

/**
 * Workspace Operations
 */
export const WorkspaceService = {
  async findAll(): Promise<Workspace[]> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM workspaces ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<Workspace | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM workspaces WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
};

/**
 * Signature Token Operations
 */
export const SignatureTokenService = {
  async create(tokenData: Partial<SignatureToken>): Promise<SignatureToken> {
    const client = await getClient();
    try {
      const query = `
        INSERT INTO signature_tokens (
          id, token, case_id, client_email, document_type, 
          form_data, form_link, status, expires_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 
          $5, $6, $7, $8
        )
        RETURNING *
      `;
      
      const result = await client.query(query, [
        tokenData.token,
        tokenData.case_id,
        tokenData.client_email,
        tokenData.document_type,
        tokenData.form_data,
        tokenData.form_link,
        tokenData.status || 'pending',
        tokenData.expires_at
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async findByToken(token: string): Promise<SignatureToken | null> {
    const client = await getClient();
    try {
      const result = await client.query('SELECT * FROM signature_tokens WHERE token = $1', [token]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const client = await getClient();
    try {
      const result = await client.query(
        'UPDATE signature_tokens SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, id]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }
};

/**
 * Digital Signature Operations
 */
export const DigitalSignatureService = {
  async create(signatureData: Partial<DigitalSignature>): Promise<DigitalSignature> {
    const client = await getClient();
    try {
      const query = `
        INSERT INTO digital_signatures (
          id, case_id, signature_token_id, signature_data, 
          signer_name, terms_accepted, signed_at, ip_address, user_agent
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, 
          $4, $5, NOW(), $6, $7
        )
        RETURNING *
      `;
      
      const result = await client.query(query, [
        signatureData.case_id,
        signatureData.signature_token_id,
        signatureData.signature_data,
        signatureData.signer_name,
        signatureData.terms_accepted,
        signatureData.ip_address,
        signatureData.user_agent
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
};

/**
 * Case Interaction Operations
 */
export const CaseInteractionService = {
  async create(interactionData: Partial<CaseInteraction>): Promise<CaseInteraction> {
    const client = await getClient();
    try {
      const query = `
        INSERT INTO case_interactions (
          id, case_number, source, method, situation, 
          action, outcome, timestamp
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 
          $5, $6, NOW()
        )
        RETURNING *
      `;
      
      const result = await client.query(query, [
        interactionData.case_number,
        interactionData.source,
        interactionData.method,
        interactionData.situation,
        interactionData.action,
        interactionData.outcome
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async findByCaseNumber(caseNumber: string): Promise<CaseInteraction[]> {
    const client = await getClient();
    try {
      const result = await client.query(
        'SELECT * FROM case_interactions WHERE case_number = $1 ORDER BY timestamp DESC',
        [caseNumber]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
};

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Raw query helper for complex queries
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await getClient();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Health check
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const client = await getClient();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export the pool for advanced usage
export { pool };

console.log('🐘 PostgreSQL database service initialized (Neon)');