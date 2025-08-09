export type InteractionType = 'call' | 'email' | 'meeting' | 'sms' | 'note' | 'document';
export type InteractionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InteractionStatus = 'pending' | 'in_progress' | 'completed' | 'follow_up_required';

export interface InteractionAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Interaction {
  id: number;
  caseNumber: string;
  caseId: number;
  interactionType: InteractionType;
  timestamp: string;
  
  // Contact information
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Structured fields
  situation: string;
  actionTaken: string;
  outcome: string;
  
  // Metadata
  priority: InteractionPriority;
  status: InteractionStatus;
  tags: string[];
  attachments: InteractionAttachment[];
  
  // Tracking
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}

export interface InteractionFeedView extends Interaction {
  // Case details
  caseHirerName?: string;
  incidentDate?: string;
  caseStatus?: string;
  insuranceCompany?: string;
  lawyerAssigned?: string;
  rentalCompany?: string;
  
  // User details
  createdByName?: string;
  createdByEmail?: string;
}

export interface CreateInteractionData {
  caseNumber: string;
  caseId: number;
  interactionType: InteractionType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  situation: string;
  actionTaken: string;
  outcome: string;
  priority?: InteractionPriority;
  status?: InteractionStatus;
  tags?: string[];
}

export interface UpdateInteractionData extends Partial<CreateInteractionData> {
  id: number;
}

export interface InteractionFilters {
  caseNumber?: string;
  caseId?: string;
  interactionType?: InteractionType[];
  priority?: InteractionPriority[];
  status?: InteractionStatus[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  tags?: string[];
  insuranceCompany?: string;
  lawyerAssigned?: string;
  rentalCompany?: string;
}

export interface InteractionSortOptions {
  field: 'timestamp' | 'caseNumber' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

export interface PaginatedInteractions {
  interactions: InteractionFeedView[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}