import { InteractionFeedView } from '@/types/interaction';

/**
 * Export interactions to CSV format
 */
export function exportInteractionsToCSV(interactions: InteractionFeedView[], filename: string = 'interactions.csv') {
  // Define CSV headers
  const headers = [
    'Case Number',
    'Date/Time',
    'Type',
    'Contact Name',
    'Contact Phone',
    'Contact Email',
    'Situation',
    'Action Taken',
    'Outcome',
    'Priority',
    'Status',
    'Insurance Company',
    'Lawyer Assigned',
    'Rental Company',
    'Created By',
    'Tags'
  ];
  
  // Convert interactions to CSV rows
  const rows = interactions.map(interaction => [
    interaction.caseNumber,
    new Date(interaction.timestamp).toLocaleString(),
    interaction.interactionType,
    interaction.contactName || '',
    interaction.contactPhone || '',
    interaction.contactEmail || '',
    `"${(interaction.situation || '').replace(/"/g, '""')}"`, // Escape quotes
    `"${(interaction.actionTaken || '').replace(/"/g, '""')}"`,
    `"${(interaction.outcome || '').replace(/"/g, '""')}"`,
    interaction.priority,
    interaction.status,
    interaction.insuranceCompany || '',
    interaction.lawyerAssigned || '',
    interaction.rentalCompany || '',
    interaction.createdByName || '',
    interaction.tags?.join('; ') || ''
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export interactions to Excel format (using CSV with .xls extension for compatibility)
 */
export function exportInteractionsToExcel(interactions: InteractionFeedView[], filename: string = 'interactions') {
  // Excel can open CSV files, so we'll use CSV format with .xls extension
  const csvFilename = filename.endsWith('.xls') || filename.endsWith('.xlsx') 
    ? filename 
    : `${filename}.xls`;
    
  exportInteractionsToCSV(interactions, csvFilename);
}

/**
 * Generate filename with current timestamp
 */
export function generateExportFilename(prefix: string = 'interactions', extension: string = 'xls'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export filtered interactions with metadata
 */
export function exportFilteredInteractions(
  interactions: InteractionFeedView[],
  filters: Record<string, any>,
  filename?: string
) {
  // Generate filename with filter info if not provided
  if (!filename) {
    const filterInfo = [];
    if (filters.insuranceCompany) filterInfo.push(`insurance-${filters.insuranceCompany}`);
    if (filters.lawyerAssigned) filterInfo.push(`lawyer-${filters.lawyerAssigned}`);
    if (filters.rentalCompany) filterInfo.push(`rental-${filters.rentalCompany}`);
    if (filters.caseNumber) filterInfo.push(`case-${filters.caseNumber}`);
    
    const prefix = filterInfo.length > 0 
      ? `interactions_${filterInfo.join('_')}` 
      : 'interactions';
      
    filename = generateExportFilename(prefix);
  }
  
  exportInteractionsToExcel(interactions, filename);
}