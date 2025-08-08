/**
 * PostgreSQL Schema Definitions for Motorbike Rental Management System
 * Using Neon PostgreSQL (100% PostgreSQL - No Firebase/SQLite)
 */

// Australian states enum
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

// Case status progression
export type CaseStatus = 
  | 'New Matter'
  | 'Customer Contacted' 
  | 'Awaiting Approval'
  | 'Bike Delivered'
  | 'Bike Returned'
  | 'Demands Sent'
  | 'Awaiting Settlement'
  | 'Settlement Agreed'
  | 'Paid'
  | 'Closed';

// Document types
export type DocumentType = 
  | 'claims' 
  | 'not-at-fault-rental' 
  | 'certis-rental' 
  | 'authority-to-act' 
  | 'direction-to-pay'
  | 'signed-agreement';

// Communication types
export type CommunicationType = 'Email' | 'Phone' | 'SMS' | 'Letter' | 'Meeting' | 'Other';

// Communication priorities
export type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Contact types
export type ContactType = 'Client' | 'Lawyer' | 'Insurer' | 'Repairer' | 'Rental Company' | 'Service Center' | 'Other';

// User roles
export type UserRole = 'admin' | 'developer' | 'lawyer' | 'rental_company' | 'workspace_user';

// User account status
export type UserStatus = 'active' | 'pending_password_change' | 'disabled';

/**
 * User Account Entity - For authentication and access control
 */
export interface UserAccount {
  id: string; // UUID
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  contact_id?: string;
  workspace_id?: string;
  first_login: boolean;
  remember_login: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

/**
 * Case Entity - Central entity for each motorbike rental case
 */
export interface Case {
  id: string; // UUID
  case_number: string;
  workspace_id?: string;
  status: CaseStatus;
  last_updated: Date;
  
  // Client (NAF) details
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_street_address?: string;
  client_suburb?: string;
  client_state?: AustralianState;
  client_postcode?: string;
  client_claim_number?: string;
  client_insurance_company?: string;
  client_insurer?: string;
  client_vehicle_rego?: string;
  
  // At-fault party details
  at_fault_party_name: string;
  at_fault_party_phone?: string;
  at_fault_party_email?: string;
  at_fault_party_street_address?: string;
  at_fault_party_suburb?: string;
  at_fault_party_state?: AustralianState;
  at_fault_party_postcode?: string;
  at_fault_party_claim_number?: string;
  at_fault_party_insurance_company?: string;
  at_fault_party_insurer?: string;
  at_fault_party_vehicle_rego?: string;
  
  // Assignments
  rental_company?: string;
  lawyer?: string;
  assigned_lawyer_id?: string;
  assigned_rental_company_id?: string;
  
  // Financial summary
  invoiced: number;
  reserve: number;
  agreed: number;
  paid: number;
  
  // Accident details
  accident_date?: Date;
  accident_time?: string;
  accident_description?: string;
  accident_diagram?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * Bike Entity - Fleet management
 */
export interface Bike {
  id: string; // UUID
  make: string;
  model: string;
  registration?: string;
  registration_expires?: Date;
  service_center?: string;
  delivery_street?: string;
  delivery_suburb?: string;
  delivery_state?: AustralianState;
  delivery_postcode?: string;
  last_service_date?: Date;
  service_notes?: string;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Retired';
  location?: string;
  daily_rate?: number;
  image_url?: string;
  image_hint?: string;
  assignment?: string;
  workspace_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Contact Entity - For lawyers, rental companies, etc.
 */
export interface Contact {
  id: string; // UUID
  name: string;
  company?: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Workspace Entity - For organizing cases
 */
export interface Workspace {
  id: string; // UUID
  name: string;
  contact_id: string;
  type?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Digital Signature Entity
 */
export interface DigitalSignature {
  id: string; // UUID
  case_id: string;
  signature_token_id?: string;
  signature_data: string; // Base64 encoded
  signer_name: string;
  terms_accepted: boolean;
  signed_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

/**
 * Signature Token Entity - For secure document signing
 */
export interface SignatureToken {
  id: string; // UUID
  token: string;
  case_id: string;
  client_email: string;
  document_type: DocumentType;
  form_data?: string; // JSON
  form_link?: string;
  status: 'pending' | 'accessed' | 'signed' | 'completed' | 'expired';
  expires_at: Date;
  signed_at?: Date;
  completed_at?: Date;
  jotform_submission_id?: string;
  pdf_url?: string;
  document_url?: string;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Rental Agreement Entity
 */
export interface RentalAgreement {
  id: string; // UUID
  case_id: string;
  signature_id?: string;
  rental_details?: string; // JSON
  status: 'draft' | 'sent' | 'signed' | 'completed';
  signed_at?: Date;
  signed_by?: string;
  pdf_url?: string;
  pdf_path?: string;
  pdf_generated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Signed Document Entity
 */
export interface SignedDocument {
  id: string; // UUID
  case_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  sha256_hash: string;
  signed_at: Date;
  signed_by: string;
  signature_data: string; // Base64
  ip_address: string;
  user_agent: string;
  encryption_key_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Case Interaction Entity - Activity logs
 */
export interface CaseInteraction {
  id: string; // UUID
  case_number: string;
  source: string;
  method: string;
  situation: string;
  action: string;
  outcome: string;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * PostgreSQL Table Names
 */
export const TABLES = {
  USER_ACCOUNTS: 'user_accounts',
  CASES: 'cases',
  BIKES: 'bikes',
  CONTACTS: 'contacts',
  WORKSPACES: 'workspaces',
  DIGITAL_SIGNATURES: 'digital_signatures',
  SIGNATURE_TOKENS: 'signature_tokens',
  RENTAL_AGREEMENTS: 'rental_agreements',
  SIGNED_DOCUMENTS: 'signed_documents',
  CASE_INTERACTIONS: 'case_interactions'
} as const;

/**
 * Document type configurations
 */
export const DOCUMENT_TYPES = {
  'claims': {
    name: 'Claims Form',
    description: 'Submit your insurance claim details',
    jotform_id: '232543267390861'
  },
  'not-at-fault-rental': {
    name: 'Not At Fault Rental',
    description: 'Rental agreement for not-at-fault parties',
    jotform_id: '233241680987464'
  },
  'certis-rental': {
    name: 'Certis Rental',
    description: 'Certis rental agreement form',
    jotform_id: '233238940095055'
  },
  'authority-to-act': {
    name: 'Authority to Act',
    description: 'Authorization for legal representation',
    jotform_id: '233183619631457'
  },
  'direction-to-pay': {
    name: 'Direction to Pay',
    description: 'Payment direction authorization',
    jotform_id: '233061493503046'
  },
  'signed-agreement': {
    name: 'Signed Agreement',
    description: 'Signed agreement document',
    jotform_id: ''
  }
} as const;

/**
 * Business Constants
 */
export const BUSINESS_CONSTANTS = {
  DEFAULT_RENTAL_PERIOD_DAYS: 7,
  DEFAULT_ADMIN_FEE: 95,
  GST_RATE: 0.1,
  DEFAULT_TOKEN_EXPIRY_HOURS: 72,
  MAX_FILE_SIZE_MB: 10,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

/**
 * Validation Helpers
 */
export class ValidationHelpers {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static isValidPostcode(postcode: string, state?: AustralianState): boolean {
    const postcodeRegex = /^\d{4}$/;
    return postcodeRegex.test(postcode);
  }

  static isValidRegistration(registration: string): boolean {
    const regRegex = /^[A-Z0-9]{3,6}$/i;
    return regRegex.test(registration);
  }

  static isValidCaseNumber(caseNumber: string): boolean {
    const caseRegex = /^\d{5}$/;
    return caseRegex.test(caseNumber);
  }

  static generateCaseNumber(week: number, month: number, sequence: number): string {
    return `${week.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${sequence.toString().padStart(3, '0')}`;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  }

  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-AU');
  }

  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-AU');
  }
}

/**
 * FRONTEND-FRIENDLY INTERFACES
 * These interfaces provide camelCase versions for frontend components
 * They map to the database schema above
 */

// Frontend-friendly Case interface with NAF/AF naming
export interface CaseFrontend {
  id: string;
  caseNumber: string;
  workspaceId?: string;
  status: CaseStatus;
  lastUpdated: Date | string;

  // Client (Not-at-fault) details - camelCase for frontend
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientStreetAddress?: string;
  clientSuburb?: string;
  clientState?: string;
  clientPostcode?: string;
  clientClaimNumber?: string;
  clientInsuranceCompany?: string;
  clientInsurer?: string;
  clientVehicleRego?: string;

  // At-fault party details - camelCase for frontend
  atFaultPartyName: string;
  atFaultPartyPhone?: string;
  atFaultPartyEmail?: string;
  atFaultPartyStreetAddress?: string;
  atFaultPartySuburb?: string;
  atFaultPartyState?: string;
  atFaultPartyPostcode?: string;
  atFaultPartyClaimNumber?: string;
  atFaultPartyInsuranceCompany?: string;
  atFaultPartyInsurer?: string;
  atFaultPartyVehicleRego?: string;

  // Assignments and financial data
  assigned_lawyer_id?: string;
  assigned_rental_company_id?: string;
  invoiced?: number;
  reserve?: number;
  agreed?: number;
  paid?: number;

  // Accident details
  accidentDate?: Date | string;
  accidentTime?: string;
  accidentDescription?: string;
  accidentDiagram?: string;
}

// Frontend-friendly Contact interface
export interface ContactFrontend {
  id: string;
  name: string;
  company?: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Frontend-friendly Workspace interface
export interface WorkspaceFrontend {
  id: string;
  name: string;
  contactId: string;
  type?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Frontend-friendly Bike interface
export interface BikeFrontend {
  id: string;
  make: string;
  model: string;
  registration?: string;
  registrationExpires?: Date | string;
  serviceCenter?: string;
  serviceCenterContactId?: string;
  deliveryStreet?: string;
  deliverySuburb?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  lastServiceDate?: Date | string;
  serviceNotes?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  location?: string;
  dailyRate?: number;
  dailyRateA?: number;
  dailyRateB?: number;
  imageUrl?: string;
  imageHint?: string;
  assignment?: string;
  assignedCaseId?: string;
  assignmentStartDate?: Date | string;
  assignmentEndDate?: Date | string;
  year?: number;
  createdDate?: Date | string;
}

/**
 * Additional type aliases for compatibility
 */
export type BikeAssignment = any; // Placeholder for bike assignment type
export type FinancialRecord = any; // Placeholder for financial record type
export type Document = any; // Placeholder for document type
export type Insurance = any; // Placeholder for insurance type
export type CollectionsClient = any; // Placeholder for collections client type
export type CommunicationLog = any; // Placeholder for communication log type
export type FollowupNote = any; // Placeholder for followup note type
export interface Commitment {
  id: string;
  caseNumber: string;
  dueDate: string;
  note: string;
  status: 'Open' | 'Closed';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Collection names for compatibility
 */
export const COLLECTIONS = TABLES; // Alias for compatibility

/**
 * Schema Transformers for converting between DB and Frontend formats
 */
export class SchemaTransformers {
  // Convert database Case to frontend CaseFrontend
  static caseDbToFrontend(dbCase: Case): CaseFrontend {
    return {
      id: dbCase.id,
      caseNumber: dbCase.case_number,
      workspaceId: dbCase.workspace_id,
      status: dbCase.status,
      lastUpdated: dbCase.last_updated,

      // Map PostgreSQL fields to frontend NAF/AF naming
      clientName: dbCase.client_name,
      clientPhone: dbCase.client_phone,
      clientEmail: dbCase.client_email,
      clientStreetAddress: dbCase.client_street_address,
      clientSuburb: dbCase.client_suburb,
      clientState: dbCase.client_state,
      clientPostcode: dbCase.client_postcode,
      clientClaimNumber: dbCase.client_claim_number,
      clientInsuranceCompany: dbCase.client_insurance_company,
      clientInsurer: dbCase.client_insurer,
      clientVehicleRego: dbCase.client_vehicle_rego,

      atFaultPartyName: dbCase.at_fault_party_name,
      atFaultPartyPhone: dbCase.at_fault_party_phone,
      atFaultPartyEmail: dbCase.at_fault_party_email,
      atFaultPartyStreetAddress: dbCase.at_fault_party_street_address,
      atFaultPartySuburb: dbCase.at_fault_party_suburb,
      atFaultPartyState: dbCase.at_fault_party_state,
      atFaultPartyPostcode: dbCase.at_fault_party_postcode,
      atFaultPartyClaimNumber: dbCase.at_fault_party_claim_number,
      atFaultPartyInsuranceCompany: dbCase.at_fault_party_insurance_company,
      atFaultPartyInsurer: dbCase.at_fault_party_insurer,
      atFaultPartyVehicleRego: dbCase.at_fault_party_vehicle_rego,

      assigned_lawyer_id: dbCase.assigned_lawyer_id,
      assigned_rental_company_id: dbCase.assigned_rental_company_id,
      invoiced: dbCase.invoiced,
      reserve: dbCase.reserve,
      agreed: dbCase.agreed,
      paid: dbCase.paid,

      accidentDate: dbCase.accident_date,
      accidentTime: dbCase.accident_time,
      accidentDescription: dbCase.accident_description,
      accidentDiagram: dbCase.accident_diagram
    };
  }

  // Convert frontend CaseFrontend to database Case
  static caseFrontendToDb(frontendCase: CaseFrontend): Partial<Case> {
    return {
      id: frontendCase.id,
      case_number: frontendCase.caseNumber,
      workspace_id: frontendCase.workspaceId,
      status: frontendCase.status,
      last_updated: frontendCase.lastUpdated instanceof Date ? frontendCase.lastUpdated : new Date(frontendCase.lastUpdated),

      client_name: frontendCase.clientName,
      client_phone: frontendCase.clientPhone,
      client_email: frontendCase.clientEmail,
      client_street_address: frontendCase.clientStreetAddress,
      client_suburb: frontendCase.clientSuburb,
      client_state: frontendCase.clientState as AustralianState,
      client_postcode: frontendCase.clientPostcode,
      client_claim_number: frontendCase.clientClaimNumber,
      client_insurance_company: frontendCase.clientInsuranceCompany,
      client_insurer: frontendCase.clientInsurer,
      client_vehicle_rego: frontendCase.clientVehicleRego,

      at_fault_party_name: frontendCase.atFaultPartyName,
      at_fault_party_phone: frontendCase.atFaultPartyPhone,
      at_fault_party_email: frontendCase.atFaultPartyEmail,
      at_fault_party_street_address: frontendCase.atFaultPartyStreetAddress,
      at_fault_party_suburb: frontendCase.atFaultPartySuburb,
      at_fault_party_state: frontendCase.atFaultPartyState as AustralianState,
      at_fault_party_postcode: frontendCase.atFaultPartyPostcode,
      at_fault_party_claim_number: frontendCase.atFaultPartyClaimNumber,
      at_fault_party_insurance_company: frontendCase.atFaultPartyInsuranceCompany,
      at_fault_party_insurer: frontendCase.atFaultPartyInsurer,
      at_fault_party_vehicle_rego: frontendCase.atFaultPartyVehicleRego,

      assigned_lawyer_id: frontendCase.assigned_lawyer_id,
      assigned_rental_company_id: frontendCase.assigned_rental_company_id,
      invoiced: frontendCase.invoiced || 0,
      reserve: frontendCase.reserve || 0,
      agreed: frontendCase.agreed || 0,
      paid: frontendCase.paid || 0,

      accident_date: frontendCase.accidentDate instanceof Date ? frontendCase.accidentDate : frontendCase.accidentDate ? new Date(frontendCase.accidentDate) : undefined,
      accident_time: frontendCase.accidentTime,
      accident_description: frontendCase.accidentDescription,
      accident_diagram: frontendCase.accidentDiagram
    };
  }

  static contactDbToFrontend(dbContact: Contact): ContactFrontend {
    return {
      id: dbContact.id,
      name: dbContact.name,
      company: dbContact.company,
      type: dbContact.type,
      phone: dbContact.phone,
      email: dbContact.email,
      address: dbContact.address,
      createdAt: dbContact.created_at,
      updatedAt: dbContact.updated_at,
    };
  }

  static workspaceDbToFrontend(dbWorkspace: Workspace): WorkspaceFrontend {
    return {
      id: dbWorkspace.id,
      name: dbWorkspace.name,
      contactId: dbWorkspace.contact_id,
      type: dbWorkspace.type,
      createdAt: dbWorkspace.created_at,
      updatedAt: dbWorkspace.updated_at,
    };
  }

  static bikeDbToFrontend(dbBike: Bike): BikeFrontend {
    return {
      id: dbBike.id,
      make: dbBike.make,
      model: dbBike.model,
      registration: dbBike.registration,
      registrationExpires: dbBike.registration_expires,
      serviceCenter: dbBike.service_center,
      deliveryStreet: dbBike.delivery_street,
      deliverySuburb: dbBike.delivery_suburb,
      deliveryState: dbBike.delivery_state,
      deliveryPostcode: dbBike.delivery_postcode,
      lastServiceDate: dbBike.last_service_date,
      serviceNotes: dbBike.service_notes,
      status: (dbBike.status?.toLowerCase?.() as any) || 'available',
      location: dbBike.location,
      dailyRate: dbBike.daily_rate,
      imageUrl: dbBike.image_url,
      imageHint: dbBike.image_hint,
      assignment: dbBike.assignment,
      workspaceId: dbBike.workspace_id,
      createdDate: dbBike.created_at,
    } as any;
  }
}

/**
 * Mock Timestamp object for backward compatibility during migration
 * @deprecated Use native Date objects instead
 */
export const Timestamp = {
  now: () => new Date().toISOString(),
  fromDate: (date: Date) => date.toISOString(),
  fromMillis: (millis: number) => new Date(millis).toISOString(),
  toDate: (isoString: string) => new Date(isoString),
  toMillis: (isoString: string) => new Date(isoString).getTime()
};

/**
 * Mock FieldValue for backward compatibility during migration
 * @deprecated Use PostgreSQL operations instead
 */
export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  delete: () => null,
  increment: (n: number) => n,
  arrayUnion: (...elements: any[]) => elements,
  arrayRemove: (...elements: any[]) => elements
};

// Additional type exports for compatibility
export type UserWithWorkspace = UserAccount & {
  workspace?: Workspace;
  workspace_name?: string;
  contact_type?: string;
};

console.log('🐘 Using PostgreSQL (Neon) schema layer');