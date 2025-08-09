export interface IDatabaseService {
  // Cases
  createCase(caseData: any): Promise<any>;
  getCaseById(id: string): Promise<any | null>;
  getCaseByCaseNumber(caseNumber: string): Promise<any | null>;
  getAllCases(): Promise<any[]>;
  getCasesForUser(userId: string): Promise<any[]>;
  updateCase(id: string, caseData: any): Promise<void>;
  deleteCase(id: string): Promise<boolean>;
  deleteAllCases(): Promise<number>;
  getCaseDetails(caseId: string): Promise<any | null>;
  
  // Contacts
  createContact(contact: any): Promise<any>;
  getAllContacts(): Promise<any[]>;
  getContactById(id: string): Promise<any | null>;
  updateContact(id: string, updates: any): Promise<void>;
  deleteContact(id: string): Promise<boolean>;
  
  // Workspaces
  createWorkspace(workspace: any): Promise<any>;
  getAllWorkspaces(): Promise<any[]>;
  getWorkspaceById(id: string): Promise<any | null>;
  updateWorkspace(id: string, updates: any): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  
  // User Accounts
  createUserAccount(account: any): Promise<any>;
  getAllUserAccounts(): Promise<any[]>;
  updateUserAccount(id: string, updates: any): Promise<void>;
  getUserByEmail(email: string): Promise<any | undefined>;
  
  // Signature Tokens
  createSignatureToken(tokenData: any): Promise<any>;
  getSignatureToken(token: string): Promise<any | null>;
  updateSignatureToken(id: string, updates: any): Promise<void>;
  getSignatureTokensForCase(caseId: string): Promise<any[]>;
  generateSignatureToken(caseId: string, email: string, documentType: string, formData?: any): Promise<string>;
  
  // Digital Signatures
  createDigitalSignature(signatureData: any): Promise<any>;
  getCaseDocuments(caseId: string): Promise<any[]>;
  
  // Rental Agreements
  createRentalAgreement(agreementData: any): Promise<any>;
  updateRentalAgreement(id: string, updates: any): Promise<void>;
  
  // Bikes
  createBike(bikeData: any): Promise<any>;
  getAllBikes(): Promise<any[]>;
  getBikes(workspaceId?: string): Promise<any[]>;
  getBikeById(id: string): Promise<any | null>;
  updateBike(id: string, updates: any): Promise<void>;
  deleteBike(id: string): Promise<void>;
  bulkInsertBikes(bikes: any[]): Promise<void>;
  
  // Bulk operations
  deleteSignatureTokensByCase(caseId: string): Promise<number>;
  deleteDigitalSignaturesByCase(caseId: string): Promise<number>;
  deleteRentalAgreementsByCase(caseId: string): Promise<number>;
  // Interactions
  createCaseInteraction(data: any): Promise<any>;
  getCaseInteractions(caseNumber: string): Promise<any[]>;
  updateCaseInteraction(id: string, updates: any): Promise<void>;
  deleteCaseInteraction(id: string): Promise<boolean>;

  // Async wrappers (for server components convenience)
  getCasesAsync(workspaceId?: string | null): Promise<any[]>;
  getBikesAsync(workspaceId?: string | null): Promise<any[]>;
  getContactsAsync(): Promise<any[]>;
  getWorkspacesAsync(): Promise<any[]>;
  createDocumentRecord(docData: any): Promise<any>;
  addDocumentToCase(caseId: string, documentId: string): Promise<boolean>;
  createAuditLog(logData: any): Promise<void>;
}
